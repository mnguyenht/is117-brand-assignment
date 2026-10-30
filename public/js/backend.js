// Everything that talks to Supabase or the order-email function. In offline
// mode (no Supabase settings) the library is never downloaded and every
// function here reports "no account" so pages fall back to this browser.
import { CONFIG, LIVE_MODE } from "./config.js";
import { normalizeCart } from "./cart.js";

// Pinned (released at least two weeks before use) and checked with Subresource
// Integrity: if the CDN ever served different bytes, the browser refuses to run
// them. This page holds the visitor's session, so third-party code must match.
const SUPABASE_JS = {
  src: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js",
  integrity:
    "sha384-BWcjm9OdFth9TbhCxZPdm+gAOUMAzQy9nmTs12ioXdCcbVnJaPMn+fMUoQCLt60R",
};

let clientPromise;

const loadSupabase = () =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SUPABASE_JS.src;
    script.integrity = SUPABASE_JS.integrity;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", () => resolve(window.supabase));
    script.addEventListener("error", () =>
      reject(new Error("Could not load the account service.")),
    );
    document.head.append(script);
  });

export function getClient() {
  if (!LIVE_MODE) return Promise.resolve(null);
  clientPromise ??= loadSupabase().then(({ createClient }) =>
    createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey),
  );
  return clientPromise;
}

// ── Demo accounts (offline mode only) ────────────────────────────────────────
// So every account page can be tried before Supabase is set up. A demo
// "sign-in" keeps only the email address in this browser. The password is
// never stored, sent or checked; the pages say so. Live mode never uses this.
export const DEMO_ACCOUNTS = !LIVE_MODE;
const DEMO_KEY = "standard-issue:demo-user";
const demoListeners = new Set();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readDemoUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem(DEMO_KEY) ?? "null");
    return user && typeof user.email === "string" ? user : null;
  } catch {
    return null;
  }
};

const setDemoUser = (user) => {
  try {
    if (user) localStorage.setItem(DEMO_KEY, JSON.stringify(user));
    else localStorage.removeItem(DEMO_KEY);
  } catch {
    // Storage blocked: the demo sign-in lasts for this page only.
  }
  demoListeners.forEach((listener) => listener(user));
};

function demoSignIn(email, password) {
  const address = String(email ?? "").trim();
  if (!EMAIL.test(address)) throw new Error("Enter a valid email address.");
  if (String(password ?? "").length < 6)
    throw new Error("Use a password of at least 6 characters.");
  const user = { id: "demo", email: address, demo: true };
  setDemoUser(user);
  return { user, session: { user } };
}

window.addEventListener("storage", (event) => {
  if (event.key === DEMO_KEY)
    demoListeners.forEach((listener) => listener(readDemoUser()));
});

export async function getUser() {
  const client = await getClient();
  if (!client) return readDemoUser();
  const { data } = await client.auth.getSession();
  return data.session?.user ?? null;
}

export async function onAuthChange(callback) {
  const client = await getClient();
  if (!client) {
    demoListeners.add(callback);
    return;
  }
  client.auth.onAuthStateChange((_event, session) =>
    callback(session?.user ?? null),
  );
}

// Live mode: fires when someone arrives from a password-reset email link.
export async function onPasswordRecovery(callback) {
  const client = await getClient();
  if (!client) return;
  client.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") callback();
  });
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

export const signUp = async (email, password) =>
  DEMO_ACCOUNTS
    ? demoSignIn(email, password)
    : call((client) => client.auth.signUp({ email, password }));

export const signIn = async (email, password) =>
  DEMO_ACCOUNTS
    ? demoSignIn(email, password)
    : call((client) => client.auth.signInWithPassword({ email, password }));

export const signOut = async () => {
  if (DEMO_ACCOUNTS) return setDemoUser(null);
  return call(async (client) => ({
    data: null,
    error: (await client.auth.signOut()).error,
  }));
};

// Source: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
// Sends a reset link that returns to reset.html. Demo mode sends nothing.
export async function requestPasswordReset(email) {
  const address = String(email ?? "").trim();
  if (!EMAIL.test(address)) throw new Error("Enter a valid email address.");
  if (DEMO_ACCOUNTS) return { demo: true };
  return call((client) =>
    client.auth.resetPasswordForEmail(address, {
      redirectTo: new URL("reset.html", window.location.href).href,
    }),
  );
}

export async function updatePassword(password) {
  if (String(password ?? "").length < 6)
    throw new Error("Use a password of at least 6 characters.");
  if (DEMO_ACCOUNTS) return { demo: true };
  return call((client) => client.auth.updateUser({ password }));
}

export async function loadRemoteCart(userId) {
  const data = await call((client) =>
    client.from("carts").select("items").eq("user_id", userId).maybeSingle(),
  );
  return normalizeCart(data?.items);
}

export function saveRemoteCart(userId, cart) {
  return call((client) =>
    client.from("carts").upsert({
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
