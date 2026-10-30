const panel = document.querySelector(".product-visual");
if (panel) {
  const canvas = document.createElement("canvas");
  canvas.className = "panel-grid";
  canvas.setAttribute("aria-hidden", "true");
  panel.prepend(canvas);
  panel.classList.add("has-panel-grid");
  const context = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const defaults = {
    gap: 9,
    dot: 1.2,
    alpha: 0.14,
    speed: 0.08,
    glow: 0.6,
    radius: 60,
  };
  const settings = {};
  let width = 0;
  let height = 0;
  let offset = 0;
  let frame = 0;
  let pointer = null;
  let glow = null;
  let lastTime = 0;
  let lastPaint = 0;
  let pattern = null;
  const color = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const readSettings = () => {
    const style = getComputedStyle(document.documentElement);
    for (const [key, fallback] of Object.entries(defaults)) {
      const value = Number.parseFloat(
        style.getPropertyValue(`--panel-grid-${key}`),
      );
      settings[key] = Number.isFinite(value) ? value : fallback;
    }
  };
  function makePattern() {
    const dpr = devicePixelRatio || 1;
    const tile = document.createElement("canvas");
    tile.width = Math.max(1, Math.round(settings.gap * dpr));
    tile.height = tile.width;
    const tileContext = tile.getContext("2d");
    tileContext.globalAlpha = settings.alpha;
    tileContext.fillStyle = color("--color-ink") || "#111";
    tileContext.beginPath();
    tileContext.arc(0, 0, settings.dot * dpr, 0, Math.PI * 2);
    tileContext.fill();
    pattern = context.createPattern(tile, "repeat");
  }
  function resize() {
    const box = panel.getBoundingClientRect();
    const dpr = devicePixelRatio || 1;
    width = box.width;
    height = box.height;
    const nextWidth = Math.round(width * dpr);
    const nextHeight = Math.round(height * dpr);
    if (canvas.width === nextWidth && canvas.height === nextHeight) return;
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    makePattern();
    start();
  }
  function draw(time = 0) {
    frame = 0;
    if (!reduced.matches && time - lastPaint < 34) {
      start();
      return;
    }
    lastPaint = time;
    const moving = !reduced.matches && settings.speed !== 0;
    if (moving) offset = (offset + settings.speed) % settings.gap;
    if (glow && !pointer && !reduced.matches) {
      const elapsed = lastTime ? time - lastTime : 16;
      glow.strength = Math.max(0, glow.strength - elapsed / 400);
      if (!glow.strength) glow = null;
    }
    lastTime = time;
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(offset, offset);
    context.fillStyle = pattern;
    context.fillRect(
      -settings.gap,
      -settings.gap,
      width + settings.gap,
      height + settings.gap,
    );
    context.restore();
    if (glow) {
      const accent = color("--color-accent") || "#f2c94c";
      const startX = Math.floor(
        (glow.x - settings.radius - offset) / settings.gap,
      );
      const endX = Math.ceil(
        (glow.x + settings.radius - offset) / settings.gap,
      );
      const startY = Math.floor(
        (glow.y - settings.radius - offset) / settings.gap,
      );
      const endY = Math.ceil(
        (glow.y + settings.radius - offset) / settings.gap,
      );
      context.fillStyle = accent;
      for (let column = startX; column <= endX; column += 1) {
        for (let row = startY; row <= endY; row += 1) {
          const x = column * settings.gap + offset;
          const y = row * settings.gap + offset;
          const falloff =
            Math.max(
              0,
              1 - Math.hypot(x - glow.x, y - glow.y) / settings.radius,
            ) * glow.strength;
          if (!falloff) continue;
          context.globalAlpha = settings.glow * falloff;
          context.beginPath();
          context.arc(
            x,
            y,
            settings.dot + (2.4 - settings.dot) * falloff,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
      }
      context.globalAlpha = 1;
    }
    if (!document.hidden && (moving || (glow && !pointer))) start();
  }
  function start() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
  }
  window.siGrid = {
    set(next = {}) {
      for (const key of Object.keys(defaults)) {
        const value = Number(next[key]);
        if (Number.isFinite(value)) settings[key] = value;
      }
      makePattern();
      start();
    },
  };
  panel.addEventListener("pointermove", (event) => {
    if (!fine.matches) return;
    const box = panel.getBoundingClientRect();
    pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
    glow = { ...pointer, strength: 1 };
    start();
  });
  panel.addEventListener("pointerleave", () => {
    pointer = null;
    if (reduced.matches) glow = null;
    start();
  });
  reduced.addEventListener("change", () => {
    offset = 0;
    if (reduced.matches && !pointer) glow = null;
    start();
  });
  document.addEventListener("visibilitychange", start);
  readSettings();
  new ResizeObserver(resize).observe(panel);
  resize();
}
