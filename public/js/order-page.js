import { LIVE_MODE } from "./config.js";
import { formatPrice } from "./cart.js";
import { initCart } from "./cart-store.js";
import { loadOrder } from "./backend.js";
import { getLocalOrder } from "./local-orders.js";
import { startHeader } from "./site-header.js";

function makeSummaryLine(size, qty) {
  const item = document.createElement("li");
  item.className = "summary-line";
  const image = document.createElement("img");
  image.src = "assets/white-shirt-cutout.svg";
  image.alt = "";
  image.width = 44;
  image.height = 48;
  const copy = document.createElement("span");
  copy.textContent = `White T-shirt · Size ${size} · Quantity ${qty}`;
  item.append(image, copy);
  return item;
}
const id = new URLSearchParams(window.location.search).get("id");
const message = document.querySelector("#order-message");
const details = document.querySelector("#order-details");

function showNotFound() {
  message.hidden = false;
  const title = message.querySelector("h1");
  const paragraph = document.createElement("p");
  const link = document.createElement("a");
  paragraph.textContent = "We couldn't find that order.";
  link.href = "index.html";
  link.textContent = "Back to the shop";
  message.replaceChildren(title, paragraph, link);
}

function addAddress(container, shipping) {
  for (const text of [
    shipping.fullName,
    shipping.address,
    `${shipping.city}, ${shipping.postalCode}`,
    shipping.country,
  ]) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    container.append(paragraph);
  }
}

startHeader();
await initCart();
let order = null;
if (id) {
  try {
    order = LIVE_MODE ? await loadOrder(id) : getLocalOrder(id);
  } catch {
    order = null;
  }
}
if (!order) {
  showNotFound();
} else {
  details.hidden = false;
  document.querySelector("#order-number").textContent = order.id
    .slice(0, 8)
    .toUpperCase();
  const lines = document.querySelector("#order-lines");
  for (const { size, qty } of order.items) {
    lines.append(makeSummaryLine(size, qty));
  }
  const total = formatPrice(order.subtotal_cents);
  document.querySelector("#order-subtotal").textContent = total;
  document.querySelector("#order-total").textContent = total;
  document.querySelector("#order-date").textContent = new Date(
    order.created_at,
  ).toLocaleDateString(undefined, { dateStyle: "long" });
  addAddress(document.querySelector("#order-address"), order.shipping);

  const emailStatus = document.querySelector("#email-status");
  if (!LIVE_MODE) {
    emailStatus.textContent = "Offline demo: no email is sent.";
  } else {
    let mail;
    try {
      mail = JSON.parse(
        sessionStorage.getItem(`standard-issue:email:${order.id}`) ?? "null",
      );
    } catch {
      mail = null;
    }
    if (mail) {
      emailStatus.textContent =
        mail.deliveredTo === "buyer"
          ? "A confirmation email is on its way to you."
          : mail.deliveredTo === "store_owner"
            ? "Email is in test mode, so the confirmation went to the store owner's inbox instead."
            : "We couldn't send the confirmation email.";
    } else {
      emailStatus.textContent = order.confirmation_sent_at
        ? "A confirmation email was sent for this order."
        : "No confirmation email was sent for this order.";
    }
  }
}
