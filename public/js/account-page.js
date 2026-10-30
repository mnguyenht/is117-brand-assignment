import {
  DEMO_ACCOUNTS,
  getUser,
  onAuthChange,
  signIn,
  signUp,
  signOut,
  loadOrders,
} from "./backend.js";
import { formatPrice } from "./cart.js";
import { initCart } from "./cart-store.js";
import { listLocalOrders } from "./local-orders.js";
import { startHeader } from "./site-header.js";
const content = document.querySelector("#account-content");
const status = document.querySelector("#account-status");
const next = new URLSearchParams(location.search).get("next");
const safeNext = /^[a-z-]+\.html$/.test(next ?? "") ? next : null;
let currentUserId;
const heading = (text) => {
  const element = document.createElement("h2");
  element.textContent = text;
  return element;
};
const announce = (text) => {
  status.textContent = text;
};
const focusHeading = () => {
  const title = content.querySelector("h2");
  if (title) {
    title.tabIndex = -1;
    title.focus();
  }
};
function demoNotice() {
  const note = document.createElement("p");
  note.className = "draft-label account-demo-note";
  note.textContent =
    "Demo accounts: your email stays in this browser and your password is never stored or checked. Real accounts switch on later.";
  return note;
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
function makeForm(kind) {
  const signin = kind === "signin";
  const form = document.createElement("form");
  form.className = "store-form auth-form";
  const title = heading(signin ? "Sign in." : "Create an account.");
  const emailLabel = document.createElement("label");
  emailLabel.htmlFor = `${kind}-email`;
  emailLabel.textContent = "Email";
  const email = document.createElement("input");
  email.id = emailLabel.htmlFor;
  email.name = "email";
  email.type = "email";
  email.autocomplete = "email";
  email.required = true;
  const passwordLabel = document.createElement("label");
  passwordLabel.htmlFor = `${kind}-password`;
  passwordLabel.textContent = "Password";
  const password = document.createElement("input");
  password.id = passwordLabel.htmlFor;
  password.name = "password";
  password.type = "password";
  password.autocomplete = signin ? "current-password" : "new-password";
  password.required = true;
  if (!signin) password.minLength = 6;
  const button = document.createElement("button");
  button.type = "submit";
  button.className = "button button-primary";
  button.textContent = signin ? "Sign in" : "Create account";
  const error = document.createElement("p");
  error.className = "field-error";
  error.role = "alert";
  error.hidden = true;
  form.append(title, emailLabel, email, passwordLabel, password);
  if (signin) {
    const forgot = document.createElement("a");
    forgot.href = "forgot.html";
    forgot.textContent = "Forgot your password?";
    form.append(forgot);
  }
  form.append(button, error);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    button.disabled = true;
    try {
      const result = signin
        ? await signIn(email.value, password.value)
        : await signUp(email.value, password.value);
      if (!signin && !result.session) {
        announce("Check your email to confirm your account, then sign in.");
        focusHeading();
      } else if (safeNext) location.href = safeNext;
      else {
        const user = result.user ?? result.session?.user;
        currentUserId = user?.id;
        await renderSignedIn(user);
        announce("Signed in.");
        focusHeading();
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
  panel.className = "account-panel shipping-panel";
  const signed = document.createElement("p");
  signed.textContent = `Signed in as ${user.email}`;
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
  panel.append(
    heading("Your account."),
    signed,
    change,
    button,
    heading("Your orders."),
  );
  try {
    panel.append(
      orderList(DEMO_ACCOUNTS ? listLocalOrders() : await loadOrders()),
    );
  } catch (problem) {
    const error = document.createElement("p");
    error.className = "field-error";
    error.role = "alert";
    error.textContent = problem.message;
    panel.append(error);
  }
  content.replaceChildren(...(DEMO_ACCOUNTS ? [demoNotice(), panel] : [panel]));
}
function renderSignedOut() {
  const layout = document.createElement("div");
  layout.className = "auth-layout";
  layout.append(makeForm("signin"), makeForm("signup"));
  content.replaceChildren(
    ...(DEMO_ACCOUNTS ? [demoNotice(), layout] : [layout]),
  );
}
startHeader();
await initCart();
const user = await getUser();
currentUserId = user?.id;
if (user) await renderSignedIn(user);
else renderSignedOut();
await onAuthChange((changed) => {
  if (changed?.id === currentUserId) return;
  currentUserId = changed?.id;
  if (changed) renderSignedIn(changed);
  else renderSignedOut();
});
