import {
  DEMO_ACCOUNTS,
  getUser,
  onPasswordRecovery,
  updatePassword,
} from "./backend.js";
import { initCart } from "./cart-store.js";
import { startHeader } from "./site-header.js";
const form = document.querySelector("#reset-form");
const message = document.querySelector("#reset-message");
const password = document.querySelector("#new-password");
const confirm = document.querySelector("#confirm-password");
const status = document.querySelector("#reset-status");
let allowed = DEMO_ACCOUNTS || Boolean(await getUser());
startHeader();
await initCart();
if (DEMO_ACCOUNTS) document.querySelector("#demo-accounts").hidden = false;
await onPasswordRecovery(() => {
  allowed = true;
  form.hidden = false;
  message.hidden = true;
});
if (!allowed) {
  form.hidden = true;
  message.hidden = false;
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (password.value !== confirm.value) {
    status.textContent = "Passwords must match.";
    confirm.setAttribute("aria-invalid", "true");
    confirm.focus();
    return;
  }
  confirm.removeAttribute("aria-invalid");
  try {
    const result = await updatePassword(password.value);
    status.textContent = result?.demo
      ? "Demo mode: nothing was changed."
      : "Password updated.";
    const link = document.createElement("a");
    link.href = "account.html";
    link.textContent = "Go to your account";
    status.append(document.createTextNode(" "), link);
    status.focus();
  } catch (problem) {
    status.textContent = problem.message;
    status.focus();
  }
});
