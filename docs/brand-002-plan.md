# BRAND-002 — Standard Issue as a (nearly) real store

Requested by the learner on 2026-10-30: "turn this into the best T-shirt website we can… practically a real website". Built overnight by the AI on branch `brand-002-real-store`. **Not merged**: the learner decides. `main` keeps the graded `BRAND-001`.

## Scope

1. **Opening animation**: clean and snappy, under one second. It plays once per browser session and is off under reduced motion.
2. **Ambient grid**: the learner's own vanilla port of React Bits' ShapeGrid (from `webdev/express`), restyled for kraft paper.
3. **Interactive 3D shirt**: a Spline `<spline-viewer>`, loaded only when a scene URL is configured. The SVG shirt stays as the poster and fallback.
4. **Tuning panel**: a temporary page for tuning the effects by hand.
5. **Accounts and saved carts**: Supabase Auth (email + password) and a Postgres `carts` table with row-level security.
6. **Checkout flow**: cart on the shop page → `checkout.html` (shipping details) → `payment.html` (fake payment: no card data collected, ever) → `order.html` (confirmation).
7. **Order email**: a Vercel function `api/order-confirmation.js` sends a Resend email to the signed-in buyer.
8. **Hosting**: Vercel. It serves `public/` as static files and runs `api/` as functions.

Out of scope: real payment, real shipping, inventory, admin.

## Two modes, chosen by `public/site-config.js`

| Mode                               | When                        | Cart                                                                            | Checkout                                                                        | Email                              |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| **Offline demo** (default, tested) | Supabase URL/key left empty | `localStorage`                                                                  | Works without an account; the order is saved in `localStorage`                  | None (page says so)                |
| **Live**                           | Supabase URL + anon key set | `carts` table for signed-in users; `localStorage` for guests, merged on sign-in | Sign-in required; the order is written by the `place_order()` database function | `/api/order-confirmation` → Resend |

The automated tests run in offline mode, so they never need the network or real keys.

## Files

- `public/site-config.js`: public settings (Supabase URL and **anon** key, Spline scene URL). The anon key is designed to be public; row-level security protects the data.
- `public/js/cart.js`: pure cart rules (sizes, quantity limits, totals). Unit-tested.
- `public/js/checkout-rules.js`: pure shipping-form validation. Unit-tested.
- `public/js/backend.js`: Supabase client loaded from a pinned CDN version **only in live mode**, plus auth, cart sync, `place_order` and the email trigger.
- `public/js/cart-store.js`: one place that reads and writes the cart, local or remote.
- Page scripts: `shop.js`, `account-page.js`, `checkout-page.js`, `payment-page.js`, `order-page.js`, `site-header.js`.
- Effects: `intro.css` + `intro-gate.js`, `grid-bg.js`, `spline-shirt.js`, tuning page `tune.html`.
- `api/order-confirmation.js` + `api/_lib/*.js`: the email function. It uses plain `fetch` to the Supabase and Resend REST APIs, so the server has no npm dependencies.
- `supabase/schema.sql`: tables, row-level security, and the `place_order` and `claim_confirmation` functions.
- `vercel.json`: static output = `public/`.

## Security decisions

- Prices are never trusted from the browser: `place_order()` recomputes the subtotal in the database ($28.00 × quantity, sizes S–XL only, at most 10 per line and 20 shirts per order).
- Orders can't be inserted or edited directly; row-level security allows `select` only on the user's own rows.
- The email function checks the caller's Supabase session and reads the order **with the caller's token**, so row-level security proves ownership. It sends only to the account's own email, and only once per order (`claim_confirmation`).
- `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `STORE_OWNER_EMAIL` live in Vercel environment variables. No secret is committed.
- Resend without a verified domain can only deliver to the Resend account's own address. The function first tries the buyer. If Resend refuses it as a test-mode send, it delivers a copy to `STORE_OWNER_EMAIL` instead and reports `"delivered_to": "store_owner"`, and the order page explains this.
- The payment page collects **no** card data. A fixed, read-only demo card is shown.

## Overnight progress log

Updated as work lands; see the bottom of SPEC.md for evidence.
