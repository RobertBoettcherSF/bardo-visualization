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
let karma = 500;
let autoTimer = 0;
let autoRunning = false;
let autoStopRequested = false;
let lineKey = "";
let detailKey = "";
let arrivalKey = "";
let selectedKey = "";
let lives = [];
let life = null;
let seenScreens = {};
let seenLinks = {};
let tries = {};
let runComplete = false;
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
  const overlay = STRINGS[lang];
  if (overlay && Object.prototype.hasOwnProperty.call(overlay, key)) return overlay[key];
  const base = STRINGS.en[key];
  return base === undefined ? key : base;
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
  document.documentElement.lang = "en-GB";
  document.title = t("title");
  document.querySelectorAll("[data-k]").forEach(function (el) {
    el.textContent = t(el.dataset.k);
  });
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
const ARRIVE = {
  judge: "arriveJudge", lights: "arriveLights", womb: "arriveWomb",
  deva: "arriveDeva", asura: "arriveAsura", human: "arriveHuman",
  animal: "arriveAnimal", preta: "arrivePreta", hell: "arriveHell"
};
const ALL_SCREENS = ["opening", "clock", "womb", "lights", "judge", "wish", "good"]
  .concat(REALMS);
const CHOICE_LINKS = [
  { from: "wish", button: "follow" }, { from: "wish", button: "dont" },
  { from: "judge", button: "follow" }, { from: "judge", button: "dont" },
  { from: "lights", button: "follow" }, { from: "lights", button: "dont" },
  { from: "womb", button: "follow" }, { from: "womb", button: "dont" },
  { from: "womb", button: "petals" },
  { from: "good", button: "again" },
  { from: "deva", button: "again" }, { from: "asura", button: "again" },
  { from: "human", button: "again" }, { from: "animal", button: "again" },
  { from: "preta", button: "again" }, { from: "hell", button: "again" }
];

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

