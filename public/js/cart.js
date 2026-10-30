// Cart rules shared by the browser and the unit tests. A cart is a list of
// { size, qty } lines. Every function returns a new cart and never changes
// the one it was given. The database function place_order() enforces the
// same limits again, because nothing from the browser is trusted.

export const PRICE_CENTS = 2800; // fictional demo price, $28.00
export const SIZES = ["S", "M", "L", "XL"];
export const MAX_PER_LINE = 10;
export const MAX_ITEMS = 20;

const toWholeNumber = (value) => {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : 0;
};

// Accept anything (saved JSON, a database row) and return a clean cart:
// known sizes only, duplicates merged, quantities clamped, size order kept.
export function normalizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  const totals = new Map();
  for (const line of raw) {
    if (!line || !SIZES.includes(line.size)) continue;
    const qty = toWholeNumber(line.qty);
    if (qty) totals.set(line.size, (totals.get(line.size) ?? 0) + qty);
  }
  let room = MAX_ITEMS;
  const cart = [];
  for (const size of SIZES) {
    const qty = Math.min(totals.get(size) ?? 0, MAX_PER_LINE, room);
    if (qty) {
      cart.push({ size, qty });
      room -= qty;
    }
  }
  return cart;
}

const quantityOf = (cart, size) =>
  cart.find((line) => line.size === size)?.qty ?? 0;

// Changes one size only. It is clamped to the room the other sizes leave, so
// a full bag never quietly gives up a different size to make space.
export function setQuantity(cart, size, qty) {
  if (!SIZES.includes(size)) throw new RangeError(`Unknown size: ${size}`);
  const others = normalizeCart(cart.filter((line) => line.size !== size));
  const room = MAX_ITEMS - itemCount(others);
  const clamped = Math.min(toWholeNumber(qty), MAX_PER_LINE, room);
  return normalizeCart([...others, { size, qty: clamped }]);
}

export function addItem(cart, size) {
  if (!SIZES.includes(size)) throw new RangeError(`Unknown size: ${size}`);
  return setQuantity(cart, size, quantityOf(cart, size) + 1);
}

export function removeItem(cart, size) {
  return normalizeCart(cart.filter((line) => line.size !== size));
}

export function mergeCarts(first, second) {
  return normalizeCart([...normalizeCart(first), ...normalizeCart(second)]);
}

export const itemCount = (cart) =>
  cart.reduce((total, line) => total + line.qty, 0);

export const subtotalCents = (cart) => itemCount(cart) * PRICE_CENTS;

export const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;
