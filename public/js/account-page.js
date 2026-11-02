import {
  DEMO_ACCOUNTS,
  getUser,
  onAuthChange,
  signOut,
  loadOrders,
} from "./backend.js";
import { authCard, demoNote, readSafeNext } from "./auth-form.js";
import { formatPrice } from "./cart.js";
import { initCart } from "./cart-store.js";
import { listLocalOrders } from "./local-orders.js";
import { startHeader } from "./site-header.js";

const content = document.querySelector("#account-content");
const status = document.querySelector("#account-status");
const safeNext = readSafeNext();
let currentUserId;

const announce = (text) => {
  status.textContent = text;
};

const focusHeading = () => {
  const title = content.querySelector("h1");
  if (title) {
    title.tabIndex = -1;
    title.focus();
  }
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function orderList(orders) {
  const list = document.createElement("ul");
  list.className = "account-orders";

  for (const order of orders.slice(0, 10)) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `order.html?id=${encodeURIComponent(order.id)}`;

    const code = document.createElement("span");
    code.className = "account-order-code";
    code.textContent = order.id.slice(0, 8).toUpperCase();

    link.append(code);
    if (order.created_at) {
      const parsed = new Date(order.created_at);
      if (!Number.isNaN(parsed.getTime())) {
        const date = document.createElement("span");
        date.className = "account-order-date";
        date.textContent = dateFormatter.format(parsed);
        link.append(date);
      }
    }

    const count = document.createElement("span");
    count.className = "account-order-count";
    count.textContent = `${order.item_count} ${
      order.item_count === 1 ? "item" : "items"
    }`;

    const total = document.createElement("span");
    total.className = "account-order-total";
    total.textContent = formatPrice(order.subtotal_cents);

    link.append(count, total);
    item.append(link);
    list.append(item);
  }

  if (!orders.length) {
    const item = document.createElement("li");
    item.className = "account-orders-empty";
    item.append(document.createTextNode("No orders yet. "));
    const shop = document.createElement("a");
    shop.href = "index.html";
    shop.textContent = "Shop the T-shirt";
    item.append(shop);
    list.append(item);
  }

  return list;
}

async function renderSignedIn(user) {
  document.title = "Account — Standard Issue";
  content.className = "account-dashboard";

  const heading = document.createElement("h1");
  const tape = document.createElement("span");
  tape.className = "label-tape";
  tape.textContent = "Your account.";
  heading.append(tape);

  const bar = document.createElement("div");
  bar.className = "account-bar";

  const signed = document.createElement("p");
  signed.append(document.createTextNode("Signed in as "));
  const email = document.createElement("strong");
  email.textContent = user.email;
  signed.append(email);

  const actions = document.createElement("div");
  actions.className = "account-actions";
  const change = document.createElement("a");
  change.href = "reset.html";
  change.textContent = "Change password";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-secondary";
  button.textContent = "Sign out";
  button.addEventListener("click", async () => {
    await signOut();
    currentUserId = null;
    renderSignedOut();
    announce("Signed out.");
    focusHeading();
  });

  actions.append(change, button);
  bar.append(signed, actions);

  const receipt = document.createElement("section");
  receipt.className = "summary-receipt account-receipt";
  const ordersHeading = document.createElement("h2");
  ordersHeading.textContent = "Your orders.";
  receipt.append(ordersHeading);

  try {
    receipt.append(
      orderList(DEMO_ACCOUNTS ? listLocalOrders() : await loadOrders()),
    );
  } catch (problem) {
    const error = document.createElement("p");
    error.className = "field-error";
    error.role = "alert";
    error.textContent = problem.message;
    receipt.append(error);
  }

  content.replaceChildren(
    heading,
    bar,
    ...(DEMO_ACCOUNTS ? [demoNote()] : []),
    receipt,
  );
}

function renderSignedOut() {
  document.title = "Sign in — Standard Issue";
  content.className = "auth-shell";
  const card = authCard("signin", {
    safeNext,
    onSignedIn: async (user) => {
      if (safeNext) {
        location.href = safeNext;
        return;
      }
      currentUserId = user?.id;
      await renderSignedIn(user);
      announce("Signed in.");
      focusHeading();
    },
  });
  content.replaceChildren(card, ...(DEMO_ACCOUNTS ? [demoNote()] : []));
}

startHeader();
await initCart();
const user = await getUser();
currentUserId = user?.id;
if (user) await renderSignedIn(user);
else renderSignedOut();

await onAuthChange(async (changed) => {
  if (changed?.id === currentUserId) return;
  currentUserId = changed?.id;
  if (changed) await renderSignedIn(changed);
  else renderSignedOut();
});
