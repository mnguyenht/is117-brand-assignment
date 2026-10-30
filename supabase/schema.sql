-- Standard Issue (BRAND-002) database setup.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste this file → Run.
-- Safe to run again: it only creates what is missing and replaces the functions.

-- ── Carts: one saved cart per signed-in user ────────────────────────────────
create table if not exists public.carts (
  user_id uuid primary key default auth.uid()
    references auth.users (id) on delete cascade,
  -- At most one line per size (S, M, L, XL). The browser cleans the lines;
  -- place_order() re-checks everything before an order exists.
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- A list of at most four short lines, and small: free sign-ups must not be
-- able to fill the free plan's database with padded carts.
alter table public.carts drop constraint if exists carts_items_check;
alter table public.carts add constraint carts_items_check check (
  jsonb_typeof(items) = 'array'
  and jsonb_array_length(items) <= 4
  and pg_column_size(items) <= 1024
);

alter table public.carts enable row level security;

drop policy if exists "carts: owner reads" on public.carts;
create policy "carts: owner reads" on public.carts
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "carts: owner inserts" on public.carts;
create policy "carts: owner inserts" on public.carts
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "carts: owner updates" on public.carts;
create policy "carts: owner updates" on public.carts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "carts: owner deletes" on public.carts;
create policy "carts: owner deletes" on public.carts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── Orders: readable by their owner, created only by place_order() ─────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  items jsonb not null,
  item_count integer not null check (item_count between 1 and 20),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping jsonb not null,
  status text not null default 'placed' check (status = 'placed'),
  confirmation_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

drop policy if exists "orders: owner reads" on public.orders;
create policy "orders: owner reads" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);
-- No insert, update or delete policies on purpose: the browser cannot write
-- orders directly. place_order() and claim_confirmation() do it with checks.

-- ── place_order(items, shipping) ────────────────────────────────────────────
-- Recomputes the price on the server ($28.00 per shirt), validates sizes,
-- quantities and the address, limits abuse, saves the order, empties the cart.
create or replace function public.place_order(p_items jsonb, p_shipping jsonb)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_line jsonb;
  v_size text;
  v_qty_text text;
  v_qty integer;
  v_seen text[] := '{}';
  v_clean jsonb := '[]'::jsonb;
  v_count integer := 0;
  v_field text;
  v_value text;
  v_max integer;
  v_shipping jsonb := '{}'::jsonb;
  v_order public.orders;
begin
  if v_user is null then
    raise exception 'Sign in to place an order.' using errcode = '28000';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'The cart must be a list.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_shipping) is distinct from 'object' then
    raise exception 'Shipping details are missing.' using errcode = '22023';
  end if;

  for v_line in select value from jsonb_array_elements(p_items) loop
    v_size := v_line ->> 'size';
    v_qty_text := v_line ->> 'qty';
    if v_size is null or v_size not in ('S', 'M', 'L', 'XL') or v_size = any (v_seen) then
      raise exception 'Unknown or repeated size.' using errcode = '22023';
    end if;
    if v_qty_text is null or v_qty_text !~ '^[0-9]{1,2}$' then
      raise exception 'Quantities must be whole numbers.' using errcode = '22023';
    end if;
    v_qty := v_qty_text::integer;
    if v_qty < 1 or v_qty > 10 then
      raise exception 'Each size holds 1 to 10 shirts.' using errcode = '22023';
    end if;
    v_seen := v_seen || v_size;
    v_count := v_count + v_qty;
    v_clean := v_clean || jsonb_build_array(jsonb_build_object('size', v_size, 'qty', v_qty));
  end loop;

  if v_count < 1 or v_count > 20 then
    raise exception 'An order holds 1 to 20 shirts.' using errcode = '22023';
  end if;

  foreach v_field in array array['fullName', 'address', 'city', 'postalCode', 'country'] loop
    v_value := btrim(coalesce(p_shipping ->> v_field, ''));
    v_max := case v_field when 'address' then 200 when 'postalCode' then 12 when 'country' then 60 else 100 end;
    if v_value = '' or char_length(v_value) > v_max then
      raise exception 'Shipping % is missing or too long.', v_field using errcode = '22023';
    end if;
    if v_value ~ '[[:cntrl:]]' then
      raise exception 'Shipping % must be on one line.', v_field using errcode = '22023';
    end if;
    v_shipping := v_shipping || jsonb_build_object(v_field, v_value);
  end loop;
  if (v_shipping ->> 'postalCode') !~ '^[A-Za-z0-9 -]+$' then
    raise exception 'Postal codes use letters, numbers, spaces or dashes.' using errcode = '22023';
  end if;

  -- A demo store still should not be an email cannon: at most 10 orders an hour.
  -- The per-user lock makes parallel calls wait their turn, so they cannot all
  -- pass the count before any of them has inserted.
  perform pg_advisory_xact_lock(hashtextextended('place_order:' || v_user::text, 0));
  if (select count(*) from public.orders
      where user_id = v_user and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many orders in the last hour. Try again later.' using errcode = '54000';
  end if;

  insert into public.orders (user_id, items, item_count, subtotal_cents, shipping)
  values (v_user, v_clean, v_count, v_count * 2800, v_shipping)
  returning * into v_order;

  delete from public.carts where user_id = v_user;
  return v_order;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, jsonb) to authenticated;

-- ── claim_confirmation(order_id) ────────────────────────────────────────────
-- Marks an order's email as sent. Returns true only the first time, and only
-- for the order's owner, so each order gets at most one confirmation email.
-- Store-wide, at most 50 confirmations go out per day (Resend's free plan
-- allows 100), so scripted sign-ups cannot use up the email quota.
create or replace function public.claim_confirmation(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('claim_confirmation', 0));
  if (select count(*) from public.orders
      where confirmation_sent_at > now() - interval '1 day') >= 50 then
    return false;
  end if;
  update public.orders
     set confirmation_sent_at = now()
   where id = p_order_id
     and user_id = auth.uid()
     and confirmation_sent_at is null;
  return found;
end;
$$;

revoke all on function public.claim_confirmation(uuid) from public, anon;
grant execute on function public.claim_confirmation(uuid) to authenticated;
