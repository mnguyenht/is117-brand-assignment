"use strict";

// Read shared CSS values instead of maintaining a second palette or spacing list.
(() => {
  const tokens = getComputedStyle(document.documentElement);
  document.querySelectorAll("[data-color-token]").forEach((label) => {
    label.textContent = tokens
      .getPropertyValue(label.dataset.colorToken)
      .trim();
  });
  document.querySelectorAll("[data-space-token]").forEach((label) => {
    label.textContent = tokens
      .getPropertyValue(label.dataset.spaceToken)
      .trim();
  });
})();
