// Runs supabase/schema.sql inside a real (WebAssembly) Postgres with a fake
// Supabase auth schema, then checks the security rules as two different users.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const schema = readFileSync(process.argv[2], "utf8");
const db = new PGlite();
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

// Minimal stand-in for what Supabase provides.
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  insert into auth.users values ('${A}', 'a@example.com'), ('${B}', 'b@example.com');
`);
await db.exec(schema);
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on public.carts, public.orders to anon, authenticated;
`);

const as = async (user, sql, params) => {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub', '${user ?? ""}', false);`,
  );
  await db.exec(user ? "set role authenticated" : "set role anon");
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role");
  }
};
const fails = async (label, fn, pattern) => {
  await assert.rejects(fn, pattern, label);
  console.log("ok  -", label);
};
const ship = JSON.stringify({
  fullName: "Alex",
  address: "1 Main St",
  city: "Newark",
  postalCode: "07102",
  country: "US",
});

// Carts: each user sees and edits only their own.
await as(
  A,
  `insert into public.carts (items) values ('[{"size":"M","qty":2}]')`,
);
await as(
  B,
  `insert into public.carts (items) values ('[{"size":"S","qty":1}]')`,
);
let rows = (await as(A, "select user_id from public.carts")).rows;
assert.deepEqual(
  rows.map((r) => r.user_id),
  [A],
);
console.log("ok  - a user reads only their own cart");
await fails(
  "a user cannot insert a cart for someone else",
  () =>
    as(A, `insert into public.carts (user_id, items) values ('${B}', '[]')`),
  /row-level security/,
);
const updated = await as(
  A,
  `update public.carts set items='[]' where user_id='${B}'`,
);
assert.equal(updated.affectedRows ?? 0, 0);
console.log("ok  - a user cannot change someone else's cart");
await fails(
  "a cart longer than four lines is refused",
  () => as(A, `update public.carts set items='[1,2,3,4,5]'`),
  /check constraint/,
);
await fails(
  "an oversized saved cart is refused",
  () =>
    as(
      A,
      `update public.carts set items = jsonb_build_array(jsonb_build_object('size','S','qty',1,'pad', repeat('x', 5000)))`,
    ),
  /check constraint/,
);
rows = (await as(null, "select * from public.carts")).rows;
assert.equal(rows.length, 0);
console.log("ok  - signed-out visitors see no carts");

// Orders: only through place_order, with the server's own price.
await fails(
  "orders cannot be inserted directly",
  () =>
    as(
      A,
      `insert into public.orders (user_id, items, item_count, subtotal_cents, shipping) values ('${A}', '[]', 1, 1, '{}')`,
    ),
  /row-level security/,
);
const placed = (
  await as(A, `select * from public.place_order($1::jsonb, $2::jsonb)`, [
    JSON.stringify([
      { size: "M", qty: 2 },
      { size: "XL", qty: 1, price: 1 },
    ]),
    ship,
  ])
).rows[0];
assert.equal(placed.subtotal_cents, 8400);
assert.equal(placed.item_count, 3);
assert.deepEqual(placed.items, [
  { size: "M", qty: 2 },
  { size: "XL", qty: 1 },
]);
console.log("ok  - place_order prices on the server and ignores a sent price");
rows = (await as(A, "select * from public.carts")).rows;
assert.equal(rows.length, 0);
console.log("ok  - placing an order empties that user's cart");
assert.equal(
  (await as(B, "select count(*)::int as n from public.carts")).rows[0].n,
  1,
);
console.log("ok  - another user's cart is untouched");
await fails(
  "signed-out visitors cannot place orders",
  () =>
    as(null, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"M","qty":1}]',
      ship,
    ]),
  /permission denied|Sign in/,
);
await fails(
  "unknown sizes are refused",
  () =>
    as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"XXL","qty":1}]',
      ship,
    ]),
  /size/,
);
await fails(
  "repeated sizes are refused",
  () =>
    as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"M","qty":1},{"size":"M","qty":1}]',
      ship,
    ]),
  /size/,
);
await fails(
  "fractional or negative quantities are refused",
  () =>
    as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"M","qty":"1.5"}]',
      ship,
    ]),
  /whole numbers/,
);
await fails(
  "more than 10 of one size is refused",
  () =>
    as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"M","qty":11}]',
      ship,
    ]),
  /1 to 10/,
);
await fails(
  "more than 20 shirts is refused",
  () =>
    as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"S","qty":10},{"size":"M","qty":10},{"size":"L","qty":1}]',
      ship,
    ]),
  /1 to 20/,
);
await fails(
  "an empty order is refused",
  () => as(A, `select public.place_order($1::jsonb, $2::jsonb)`, ["[]", ship]),
  /1 to 20/,
);
await fails(
  "a missing address field is refused",
  () =>
    as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"M","qty":1}]',
      JSON.stringify({ fullName: "A" }),
    ]),
  /Shipping/,
);
await fails(
  "a postal code with symbols is refused",
  () =>
    as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"M","qty":1}]',
      JSON.stringify({ ...JSON.parse(ship), postalCode: "<x>" }),
    ]),
  /Postal/,
);
await fails(
  "line breaks in an address are refused",
  () =>
    as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"M","qty":1}]',
      JSON.stringify({ ...JSON.parse(ship), fullName: "Jane\nTotal: $0" }),
    ]),
  /one line/,
);

rows = (await as(B, "select * from public.orders")).rows;
assert.equal(rows.length, 0);
console.log("ok  - another user cannot read your orders");
const changed = await as(A, `update public.orders set subtotal_cents = 0`);
assert.equal(changed.affectedRows ?? 0, 0);
console.log("ok  - orders cannot be edited from the browser");

// Confirmation email can be claimed once, by the owner only.
assert.equal(
  (await as(B, `select public.claim_confirmation($1) as c`, [placed.id]))
    .rows[0].c,
  false,
);
console.log("ok  - another user cannot claim your confirmation email");
assert.equal(
  (await as(A, `select public.claim_confirmation($1) as c`, [placed.id]))
    .rows[0].c,
  true,
);
assert.equal(
  (await as(A, `select public.claim_confirmation($1) as c`, [placed.id]))
    .rows[0].c,
  false,
);
console.log("ok  - the owner can claim the email exactly once");

// Rate limit: the 11th order within an hour is refused.
for (let i = 0; i < 9; i++)
  await as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
    '[{"size":"S","qty":1}]',
    ship,
  ]);
await fails(
  "an 11th order in one hour is refused",
  () =>
    as(A, `select public.place_order($1::jsonb, $2::jsonb)`, [
      '[{"size":"S","qty":1}]',
      ship,
    ]),
  /Too many orders/,
);

// Store-wide email cap: once 50 confirmations went out in a day, no more.
await db.exec(`
  insert into public.orders (user_id, items, item_count, subtotal_cents, shipping, confirmation_sent_at, created_at)
  select '${B}', '[{"size":"S","qty":1}]', 1, 2800, '{}', now(), now() - interval '2 hours'
  from generate_series(1, 50);
`);
const fresh = (
  await as(B, `select * from public.place_order($1::jsonb, $2::jsonb)`, [
    '[{"size":"S","qty":1}]',
    ship,
  ])
).rows[0];
assert.equal(
  (await as(B, `select public.claim_confirmation($1) as c`, [fresh.id])).rows[0]
    .c,
  false,
);
console.log("ok  - no more than 50 confirmation emails go out per day");

// Running the schema a second time must not fail.
await db.exec(schema);
console.log("ok  - schema.sql can be run again safely");
console.log("ALL SQL CHECKS PASSED");
