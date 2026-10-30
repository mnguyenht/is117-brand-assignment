import { test } from "node:test";
import assert from "node:assert/strict";
import { validateShipping } from "../../public/js/checkout-rules.js";

const good = {
  fullName: "Alex Doe",
  address: "12 Main Street",
  city: "Newark",
  postalCode: "07102",
  country: "United States",
};

test("a complete address passes and comes back trimmed", () => {
  const result = validateShipping({ ...good, fullName: "  Alex Doe  " });
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, {});
  assert.equal(result.value.fullName, "Alex Doe");
});

test("each missing field gets its own message", () => {
  const result = validateShipping({});
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    "address",
    "city",
    "country",
    "fullName",
    "postalCode",
  ]);
});

test("whitespace-only answers count as missing", () => {
  const result = validateShipping({ ...good, city: "   " });
  assert.equal(result.ok, false);
  assert.ok(result.errors.city);
});

test("a postal code with symbols is rejected", () => {
  const result = validateShipping({ ...good, postalCode: "07<1>02" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.postalCode);
});

test("postal codes with letters, spaces and dashes are allowed", () => {
  assert.equal(validateShipping({ ...good, postalCode: "SW1A 1AA" }).ok, true);
  assert.equal(
    validateShipping({ ...good, postalCode: "07102-1234" }).ok,
    true,
  );
});

test("overlong answers are rejected", () => {
  const result = validateShipping({ ...good, address: "x".repeat(201) });
  assert.equal(result.ok, false);
  assert.ok(result.errors.address);
});
