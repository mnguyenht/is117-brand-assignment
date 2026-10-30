# BRAND-002 — Standard Issue as a (nearly) real store

Requested by the learner on 2026-10-30: "turn this into the best T-shirt website we can… practically a real website". Built overnight by the AI on branch `brand-002-real-store`. **Not merged**: the learner decides. `main` keeps the graded `BRAND-001`.

## Scope

1. **Opening animation**: clean and snappy, about one second. It plays once per tab (the flag lives in `sessionStorage`, which each tab keeps separately) and is off under reduced motion.
2. **Ambient grid**: the learner's own vanilla port of React Bits' ShapeGrid (from `webdev/express`), restyled for kraft paper.
3. **Interactive 3D shirt**: a Spline `<spline-viewer>`, loaded only when a scene URL is configured. The SVG shirt stays as the poster and fallback.
4. **Tuning panel**: a temporary page for tuning the effects by hand.
5. **Accounts and saved carts**: Supabase Auth (email + password) and a Postgres `carts` table with row-level security.
6. **Checkout flow**: cart on the shop page → `checkout.html` (shipping details) → `payment.html` (fake payment: no card data collected, ever) → `order.html` (confirmation).
7. **Order email**: a Vercel function `api/order-confirmation.js` sends a Resend email to the signed-in buyer.
8. **Hosting**: Vercel. It serves `public/` as static files and runs `api/` as functions.

Out of scope: real payment, real shipping, inventory, admin.

## Two modes, chosen by `public/js/config.js`

| Mode                               | When                        | Cart                                                                            | Checkout                                                                        | Email                              |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| **Offline demo** (default, tested) | Supabase URL/key left empty | `localStorage`                                                                  | Works without an account; the order is saved in `localStorage`                  | None (page says so)                |
| **Live**                           | Supabase URL + anon key set | `carts` table for signed-in users; `localStorage` for guests, merged on sign-in | Sign-in required; the order is written by the `place_order()` database function | `/api/order-confirmation` → Resend |

The automated tests run in offline mode, so they never need the network or real keys.

## Files

- `public/js/config.js`: public settings (Supabase URL and **anon** key, Spline scene URL). The anon key is designed to be public; row-level security protects the data.
- `public/js/cart.js`: pure cart rules (sizes, quantity limits, totals). Unit-tested.
- `public/js/checkout-rules.js`: pure shipping-form validation. Unit-tested.
- `public/js/backend.js`: Supabase client loaded from a pinned CDN version **only in live mode**, plus auth, cart sync, `place_order` and the email trigger.
- `public/js/cart-store.js`: one place that reads and writes the cart, local or remote.
- Page scripts: `shop.js`, `account-page.js`, `checkout-page.js`, `payment-page.js`, `order-page.js`, `site-header.js`.
- Effects: `effects.css` + `intro-gate.js`, `grid-bg.js`, `spline-shirt.js`, tuning page `tune.html`.
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
- Added after the adversarial review:
  - The email contains no customer-typed text, so unverified sign-ups can't make the store send phishing content.
  - At most 50 confirmation emails go out per day, store-wide (Resend's free plan allows 100).
  - A per-user lock stops parallel requests from slipping past the 10-orders-an-hour limit.
  - Addresses with control characters are refused.
  - Saved carts are capped at 1 KB.
  - The Supabase and Spline scripts are pinned and checked with Subresource Integrity.
- Accepted limits (documented, not fixed):
  - An email that fails to send is not retried. Each order can claim one send, and re-opening that would allow spam.
  - A network retry of "Place demo order" can create a second order.
  - There is no Content-Security-Policy header yet, because the Spline viewer and Supabase need several origins.
  - Turning off "Confirm email" (see the setup guide) means sign-ups are not proof of owning an address. That is acceptable for a demo only because of the protections above.

## Overnight progress log

1. BRAND-001 merged as PR #3; `main` is deployed on Vercel production.
2. Backend: cart rules, schema, email function. Test-first, with 41 node tests and 27 SQL checks in PGlite (`supabase/check-schema.mjs`).
3. Store pages and effects written by Codex from strict specs and reviewed by Claude. The branch has a Vercel preview.
4. Three-lens adversarial review (security, correctness, accessibility). 35 findings were triaged: the security and cart fixes were made by Claude, and the front-end and accessibility fixes by Codex.
