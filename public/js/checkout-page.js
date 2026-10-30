import { LIVE_MODE } from "./config.js";
import { itemCount, subtotalCents, formatPrice } from "./cart.js";
import { initCart, getCart } from "./cart-store.js";
import { getUser } from "./backend.js";
import { validateShipping, SHIPPING_FIELDS } from "./checkout-rules.js";
import { startHeader } from "./site-header.js";

const SHIPPING_KEY = "standard-issue:shipping";
const form = document.querySelector("#shipping-form");
const summary = document.querySelector("#order-summary");
const message = document.querySelector("#checkout-message");
let handleSubmit = () => {};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  handleSubmit();
});

function showMessage(text, href, linkText) {
  form.remove();
  summary.remove();
  message.hidden = false;
  const paragraph = document.createElement("p");
  const link = document.createElement("a");
  paragraph.textContent = text;
  link.href = href;
  link.textContent = linkText;
  message.replaceChildren(paragraph, link);
}

function renderSummary(cart) {
  const lines = document.querySelector("#summary-lines");
  lines.replaceChildren();
  for (const { size, qty } of cart) {
    const item = document.createElement("li");
    item.textContent = `White T-shirt · Size ${size} · Quantity ${qty}`;
    lines.append(item);
  }
  const price = formatPrice(subtotalCents(cart));
  document.querySelector("#summary-subtotal").textContent = price;
  document.querySelector("#summary-total").textContent = price;
}

startHeader();
await initCart();
const cart = getCart();
if (!itemCount(cart)) {
  showMessage("Your bag is empty.", "index.html", "Back to the shop");
} else if (LIVE_MODE && !(await getUser())) {
  showMessage(
    "Sign in to check out.",
    "account.html?next=checkout.html",
    "Go to sign in",
  );
} else {
  renderSummary(cart);
  try {
    const saved = JSON.parse(sessionStorage.getItem(SHIPPING_KEY) ?? "null");
    for (const field of SHIPPING_FIELDS) {
      if (saved?.[field]) form.elements[field].value = saved[field];
    }
  } catch {
    sessionStorage.removeItem(SHIPPING_KEY);
  }

  handleSubmit = () => {
    const input = Object.fromEntries(new FormData(form));
    const result = validateShipping(input);
    for (const field of SHIPPING_FIELDS) {
      const control = form.elements[field];
      const error = document.querySelector(`#${field}-error`);
      if (result.errors[field]) {
        error.textContent = result.errors[field];
        error.hidden = false;
        control.setAttribute("aria-invalid", "true");
        control.setAttribute("aria-describedby", error.id);
      } else {
        error.hidden = true;
        control.removeAttribute("aria-invalid");
        control.removeAttribute("aria-describedby");
      }
    }
    if (!result.ok) {
      form.elements[
        SHIPPING_FIELDS.find((field) => result.errors[field])
      ].focus();
      return;
    }
    sessionStorage.setItem(SHIPPING_KEY, JSON.stringify(result.value));
    window.location.href = "payment.html";
  };
}
