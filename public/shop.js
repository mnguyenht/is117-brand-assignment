import { SIZES, itemCount, subtotalCents, formatPrice } from "./js/cart.js";
import { initCart, getCart, add, remove, clear } from "./js/cart-store.js";
import { startHeader } from "./js/site-header.js";
const form = document.querySelector("#product-form");
if (form) {
  const sizeError = document.querySelector("#size-error");
  const bagCount = document.querySelector("#bag-count");
  const bagStatus = document.querySelector("#bag-status");
  const bagItems = document.querySelector("#bag-items");
  const bagSubtotal = document.querySelector("#bag-subtotal");
  const checkoutLink = document.querySelector("#checkout-link");
  const clearBag = document.querySelector("#clear-bag");
  const addConfirm = document.querySelector("#add-confirm");
  const bagLimit = document.querySelector("#bag-limit");
  let holdTimer, leaveTimer, bumpTimer, transitionHandler;
  const hideAdded = () => {
    clearTimeout(leaveTimer);
    addConfirm.hidden = true;
    addConfirm.classList.remove("is-leaving");
    if (transitionHandler)
      addConfirm.removeEventListener("transitionend", transitionHandler);
    transitionHandler = null;
  };
  const showAdded = () => {
    clearTimeout(holdTimer);
    clearTimeout(leaveTimer);
    if (transitionHandler)
      addConfirm.removeEventListener("transitionend", transitionHandler);
    addConfirm.classList.remove("is-leaving");
    addConfirm.hidden = false;
    holdTimer = setTimeout(() => {
      addConfirm.classList.add("is-leaving");
      transitionHandler = (event) => {
        if (event.propertyName === "opacity") hideAdded();
      };
      addConfirm.addEventListener("transitionend", transitionHandler);
      leaveTimer = setTimeout(hideAdded, 300);
    }, 1400);
    clearTimeout(bumpTimer);
    bagCount.classList.add("is-bumped");
    bumpTimer = setTimeout(() => bagCount.classList.remove("is-bumped"), 400);
  };
  const renderBag = (cart = getCart()) => {
    const count = itemCount(cart);
    clearBag.disabled = count === 0;
    clearBag.hidden = count === 0;
    bagItems.replaceChildren();
    for (const { size, qty } of cart) {
      const item = document.createElement("li");
      const thumb = document.createElement("span");
      thumb.className = "bag-thumbnail";
      const image = document.createElement("img");
      image.src = "assets/white-shirt-cutout.svg";
      image.alt = "";
      image.width = 44;
      image.height = 48;
      thumb.append(image);
      const details = document.createElement("span");
      details.className = "bag-line-copy";
      const name = document.createElement("strong");
      name.textContent = "White T-shirt";
      const meta = document.createElement("span");
      meta.textContent = `Size ${size} · Quantity ${qty}`;
      details.append(name, meta);
      const price = document.createElement("span");
      price.className = "bag-line-price";
      price.textContent = formatPrice(qty * 2800);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "text-button bag-remove";
      button.textContent = "Remove";
      button.setAttribute("aria-label", `Remove size ${size}`);
      button.addEventListener("click", async () => {
        const buttons = [...bagItems.querySelectorAll(".bag-remove")];
        const index = buttons.indexOf(button);
        await remove(size);
        const next = itemCount(getCart());
        bagStatus.textContent = next
          ? `Your demo bag has ${next} ${next === 1 ? "item" : "items"}.`
          : "Your demo bag is empty. Choose a size to try it again.";
        const remaining = [...bagItems.querySelectorAll(".bag-remove")];
        (
          remaining[index] ??
          remaining[index - 1] ??
          document.querySelector("#bag-title")
        ).focus();
      });
      item.append(thumb, details, price, button);
      bagItems.append(item);
    }
    const total = formatPrice(subtotalCents(cart));
    bagSubtotal.textContent = `Subtotal ${total}`;
    bagSubtotal.hidden = count === 0;
    checkoutLink.textContent = `Check out — ${total}`;
    checkoutLink.hidden = count === 0;
  };
  window.addEventListener("cart:change", (event) => renderBag(event.detail));
  startHeader();
  await initCart();
  renderBag();
  const initial = itemCount(getCart());
  if (initial)
    bagStatus.textContent = `Your demo bag has ${initial} ${initial === 1 ? "item" : "items"}.`;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="size"]:checked');
    if (!selected || !SIZES.includes(selected.value)) {
      sizeError.hidden = false;
      form
        .querySelectorAll('input[name="size"]')
        .forEach((input) => input.setAttribute("aria-invalid", "true"));
      form.querySelector('input[name="size"]').focus();
      return;
    }
    sizeError.hidden = true;
    const previous = itemCount(getCart());
    await add(selected.value);
    const count = itemCount(getCart());
    if (count === previous) {
      clearTimeout(holdTimer);
      hideAdded();
      bagStatus.textContent = "";
      bagLimit.textContent =
        "Your bag is full: up to 10 of a size and 20 shirts in total.";
      bagLimit.hidden = false;
      return;
    }
    bagLimit.hidden = true;
    showAdded();
    bagStatus.textContent = `Added a white T-shirt in size ${selected.value}. Your demo bag has ${count} ${count === 1 ? "item" : "items"}.`;
  });
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
