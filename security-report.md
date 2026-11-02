# Security audit — Standard Issue (BRAND-002) — 2026-11-02

**Verdict:** SHIP WITH CAVEATS. No reachable, exploitable issue was found. The caveats are demo-store limits (listed under Low/Info) and one rotation step for the learner.
**Production-audit score:** 78/100 (the ECC production-audit rubric, judged for a class demo store). Points are lost for no backups on the Supabase free plan, no error tracking, no health check and no CSP.

## Scope

- **Stack:**
  - static HTML/CSS/JS in `public/`;
  - one Vercel function, `api/order-confirmation.js`, which sends Resend email;
  - Supabase for auth and Postgres, with row-level security;
  - hosted on Vercel at <https://standard-issue-is117.vercel.app>.
- **Layers audited:** 1 front end, 2 API, 3 database, 4 auth, 5 hosting, 6 compute, 7 CI and version control, 8 RLS, 9 rate limiting, 10 caching, 12 logs, 13 recovery.
- **N/A:** 11 load balancing (static site plus one function).
- **AI-agent audit:** N/A (no LLM features).
- **Dynamic pentest:** not part of this pass. This is a static code review plus read-only checks against the live site: headers, file exposure, and the email function's reaction to requests without a valid sign-in.
- **Tools run:**
  - built-in `/security-review` on the branch diff;
  - the 13-layer and pre-launch checklists;
  - the ECC bounty-hunter reachability test.
- **Not run:** `gstack-cso` and `gstack-review`. Instead, the same code had a three-lens adversarial review on 2026-10-30 (35 findings, fixed or documented in `docs/brand-002-plan.md`), and this pass re-read every security path changed since.

## Findings by severity

### Critical / High

None.

### Medium

- **[Layer 4] A Supabase secret key sat in local `config.js` and in Vercel during setup.**
  - It never entered git history (checked with `git log -S sb_secret_`: 0 commits).
  - Supabase also refuses secret keys from browsers.
  - **Fix (learner):** in Supabase, delete or roll that secret key, and make sure Vercel's `SUPABASE_ANON_KEY` holds the publishable key.

### Low

- **[Layer 2/5, must-check 16] `tune.html` (a local tuning page) is public in production.**
  - It only changes CSS variables in the visitor's own tab, so the impact is none.
  - **Fix:** add `public/tune.html` and `public/js/tune.js` to `.vercelignore`.
- **[Layer 4, must-check 19] The session lives in `localStorage`, not an httpOnly cookie.**
  - This is supabase-js's default for a static site.
  - Its risk depends on XSS, and none was found: no HTML sinks, all user text goes in through `textContent`, and third-party scripts are SRI-pinned.
  - Accepted for a demo.
- **[Layer 5] No Content-Security-Policy header.** This is already an accepted limit in the plan. A CSP for Supabase's CDN and API origins would be the next hardening step.
- **[Layer 4, must-check 5] User enumeration.** Supabase's sign-up error says an address is already registered. That is Supabase's default; accepted for a demo.

### Info

- **[Layer 13]** Supabase's free plan has no automatic backups or point-in-time restore. The data is demo orders only.
- **[Layer 12]** There is no error tracking or alerting. Vercel's function logs hold no secrets or customer text (the email function logs nothing).

## Pre-launch must-checks (20)

