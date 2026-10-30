// Vercel serverless function: POST /api/order-confirmation { orderId }
// with "Authorization: Bearer <Supabase access token>".
import { handleOrderConfirmation } from "./_lib/order-confirmation.js";

export default async function handler(request, response) {
  const result = await handleOrderConfirmation(
    {
      method: request.method,
      headers: request.headers,
      body: typeof request.body === "object" ? request.body : undefined,
    },
    { env: process.env, fetch },
  );
  response.status(result.status).json(result.body);
}
