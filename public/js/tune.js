const allowedHosts = new Set(["localhost", "127.0.0.1"]);
const app = document.querySelector("#tune-app");
const unavailable = document.querySelector("#tune-unavailable");

if (!allowedHosts.has(location.hostname)) {
  unavailable.hidden = false;
} else {
  app.hidden = false;
  const knobs = [
    {
      group: "intro",
      label: "Unboxing hold",
      property: "--unbox-hold",
      min: 0,
      max: 400,
      step: 20,
      value: 180,
      unit: "ms",
    },
    {
      group: "intro",
      label: "Flap speed",
      property: "--unbox-ms",
      min: 300,
      max: 900,
      step: 20,
      value: 560,
      unit: "ms",
    },
    {
      group: "intro",
      label: "Entrance stagger",
      property: "--enter-stagger",
      min: 30,
      max: 120,
      step: 5,
      value: 60,
      unit: "ms",
    },
    {
      group: "intro",
      label: "Entrance rise",
      property: "--enter-rise",
      min: 0,
      max: 24,
      step: 1,
      value: 12,
      unit: "px",
    },
    {
      group: "grid",
      label: "Gap",
      property: "--panel-grid-gap",
      setting: "gap",
      min: 6,
      max: 16,
      step: 1,
      value: 9,
    },
    {
      group: "grid",
      label: "Dot",
      property: "--panel-grid-dot",
      setting: "dot",
      min: 0.6,
      max: 2.4,
      step: 0.1,
      value: 1.2,
    },
    {
      group: "grid",
      label: "Strength",
      property: "--panel-grid-alpha",
      setting: "alpha",
      min: 0.04,
      max: 0.3,
      step: 0.01,
      value: 0.14,
    },
    {
      group: "grid",
      label: "Drift",
      property: "--panel-grid-speed",
      setting: "speed",
      min: 0,
      max: 0.4,
      step: 0.01,
      value: 0.08,
    },
    {
      group: "grid",
      label: "Glow",
      property: "--panel-grid-glow",
      setting: "glow",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.6,
    },
    {
      group: "grid",
      label: "Radius",
      property: "--panel-grid-radius",
      setting: "radius",
      min: 20,
      max: 140,
      step: 5,
      value: 60,
    },
  ];
  const preview = document.querySelector("#shop-preview");
  const output = document.querySelector("#tune-output");
  const inputs = new Map();

  function formattedValue(knob) {
    return `${inputs.get(knob.property).value}${knob.unit ?? ""}`;
  }

  function renderOutput() {
    output.textContent = `:root {\n${knobs
      .map((knob) => `  ${knob.property}: ${formattedValue(knob)};`)
      .join("\n")}\n}`;
  }

  function sendGridValues() {
    const values = {};
    for (const knob of knobs.filter(({ group }) => group === "grid")) {
      values[knob.setting] = Number(inputs.get(knob.property).value);
    }
    preview.contentWindow?.siGrid?.set(values);
  }

  for (const knob of knobs) {
    const row = document.createElement("div");
    row.className = "tune-control";
    const label = document.createElement("label");
    const input = document.createElement("input");
    const readout = document.createElement("output");
    const id = `tune-${knob.property.slice(2)}`;
    label.htmlFor = id;
    label.textContent = knob.label;
    input.id = id;
    input.type = "range";
    input.min = knob.min;
    input.max = knob.max;
    input.step = knob.step;
    input.value = knob.value;
    readout.htmlFor = id;
    readout.value = `${knob.value}${knob.unit ?? ""}`;
    row.append(label, readout, input);
    document.querySelector(`#${knob.group}-controls`).append(row);
    inputs.set(knob.property, input);
    input.addEventListener("input", () => {
      readout.value = formattedValue(knob);
      renderOutput();
      if (knob.group === "grid") sendGridValues();
    });
  }

  preview.addEventListener("load", sendGridValues);
  document.querySelector("#replay-intro").addEventListener("click", () => {
    const overrides = Object.fromEntries(
      knobs.map((knob) => [knob.property, formattedValue(knob)]),
    );
    sessionStorage.setItem("si:tune-overrides", JSON.stringify(overrides));
    sessionStorage.removeItem("si:unboxed");
    preview.contentWindow.location.reload();
  });
  document.querySelector("#reset-values").addEventListener("click", () => {
    for (const knob of knobs) {
      const input = inputs.get(knob.property);
      input.value = knob.value;
      input.dispatchEvent(new Event("input"));
    }
    sessionStorage.removeItem("si:tune-overrides");
  });
  document.querySelector("#copy-values").addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.textContent);
  });
  renderOutput();
}
