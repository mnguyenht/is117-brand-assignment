import { LIVE_MODE } from "./config.js";
import { formatPrice } from "./cart.js";
import { initCart } from "./cart-store.js";
import {
  getUser,
  onAuthChange,
  signIn,
  signUp,
  signOut,
  loadOrders,
} from "./backend.js";
import { listLocalOrders } from "./local-orders.js";
import { startHeader } from "./site-header.js";

const content = document.querySelector("#account-content");
const status = document.querySelector("#account-status");
const next = new URLSearchParams(window.location.search).get("next");
const safeNext = /^[a-z-]+\.html$/.test(next ?? "") ? next : null;
let currentUserId = null;

function announce(text) {
  status.textContent = text;
}

function focusViewHeading() {
  const title = content.querySelector("h2");
  if (title) {
    title.tabIndex = -1;
    title.focus();
  }
}

function heading(text) {
  const element = document.createElement("h2");
  element.textContent = text;
  return element;
}

function orderList(orders) {
  const list = document.createElement("ul");
  list.className = "account-orders";
  for (const order of orders.slice(0, 10)) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `order.html?id=${encodeURIComponent(order.id)}`;
    link.textContent = `Order ${order.id.slice(0, 8).toUpperCase()} · ${order.item_count} ${order.item_count === 1 ? "item" : "items"} · ${formatPrice(order.subtotal_cents)}`;
    item.append(link);
    list.append(item);
  }
  if (!orders.length) {
    const item = document.createElement("li");
    item.textContent = "No orders yet.";
    list.append(item);
  }
  return list;
}

function makeAuthForm(kind) {
  const isSignIn = kind === "signin";
  const form = document.createElement("form");
  const title = heading(isSignIn ? "Sign in." : "Create an account.");
  const emailLabel = document.createElement("label");
  const email = document.createElement("input");
  const passwordLabel = document.createElement("label");
  const password = document.createElement("input");
  const button = document.createElement("button");
  const error = document.createElement("p");

  form.className = "store-form auth-form";
  emailLabel.htmlFor = `${kind}-email`;
  emailLabel.textContent = "Email";
  email.id = `${kind}-email`;
  email.name = "email";
  email.type = "email";
  email.autocomplete = "email";
  email.required = true;
  passwordLabel.htmlFor = `${kind}-password`;
  passwordLabel.textContent = "Password";
  password.id = `${kind}-password`;
  password.name = "password";
  password.type = "password";
  password.autocomplete = isSignIn ? "current-password" : "new-password";
  password.required = true;
  if (!isSignIn) password.minLength = 6;
  button.type = "submit";
  button.className = "button button-primary";
  button.textContent = isSignIn ? "Sign in" : "Create account";
  error.className = "field-error";
  error.setAttribute("role", "alert");
  error.hidden = true;
  form.append(title, emailLabel, email, passwordLabel, password, button, error);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    button.disabled = true;
    try {
      const result = isSignIn
        ? await signIn(email.value, password.value)
        : await signUp(email.value, password.value);
      if (!isSignIn && !result.session) {
        announce("Check your email to confirm your account, then sign in.");
        focusViewHeading();
      } else if (safeNext) {
        window.location.href = safeNext;
      } else {
        currentUserId = result.user?.id ?? result.session?.user?.id ?? null;
        await renderSignedIn(result.user ?? result.session?.user);
        announce("Signed in.");
        focusViewHeading();
      }
    } catch (problem) {
      error.textContent = problem.message;
      error.hidden = false;
    } finally {
      button.disabled = false;
    }
  });
  return form;
}

async function renderSignedIn(user) {
  const panel = document.createElement("section");
  const signedIn = document.createElement("p");
  const button = document.createElement("button");
  signedIn.textContent = `Signed in as ${user.email}`;
  button.type = "button";
  button.className = "button button-secondary";
  button.textContent = "Sign out";
  button.addEventListener("click", async () => {
    await signOut();
    currentUserId = null;
    renderSignedOut();
    announce("Signed out.");
    focusViewHeading();
  });
  panel.className = "account-panel shipping-panel";
  panel.append(signedIn, button, heading("Recent orders."));
  try {
    panel.append(orderList(await loadOrders()));
  } catch (problem) {
    const error = document.createElement("p");
    error.className = "field-error";
    error.setAttribute("role", "alert");
    error.textContent = problem.message;
    panel.append(error);
  }
  content.replaceChildren(panel);
}

function renderSignedOut() {
  const layout = document.createElement("div");
  layout.className = "auth-layout";
  layout.append(makeAuthForm("signin"), makeAuthForm("signup"));
  content.replaceChildren(layout);
}

function renderOffline() {
  const panel = document.createElement("section");
  const notice = document.createElement("p");
  panel.className = "account-panel shipping-panel";
  notice.textContent =
    "Accounts are switched off in this demo copy. Your bag and orders are saved in this browser.";
  panel.append(notice, heading("Recent orders."), orderList(listLocalOrders()));
  content.replaceChildren(panel);
}

startHeader();
await initCart();
if (!LIVE_MODE) {
  renderOffline();
} else {
  const user = await getUser();
  currentUserId = user?.id ?? null;
  if (user) await renderSignedIn(user);
  else renderSignedOut();
  await onAuthChange((changedUser) => {
    const nextUserId = changedUser?.id ?? null;
    if (nextUserId === currentUserId) return;
    currentUserId = nextUserId;
    if (changedUser) renderSignedIn(changedUser);
    else renderSignedOut();
  });
}
