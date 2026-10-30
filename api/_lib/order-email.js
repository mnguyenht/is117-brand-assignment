// Builds the order confirmation email. Customer-typed text is escaped before
// it goes into the HTML version.
import { formatPrice } from "../../public/js/cart.js";

const escapeHtml = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

export const shortOrderNumber = (orderId) => orderId.slice(0, 8).toUpperCase();

export function buildOrderEmail(order) {
  const number = shortOrderNumber(order.id);
  const lines = order.items.map(
    (line) =>
      `White T-shirt, size ${line.size} × ${line.qty} — ${formatPrice(line.qty * 2800)}`,
  );
  const total = formatPrice(order.subtotal_cents);
  // Deliberately no customer-typed text (name, address): sign-ups are not
  // email-verified in the demo, so anything typed could be used to make the
  // store send a convincing phishing message. The order page shows the address.
  const subject = `Your Standard Issue order ${number} (demo)`;
  const text = [
    `Thanks for your order. This is a classroom demo: nothing was charged and nothing will ship.`,
    ``,
    `Order ${number}`,
    ...lines,
    `Total: ${total}`,
    ``,
    `Your shipping details are on the order page of the site.`,
    ``,
    `Standard Issue — a white T-shirt is a white T-shirt.`,
  ].join("\n");
  const html = `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;color:#111;background:#dcc8a4;padding:24px">
<div style="max-width:480px;margin:0 auto;background:#fff;padding:24px;border:3px double #111">
<p style="font-family:Consolas,monospace;letter-spacing:.2em;font-size:12px;margin:0 0 16px">STANDARD ISSUE</p>
<h1 style="font-size:22px;margin:0 0 8px">Order ${escapeHtml(number)}</h1>
<p style="margin:0 0 16px">Thanks for your order. This is a classroom demo: nothing was charged and nothing will ship.</p>
<ul style="padding-left:18px;margin:0 0 16px">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
<p style="font-weight:700;margin:0 0 16px">Total: ${escapeHtml(total)}</p>
<p style="font-size:13px;margin:0">Your shipping details are on the order page of the site.</p>
</div></body></html>`;
  return { subject, text, html };
}
