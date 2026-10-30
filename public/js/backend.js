// Everything that talks to Supabase or the order-email function. In offline
// mode (no Supabase settings) the library is never downloaded and every
// function here reports "no account" so pages fall back to this browser.
import { CONFIG, LIVE_MODE } from "./config.js";
import { normalizeCart } from "./cart.js";

// Pinned, released at least two weeks before use.
const SUPABASE_JS =
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm";

let clientPromise;

export function getClient() {
  if (!LIVE_MODE) return Promise.resolve(null);
  clientPromise ??= import(SUPABASE_JS).then(({ createClient }) =>
    createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey),
  );
  return clientPromise;
}

export async function getUser() {
  const client = await getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.user ?? null;
}

export async function onAuthChange(callback) {
  const client = await getClient();
  if (!client) return;
  client.auth.onAuthStateChange((_event, session) =>
    callback(session?.user ?? null),
  );
}

// Supabase error text is technical; give people a sentence they can act on.
const friendly = (error) => {
  const message = error?.message ?? String(error);
  if (/invalid login credentials/i.test(message))
    return "That email and password don't match an account.";
  if (/already registered/i.test(message))
    return "There's already an account with that email. Sign in instead.";
  if (/password/i.test(message) && /least/i.test(message))
    return "Use a password of at least 6 characters.";
  if (/rate limit|too many/i.test(message))
    return "Too many tries. Wait a minute and try again.";
  return message;
};

async function call(action) {
  const client = await getClient();
  if (!client) throw new Error("Accounts are off in this demo copy.");
  const { data, error } = await action(client);
  if (error) throw new Error(friendly(error));
  return data;
}

export const signUp = (email, password) =>
  call((client) => client.auth.signUp({ email, password }));

export const signIn = (email, password) =>
  call((client) => client.auth.signInWithPassword({ email, password }));

export const signOut = () =>
  call(async (client) => ({
    data: null,
    error: (await client.auth.signOut()).error,
  }));

export async function loadRemoteCart(userId) {
  const data = await call((client) =>
    client.from("carts").select("items").eq("user_id", userId).maybeSingle(),
  );
  return normalizeCart(data?.items);
}

export function saveRemoteCart(userId, cart) {
  return call((client) =>
    client
      .from("carts")
      .upsert({
        user_id: userId,
        items: cart,
        updated_at: new Date().toISOString(),
      }),
  );
}

// The database re-checks every line and computes the price itself.
export const placeOrder = (cart, shipping) =>
  call((client) =>
    client.rpc("place_order", { p_items: cart, p_shipping: shipping }),
  );

export const loadOrder = (orderId) =>
  call((client) =>
    client.from("orders").select("*").eq("id", orderId).maybeSingle(),
  );

export const loadOrders = () =>
  call((client) =>
    client
      .from("orders")
      .select("id, item_count, subtotal_cents, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  );

// Asks the Vercel function to email the confirmation. Returns
// { deliveredTo: "buyer" | "store_owner" } or { error }.
export async function requestConfirmation(orderId) {
  const client = await getClient();
  const { data } = await client.auth.getSession();
  try {
    const response = await fetch("/api/order-confirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ orderId }),
    });
    const body = await response.json().catch(() => ({}));
    return response.ok ? body : { error: body.error ?? "Email not sent." };
  } catch {
    return { error: "Email not sent." };
  }
}
