const STAMP = "__STAMP__";
const RAW_VERSION = "https://raw.githubusercontent.com/RobertBoettcherSF/bardo-visualization/main/version.txt";
const REPO_API = "https://api.github.com/repos/RobertBoettcherSF/bardo-visualization/commits/main";
const REALM_COLOUR = ["#C9C3B5", "#4A5E48", "#A89A55", "#3A4A62", "#7A4548", "#5C5550"];
const REALM_KEY = ["deva", "asura", "human", "animal", "preta", "hell"];

let lang = "en";
let direction = 0;
let milli = 0;
let fps = 0;
let frameCount = 0;
let frameStamp = 0;
let viewMode = "opening";
let methodsDone = 0;
let destination = -1;
let wanderTick = 0;
let pendingAction = 0;
let pendingArg = 0;
let cardsKey = "";
let animating = false;
let windWanted = null;
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

function input() { return ints(ada.inPtr, 8); }
function output() { return ints(ada.outPtr, 16); }
function sidpa() { return ints(ada.sidpaPtr, 16); }

function phaseText(code, named) {
  const base = t("phase" + code);
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
    document.getElementById("crash").textContent = t("crash").replace("{notice}", crashNotice);
  }
  cardsKey = "";
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
  view[2] = pendingAction;
  view[3] = pendingArg;
  view[4] = methodsDone;
  view[5] = destination;
  view[6] = wanderTick;
  ada.exports.bardo_compute();
  pendingAction = 0;
  pendingArg = 0;
  const side = sidpa();
  if (side[2] >= 0) methodsDone = side[2];
  if (side[3] >= 0) destination = side[3];
  return output();
}

function outcomeText(code) {
  const key = {
    1: "outClosed", 2: "outAmitabha", 3: "outTusita", 4: "outAllow",
    5: "outRefuse", 6: "outFree", 7: "outStay", 8: "outOrder",
    9: sidpa()[6] === 0 ? "outAnger" : sidpa()[6] === 1 ? "outDesire" : "outIgnorance"
  }[code];
  return key ? t(key) : "";
}

function sceneCopy(code) {
  if (code === 1) return ["sceneWomb", "bodyWomb"];
  if (code === 2) return ["sceneLights", "bodyLights"];
  if (code === 3) return ["sceneJudge", "bodyJudge"];
  if (code === 4) return ["sceneWish", "bodyWish"];
  return ["sceneClock", "bodyClock"];
}

function updateChrome(out) {
  const side = sidpa();
  const day = out[2];
  const phase = phaseText(out[1], out[3]);
  const state = document.getElementById("state");
  state.dataset.day = String(day);
  state.dataset.phase = phase;
  state.dataset.clarity = String(out[4]);
  state.dataset.intensity = String(out[5]);
  state.dataset.complexity = String(out[6]);
  state.dataset.mantra = String(out[8]);
  state.dataset.scene = String(side[0]);
  state.dataset.brightest = String(side[3]);
  state.dataset.outcome = String(side[1]);
  state.dataset.paused = rain && rain.isPaused() ? "true" : "false";
  document.getElementById("day").value = String(day);
  document.getElementById("day-read").textContent = t("dayLabel") + " " + day + " " + t("of") + " 49";
  document.getElementById("phase-read").textContent = phase;
  document.getElementById("clarity-read").textContent = t("clarity") + " " + out[4];
  document.getElementById("intensity-read").textContent = t("intensity") + " " + out[5];
  document.getElementById("complexity-read").textContent = t("complexity") + " " + out[6];
  document.getElementById("dir-help").textContent = direction === 0 ? t("helpJung") : t("helpBook");
  const jung = document.getElementById("dir-jung");
  const book = document.getElementById("dir-book");
  jung.textContent = t("jungShort");
  book.textContent = t("bookShort");
  jung.setAttribute("aria-label", t("directionJung"));
  book.setAttribute("aria-label", t("directionBook"));
  jung.setAttribute("aria-pressed", String(direction === 0));
  book.setAttribute("aria-pressed", String(direction === 1));
  document.getElementById("prev").textContent = t("prev");
  document.getElementById("start").textContent = t("start");
  document.getElementById("next").textContent = t("next");
  document.getElementById("debug").textContent = t("debug");
  const sound = document.getElementById("sound");
  sound.textContent = soundEnabled() ? t("soundOn") : t("soundOff");
  sound.setAttribute("aria-pressed", String(soundEnabled()));
  const names = sceneCopy(side[0]);
  document.getElementById("scene-title").textContent = t(names[0]);
  document.getElementById("scene-body").textContent = t(names[1]);
  document.getElementById("outcome").textContent = outcomeText(side[1]);
  document.getElementById("prev").disabled = viewMode === "opening";
  document.getElementById("next").disabled = viewMode === "tour" && side[0] !== 0 && side[13] < 0;
  const wantWind = viewMode === "tour" && side[0] !== 0;
  if (wantWind !== windWanted) {
    windWanted = wantWind;
    setWind(wantWind);
  }
}

