import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addItem,
  setQuantity,
  removeItem,
  normalizeCart,
  mergeCarts,
  itemCount,
  subtotalCents,
  formatPrice,
  MAX_PER_LINE,
  MAX_ITEMS,
} from "../../public/js/cart.js";

test("adding a size creates a line with quantity 1", () => {
  assert.deepEqual(addItem([], "M"), [{ size: "M", qty: 1 }]);
});

test("adding the same size again increases that line", () => {
  const cart = addItem(addItem([], "M"), "M");
  assert.deepEqual(cart, [{ size: "M", qty: 2 }]);
});

test("lines stay in size order S, M, L, XL", () => {
  const cart = addItem(addItem(addItem([], "XL"), "S"), "L");
  assert.deepEqual(
    cart.map((line) => line.size),
    ["S", "L", "XL"],
  );
});

test("adding an unknown size is rejected", () => {
  assert.throws(() => addItem([], "XXL"), RangeError);
});

test("a line cannot go above the per-size limit", () => {
  let cart = [];
  for (let i = 0; i < MAX_PER_LINE + 3; i++) cart = addItem(cart, "S");
  assert.equal(cart[0].qty, MAX_PER_LINE);
});

test("the whole cart cannot go above the item limit", () => {
  const cart = normalizeCart([
    { size: "S", qty: 10 },
    { size: "M", qty: 10 },
    { size: "L", qty: 10 },
  ]);
  assert.equal(itemCount(cart), MAX_ITEMS);
});

test("adding when the bag is full changes nothing, so no other size is dropped", () => {
  const full = [
    { size: "L", qty: 10 },
    { size: "XL", qty: 10 },
  ];
  assert.deepEqual(addItem(full, "S"), full);
});

test("raising one size only uses the room that is left", () => {
  const cart = [
    { size: "S", qty: 5 },
    { size: "XL", qty: 10 },
  ];
  assert.deepEqual(setQuantity(cart, "M", 9), [
    { size: "S", qty: 5 },
    { size: "M", qty: 5 },
    { size: "XL", qty: 10 },
  ]);
});

test("setting quantity to zero removes the line", () => {
  assert.deepEqual(setQuantity([{ size: "M", qty: 3 }], "M", 0), []);
});

test("removing a size leaves the other lines", () => {
  const cart = [
    { size: "S", qty: 1 },
    { size: "L", qty: 2 },
  ];
  assert.deepEqual(removeItem(cart, "S"), [{ size: "L", qty: 2 }]);
});

test("normalizing drops junk and merges duplicate sizes", () => {
  const raw = [
    { size: "M", qty: 1 },
    { size: "M", qty: "2" },
    { size: "XXL", qty: 4 },
    { size: "L", qty: -1 },
    { size: "S", qty: 1.7 },
    null,
    "nonsense",
  ];
  assert.deepEqual(normalizeCart(raw), [
    { size: "S", qty: 1 },
    { size: "M", qty: 3 },
  ]);
});

test("normalizing something that is not a list gives an empty cart", () => {
  assert.deepEqual(normalizeCart({ size: "M" }), []);
  assert.deepEqual(normalizeCart(undefined), []);
});

test("merging a guest cart into a saved cart adds quantities", () => {
  const saved = [{ size: "M", qty: 1 }];
  const guest = [
    { size: "M", qty: 2 },
    { size: "XL", qty: 1 },
  ];
  assert.deepEqual(mergeCarts(saved, guest), [
    { size: "M", qty: 3 },
    { size: "XL", qty: 1 },
  ]);
});

test("count and subtotal use the fixed demo price of $28", () => {
  const cart = [
    { size: "S", qty: 2 },
    { size: "XL", qty: 1 },
  ];
  assert.equal(itemCount(cart), 3);
  assert.equal(subtotalCents(cart), 8400);
  assert.equal(formatPrice(8400), "$84.00");
});

test("functions never change the cart they are given", () => {
  const cart = Object.freeze([Object.freeze({ size: "M", qty: 1 })]);
  assert.doesNotThrow(() => addItem(cart, "M"));
  assert.doesNotThrow(() => setQuantity(cart, "M", 4));
  assert.deepEqual(cart, [{ size: "M", qty: 1 }]);
});
