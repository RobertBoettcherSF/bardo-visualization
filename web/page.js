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
let screenId = "opening";
let endingLocked = false;
let turned = false;
let poisonSeen = -1;
let autoTimer = 0;
const pathLog = [];
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
  if (side[6] >= 0) poisonSeen = side[6];
  return output();
}

const SCENE_ID = { 1: "womb", 2: "lights", 3: "judge", 4: "wish" };
const SCENE_CODE = { womb: 1, lights: 2, judge: 3, wish: 4 };
const ANCHOR = { womb: 49, lights: 39, judge: 32, wish: 22 };
const REALMS = ["deva", "asura", "human", "animal", "preta", "hell"];
const REALM_INFO = {
  deva: "infoDeva", asura: "infoAsura", human: "infoHuman",
  animal: "infoAnimal", preta: "infoPreta", hell: "infoHell"
};
const REALM_QUOTE = {
  deva: "quoteDeva", asura: "quoteAsura", human: "quoteHuman",
  animal: "quoteAnimal", preta: "quotePreta", hell: "quoteHell"
};

function tourList() {
  const teach = direction === 0
    ? ["womb", "lights", "judge", "wish"]
    : ["wish", "judge", "lights", "womb"];
  return teach.concat(["good"]).concat(REALMS);
}

function firstId() {
  return direction === 0 ? "womb" : "wish";
}

function screenFromScene(scene) {
  return SCENE_ID[scene] || "clock";
}