function button(label, action, arg, pressed) {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = label;
  el.dataset.action = String(action);
  el.dataset.arg = String(arg);
  if (pressed) el.className = "bright";
  return el;
}

function syncCards(scene) {
  const key = [scene, lang, methodsDone, destination, sidpa()[15]].join(":");
  if (key === cardsKey) return;
  cardsKey = key;
  const box = document.getElementById("cards");
  box.replaceChildren();
  if (scene === 1) {
    for (let i = 1; i <= 5; i++) box.appendChild(button(t("method" + i), 1, i, false));
    box.appendChild(button(t("transferA"), 2, 0, false));
    box.appendChild(button(t("transferT"), 2, 1, false));
    ["east", "south", "west", "north"].forEach(function (name, i) {
      box.appendChild(button(t(name), 3, i, false));
    });
    REALM_KEY.forEach(function (name, i) {
      box.appendChild(button(t(name), 3, 10 + i, false));
    });
  } else if (scene === 2) {
    REALM_KEY.forEach(function (name, i) {
      box.appendChild(button(t(name), 4, i, destination === i));
    });
  } else if (scene === 3) {
    box.appendChild(button(t("recognise"), 5, 0, false));
    box.appendChild(button(t("notYet"), 6, 0, false));
  } else if (scene === 4) {
    box.appendChild(button(t("abyssW"), 7, 0, false));
    box.appendChild(button(t("abyssB"), 7, 1, false));
    box.appendChild(button(t("abyssR"), 7, 2, false));
  }
}

function paintAxes(ctx, width, height, marker) {
  const left = 36, right = 12, top = 16, bottom = 28;
  const plotW = Math.max(10, width - left - right);
  const plotH = Math.max(10, height - top - bottom);
  ctx.strokeStyle = "#3c4038";
  ctx.fillStyle = "#b7b1a2";
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, top + plotH);
  ctx.lineTo(left + plotW, top + plotH);
  ctx.stroke();
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
  const x = left + (marker / 49) * plotW;
  ctx.strokeStyle = "#f5e642";
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, top + plotH);
  ctx.stroke();
}

function drawGraph(day) {
  const canvas = document.getElementById("curves");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const width = canvas.clientWidth || 320;
  const height = canvas.clientHeight || 160;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  paintAxes(ctx, width, height, day);
}