| #   | Check                              | Status                                                                                                                                                                            |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | HSTS                               | pass (`max-age=63072000; includeSubDomains; preload` on the live site)                                                                                                            |
| 2   | CSRF                               | N/A (the only API takes a bearer token, not a cookie)                                                                                                                             |
| 3   | Sessions reset on password change  | pass (Supabase `updateUser` rotates the session; other sessions keep their refresh tokens until expiry, Supabase default)                                                         |
| 4   | Reset links expire                 | pass (Supabase default 1 h, single use)                                                                                                                                           |
| 5   | No user enumeration                | finding (Low, Supabase default message)                                                                                                                                           |
| 6   | Upload allow-list                  | N/A (no uploads)                                                                                                                                                                  |
| 7   | Payment webhooks                   | N/A (no real payments)                                                                                                                                                            |
| 8   | Prices set server-side             | pass (`place_order()` re-prices in the database at $28 × qty)                                                                                                                     |
| 9   | Prompt injection                   | N/A                                                                                                                                                                               |
| 10  | AI usage caps                      | N/A                                                                                                                                                                               |
| 11  | Request size limit                 | pass (Vercel's 4.5 MB body default; the function reads one UUID)                                                                                                                  |
| 12  | Rate-limited resets/email          | pass (Supabase auth limits; the confirmation email is capped at once per order and 50 per day store-wide)                                                                         |
| 13  | Sanitise before storing            | pass (shipping text: control characters refused in the database; the email contains no customer-typed text)                                                                       |
| 14  | CORS                               | pass (no CORS headers, so same-origin only)                                                                                                                                       |
| 15  | No directory listing / stray files | pass (`.git`, `.env`, `server.mjs`, `supabase/`, `docs/`, `README.md` all 404 live)                                                                                               |
| 16  | No debug routes                    | finding (Low, `tune.html`)                                                                                                                                                        |
| 17  | Lockout after failed logins        | pass (Supabase auth rate limits)                                                                                                                                                  |
| 18  | Security event logs                | pass (Supabase Auth logs sign-ins and resets)                                                                                                                                     |
| 19  | Secure cookie flags                | finding (Low, localStorage session)                                                                                                                                               |
| 20  | Least-privilege DB access          | pass (RLS on `carts` and `orders`; the anon role cannot run `place_order`/`claim_confirmation`; security-definer functions pin `search_path = ''`; the service key is never used) |

## Harness (Layer 0) findings

- No `.mcp.json`.
- `.claude/` holds only `launch.json`, which is gitignored.
- No project hooks or agents. Nothing to fix.

## Coverage by layer (1–13)

| Layer         | Status         | Notes                                                                                       |
| ------------- | -------------- | ------------------------------------------------------------------------------------------- |
| 1 Front end   | clean          | no `innerHTML`/`eval`; SRI on the Supabase script; `next` redirect accepts only `name.html` |
| 2 API         | clean          | POST only; UUID check; bearer token required; generic errors                                |
| 3 Database    | clean          | parameterised REST calls only; no storage buckets                                           |
| 4 Auth        | findings (Low) | localStorage session; enumeration message                                                   |
| 5 Hosting     | findings (Low) | headers good, HSTS on; no CSP; `tune.html` public                                           |
| 6 Compute     | clean          | one function; secrets only in Vercel env                                                    |
| 7 CI/VCS      | clean          | `.env*` gitignored; no secrets in history; lock file plus `npm ci`; CI runs checks          |
| 8 RLS         | clean          | owner-only policies on both tables                                                          |
| 9 Rate limits | clean          | per-user order limit, per-order and daily email caps, Supabase auth limits                  |
| 10 Caching    | clean          | no user data in shared caches; account pages render client-side                             |
| 11 Scaling    | N/A            |                                                                                             |
| 12 Logs       | info           | no error tracking                                                                           |
| 13 Recovery   | info           | free plan, no backups                                                                       |

## Fix plan (ordered)

1. Learner: delete or roll the old Supabase secret key; confirm Vercel uses the publishable key.
2. Add `public/tune.html` and `public/js/tune.js` to `.vercelignore`.
3. Later, if this becomes a real store: a CSP header, cookie-based sessions through a server, Supabase Pro backups, and error tracking.

## Evidence checked / missing

- **Checked:**
  - `api/order-confirmation.js`, `api/_lib/*`, `supabase/schema.sql`, `public/js/backend.js`, `auth-form.js`, `server.mjs`, `vercel.json`, `.vercelignore`, `.gitignore`;
  - live headers and file exposure on the production domain;
  - the email function's response with no token and with a fake token (401 both times).
- **Missing:** a runtime pentest of Supabase auth flows, and a check of the production `config.js` after PR #6 merges.
