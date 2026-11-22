const STAMP = "__STAMP__";
const RAW_VERSION = "https://raw.githubusercontent.com/RobertBoettcherSF/bardo-visualization/main/version.txt";
const REPO_API = "https://api.github.com/repos/RobertBoettcherSF/bardo-visualization/commits/main";

let lang = "en";
let direction = 0;
let milli = 0;
let fps = 0;
let frameCount = 0;
let frameStamp = 0;
const errors = [];
let crashNotice = "";
let ada = null;
let rain = null;
const curves = { clarity: [], intensity: [], complexity: [] };

function t(key) {
  return STRINGS[lang][key];
}

function ints(ptr, n) {
  return new Int32Array(ada.exports.memory.buffer, ptr, n);
}

function output() {
  return ints(ada.outPtr, 16);
}

function input() {
  return ints(ada.inPtr, 8);
}

function phaseText(code, named) {
  const key = "phase" + code;
  const base = t(key);
  if (code === 2 || code === 3) return base + " " + named;
  return base;
}

function applyStaticText() {
  document.documentElement.lang = lang === "de" ? "de" : "en-GB";
  document.title = t("title");
  document.querySelectorAll("[data-k]").forEach(function (el) {
    el.textContent = t(el.dataset.k);
  });
  document.getElementById("lang-en").setAttribute("aria-pressed", String(lang === "en"));
  document.getElementById("lang-de").setAttribute("aria-pressed", String(lang === "de"));
  if (rain) rain.refreshLabels();
  if (crashNotice) {
    document.getElementById("crash").textContent =
      t("crash").replace("{notice}", crashNotice);
  }
}

function showError(message) {
  errors.push(message);
  const box = document.getElementById("errors");
  box.hidden = false;
  box.textContent = errors.join("\n");
}

function compute() {
  const view = input();
  view[0] = milli;
  view[1] = direction;
  ada.exports.bardo_compute();
  return output();
}

function render() {
  const out = compute();
  if (out[0] !== 0) {
    showError("Ada status " + out[0]);
  }
  const day = out[2];
  const named = out[3];
  const phase = phaseText(out[1], named);
  const state = document.getElementById("state");
  state.dataset.day = String(day);
  state.dataset.phase = phase;
  state.dataset.clarity = String(out[4]);
  state.dataset.intensity = String(out[5]);
  state.dataset.complexity = String(out[6]);
  state.dataset.mantra = String(out[8]);
  state.dataset.paused = rain && rain.isPaused() ? "true" : "false";
  document.getElementById("day").value = String(day);
  document.getElementById("day-read").textContent =
    t("dayLabel") + " " + day + " " + t("of") + " 49";
  document.getElementById("phase-read").textContent = phase;
  document.getElementById("clarity-read").textContent =
    t("clarity") + " " + out[4];
  document.getElementById("intensity-read").textContent =
    t("intensity") + " " + out[5];
  document.getElementById("complexity-read").textContent =
    t("complexity") + " " + out[6];
  document.getElementById("dir-help").textContent =
    direction === 0 ? t("helpJung") : t("helpBook");
  document.getElementById("walk").textContent =
    direction === 0 ? t("walkJung") : t("walkBook");
  document.getElementById("dir-jung").setAttribute("aria-pressed", String(direction === 0));
  document.getElementById("dir-book").setAttribute("aria-pressed", String(direction === 1));
  for (let id = 1; id <= 3; id++) {
    document.getElementById("m" + id).classList.toggle("active", out[8] === id);
  }
  drawGraph(day);
}

function sampleCurves() {
  const savedMilli = milli;
  const savedDir = direction;
  for (let day = 0; day <= 49; day++) {
    milli = ada.exports.bardo_milli_of_day(day);
    const out = compute();
    curves.clarity[day] = out[4];
    curves.intensity[day] = out[5];
    curves.complexity[day] = out[6];
  }
  milli = savedMilli;
  direction = savedDir;
  compute();
}

