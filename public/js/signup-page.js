import { DEMO_ACCOUNTS, getUser } from "./backend.js";
import { authCard, demoNote, readSafeNext } from "./auth-form.js";
import { initCart } from "./cart-store.js";
import { startHeader } from "./site-header.js";

const content = document.querySelector("#signup-content");
const safeNext = readSafeNext();

startHeader();
await initCart();

if (await getUser()) {
  location.replace(safeNext ?? "account.html");
} else {
  content.replaceChildren(
    authCard("signup", {
      safeNext,
      onSignedIn: () => {
        location.href = safeNext ?? "account.html";
      },
    }),
    ...(DEMO_ACCOUNTS ? [demoNote()] : []),
  );
}
