(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  try {
    const overrides = JSON.parse(
      sessionStorage.getItem("si:tune-overrides") ?? "null",
    );
    if (overrides && typeof overrides === "object") {
      for (const [property, value] of Object.entries(overrides)) {
        if (property.startsWith("--intro-") || property.startsWith("--grid-")) {
          root.style.setProperty(property, String(value));
        }
      }
    }
  } catch {
    // Storage can be unavailable in privacy modes; shipped values still work.
  }

  if (reducedMotion) return;

  try {
    if (!sessionStorage.getItem("si:intro-played")) {
      root.classList.add("intro");
      sessionStorage.setItem("si:intro-played", "true");
    }
  } catch {
    root.classList.add("intro");
  }
})();
