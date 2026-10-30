// Offline demo only: orders are kept in this browser, shaped like the rows
// the database's place_order() returns, so the order page can show either.
import { normalizeCart, itemCount, PRICE_CENTS } from "./cart.js";

const KEY = "standard-issue:orders";

const readAll = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export function saveLocalOrder(cart, shipping) {
  const items = normalizeCart(cart);
  const count = itemCount(items);
  if (!count) throw new Error("Your bag is empty.");
  const order = {
    id: crypto.randomUUID(),
    items,
    item_count: count,
    subtotal_cents: count * PRICE_CENTS,
    shipping,
    created_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify([order, ...readAll()].slice(0, 10)),
    );
  } catch {
    // Storage blocked: the confirmation page reads the session copy below.
  }
  sessionStorage.setItem(`${KEY}:last`, JSON.stringify(order));
  return order;
}

export function getLocalOrder(id) {
  const fromList = readAll().find((order) => order.id === id);
  if (fromList) return fromList;
  try {
    const last = JSON.parse(sessionStorage.getItem(`${KEY}:last`) ?? "null");
    return last?.id === id ? last : null;
  } catch {
    return null;
  }
}

export const listLocalOrders = () => readAll();
