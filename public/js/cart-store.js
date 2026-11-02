// The one place pages read and change the cart.
// - Guests (and the offline demo): the cart lives in this browser.
// - Signed-in shoppers (live mode): the cart is saved to their account. When
//   they sign in, anything picked as a guest is merged into the saved cart.
// Every change fires a "cart:change" event so the header count stays current.
import {
  addItem,
  setQuantity,
  removeItem,
  mergeCarts,
  normalizeCart,
} from "./cart.js";
import {
  getUser,
  onAuthChange,
  loadRemoteCart,
  saveRemoteCart,
} from "./backend.js";
import { LIVE_MODE } from "./config.js";

const KEY = "standard-issue:cart";

const readLocal = () => {
  try {
    return normalizeCart(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
  } catch {
    return [];
  }
};

const writeLocal = (cart) => {
  try {
    if (cart.length) localStorage.setItem(KEY, JSON.stringify(cart));
    else localStorage.removeItem(KEY);
  } catch {
    // Private windows can block storage; the cart still works for this page.
  }
};

let cart = readLocal();
// Set only once the account's saved cart has really loaded. Until then the
// page stays in guest mode, so a failed load can never overwrite the saved
// cart with an empty one.
let userId = null;

const announce = () =>
  window.dispatchEvent(new CustomEvent("cart:change", { detail: cart }));

export const getCart = () => cart;

// Call once per page. Signs the cart into the account if there is one.
export async function initCart() {
  try {
    // Demo accounts (offline mode) keep the cart in this browser.
    const user = LIVE_MODE ? await getUser() : null;
    if (user) {
      const guest = readLocal();
      const merged = mergeCarts(await loadRemoteCart(user.id), guest);
      if (guest.length) await saveRemoteCart(user.id, merged);
      // The guest lines are now part of the account: clear them only after
      // the save worked, so they are never merged in a second time.
      writeLocal([]);
      cart = merged;
      userId = user.id;
    }
  } catch {
    // Network trouble: stay in guest mode with the browser's cart.
  }
  announce();
  return cart;
}

async function commit(next) {
  cart = next;
  if (userId) {
    try {
      await saveRemoteCart(userId, cart);
    } catch {
      // Keep the change on this page only. Writing it to the guest key would
      // merge it into the account again on the next load and double it.
    }
  } else {
    writeLocal(cart);
  }
  announce();
  return cart;
}

export const add = (size) => commit(addItem(cart, size));
export const updateQuantity = (size, qty) =>
  commit(setQuantity(cart, size, qty));
export const remove = (size) => commit(removeItem(cart, size));
export const clear = () => commit([]);

// After an order the database empties the saved cart; mirror that here.
export function forgetCart() {
  cart = [];
  writeLocal([]);
  announce();
}

// Another guest tab changed the cart: follow it.
window.addEventListener("storage", (event) => {
  if (event.key === KEY && !userId) {
    cart = readLocal();
    announce();
  }
});

// Signed-in tabs share no storage, so re-read the account's cart whenever
// this tab comes back into view (it may have changed or been ordered).
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible" || !userId) return;
  try {
    cart = await loadRemoteCart(userId);
    announce();
  } catch {
    // Keep what is on screen.
  }
});

// Signed out (here or in another tab): stop using the account's cart, so
// the next person on this browser does not inherit it.
onAuthChange((user) => {
  if (!user && userId) {
    userId = null;
    cart = readLocal();
    announce();
  }
});
