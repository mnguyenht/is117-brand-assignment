import { DEMO_ACCOUNTS, requestPasswordReset } from "./backend.js";
import { initCart } from "./cart-store.js";
import { startHeader } from "./site-header.js";
const form = document.querySelector("#forgot-form");
const email = document.querySelector("#forgot-email");
const status = document.querySelector("#forgot-status");
startHeader();
await initCart();
if (DEMO_ACCOUNTS) document.querySelector("#demo-accounts").hidden = false;
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const result = await requestPasswordReset(email.value);
    status.textContent = result?.demo
      ? "Demo mode: no email is sent. In the live store a reset link would arrive by email."
      : "If an account exists for that email, a reset link is on its way.";
    status.focus();
  } catch (problem) {
    status.textContent = problem.message;
    status.focus();
  }
});