function drawGraph(day) {
  const canvas = document.getElementById("curves");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const width = canvas.clientWidth || 320;
  const height = canvas.clientHeight || 200;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const left = 36;
  const right = 12;
  const top = 16;
  const bottom = 28;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  ctx.strokeStyle = "#3c4038";
  ctx.fillStyle = "#b7b1a2";
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, top + plotH);
  ctx.lineTo(left + plotW, top + plotH);
  ctx.stroke();
  ctx.fillText("1000", 2, top + 10);
  ctx.fillText("0", 18, top + plotH);
  ctx.fillText(t("axisDay"), left, height - 8);
  ctx.fillText("49", left + plotW - 14, top + plotH + 14);
  function line(series, colour) {
    ctx.beginPath();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;
    for (let d = 0; d <= 49; d++) {
      const x = left + (d / 49) * plotW;
      const y = top + plotH - (series[d] / 1000) * plotH;
      if (d === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  line(curves.clarity, "#d9ffc3");
  line(curves.intensity, "#e0b080");
  line(curves.complexity, "#8aa4c8");
  const x = left + (day / 49) * plotW;
  ctx.strokeStyle = "#f5e642";
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, top + plotH);
  ctx.stroke();
}

function loadGlyphs() {
  const sequences = { 1: [], 2: [], 3: [] };
  for (let mantra = 1; mantra <= 3; mantra++) {
    for (let index = 0; index < 32; index++) {
      ada.exports.bardo_mantra_glyph(mantra, index);
      const out = output();
      if (out[0] === 4) break;
      if (out[0] !== 0) throw new Error("glyph status " + out[0]);
      const bytes = new Uint8Array(ada.exports.memory.buffer, ada.glyphPtr, out[12]);
      const text = new TextDecoder("utf-8").decode(bytes);
      if (text === "\u094D" || text.endsWith("\u094D")) {
        throw new Error("virama cluster");
      }
      sequences[mantra].push(text);
    }
    if (sequences[mantra].length < 1) throw new Error("empty mantra");
  }
  return sequences;
}

function report() {
  const state = document.getElementById("state");
  return {
    schema: "bardo-d009",
    stamp: STAMP,
    settings: {
      language: lang === "de" ? "de" : "en-GB",
      direction: direction === 0 ? "jung-reverse" : "book-order",
      day: Number(state.dataset.day),
      phase: state.dataset.phase,
      rainPaused: rain ? rain.isPaused() : true,
      reducedMotion: rain ? rain.prefersReduced() : matchMedia("(prefers-reduced-motion: reduce)").matches
    },
    fps: Math.round(fps * 10) / 10,
    errors: errors.slice(),
    crash: { afterReload: crashNotice !== "", notice: crashNotice },
    note: document.getElementById("note").value
  };
}

function downloadReport() {
  const blob = new Blob([JSON.stringify(report(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "bardo-report.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
}

function readCString(ptr) {
  const mem = new Uint8Array(ada.exports.memory.buffer);
  let end = ptr;
  const limit = Math.min(mem.length, ptr + 180);
  while (end < limit && mem[end] !== 0) end++;
  return new TextDecoder().decode(mem.subarray(ptr, end));
}

async function boot() {
  document.getElementById("stamp").textContent = STAMP;
  try {
    crashNotice = sessionStorage.getItem("bardo-crash") || "";
    if (crashNotice) sessionStorage.removeItem("bardo-crash");
  } catch (err) {
    crashNotice = "";
  }
  if (crashNotice) {
    const banner = document.getElementById("crash");
    banner.hidden = false;
    banner.textContent = t("crash").replace("{notice}", crashNotice);
  }
  const bytes = Uint8Array.from(atob(WASM_BASE64), function (c) { return c.charCodeAt(0); });
  const env = new Proxy({
    bardo_host_trap: function (ptr, line) {
      const notice = readCString(ptr >>> 0) + ":" + line;
      try { sessionStorage.setItem("bardo-crash", notice); } catch (err) { /* private mode */ }
      showError(notice);
      throw new Error(notice);
    }
  }, {
    get: function (target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      showError("unknown wasm import " + prop);
      return function () { return 0; };
    }
  });
  const instantiated = await WebAssembly.instantiate(bytes, { env: env });
  const exports = instantiated.instance.exports;
  if (typeof exports.adainit === "function") exports.adainit();
  ada = {
    exports: exports,
    inPtr: exports.bardo_input() >>> 0,
    outPtr: exports.bardo_output() >>> 0,
    glyphPtr: exports.bardo_glyph() >>> 0
  };
  const sequences = loadGlyphs();
  direction = 0;
  milli = ada.exports.bardo_start(direction);
  sampleCurves();
  applyStaticText();
  rain = startRain({
    canvas: document.getElementById("rain"),
    button: document.getElementById("rain-toggle"),
    sequences: sequences,
    labels: function () { return { pause: t("pause"), play: t("play") }; },
    scales: function () {
      const out = output();
      return { speed: out[9], alpha: out[10], stride: out[11] || 1 };
    },
    onFrame: function () {
      frameCount += 1;
      const now = performance.now();
      if (frameStamp === 0) frameStamp = now;
      if (now - frameStamp >= 1000) {
        fps = frameCount * 1000 / (now - frameStamp);
        frameCount = 0;
        frameStamp = now;
      }
    }
  });
  render();
  window.__bardoReady = true;
}

function setDirection(next) {
  direction = next;
  milli = ada.exports.bardo_start(direction);
  render();
}

function pollVersion() {
  if (location.protocol === "file:") return;
  fetch(RAW_VERSION, { cache: "no-store" })
    .then(function (res) { return res.ok ? res.text() : ""; })
    .then(function (text) {
      const remote = text.trim();
      if (!remote || remote === STAMP) return;
      const button = document.getElementById("reload");
      button.hidden = false;
      button.textContent = t("reload").replace("{stamp}", remote);
      button.onclick = function () {
        fetch(REPO_API, { cache: "no-store" })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data && /^[0-9a-f]{40}$/.test(data.sha)) {
              location.assign("https://rawcdn.githack.com/RobertBoettcherSF/bardo-visualization/" + data.sha + "/index.html");
            } else {
              location.reload();
            }
          })
          .catch(function () { location.reload(); });
      };
    })
    .catch(function () { /* a failed poll is not a new build */ });
}

document.getElementById("lang-en").addEventListener("click", function () {
  lang = "en";
  applyStaticText();
  render();
});
document.getElementById("lang-de").addEventListener("click", function () {
  lang = "de";
  applyStaticText();
  render();
});
document.getElementById("dir-jung").addEventListener("click", function () { setDirection(0); });
document.getElementById("dir-book").addEventListener("click", function () { setDirection(1); });
document.getElementById("walk").addEventListener("click", function () {
  milli = ada.exports.bardo_walk(milli, direction);
  render();
});
document.getElementById("day").addEventListener("input", function (event) {
  milli = ada.exports.bardo_milli_of_day(Number(event.target.value));
  render();
});
document.getElementById("enter").addEventListener("click", function () {
  document.getElementById("tour").scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("day").focus();
});
document.getElementById("debug").addEventListener("click", downloadReport);
document.addEventListener("keydown", function (event) {
  if (event.key === "F9" && event.target.id !== "note") {
    event.preventDefault();
    downloadReport();
  }
});
const wide = matchMedia("(min-width: 900px)");
function foldGraph() {
  document.getElementById("graph-fold").open = wide.matches;
}
wide.addEventListener("change", foldGraph);
foldGraph();
document.getElementById("graph-fold").addEventListener("toggle", function () {
  if (ada) drawGraph(Number(document.getElementById("state").dataset.day || "0"));
});
addEventListener("resize", function () {
  if (ada) drawGraph(Number(document.getElementById("state").dataset.day || "0"));
});

boot().catch(function (err) {
  showError(t("errorWasm") + " " + (err && err.message ? err.message : String(err)));
  window.__bardoReady = false;
  window.__bardoError = String(err);
});
pollVersion();
setInterval(pollVersion, 120000);
