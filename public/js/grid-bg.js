// Drifting background grid that lights up the squares under your mouse, leaving a fading trail.
// Ported from React Bits' ShapeGrid by David Haz (MIT + Commons Clause), squares only:
// https://github.com/DavidHDev/react-bits/tree/main/src/content/Backgrounds/ShapeGrid
// Changes from the original: plain JS instead of a React component, sharp lines on high-DPI
// screens, mouse tracked on the window (the canvas sits behind the page), no drift with reduced motion.

const canvas = document.querySelector("#grid-bg");

if (canvas) {
  const context = canvas.getContext("2d");
  const rootStyle = getComputedStyle(document.documentElement);
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = matchMedia("(hover: hover) and (pointer: fine)");
  const lineColor = rootStyle.getPropertyValue("--color-ink").trim();
  const glowColor = rootStyle.getPropertyValue("--color-accent").trim();
  const numberFromCss = (property, fallback) => {
    const value = Number.parseFloat(rootStyle.getPropertyValue(property));
    return Number.isFinite(value) ? value : fallback;
  };
  const settings = {
    cell: numberFromCss("--grid-cell", 48),
    speed: numberFromCss("--grid-speed", 0.2),
    lineAlpha: numberFromCss("--grid-line-alpha", 0.07),
    glowAlpha: numberFromCss("--grid-glow-alpha", 0.5),
    trail: numberFromCss("--grid-trail", 10),
  };
  const offset = { x: 0, y: 0 };
  const glow = new Map();
  let hovered = null;
  let trail = [];
  let frame = null;

  function resize() {
    const dpr = devicePixelRatio || 1;
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function cellAt(x, y) {
    return {
      col: Math.floor((x - offset.x) / settings.cell),
      row: Math.floor((y - offset.y) / settings.cell),
    };
  }

  function updateGlow() {
    const targets = new Map();
    if (hovered) targets.set(`${hovered.col},${hovered.row}`, 1);
    const activeTrail = calm.matches ? [] : trail;
    activeTrail.forEach((cell, index) => {
      const key = `${cell.col},${cell.row}`;
      if (!targets.has(key)) {
        targets.set(
          key,
          (activeTrail.length - index) / (activeTrail.length + 1),
        );
      }
    });
    if (calm.matches) {
      glow.clear();
      for (const [key, opacity] of targets) glow.set(key, opacity);
      return false;
    }
    for (const key of targets.keys()) {
      if (!glow.has(key)) glow.set(key, 0);
    }
    let changing = false;
    for (const [key, opacity] of glow) {
      const target = targets.get(key) || 0;
      const next = opacity + (target - opacity) * 0.15;
      if (next < 0.005) glow.delete(key);
      else {
        glow.set(key, next);
        if (Math.abs(target - next) >= 0.005) changing = true;
      }
    }
    return changing;
  }

  function draw() {
    frame = null;
    if (!calm.matches) {
      offset.x += settings.speed;
      offset.y += settings.speed;
    }
    const glowChanging = updateGlow();
    context.clearRect(0, 0, innerWidth, innerHeight);
    context.strokeStyle = lineColor;
    context.lineWidth = 1;
    const firstCol = Math.floor(-offset.x / settings.cell);
    const firstRow = Math.floor(-offset.y / settings.cell);
    const lastCol = firstCol + Math.ceil(innerWidth / settings.cell);
    const lastRow = firstRow + Math.ceil(innerHeight / settings.cell);
    for (let col = firstCol; col <= lastCol; col += 1) {
      for (let row = firstRow; row <= lastRow; row += 1) {
        const x = col * settings.cell + offset.x;
        const y = row * settings.cell + offset.y;
        const opacity = glow.get(`${col},${row}`);
        if (opacity) {
          context.globalAlpha = settings.glowAlpha * opacity;
          context.fillStyle = glowColor;
          context.fillRect(x, y, settings.cell, settings.cell);
        }
        context.globalAlpha = settings.lineAlpha;
        context.strokeRect(
          Math.round(x) + 0.5,
          Math.round(y) + 0.5,
          settings.cell,
          settings.cell,
        );
        context.globalAlpha = 1;
      }
    }
    const drifting = !calm.matches && settings.speed !== 0;
    if (!document.hidden && (drifting || glowChanging)) {
      frame = requestAnimationFrame(draw);
    }
  }

  function start() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
  }

  window.siGrid = {
    set(nextSettings) {
      for (const key of Object.keys(settings)) {
        const value = Number(nextSettings[key]);
        if (Number.isFinite(value)) settings[key] = value;
      }
      trail = trail.slice(0, Math.max(0, Math.round(settings.trail)));
      start();
    },
  };

  addEventListener("resize", () => {
    resize();
    start();
  });
  addEventListener("pointermove", (event) => {
    if (!canHover.matches) return;
    const cell = cellAt(event.clientX, event.clientY);
    if (hovered && (hovered.col !== cell.col || hovered.row !== cell.row)) {
      trail = [hovered, ...trail].slice(0, settings.trail);
    }
    hovered = cell;
    start();
  });
  document.documentElement.addEventListener("pointerleave", () => {
    if (hovered) trail = [hovered, ...trail].slice(0, settings.trail);
    hovered = null;
    start();
  });
  calm.addEventListener("change", () => {
    if (calm.matches) trail = [];
    start();
  });
  document.addEventListener("visibilitychange", start);
  resize();
  start();
  requestAnimationFrame(() => canvas.classList.add("is-ready"));
}