function remember(button, extra) {
  const entry = { screen: screenId, button: button, t: Date.now() };
  if (extra) {
    Object.keys(extra).forEach(function (key) { entry[key] = extra[key]; });
  }
  pathLog.push(entry);
  if (pathLog.length > 80) pathLog.shift();
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

function infoKey(scene) {
  if (viewMode === "opening" || screenId === "opening") return "title";
  if (screenId === "good") return "infoGood";
  if (REALM_INFO[screenId]) return REALM_INFO[screenId];
  if (screenId === "wish" && turned) return "infoWishTurn";
  if (scene === 1 || screenId === "womb") return "infoWomb";
  if (scene === 2 || screenId === "lights") return "infoLights";
  if (scene === 3 || screenId === "judge") return "infoJudge";
  if (scene === 4 || screenId === "wish") return "infoWish";
  return "infoClock";
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
  if (viewMode !== "opening" && !endingLocked) screenId = screenFromScene(side[0]);
  state.dataset.scene = String(side[0]);
  state.dataset.screen = screenId;
  state.dataset.brightest = String(side[3]);
  state.dataset.outcome = String(side[1]);
  state.dataset.methods = String(side[2]);
  state.dataset.paused = rain && rain.isPaused() ? "true" : "false";
  document.getElementById("day").value = String(day);
  document.getElementById("day-read").textContent = t("dayLabel") + " " + day + " " + t("of") + " 49";
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
  document.getElementById("auto").textContent = t("auto");
  document.getElementById("next").textContent = t("next");
  document.getElementById("menu").textContent = t("menu");
  document.getElementById("debug").textContent = t("debug");
  const sound = document.getElementById("sound");
  sound.textContent = soundEnabled() ? t("soundOn") : t("soundOff");
  sound.setAttribute("aria-pressed", String(soundEnabled()));
  const teaching = SCENE_CODE[screenId] !== undefined;
  const ending = viewMode === "ending";
  document.body.classList.toggle("is-opening", viewMode === "opening");
  document.body.classList.toggle("is-ending", ending);
  document.body.classList.toggle("has-choice", teaching);
  document.getElementById("enter").textContent = t(infoKey(side[0]));
  const quote = document.getElementById("quote");
  if (ending) {
    quote.textContent = t(screenId === "good" ? "quoteGood" : REALM_QUOTE[screenId]);
  }
  const names = sceneCopy(viewMode === "opening" ? -1 : side[0]);
  const moreBody = viewMode === "opening" ? t("lead") + " " + t("moreEnter") : t(names[1]);
  document.getElementById("more-body").textContent = moreBody;
  document.getElementById("outcome").textContent = viewMode === "opening" || ending ? "" : outcomeText(side[1]);
  const list = tourList();
  const index = list.indexOf(screenId);
  document.getElementById("prev").disabled = viewMode === "opening";
  document.getElementById("next").disabled = index === list.length - 1;
  const wantWind = viewMode !== "opening";
  if (wantWind !== windWanted) {
    windWanted = wantWind;
    setWind(wantWind);
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
  if (!canvas || document.getElementById("more").hidden) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const width = canvas.clientWidth || 280;
  const height = canvas.clientHeight || 120;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  paintAxes(ctx, width, height, day);
}

function modelNow() {
  const side = sidpa();
  return {
    opening: viewMode === "opening",
    ending: viewMode === "ending",
    screen: screenId,
    scene: side[0],
    methods: side[2],
    bright: side[3],
    x: side[8],
    y: side[9],
    curves: curves
  };
}

function noteFrame(now) {
  frameCount += 1;
  if (frameStamp === 0) frameStamp = now;
  const span = now - frameStamp;
  if (span >= 1000) {
    fps = frameCount * 1000 / span;
    frameCount = 0;
    frameStamp = now;
  }
}

function drawCanvas() {
  paintAll(performance.now(), modelNow());
}

let looping = false;
function ensureLoop() {
  if (looping) return;
  looping = true;
  requestAnimationFrame(function tick(now) {
    if (ada && screenId === "wish" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wanderTick = (wanderTick + 1) % 100000;
      compute();
    }
    if (ada) {
      paintAll(now, modelNow());
      noteFrame(now);
    }
    requestAnimationFrame(tick);
  });
}

function placeChoices() {
  const stage = window.__stage;
  const choices = document.getElementById("choices");
  if (!stage || !choices) return;
  const top = (stage.y + stage.h - 52) + "px";
  const left = stage.x + "px";
  const width = stage.w + "px";
  if (choices.style.top !== top) choices.style.top = top;
  if (choices.style.left !== left) choices.style.left = left;
  if (choices.style.width !== width) choices.style.width = width;
}

function render() {
  const out = compute();
  updateChrome(out);
  drawCanvas();
  placeChoices();
  ensureLoop();
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

function stopAuto() {
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = 0;
  const button = document.getElementById("auto");
  if (button) button.setAttribute("aria-pressed", "false");
}

function showScreen(id, button, extra) {
  if (button !== "auto") stopAuto();
  screenId = id;
  remember(button, extra);
  document.getElementById("more").hidden = true;
  if (id === "opening") {
    viewMode = "opening";
    endingLocked = false;
    turned = false;
  } else if (ANCHOR[id]) {
    viewMode = "tour";
    endingLocked = false;
    if (id !== "wish") turned = false;
    milli = ada.exports.bardo_milli_of_day(ANCHOR[id]);
  } else {
    viewMode = "ending";
    endingLocked = true;
    turned = false;
  }
  cardsKey = "";
  render();
}

function showOpening() {
  showScreen("opening", "prev");
}

function karmicId() {
  const code = ada.exports.bardo_realm(destination, poisonSeen);
  return REALMS[code] || "human";
}

function goStart() {
  playClick();
  methodsDone = 0;
  destination = -1;
  poisonSeen = -1;
  wanderTick = 0;
  pendingAction = 0;
  showScreen(firstId(), "start");
}

function goNext() {
  playClick();
  const list = tourList();
  const index = list.indexOf(screenId);
  if (screenId === "opening" || index < 0) {
    showScreen(firstId(), "next");
    return;
  }
  if (index >= list.length - 1) return;
  showScreen(list[index + 1], "next");
}

function goPrev() {
  playClick();
  if (screenId === "opening") return;
  const index = tourList().indexOf(screenId);
  if (index <= 0) {
    showScreen("opening", "prev");
    return;
  }
  showScreen(tourList()[index - 1], "prev");
}

function choose(follow) {
  playClick();
  if (!SCENE_CODE[screenId]) return;
  if (follow && screenId === "wish") {
    turned = true;
    remember("follow", { onward: "chonyid" });
    render();
    return;
  }
  const next = follow
    ? (screenId === "womb" ? "good" : screenId === "lights" ? "judge" : "wish")
    : (screenId === "wish" ? "judge" : screenId === "judge" ? "lights" : screenId === "lights" ? "womb" : karmicId());
  showScreen(next, follow ? "follow" : "dont");
}

function startAuto() {
  stopAuto();
  if (screenId === "opening" || tourList().indexOf(screenId) < 0) showScreen(firstId(), "auto");
  const pace = window.__autoPace || 4500;
  document.getElementById("auto").setAttribute("aria-pressed", "true");
  autoTimer = setInterval(function () {
    const list = tourList();
    const index = list.indexOf(screenId);
    if (index < 0 || index >= list.length - 1) {
      stopAuto();
      return;
    }
    showScreen(list[index + 1], "auto");
  }, pace);
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
    screen: screenId,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    devicePixelRatio: window.devicePixelRatio || 1,
    userAgent: navigator.userAgent,
    path: pathLog.slice(),
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
    }
  });
  remember("load");
  render();
  window.__bardoReady = true;
}

