// Sends one confirmation email for one order, to the signed-in buyer only.
// Kept free of Vercel types so the unit tests can call it directly with a fake
// fetch. Uses the Supabase and Resend REST APIs, so no npm packages are needed.
import { buildOrderEmail } from "./order-email.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_FROM = "Standard Issue <onboarding@resend.dev>";

const json = (status, body) => ({ status, body });

export async function handleOrderConfirmation(request, { env, fetch }) {
  if (request.method !== "POST") return json(405, { error: "Use POST." });
  const { SUPABASE_URL, SUPABASE_ANON_KEY, RESEND_API_KEY } = env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !RESEND_API_KEY)
    return json(503, { error: "Order emails are not configured yet." });

  const auth = request.headers?.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return json(401, { error: "Sign in first." });
  const orderId = request.body?.orderId;
  if (typeof orderId !== "string" || !UUID.test(orderId))
    return json(400, { error: "Unknown order." });

  // Every Supabase call carries the buyer's own token, so row-level security
  // decides what they can see and claim.
  const supabase = (path, options = {}) =>
    fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

  const userResponse = await supabase("/auth/v1/user");
  if (!userResponse.ok) return json(401, { error: "Sign in again." });
  const user = await userResponse.json();
  if (!user?.email) return json(401, { error: "Sign in again." });

  const orderResponse = await supabase(
    `/rest/v1/orders?id=eq.${orderId}&select=id,items,item_count,subtotal_cents,shipping,created_at`,
  );
  if (!orderResponse.ok)
    return json(502, { error: "Could not read the order." });
  const [order] = await orderResponse.json();
  if (!order) return json(404, { error: "Unknown order." });

  const claimResponse = await supabase("/rest/v1/rpc/claim_confirmation", {
    method: "POST",
    body: JSON.stringify({ p_order_id: orderId }),
  });
  if (!claimResponse.ok)
    return json(502, { error: "Could not prepare the email." });
  if ((await claimResponse.json()) !== true)
    return json(409, { error: "The confirmation was already sent." });

  const email = buildOrderEmail(order);
  const send = (to, subject) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `order-confirmation/${orderId}/${to}`,
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || DEFAULT_FROM,
        to: [to],
        subject,
        text: email.text,
        html: email.html,
      }),
    });

  const first = await send(user.email, email.subject);
  if (first.ok) return json(200, { deliveredTo: "buyer" });

  // Without a verified domain, Resend only delivers to the account owner.
  // Send the owner a labelled copy instead, so the demo still shows an email.
  const owner = env.STORE_OWNER_EMAIL;
  if (first.status === 403 && owner && owner !== user.email) {
    const copy = await send(owner, `[Copy for ${user.email}] ${email.subject}`);
    if (copy.ok) return json(200, { deliveredTo: "store_owner" });
  }
  return json(502, { error: "The email service refused the message." });
}
