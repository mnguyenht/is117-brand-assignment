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
      label: "Tape speed",
      property: "--intro-tape-ms",
      min: 200,
      max: 700,
      step: 10,
      value: 360,
      unit: "ms",
    },
    {
      group: "intro",
      label: "Stagger",
      property: "--intro-stagger-ms",
      min: 40,
      max: 250,
      step: 10,
      value: 120,
      unit: "ms",
    },
    {
      group: "intro",
      label: "Rise",
      property: "--intro-rise-px",
      min: 0,
      max: 32,
      step: 1,
      value: 16,
      unit: "px",
    },
    {
      group: "intro",
      label: "Tag settle",
      property: "--intro-tag-ms",
      min: 300,
      max: 1000,
      step: 20,
      value: 640,
      unit: "ms",
    },
    {
      group: "grid",
      label: "Cell",
      property: "--grid-cell",
      setting: "cell",
      min: 24,
      max: 96,
      step: 4,
      value: 48,
    },
    {
      group: "grid",
      label: "Drift speed",
      property: "--grid-speed",
      setting: "speed",
      min: 0,
      max: 0.8,
      step: 0.05,
      value: 0.2,
    },
    {
      group: "grid",
      label: "Line strength",
      property: "--grid-line-alpha",
      setting: "lineAlpha",
      min: 0.02,
      max: 0.2,
      step: 0.01,
      value: 0.07,
    },
    {
      group: "grid",
      label: "Glow strength",
      property: "--grid-glow-alpha",
      setting: "glowAlpha",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.5,
    },
    {
      group: "grid",
      label: "Trail length",
      property: "--grid-trail",
      setting: "trail",
      min: 0,
      max: 24,
      step: 1,
      value: 10,
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
    sessionStorage.removeItem("si:intro-played");
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
