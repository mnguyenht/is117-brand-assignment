(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    const values = JSON.parse(
      sessionStorage.getItem("si:tune-overrides") ?? "null",
    );
    if (values && typeof values === "object") {
      for (const [property, value] of Object.entries(values)) {
        if (/^--(?:unbox|enter|panel-grid)-/.test(property))
          root.style.setProperty(property, String(value));
      }
    }
  } catch {
    // Storage can be unavailable; shipped values still work.
  }
  if (reduced) return;
  let first;
  try {
    first = !sessionStorage.getItem("si:unboxed");
    sessionStorage.setItem("si:unboxed", "true");
  } catch {
    first = true;
  }
  if (first) {
    root.classList.add("unbox");
    root.style.setProperty("--enter-start", "360ms");
  }
  root.classList.add("enter");
  const clear = () => root.classList.remove("unbox", "enter");
  addEventListener("keydown", clear, { once: true });
  addEventListener("pointerdown", clear, { once: true });
  addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector("main");
    const candidates =
      location.pathname.endsWith("index.html") || location.pathname === "/"
        ? [
            document.querySelector(".product-visual"),
            ...document.querySelectorAll(".product-information > *"),
            ...document.querySelectorAll(
              "main > section:not(.product-section)",
            ),
          ]
        : [
            ...(main?.querySelectorAll(
              ":scope > h1, :scope > article, :scope > div, :scope > section",
            ) ?? []),
          ];
    candidates
      .filter(Boolean)
      .slice(0, 10)
      .forEach((element, index) => {
        element.dataset.enter = "";
        element.style.setProperty("--i", index);
      });
    document
      .querySelectorAll(".starter-notice, .site-footer")
      .forEach((element, index) => {
        element.dataset.enter = "";
        element.style.setProperty(
          "--i",
          Math.min(9, candidates.length + index),
        );
      });
    const flap = document.querySelector("html");
    flap.addEventListener("animationend", (event) => {
      if (event.animationName.startsWith("unbox-"))
        root.classList.remove("unbox");
    });
    setTimeout(() => root.classList.remove("unbox"), 1200);
    setTimeout(() => root.classList.remove("enter"), 1600);
  });
})();