function currentInfo(scene) {
  if (lineKey) return t(lineKey);
  if (arrivalKey) return t(arrivalKey);
  return t(infoKey(scene));
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
  const autoButton = document.getElementById("auto");
  autoButton.textContent = autoRunning ? t("stop") : t("auto");
  autoButton.setAttribute("aria-pressed", String(autoRunning));
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
  document.getElementById("enter").textContent = currentInfo(side[0]);
  const quote = document.getElementById("quote");
  if (ending) {
    quote.textContent = t(screenId === "good" ? "quoteGood" : REALM_QUOTE[screenId]);
  }
  const names = sceneCopy(viewMode === "opening" ? -1 : side[0]);
  const moreBody = detailKey
    ? t(detailKey)
    : (viewMode === "opening" ? t("lead") + " " + t("moreEnter") : t(names[1]));
  document.getElementById("more-body").textContent = moreBody;
  document.getElementById("curves").style.display = detailKey ? "none" : "block";
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

function placePanels() {
  const stage = window.__stage;
  const choices = document.getElementById("choices");
  const more = document.getElementById("more");
  if (!stage || !choices || !more) return;
  const top = (stage.y + stage.h - 52) + "px";
  const left = stage.x + "px";
  const width = stage.w + "px";
  if (choices.style.top !== top) choices.style.top = top;
  if (choices.style.left !== left) choices.style.left = left;
  if (choices.style.width !== width) choices.style.width = width;
  const panelTop = stage.y + 8;
  const choiceTop = stage.y + stage.h - 56;
  more.style.top = panelTop + "px";
  more.style.left = left;
  more.style.width = width;
  more.style.bottom = "auto";
  more.style.transform = "none";
  more.style.maxHeight = Math.max(72, choiceTop - panelTop - 8) + "px";
}

function render() {
  const out = compute();
  updateChrome(out);
  drawCanvas();
  placePanels();
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

function showScreen(id, button, extra) {
  screenId = id;
  remember(button, extra);
  selectedKey = "";
  lineKey = "";
  detailKey = "";
  arrivalKey = "";
  if (button === "dont") {
    arrivalKey = REALMS.indexOf(id) >= 0 ? pullKey() : (ARRIVE[id] || "");
  }
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

function pullKey() {
  const realm = destination >= 0 && destination <= 5
    ? destination
    : ada.exports.bardo_karma_realm(karma);
  const band = ada.exports.bardo_karma_band(karma);
  return "pull" + band + "_" + realm;
}

function rebirthId() {
  const code = ada.exports.bardo_rebirth(destination, karma);
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

function choose(follow, via) {
  if (via !== "auto") playClick();
  if (!SCENE_CODE[screenId]) return;
  const from = screenId;
  const karmaBefore = karma;
  karma = follow
    ? ada.exports.bardo_karma_lighten(karma)
    : ada.exports.bardo_karma_heavy(karma);
  if (follow && from === "wish") {
    turned = true;
    lineKey = "infoWishTurn";
    detailKey = "bodyWish";
    arrivalKey = "";
    remember("follow", { onward: "chonyid" });
    if (via === "auto") noteStep("follow", from, "wish", { karmaBefore: karmaBefore });
    render();
    return;
  }
  if (follow && from === "womb") {
    const chance = ada.exports.bardo_karma_chance(karma);
    const roll = Math.floor(Math.random() * 1000);
    const natural = roll < chance;
    const ok = via === "auto" ? true : natural;
    if (!ok) {
      lineKey = pullKey();
      detailKey = "detailFail";
      arrivalKey = "";
      render();
      return;
    }
    showScreen("good", "follow");
    if (via === "auto") {
      noteStep("follow", from, "good", {
        karmaBefore: karmaBefore, chance: chance, roll: roll, forced: !natural
      });
    }
    return;
  }
  const next = follow
    ? (from === "lights" ? "judge" : "wish")
    : (from === "wish" ? "judge" : from === "judge" ? "lights" : from === "lights" ? "womb" : rebirthId());
  showScreen(next, follow ? "follow" : "dont");
  if (via === "auto") noteStep(follow ? "follow" : "dont", from, screenId, { karmaBefore: karmaBefore });
}

function explainOf(action, arg) {
  if (action === 1 && arg >= 1 && arg <= 5) {
    return { line: "tapPetal" + arg, detail: "detailPetal" + arg };
  }
  if (action === 2) {
    return arg === 0
      ? { line: "transferA", detail: "detailAmitabha" }
      : { line: "transferT", detail: "detailTusita" };
  }
  if (action === 3 && arg >= 0 && arg <= 3) {
    const names = ["east", "south", "west", "north"];
    return { line: names[arg], detail: "detailSign" + arg };
  }
  if (action === 4 && arg >= 0 && arg <= 5) {
    return { line: "tapLight" + arg, detail: "detailLight" + arg };
  }
  if (action === 5) return { line: "tapMirror", detail: "detailMirror" };
  if (action === 6) return { line: "tapPass", detail: "detailPass" };
  if (action === 7 && arg >= 0 && arg <= 2) {
    return { line: "tapAbyss" + arg, detail: "detailAbyss" + arg };
  }
  if (action === 8) return { line: "tapPebbleW", detail: "detailPebbleW" };
  if (action === 9) return { line: "tapPebbleB", detail: "detailPebbleB" };
  return null;
}

function applyAction(action, arg) {
  pendingAction = action;
  pendingArg = arg;
  compute();
}

function onHit(region, via) {
  const spec = explainOf(region.action, region.arg);
  if (!spec) return;
  const key = region.action + ":" + region.arg;
  const acts = region.action >= 1 && region.action <= 7;
  if (selectedKey === key && acts) {
    const from = screenId;
    const before = methodsDone;
    applyAction(region.action, region.arg);
    if (via !== "auto") playClick();
    if (region.action === 1 && from === "womb" && methodsDone >= 5) {
      showScreen("good", "petals");
      if (via === "auto") noteStep("petals", from, "good");
      return;
    }
    const outcome = sidpa()[1];
    if (outcome === 8) lineKey = "outOrder";
    else if (region.action === 1 && methodsDone > before) lineKey = "tapClosed";
    else if (outcome === 6) lineKey = "outFree";
    else if (outcome === 7) lineKey = "outStay";
    else if (outcome === 4) lineKey = "outAllow";
    else if (outcome === 5) lineKey = "outRefuse";
    else if (outcome === 2) lineKey = "outAmitabha";
    else if (outcome === 3) lineKey = "outTusita";
    else if (outcome === 9) lineKey = region.arg === 0 ? "outAnger" : region.arg === 1 ? "outDesire" : "outIgnorance";
    else if (region.action === 4) lineKey = spec.line;
    else lineKey = spec.line;
    detailKey = spec.detail;
    arrivalKey = "";
    if (via === "auto") noteStep("tap", from, screenId);
    render();
    return;
  }
  selectedKey = key;
  lineKey = spec.line;
  detailKey = spec.detail;
  arrivalKey = "";
  if (via === "auto") noteStep("tap", screenId, screenId);
  render();
}

function noteStep(action, from, led, extra) {
  seenScreens[from] = true;
  seenScreens[led] = true;
  seenLinks[from + ">" + action] = true;
  if (!life) life = { steps: [], karma: karma };
  const step = { screen: from, action: action, led: led, t: Date.now(), karma: karma };
  if (extra) {
    Object.keys(extra).forEach(function (key) { step[key] = extra[key]; });
  }
  life.steps.push(step);
  life.karma = karma;
  if (led === "good" || REALMS.indexOf(led) >= 0) {
    life.ended = led;
    lives.push(life);
    life = { steps: [], karma: karma };
    window.__autoLives = lives.length;
  }
  publishCoverage();
}

const LIFE_SCREENS = ["wish", "judge", "lights", "womb", "good"].concat(REALMS);

function actionsFor(screen) {
  if (screen === "wish") {
    return [
      { id: "follow", kind: "follow" },
      { id: "dont", kind: "dont" },
      { id: "abyss-0", kind: "hit", action: 7, arg: 0 },
      { id: "abyss-1", kind: "hit", action: 7, arg: 1 },
      { id: "abyss-2", kind: "hit", action: 7, arg: 2 }
    ];
  }
  if (screen === "judge") {
    return [
      { id: "follow", kind: "follow" },
      { id: "dont", kind: "dont" },
      { id: "mirror", kind: "hit", action: 5, arg: 0 },
      { id: "pass", kind: "hit", action: 6, arg: 0 },
      { id: "pebble-w", kind: "hit", action: 8, arg: 0 },
      { id: "pebble-b", kind: "hit", action: 9, arg: 0 }
    ];
  }
  if (screen === "lights") {
    const list = [
      { id: "follow", kind: "follow" },
      { id: "dont", kind: "dont" }
    ];
    for (let i = 0; i < 6; i++) list.push({ id: "light-" + i, kind: "light", arg: i });
    return list;
  }
  if (screen === "womb") {
    const list = [
      { id: "follow", kind: "follow" },
      { id: "dont", kind: "dont" }
    ];
    for (let i = 1; i <= 5; i++) list.push({ id: "petal-" + i, kind: "petal", arg: i });
    return list;
  }
  if (screen === "good" || REALMS.indexOf(screen) >= 0) {
    return [{ id: "again", kind: "again" }];
  }
  return [];
}

function requiredLinks() {
  const links = [];
  LIFE_SCREENS.forEach(function (screen) {
    actionsFor(screen).forEach(function (action) {
      links.push({ from: screen, button: action.id });
    });
  });
  links.push({ from: "womb", button: "petals" });
  return links;
}

function unreachedNow() {
  return {
    screens: LIFE_SCREENS.filter(function (id) { return !seenScreens[id]; }),
    links: requiredLinks().filter(function (link) {
      return !seenLinks[link.from + ">" + link.button];
    })
  };
}

function coverageNow() {
  const gaps = unreachedNow();
  const screens = (LIFE_SCREENS.length - gaps.screens.length) + "/" + LIFE_SCREENS.length;
  const linkCount = requiredLinks().length;
  const links = (linkCount - gaps.links.length) + "/" + linkCount;
  return {
    screens: screens,
    links: links,
    complete: gaps.screens.length === 0 && gaps.links.length === 0
  };
}

function publishCoverage() {
  const now = coverageNow();
  window.__coverage = now.screens + " " + now.links;
  window.__coverageComplete = now.complete;
}

function coverageComplete() {
  return coverageNow().complete;
}

function runFile() {
  const totals = { lives: 0, good: 0, incomplete: 0, rebirths: {} };
  REALMS.forEach(function (name) { totals.rebirths[name] = 0; });
  lives.forEach(function (item) {
    if (!item.ended) {
      totals.incomplete += 1;
      return;
    }
    totals.lives += 1;
    if (item.ended === "good") totals.good += 1;
    else if (totals.rebirths[item.ended] !== undefined) totals.rebirths[item.ended] += 1;
  });
  return {
    schema: "bardo-run",
    stamp: STAMP,
    complete: runComplete,
    coverage: coverageNow(),
    lives: lives.map(function (item) {
      return {
        steps: item.steps,
        ended: item.ended || "",
        karma: item.karma,
        incomplete: item.incomplete === true
      };
    }),
    totals: totals,
    unreached: unreachedNow(),
    deadEnds: [{
      from: "wish",
      button: "follow",
      onward: "chonyid",
      note: "Following here would open Chönyid, which is not in this part of the tour."
    }]
  };
}

function downloadRun() {
  const blob = new Blob([JSON.stringify(runFile(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "bardo-run.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
}

function finishAuto() {
  if (autoTimer) clearTimeout(autoTimer);
  autoTimer = 0;
  if (life && life.steps.length && !life.ended) {
    life.ended = "";
    life.incomplete = true;
    lives.push(life);
  }
  life = null;
  autoRunning = false;
  autoStopRequested = false;
  runComplete = coverageComplete();
  downloadRun();
  render();
}

function scheduleAuto() {
  const pace = window.__autoPace || 3000;
  autoTimer = setTimeout(autoStep, pace);
}

function autoStep() {
  autoTimer = 0;
  if (!autoRunning) return;
  performAutoAction();
  if (autoStopRequested || coverageComplete()) {
    finishAuto();
    return;
  }
  scheduleAuto();
}

function beginAgain(via) {
  if (via !== "auto") playClick();
  const from = screenId;
  const karmaBefore = karma;
  karma = ada.exports.bardo_karma_carry(karma);
  methodsDone = 0;
  destination = -1;
  poisonSeen = -1;
  wanderTick = 0;
  pendingAction = 0;
  showScreen("wish", "again");
  if (via === "auto") noteStep("again", from, "wish", { karmaBefore: karmaBefore });
}

function actionHelps(action) {
  const link = screenId + ">" + action.id;
  if (!seenLinks[link]) return true;
  if (action.kind === "light" && !seenScreens[REALMS[action.arg]]) return true;
  if (action.kind === "petal" && action.arg === methodsDone + 1 && !seenLinks["womb>petals"]) return true;
  if (action.kind === "follow" && screenId === "womb" && !seenScreens.good) return true;
  if (action.kind === "dont" && screenId === "womb") {
    const realm = destination >= 0 && destination <= 5
      ? REALMS[destination]
      : REALMS[ada.exports.bardo_karma_realm(karma)];
    if (!seenScreens[realm]) return true;
  }
  if (action.kind === "dont" && screenId === "wish" && !seenScreens.judge) return true;
  if (action.kind === "dont" && screenId === "judge" && !seenScreens.lights) return true;
  if (action.kind === "dont" && screenId === "lights" && !seenScreens.womb) return true;
  return false;
}

function pickAction() {
  const actions = actionsFor(screenId);
  if (!actions.length) return null;
  let least = actions[0];
  let min = tries[screenId + ">" + least.id] || 0;
  const pool = [];
  actions.forEach(function (action) {
    const count = tries[screenId + ">" + action.id] || 0;
    if (count < min) {
      min = count;
      pool.length = 0;
      pool.push(action);
    } else if (count === min) {
      pool.push(action);
    }
  });
  const helpful = pool.filter(actionHelps);
  const choice = (helpful.length ? helpful : pool);
  return choice[Math.floor(Math.random() * choice.length)];
}

function autoApply(action) {
  const key = screenId + ">" + action.id;
  tries[key] = (tries[key] || 0) + 1;
  if (action.kind === "follow") {
    choose(true, "auto");
    return;
  }
  if (action.kind === "dont") {
    choose(false, "auto");
    return;
  }
  if (action.kind === "again") {
    beginAgain("auto");
    return;
  }
  const from = screenId;
  const karmaBefore = karma;
  if (action.kind === "light") {
    destination = action.arg;
    applyAction(4, action.arg);
    lineKey = "tapLight" + action.arg;
    detailKey = "detailLight" + action.arg;
    arrivalKey = "";
    noteStep(action.id, from, screenId, { karmaBefore: karmaBefore });
    render();
    return;
  }
  if (action.kind === "petal") {
    const before = methodsDone;
    applyAction(1, action.arg);
    if (from === "womb" && methodsDone >= 5) {
      showScreen("good", "petals");
      noteStep(action.id, from, "womb", { karmaBefore: karmaBefore });
      noteStep("petals", from, "good", { karmaBefore: karmaBefore });
      return;
    }
    lineKey = methodsDone > before ? "tapClosed" : (sidpa()[1] === 8 ? "outOrder" : "tapPetal" + action.arg);
    detailKey = "detailPetal" + action.arg;
    arrivalKey = "";
    noteStep(action.id, from, screenId, { karmaBefore: karmaBefore });
    render();
    return;
  }
  if (action.action >= 1 && action.action <= 7) applyAction(action.action, action.arg);
  const spec = explainOf(action.action, action.arg);
  if (spec) {
    lineKey = spec.line;
    detailKey = spec.detail;
    arrivalKey = "";
  }
  noteStep(action.id, from, screenId, { karmaBefore: karmaBefore });
  render();
}

function performAutoAction() {
  if (!actionsFor(screenId).length) {
    const from = screenId;
    showScreen("wish", "auto");
    noteStep("start", from, screenId, { karmaBefore: karma });
    return;
  }
  const action = pickAction();
  if (!action) return;
  autoApply(action);
}

function startAuto() {
  if (autoRunning) return;
  autoRunning = true;
  autoStopRequested = false;
  runComplete = false;
  lives = [];
  life = { steps: [], karma: karma };
  seenScreens = {};
  seenLinks = {};
  tries = {};
  window.__autoLives = 0;
  if (screenId === "opening" || screenId === "clock") showScreen("wish", "auto");
  seenScreens[screenId] = true;
  publishCoverage();
  scheduleAuto();
  render();
}

function requestStop() {
  if (!autoRunning) return;
  autoStopRequested = true;
  if (!autoTimer) finishAuto();
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
      language: "en-GB",
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
  karma = exports.bardo_karma_start();
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
  direction = next;
  milli = ada.exports.bardo_start(direction);
  methodsDone = 0;
  destination = -1;
  poisonSeen = -1;
  endingLocked = false;
  turned = false;
  lineKey = "";
  detailKey = "";
  arrivalKey = "";
  selectedKey = "";
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

document.getElementById("dir-jung").addEventListener("click", function () { setDirection(0); playClick(); });
document.getElementById("dir-book").addEventListener("click", function () { setDirection(1); playClick(); });
document.getElementById("day").addEventListener("input", function (event) {
  endingLocked = false;
  turned = false;
  lineKey = "";
  detailKey = "";
  arrivalKey = "";
  selectedKey = "";
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
document.getElementById("again").addEventListener("click", function () { beginAgain(); });
document.getElementById("auto").addEventListener("click", function () {
  if (autoRunning) requestStop();
  else startAuto();
});
document.getElementById("enter").addEventListener("click", function () {
  const more = document.getElementById("more");
  more.hidden = !more.hidden;
  if (!more.hidden) {
    placePanels();
    drawGraph(Number(document.getElementById("state").dataset.day || "0"));
  }
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
      onHit(regions[i]);
      return;
    }
  }
});
addEventListener("resize", function () {
  if (!ada) return;
  drawCanvas();
  placePanels();
  drawGraph(Number(document.getElementById("state").dataset.day || "0"));
});

boot().catch(function (err) {
  showError(t("errorWasm") + " " + (err && err.message ? err.message : String(err)));
  window.__bardoReady = false;
  window.__bardoError = String(err);
});
pollVersion();
setInterval(pollVersion, 120000);
