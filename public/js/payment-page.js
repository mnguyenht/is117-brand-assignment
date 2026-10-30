import { LIVE_MODE } from "./config.js";
import { itemCount, subtotalCents, formatPrice } from "./cart.js";
import { initCart, getCart, clear, forgetCart } from "./cart-store.js";
import { placeOrder, requestConfirmation } from "./backend.js";
import { saveLocalOrder } from "./local-orders.js";
import { startHeader } from "./site-header.js";

const SHIPPING_KEY = "standard-issue:shipping";
const message = document.querySelector("#payment-message");
const details = document.querySelector("#payment-details");
const summary = document.querySelector("#order-summary");
const button = document.querySelector("#place-order");
const error = document.querySelector("#payment-error");

function showMessage(text, href, linkText) {
  details.remove();
  summary.remove();
  message.hidden = false;
  const paragraph = document.createElement("p");
  const link = document.createElement("a");
  paragraph.textContent = text;
  link.href = href;
  link.textContent = linkText;
  message.replaceChildren(paragraph, link);
}

function addAddress(container, shipping) {
  const name = document.createElement("p");
  const address = document.createElement("p");
  const place = document.createElement("p");
  const country = document.createElement("p");
  name.textContent = shipping.fullName;
  address.textContent = shipping.address;
  place.textContent = `${shipping.city}, ${shipping.postalCode}`;
  country.textContent = shipping.country;
  container.replaceChildren(name, address, place, country);
}

startHeader();
await initCart();
const cart = getCart();
let shipping;
try {
  shipping = JSON.parse(sessionStorage.getItem(SHIPPING_KEY) ?? "null");
} catch {
  shipping = null;
}

if (!itemCount(cart)) {
  showMessage("Your bag is empty.", "index.html", "Back to the shop");
} else if (!shipping) {
  showMessage(
    "Add your shipping details before payment.",
    "checkout.html",
    "Back to checkout",
  );
} else {
  const total = formatPrice(subtotalCents(cart));
  const lines = document.querySelector("#summary-lines");
  for (const { size, qty } of cart) {
    const item = document.createElement("li");
    item.textContent = `White T-shirt · Size ${size} · Quantity ${qty}`;
    lines.append(item);
  }
  document.querySelector("#summary-subtotal").textContent = total;
  document.querySelector("#summary-total").textContent = total;
  addAddress(document.querySelector("#shipping-address"), shipping);
  button.textContent = `Place demo order — ${total}`;

  button.addEventListener("click", async () => {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Placing order…";
    error.hidden = true;
    try {
      let order;
      if (LIVE_MODE) {
        order = await placeOrder(getCart(), shipping);
        if (Array.isArray(order)) [order] = order;
        forgetCart();
        const mail = await requestConfirmation(order.id);
        sessionStorage.setItem(
          `standard-issue:email:${order.id}`,
          JSON.stringify(mail),
        );
      } else {
        order = saveLocalOrder(getCart(), shipping);
        await clear();
      }
      sessionStorage.removeItem(SHIPPING_KEY);
      window.location.href = `order.html?id=${encodeURIComponent(order.id)}`;
    } catch (problem) {
      button.disabled = false;
      button.textContent = original;
      error.textContent = problem.message;
      error.hidden = false;
    }
  });
}