function drawCanvas() {
  const canvas = document.getElementById("viz");
  const stage = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const width = stage.clientWidth || 320;
  const height = stage.clientHeight || 320;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const side = sidpa();
  const scene = side[0];
  if (scene === 0) {
    paintAxes(ctx, width, height, Number(document.getElementById("state").dataset.day || "0"));
    return;
  }
  if (scene === 2) {
    const cx = width / 2;
    const cy = height * 0.38;
    const radius = Math.min(width, height) * 0.26;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, -Math.PI / 2 + i * Math.PI / 3, -Math.PI / 2 + (i + 1) * Math.PI / 3);
      ctx.closePath();
      ctx.fillStyle = REALM_COLOUR[i];
      ctx.globalAlpha = side[3] === i ? 1 : 0.45;
      ctx.fill();
      if (side[3] === i) {
        ctx.globalAlpha = 1;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#f5e642";
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "#070807";
    ctx.fill();
    return;
  }
  if (scene === 3) {
    ctx.fillStyle = "#10141a";
    ctx.fillRect(0, 0, width, height);
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.36, Math.min(width, height) * 0.22, Math.min(width, height) * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#F7F4EA";
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(width * 0.28 + (i % 3) * 16, height * 0.72 + Math.floor(i / 3) * 16, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#F4F1E6";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width * 0.62 + (i % 3) * 16, height * 0.72 + Math.floor(i / 3) * 16, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#1C1C1C";
      ctx.fill();
    }
    return;
  }
  if (scene === 4) {
    ctx.fillStyle = "#2a2926";
    ctx.fillRect(0, 0, width, height);
    const x = (side[8] / 1000) * width;
    const y = (side[9] / 1000) * (height * 0.7);
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#E6E0D4";
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  ctx.strokeStyle = "#d9ffc3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.36, Math.min(width, height) * 0.2, 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
}

function render() {
  const out = compute();
  updateChrome(out);
  if (viewMode === "tour") {
    syncCards(sidpa()[0]);
    drawCanvas();
    maybeAnimate();
  }
  drawGraph(out[2]);
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

function showOpening() {
  viewMode = "opening";
  animating = false;
  document.getElementById("opening").hidden = false;
  document.getElementById("tour").hidden = true;
  updateChrome(compute());
}

function showTour() {
  viewMode = "tour";
  document.getElementById("opening").hidden = true;
  document.getElementById("tour").hidden = false;
}

function enterTour() {
  showTour();
  if (sidpa()[0] === 0) {
    const first = ada.exports.bardo_first(direction);
    milli = ada.exports.bardo_milli_of_day(ada.exports.bardo_anchor(first));
  }
  cardsKey = "";
  render();
}

function goScene(code) {
  milli = ada.exports.bardo_milli_of_day(ada.exports.bardo_anchor(code));
  showTour();
  cardsKey = "";
  render();
}

function goNext() {
  playClick();
  if (viewMode === "opening") { enterTour(); return; }
  const side = sidpa();
  if (side[0] === 0) { enterTour(); return; }
  if (side[13] < 0) return;
  goScene(side[13]);
}

function goPrev() {
  playClick();
  if (viewMode === "opening") return;
  const side = sidpa();
  if (side[0] === 0 || side[14] < 0) { showOpening(); return; }
  goScene(side[14]);
}

function maybeAnimate() {
  const scene = sidpa()[0];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (viewMode === "tour" && scene === 4 && !reduced && !animating) {
    animating = true;
    requestAnimationFrame(stepWish);
  }
  if (viewMode !== "tour" || scene !== 4 || reduced) animating = false;
}

function stepWish() {
  if (!animating) return;
  wanderTick = (wanderTick + 1) % 100000;
  const out = compute();
  updateChrome(out);
  drawCanvas();
  requestAnimationFrame(stepWish);
}

function act(action, arg) {
  pendingAction = action;
  pendingArg = arg;
  playClick();
  cardsKey = "";
  render();
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
      if (text === "\u094D" || text.endsWith("\u094D")) throw new Error("virama cluster");
      sequences[mantra].push(text);
    }
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
      scene: Number(state.dataset.scene),
      sound: soundEnabled(),
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
    sidpaPtr: exports.bardo_sidpa() >>> 0,
    glyphPtr: exports.bardo_glyph() >>> 0
  };
  const sequences = loadGlyphs();
  direction = 0;
  destination = -1;
  milli = exports.bardo_start(direction);
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
  methodsDone = 0;
  destination = -1;
  cardsKey = "";
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
  lang = "en"; applyStaticText(); render();
});
document.getElementById("lang-de").addEventListener("click", function () {
  lang = "de"; applyStaticText(); render();
});
document.getElementById("dir-jung").addEventListener("click", function () { setDirection(0); playClick(); });
document.getElementById("dir-book").addEventListener("click", function () { setDirection(1); playClick(); });
document.getElementById("day").addEventListener("input", function (event) {
  milli = ada.exports.bardo_milli_of_day(Number(event.target.value));
  cardsKey = "";
  render();
});
document.getElementById("enter").addEventListener("click", function () { playClick(); enterTour(); });
document.getElementById("next").addEventListener("click", goNext);
document.getElementById("prev").addEventListener("click", goPrev);
document.getElementById("start").addEventListener("click", function () {
  playClick();
  methodsDone = 0;
  destination = -1;
  wanderTick = 0;
  milli = ada.exports.bardo_start(direction);
  cardsKey = "";
  showOpening();
});
document.getElementById("sound").addEventListener("click", function () {
  setSound(!soundEnabled());
  if (soundEnabled()) playClick();
  render();
});
document.getElementById("cards").addEventListener("click", function (event) {
  const el = event.target.closest("button");
  if (!el) return;
  act(Number(el.dataset.action), Number(el.dataset.arg));
});
document.getElementById("debug").addEventListener("click", downloadReport);
document.addEventListener("keydown", function (event) {
  if (event.key === "F9" && event.target.id !== "note") {
    event.preventDefault();
    downloadReport();
    return;
  }
  if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") return;
  if (event.key === "ArrowRight") { event.preventDefault(); goNext(); }
  if (event.key === "ArrowLeft") { event.preventDefault(); goPrev(); }
  if (event.key === "Home") {
    event.preventDefault();
    document.getElementById("start").click();
  }
});
const stage = document.getElementById("stage");
let touchX = null;
stage.addEventListener("touchstart", function (event) {
  touchX = event.changedTouches[0].clientX;
}, { passive: true });
stage.addEventListener("touchend", function (event) {
  if (touchX === null) return;
  const dx = event.changedTouches[0].clientX - touchX;
  touchX = null;
  if (dx <= -48) goNext();
  else if (dx >= 48) goPrev();
}, { passive: true });

const wide = matchMedia("(min-width: 900px)");
function foldGraph() {
  document.getElementById("graph-fold").open = wide.matches;
  document.getElementById("notes").open = wide.matches;
}
wide.addEventListener("change", foldGraph);
foldGraph();
document.getElementById("graph-fold").addEventListener("toggle", function () {
  if (ada) drawGraph(Number(document.getElementById("state").dataset.day || "0"));
});
addEventListener("resize", function () {
  if (!ada) return;
  drawGraph(Number(document.getElementById("state").dataset.day || "0"));
  if (viewMode === "tour") drawCanvas();
});

boot().catch(function (err) {
  showError(t("errorWasm") + " " + (err && err.message ? err.message : String(err)));
  window.__bardoReady = false;
  window.__bardoError = String(err);
});
pollVersion();
setInterval(pollVersion, 120000);
