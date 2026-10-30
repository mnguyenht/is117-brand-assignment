import { CONFIG } from "./config.js";
const sceneUrl = CONFIG.splineSceneUrl.trim();
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const panel = document.querySelector(".product-visual");
if (sceneUrl && panel) {
  const shirt = panel.querySelector(".shirt-image");
  let loading = false;
  panel.addEventListener("wheel", (event) => event.stopPropagation(), {
    capture: true,
    passive: true,
  });
  function addLoadButton(noteText = "") {
    const button = document.createElement("button");
    button.className = "spline-button";
    button.type = "button";
    button.textContent = "View in 3D";
    button.addEventListener("click", () => {
      panel.tabIndex = -1;
      panel.focus();
      button.remove();
      panel.querySelector(".spline-error")?.remove();
      loadViewer();
    });
    panel.append(button);
    if (noteText) {
      const note = document.createElement("span");
      note.className = "spline-error";
      note.textContent = noteText;
      panel.append(note);
    }
  }
  function loadViewer() {
    if (loading) return;
    loading = true;
    const viewer = document.createElement("spline-viewer");
    viewer.setAttribute("url", sceneUrl);
    viewer.setAttribute("loading-anim-type", "none");
    viewer.setAttribute("role", "img");
    viewer.setAttribute("aria-label", "3D white T-shirt. Drag to turn it.");
    const loader = document.createElement("script");
    loader.type = "module";
    loader.src =
      "https://cdn.spline.design/@splinetool/viewer@2.0.122/build/spline-viewer.js";
    loader.integrity =
      "sha384-UxGIOjoGfkAIHT0tTRRLMF74vfbaZnCyq8+7jNxOwRZP65RLb8sKZKQXVS/nRKYo";
    loader.crossOrigin = "anonymous";
    const timeout = setTimeout(fail, 20000);
    function fail() {
      clearTimeout(timeout);
      viewer.remove();
      loader.remove();
      loading = false;
      addLoadButton("3D view couldn't load.");
    }
    loader.addEventListener("error", fail, { once: true });
    viewer.addEventListener(
      "load-complete",
      () => {
        clearTimeout(timeout);
        viewer._spline?.setBackgroundColor?.("transparent");
        if (viewer._canvas) viewer._canvas.style.touchAction = "pan-y";
        viewer.classList.add("is-ready");
        shirt.classList.add("has-3d-view");
        const label = document.createElement("span");
        label.className = "visual-label spline-label";
        label.textContent = "Drag to turn";
        panel.append(label);
      },
      { once: true },
    );
    panel.append(viewer);
    document.head.append(loader);
  }
  if (reduced) addLoadButton();
  else {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadViewer();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(panel);
  }
}
