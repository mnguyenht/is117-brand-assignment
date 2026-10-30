import { test } from "node:test";
import assert from "node:assert/strict";
import { handleOrderConfirmation } from "../../api/_lib/order-confirmation.js";

const ORDER_ID = "6f1c2b3a-1111-4222-8333-944455556666";
const env = {
  SUPABASE_URL: "https://demo.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  RESEND_API_KEY: "re_test",
  STORE_OWNER_EMAIL: "owner@example.com",
};
const order = {
  id: ORDER_ID,
  items: [{ size: "M", qty: 2 }],
  item_count: 2,
  subtotal_cents: 5600,
  shipping: {
    fullName: "Alex <b>Doe</b>",
    address: "12 Main Street",
    city: "Newark",
    postalCode: "07102",
    country: "United States",
  },
  created_at: "2026-10-30T06:00:00Z",
};

// A fake fetch that answers like Supabase and Resend, and records every call.
function fakeServices({
  userOk = true,
  orders = [order],
  claimed = true,
  resend = [{ status: 200, body: { id: "email_1" } }],
} = {}) {
  const calls = [];
  const resendReplies = [...resend];
  const reply = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  const fetch = async (url, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ url: String(url), headers: options.headers ?? {}, body });
    if (String(url).endsWith("/auth/v1/user"))
      return userOk
        ? reply(200, { id: "user-1", email: "alex@example.com" })
        : reply(401, { msg: "invalid JWT" });
    if (String(url).includes("/rest/v1/orders")) return reply(200, orders);
    if (String(url).endsWith("/rest/v1/rpc/claim_confirmation"))
      return reply(200, claimed);
    if (String(url) === "https://api.resend.com/emails") {
      const next = resendReplies.shift();
      return reply(next.status, next.body);
    }
    throw new Error(`Unexpected request to ${url}`);
  };
  return { fetch, calls };
}

const request = (overrides = {}) => ({
  method: "POST",
  headers: { authorization: "Bearer user-token" },
  body: { orderId: ORDER_ID },
  ...overrides,
});

test("only POST is accepted", async () => {
  const { fetch } = fakeServices();
  const result = await handleOrderConfirmation(request({ method: "GET" }), {
    env,
    fetch,
  });
  assert.equal(result.status, 405);
});

test("reports not configured when keys are missing", async () => {
  const { fetch } = fakeServices();
  const result = await handleOrderConfirmation(request(), { env: {}, fetch });
  assert.equal(result.status, 503);
});

test("a request without a sign-in token is refused", async () => {
  const { fetch, calls } = fakeServices();
  const result = await handleOrderConfirmation(request({ headers: {} }), {
    env,
    fetch,
  });
  assert.equal(result.status, 401);
  assert.equal(calls.length, 0);
});

test("an order id that is not a UUID is refused", async () => {
  const { fetch, calls } = fakeServices();
  const result = await handleOrderConfirmation(
    request({ body: { orderId: "1 or 1=1" } }),
    { env, fetch },
  );
  assert.equal(result.status, 400);
  assert.equal(calls.length, 0);
});

test("an invalid sign-in token is refused", async () => {
  const { fetch } = fakeServices({ userOk: false });
  const result = await handleOrderConfirmation(request(), { env, fetch });
  assert.equal(result.status, 401);
});

test("an order the user cannot see is not found", async () => {
  const { fetch, calls } = fakeServices({ orders: [] });
  const result = await handleOrderConfirmation(request(), { env, fetch });
  assert.equal(result.status, 404);
  assert.ok(!calls.some((call) => call.url.includes("resend")));
});

test("the order is read with the user's own token, so row-level security applies", async () => {
  const { fetch, calls } = fakeServices();
  await handleOrderConfirmation(request(), { env, fetch });
  const read = calls.find((call) => call.url.includes("/rest/v1/orders"));
  assert.equal(read.headers.Authorization, "Bearer user-token");
});

test("a second send for the same order is refused", async () => {
  const { fetch, calls } = fakeServices({ claimed: false });
  const result = await handleOrderConfirmation(request(), { env, fetch });
  assert.equal(result.status, 409);
  assert.ok(!calls.some((call) => call.url.includes("resend")));
});

test("the email goes to the signed-in account, never to an address in the request", async () => {
  const { fetch, calls } = fakeServices();
  const result = await handleOrderConfirmation(
    request({ body: { orderId: ORDER_ID, email: "victim@example.com" } }),
    { env, fetch },
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.deliveredTo, "buyer");
  const sent = calls.find((call) => call.url.includes("resend"));
  assert.deepEqual(sent.body.to, ["alex@example.com"]);
  assert.equal(sent.headers.Authorization, "Bearer re_test");
});

test("the email carries no customer-typed text, so it cannot be used for phishing", async () => {
  const { fetch, calls } = fakeServices();
  await handleOrderConfirmation(request(), { env, fetch });
  const sent = calls.find((call) => call.url.includes("resend"));
  for (const part of [sent.body.html, sent.body.text, sent.body.subject]) {
    assert.ok(!part.includes("Alex"));
    assert.ok(!part.includes("Main Street"));
  }
  assert.ok(sent.body.text.includes("$56.00"));
  assert.ok(sent.body.text.includes("6F1C2B3A"));
});

test("in Resend test mode the email falls back to a copy for the store owner", async () => {
  const { fetch, calls } = fakeServices({
    resend: [
      {
        status: 403,
        body: {
          name: "validation_error",
          message: "You can only send testing emails to your own email address",
        },
      },
      { status: 200, body: { id: "email_2" } },
    ],
  });
  const result = await handleOrderConfirmation(request(), { env, fetch });
  assert.equal(result.status, 200);
  assert.equal(result.body.deliveredTo, "store_owner");
  const sends = calls.filter((call) => call.url.includes("resend"));
  assert.deepEqual(sends[1].body.to, ["owner@example.com"]);
  assert.match(sends[1].body.subject, /alex@example\.com/);
});

test("other Resend failures are reported, not hidden", async () => {
  const { fetch } = fakeServices({
    resend: [{ status: 500, body: { message: "boom" } }],
  });
  const result = await handleOrderConfirmation(request(), { env, fetch });
  assert.equal(result.status, 502);
});
