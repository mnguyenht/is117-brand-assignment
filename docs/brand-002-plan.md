# BRAND-002 — Standard Issue as a (nearly) real store

Requested by the learner on 2026-10-30: "turn this into the best T-shirt website we can… practically a real website". Built overnight by the AI on branch `brand-002-real-store`. **Not merged**: the learner decides. `main` keeps the graded `BRAND-001`.

## Scope

1. **Opening animation**: clean and snappy, about one second. It plays once per tab (the flag lives in `sessionStorage`, which each tab keeps separately) and is off under reduced motion.
2. **Ambient grid**: the learner's own vanilla port of React Bits' ShapeGrid (from `webdev/express`), restyled for kraft paper.
3. ~~**Interactive 3D shirt**~~: removed in round 4 at the learner's request (the drag controls misbehaved and it was too laggy). The flat SVG shirt stays.
4. **Tuning panel**: a temporary page for tuning the effects by hand.
5. **Accounts and saved carts**: Supabase Auth (email + password) and a Postgres `carts` table with row-level security.
6. **Checkout flow**: cart on the shop page → `checkout.html` (shipping details) → `payment.html` (fake payment: no card data collected, ever) → `order.html` (confirmation).
7. **Order email**: a Vercel function `api/order-confirmation.js` sends a Resend email to the signed-in buyer.
8. **Hosting**: Vercel. It serves `public/` as static files and runs `api/` as functions.

Out of scope: real payment, real shipping, inventory, admin.

## Two modes, chosen by `public/js/config.js`

| Mode                               | When                        | Cart                                                                            | Checkout                                                                        | Email                              |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| **Offline demo** (default, tested) | Supabase URL/key left empty | `localStorage`                                                                  | Needs a demo sign-in; the order is saved in `localStorage`                      | None (page says so)                |
| **Live**                           | Supabase URL + anon key set | `carts` table for signed-in users; `localStorage` for guests, merged on sign-in | Sign-in required; the order is written by the `place_order()` database function | `/api/order-confirmation` → Resend |

The automated tests run in offline mode, so they never need the network or real keys.

## Files

- `public/js/config.js`: public settings (Supabase URL and **anon** key). The anon key is designed to be public; row-level security protects the data.
- `public/js/cart.js`: pure cart rules (sizes, quantity limits, totals). Unit-tested.
- `public/js/checkout-rules.js`: pure shipping-form validation. Unit-tested.
- `public/js/backend.js`: Supabase client loaded from a pinned CDN version **only in live mode**, plus auth, cart sync, `place_order` and the email trigger.
- `public/js/cart-store.js`: one place that reads and writes the cart, local or remote.
- Page scripts: `shop.js`, `account-page.js`, `checkout-page.js`, `payment-page.js`, `order-page.js`, `site-header.js`.
- Effects: `effects.css` + `intro-gate.js`, `grid-bg.js`, tuning page `tune.html`.
- Auth screens: `account.html` (sign in, then the account dashboard), `signup.html`, `forgot.html`, `reset.html`; shared form code in `js/auth-form.js`.
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
  - The Supabase script is pinned and checked with Subresource Integrity.
- Accepted limits (documented, not fixed):
  - An email that fails to send is not retried. Each order can claim one send, and re-opening that would allow spam.
  - A network retry of "Place demo order" can create a second order.
  - There is no Content-Security-Policy header yet, because Supabase needs its CDN and API origins.
  - Turning off "Confirm email" (see the setup guide) means sign-ups are not proof of owning an address. That is acceptable for a demo only because of the protections above.

## Overnight progress log

1. BRAND-001 merged as PR #3; `main` is deployed on Vercel production.
2. Backend: cart rules, schema, email function. Test-first, with 41 node tests and 27 SQL checks in PGlite (`supabase/check-schema.mjs`).
3. Store pages and effects written by Codex from strict specs and reviewed by Claude. The branch has a Vercel preview.
4. Three-lens adversarial review (security, correctness, accessibility). 35 findings were triaged: the security and cart fixes were made by Claude, and the front-end and accessibility fixes by Codex.
5. Round 3, from the learner's feedback:
   - the dot grid moves into the shirt panel only;
   - the "Added" sticker fades;
   - the bag gets thumbnails and a "Check out — $X" button;
   - the wordmark is bigger and tilted;
   - an unboxing intro plays once per tab, and a short entrance on every view;
   - account pages (sign in, create account, forgot and reset password, account) run as offline demo accounts until Supabase is set up;
   - the learner's own Spline scene loads in viewer 2.0.122.

   Codex wrote the effects and pages from a spec; Claude reviewed them.

6. Round-3 review (Claude):
   - A later "lift above the grid" rule had the same specificity as the hang tag's `z-index: 2` and loaded later. The 3D canvas painted over the tag, and the "couldn't load" note covered its Claims row. Fixed with `:where()`. The SVG shirt now sits above the dots.
   - The 3D controls moved bottom-left, clear of the tag and Spline's badge.
   - Two account-form spacing fixes.
7. `/bld-refine-sprint` on the shop. Codex implemented, from a spec; Claude reviewed:
   - phone tap targets of at least 44px;
   - colour hovers only on real pointers, so the yellow no longer sticks after a tap;
   - under reduced motion the sticker still fades but never moves;
   - entrance 340 → 280 ms;
   - the grid stops drawing while off-screen;
   - a grab cursor on the 3D shirt;
   - an empty bag hides its "Empty demo bag" button.

   Two new browser tests cover the off-screen grid pause and the empty bag; both were seen failing before the fix.

   Accepted limit: the "Built with Spline" badge stays. Removing it needs a paid Spline plan. (Moot after round 4.)

8. Round 4, from the learner's feedback; Codex implemented two specs and Claude reviewed and fixed:
   - The 3D shirt is removed (laggy, broken controls). The flat shirt stays, and a test checks that nothing is requested from spline.design.
   - The pointer glow colour is a token, `--panel-grid-glow-color`, set to kraft brown, with stamp blue offered.
   - Auth: sign-in and create-account are separate centred cards.
     - Forgot and reset share the card.
     - The forms gain show/hide password and busy labels.
     - The next-page check is still the original same-site regex, with a negative test for an outside URL.
   - A different composition per page instead of the same title-plus-split:
     - shop: the bag is centred and About is stacked;
     - checkout: steps and a sticky sidebar;
     - payment: one centred column;
     - order: a centred receipt that prints in;
     - style guide: a stacked specimen sheet.
   - `/bld-refine-sprint` on every page:
     - new links and the toggle reach 44 px;
     - no sideways overflow at 375 and 1280 px on all 11 views;
     - no console errors.
   - Remaining small targets are the footer links and the style-guide sub-nav, which pass WCAG AA through spacing.
