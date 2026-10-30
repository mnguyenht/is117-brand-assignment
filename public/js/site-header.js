import { LIVE_MODE } from "./config.js";
import { itemCount } from "./cart.js";
import { getCart } from "./cart-store.js";
import { getUser, onAuthChange } from "./backend.js";

export function startHeader() {
  const updateCount = (cart) => {
    document.querySelectorAll("#bag-count").forEach((element) => {
      element.textContent = String(itemCount(cart));
    });
  };
  const updateAccount = (user) => {
    const link = document.querySelector("#account-link");
    if (link) link.textContent = LIVE_MODE && !user ? "Sign in" : "Account";
  };
  updateCount(getCart());
  window.addEventListener("cart:change", (event) => updateCount(event.detail));
  if (LIVE_MODE) {
    getUser()
      .then(updateAccount)
      .catch(() => updateAccount(null));
    onAuthChange(updateAccount);
  } else {
    updateAccount(null);
  }
}