function setDirection(next) {
  stopAuto();
  direction = next;
  milli = ada.exports.bardo_start(direction);
  methodsDone = 0;
  destination = -1;
  poisonSeen = -1;
  endingLocked = false;
  turned = false;
  cardsKey = "";
  if (viewMode !== "opening") viewMode = "tour";
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
  stopAuto();
  endingLocked = false;
  turned = false;
  milli = ada.exports.bardo_milli_of_day(Number(event.target.value));
  if (viewMode === "opening") viewMode = "tour";
  cardsKey = "";
  render();
});
document.getElementById("go").addEventListener("click", function () {
  if (viewMode === "opening") showScreen(firstId(), "enter");
});
document.getElementById("follow").addEventListener("click", function () { choose(true); });
document.getElementById("dont").addEventListener("click", function () { choose(false); });
document.getElementById("again").addEventListener("click", goStart);
document.getElementById("auto").addEventListener("click", function () {
  if (autoTimer) stopAuto();
  else startAuto();
});
document.addEventListener("pointerdown", function (event) {
  if (!autoTimer) return;
  if (event.target && event.target.closest && event.target.closest("#auto")) return;
  stopAuto();
}, true);
document.addEventListener("keydown", function (event) {
  if (autoTimer && event.key !== "F9") stopAuto();
});
document.getElementById("enter").addEventListener("click", function () {
  const more = document.getElementById("more");
  if (more.hidden) {
    more.hidden = false;
    drawGraph(Number(document.getElementById("state").dataset.day || "0"));
    return;
  }
  more.hidden = true;
  if (viewMode === "opening") showScreen(firstId(), "enter");
});
document.getElementById("menu").addEventListener("click", function () {
  const panel = document.getElementById("menu-panel");
  panel.hidden = !panel.hidden;
  document.getElementById("menu").setAttribute("aria-expanded", String(!panel.hidden));
});
document.getElementById("next").addEventListener("click", goNext);
document.getElementById("prev").addEventListener("click", goPrev);
document.getElementById("start").addEventListener("click", goStart);
document.getElementById("sound").addEventListener("click", function () {
  setSound(!soundEnabled());
  if (soundEnabled()) playClick();
  render();
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
const viz = document.getElementById("viz");
let pointer = null;
viz.addEventListener("pointerdown", function (event) {
  pointer = { x: event.clientX, y: event.clientY };
});
viz.addEventListener("pointerup", function (event) {
  if (!pointer) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  pointer = null;
  if (Math.hypot(dx, dy) > 36) {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      if (dx < 0) goNext();
      else goPrev();
    }
    return;
  }
  if (viewMode !== "tour") return;
  const rect = viz.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  for (let i = regions.length - 1; i >= 0; i--) {
    if (hitContains(regions[i], x, y)) {
      act(regions[i].action, regions[i].arg);
      return;
    }
  }
});
addEventListener("resize", function () {
  if (!ada) return;
  drawCanvas();
  placeChoices();
  drawGraph(Number(document.getElementById("state").dataset.day || "0"));
});

boot().catch(function (err) {
  showError(t("errorWasm") + " " + (err && err.message ? err.message : String(err)));
  window.__bardoReady = false;
  window.__bardoError = String(err);
});
pollVersion();
setInterval(pollVersion, 120000);
