import { SIZES, itemCount, subtotalCents, formatPrice } from "./js/cart.js";
import { initCart, getCart, add, remove, clear } from "./js/cart-store.js";
import { startHeader } from "./js/site-header.js";

const form = document.querySelector("#product-form");

if (form) {
  let handleSubmit = () => {};
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
  });
  const sizeError = document.querySelector("#size-error");
  const bagCount = document.querySelector("#bag-count");
  const bagStatus = document.querySelector("#bag-status");
  const bagItems = document.querySelector("#bag-items");
  const bagSubtotal = document.querySelector("#bag-subtotal");
  const checkoutLink = document.querySelector("#checkout-link");
  const clearBag = document.querySelector("#clear-bag");
  const addConfirm = document.querySelector("#add-confirm");
  const bagLimit = document.querySelector("#bag-limit");
  let holdTimer;
  let leaveTimer;
  let bumpTimer;

  const showAdded = () => {
    clearTimeout(holdTimer);
    clearTimeout(leaveTimer);
    addConfirm.classList.remove("is-leaving");
    addConfirm.hidden = false;
    holdTimer = setTimeout(() => {
      addConfirm.classList.add("is-leaving");
      leaveTimer = setTimeout(() => {
        addConfirm.hidden = true;
        addConfirm.classList.remove("is-leaving");
      }, 120);
    }, 1400);
    clearTimeout(bumpTimer);
    bagCount.classList.add("is-bumped");
    bumpTimer = setTimeout(() => bagCount.classList.remove("is-bumped"), 400);
  };

  const renderBag = (cart = getCart()) => {
    const count = itemCount(cart);
    clearBag.disabled = count === 0;
    bagItems.replaceChildren();
    for (const { size, qty } of cart) {
      const item = document.createElement("li");
      const line = document.createElement("span");
      const removeButton = document.createElement("button");
      line.textContent = `White T-shirt · Size ${size} · Quantity ${qty}`;
      removeButton.type = "button";
      removeButton.className = "text-button bag-remove";
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", `Remove size ${size}`);
      removeButton.addEventListener("click", async () => {
        const buttons = [...bagItems.querySelectorAll(".bag-remove")];
        const removedIndex = buttons.indexOf(removeButton);
        await remove(size);
        const nextCount = itemCount(getCart());
        bagStatus.textContent = nextCount
          ? `Your demo bag has ${nextCount} ${nextCount === 1 ? "item" : "items"}.`
          : "Your demo bag is empty. Choose a size to try it again.";
        const remaining = [...bagItems.querySelectorAll(".bag-remove")];
        const focusTarget =
          remaining[removedIndex] ??
          remaining[removedIndex - 1] ??
          document.querySelector("#bag-title");
        focusTarget.focus();
      });
      item.append(line, removeButton);
      bagItems.append(item);
    }
    bagSubtotal.textContent = `Subtotal ${formatPrice(subtotalCents(cart))}`;
    bagSubtotal.hidden = count === 0;
    checkoutLink.hidden = count === 0;
  };

  window.addEventListener("cart:change", (event) => renderBag(event.detail));
  startHeader();
  await initCart();
  const initialCount = itemCount(getCart());
  if (initialCount) {
    bagStatus.textContent = `Your demo bag has ${initialCount} ${initialCount === 1 ? "item" : "items"}.`;
  }

  handleSubmit = async () => {
    const selected = form.querySelector('input[name="size"]:checked');
    if (!selected || !SIZES.includes(selected.value)) {
      sizeError.hidden = false;
      form.querySelectorAll('input[name="size"]').forEach((input) => {
        input.setAttribute("aria-invalid", "true");
      });
      form.querySelector('input[name="size"]').focus();
      return;
    }
    sizeError.hidden = true;
    const previousCount = itemCount(getCart());
    await add(selected.value);
    const count = itemCount(getCart());
    if (count === previousCount) {
      clearTimeout(holdTimer);
      clearTimeout(leaveTimer);
      addConfirm.hidden = true;
      addConfirm.classList.remove("is-leaving");
      bagStatus.textContent = "";
      bagLimit.textContent =
        "Your bag is full: up to 10 of a size and 20 shirts in total.";
      bagLimit.hidden = false;
      return;
    }
    bagLimit.hidden = true;
    showAdded();
    bagStatus.textContent = `Added a white T-shirt in size ${selected.value}. Your demo bag has ${count} ${count === 1 ? "item" : "items"}.`;
  };

  form.addEventListener("change", () => {
    sizeError.hidden = true;
    bagLimit.hidden = true;
    form
      .querySelectorAll('input[name="size"]')
      .forEach((input) => input.removeAttribute("aria-invalid"));
  });

  clearBag.addEventListener("click", async () => {
    await clear();
    bagStatus.textContent =
      "Your demo bag is empty. Choose a size to try it again.";
    (
      form.querySelector('input[name="size"]:checked') ??
      form.querySelector('input[name="size"]')
    ).focus();
  });
}
