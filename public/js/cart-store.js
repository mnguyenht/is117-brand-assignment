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
import { getUser, loadRemoteCart, saveRemoteCart } from "./backend.js";

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
let userId = null;

const announce = () =>
  window.dispatchEvent(new CustomEvent("cart:change", { detail: cart }));

export const getCart = () => cart;

// Call once per page. Signs the cart into the account if there is one.
export async function initCart() {
  try {
    const user = await getUser();
    if (user) {
      userId = user.id;
      const guest = readLocal();
      cart = mergeCarts(await loadRemoteCart(user.id), guest);
      if (guest.length) await saveRemoteCart(user.id, cart);
      writeLocal([]);
    }
  } catch {
    // Network trouble: keep the browser's cart rather than losing it.
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
      writeLocal(cart); // keep it somewhere if the save fails
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

// The other tab changed the cart: follow it.
window.addEventListener("storage", (event) => {
  if (event.key === KEY && !userId) {
    cart = readLocal();
    announce();
  }
});
