# Turning on accounts, saved carts and order emails

Out of the box the store runs as an **offline demo**: the bag and orders live in your browser and no email is sent. These steps switch on the real parts. Everything here is on free plans and needs no credit card. It takes about 20 minutes.

You will create three things: a **Supabase** project (accounts + database), a **Resend** API key (email) and three **Vercel** settings (to connect them). Never paste a secret key into a file in this repo; secrets only go into Vercel.

## 1. Supabase: accounts and the database (about 8 minutes)

1. Go to <https://supabase.com>, choose **Start your project**, and sign in with GitHub.
2. **New project.** Name: `standard-issue`. Database password: click **Generate a password** and save it in your password manager (the site never needs it). Region: **East US**. Click **Create new project** and wait about 2 minutes.
3. Left sidebar → **SQL Editor** → **New query**. Open [`supabase/schema.sql`](../supabase/schema.sql) from this repo, copy all of it, paste it in, and click **Run**. You should see "Success. No rows returned".
4. Left sidebar → **Authentication** → **Sign In / Providers** → **Email**. Turn **off** "Confirm email" and save.
   _Why:_ Supabase's built-in email only reaches your own team's addresses on the free plan, so sign-up confirmation emails would never arrive for anyone else. For a class demo, accounts work right away instead.
5. Left sidebar → **Project Settings** → **API Keys** (or **Data API**). Copy two values:
   - **Project URL**, which looks like `https://abcdxyz.supabase.co`.
   - **Publishable key** (`sb_publishable_…`), or on older projects the **anon public** key. This key is _designed_ to be public; the database rules in `schema.sql` decide what anyone can read or write. **Do not** copy the `service_role` / secret key anywhere.
6. Put both values into [`public/js/config.js`](../public/js/config.js) (`supabaseUrl` and `supabaseAnonKey`). This is the one change you commit.

## 2. Resend: order confirmation emails (about 4 minutes)

1. Go to <https://resend.com> and sign up **with the email address you want to receive the demo order emails**.
2. **API Keys** → **Create API Key**. Name `standard-issue`, permission **Sending access**. Copy it now: it is shown only once.
3. You don't need a domain. Without one, Resend can only deliver to **your own** address. So when anyone else places an order, the site sends **you** a copy labelled "[Copy for their@email]", and the order page explains that the email is in test mode.

## 3. Vercel: connect the keys (about 4 minutes)

1. Open <https://vercel.com/mnguyenhts-projects/is117-brand-assignment/settings/environment-variables>.
2. Add these four, ticking **Production** and **Preview** for each:

   | Name                | Value                                  |
   | ------------------- | -------------------------------------- |
   | `SUPABASE_URL`      | your Supabase Project URL              |
   | `SUPABASE_ANON_KEY` | your Supabase publishable / anon key   |
   | `RESEND_API_KEY`    | your Resend key (`re_…`)               |
   | `STORE_OWNER_EMAIL` | the email you signed up to Resend with |

3. Deployments → the newest one → **⋯** → **Redeploy**. (Any `git push` also redeploys.)

## 4. Try it

1. Open the site → **Account** → create an account (any email + a 6+ character password).
2. Add a shirt, **Check out**, fill in an address, **Place demo order**.
3. Your Resend inbox gets the confirmation. In Supabase → **Table Editor** → `orders`, the row is there, priced by the database.

## 5. The 3D shirt (done — one fix left in Spline)

Your scene (`NxwbTGxwVcrRqPgS`) is already in [`public/js/config.js`](../public/js/config.js), loaded with viewer 2.0.122. The site makes its dark background transparent in code, so you don't need to change that.

**The one thing to fix:** when you drag, the shirt swings off to the side instead of turning in place. The camera orbits around the scene's centre, but the shirt isn't sitting on it. In the Spline editor:

1. Select the shirt and set its **Position** to `0, 0, 0` (right panel → Transform). If the shirt is a group, select the group.
2. Select the camera → **Play settings** → **Orbit**: keep it on, and turn **Zoom** and **Pan** off. Zoom would fight with page scrolling, and pan lets people drag the shirt out of view.
3. **Export** → **Code Export** → **Update** (the URL stays the same). Refresh the site to see it.

The "Built with Spline" badge comes with Spline's free plan and can only be removed on a paid plan.

## If something goes wrong

- **"Accounts are off in this demo copy"**: `config.js` still has empty Supabase values, or the deploy hasn't picked them up yet.
- **Order placed but "We couldn't send the confirmation email"**: one of the four Vercel variables is missing or misspelled. Fix it and redeploy. Each order emails at most once, so place a new order to test again.
- **Supabase project paused**: free projects pause after a week with no visits. Open the Supabase dashboard and click **Restore**.
