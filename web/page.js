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
let autoPrompt = false;
let autoKeepGoing = false;
let autoQuiet = false;
let diary = { screens: {} };
let diaryDirty = false;
let stepTotal = 0;
let runTruncated = false;
let lifeTotals = null;
const STEP_CAP = 4000;
const DIARY_KEY = "bardo-auto-diary";
let lineKey = "";
let detailKey = "";
let forcedArrival = "";
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
const ANCHOR = { womb: 49, lights: 42, judge: 35, wish: 28 };
const CLIMB = ["f1", "f2", "f3", "womb", "lights", "judge", "wish", "chonyid", "w14", "w13", "w12", "w11", "w10", "w09", "w08"];
const SCREEN = {
  opening: { code: "OPEN" },
  clock: { code: "CLOCK" },
  f1: { code: "J00-F1", tour: true, frame: true, canon: "frame", blurb: "blurbF1", hits: [
    { line: "tapPsyche", detail: "detailPsyche" },
    { line: "tapPsychotic", detail: "detailPsychotic" },
    { line: "tapCaveat", detail: "detailCaveat" }
  ]},
  f2: { code: "J00-F2", tour: true, frame: true, canon: "interval", blurb: "blurbF2", hits: [
    { line: "tapSecChikhai", detail: "detailSecChikhai" },
    { line: "tapSecChonyid", detail: "detailSecChonyid" },
    { line: "tapSecSidpa", detail: "detailSecSidpa" },
    { line: "tapCurveC", detail: "detailCurveC" },
    { line: "tapCurveI", detail: "detailCurveI" },
    { line: "tapCurveX", detail: "detailCurveX" }
  ]},
  f3: { code: "J00-F3", tour: true, frame: true, canon: "bardos", blurb: "blurbF3", hits: [
    { line: "tapBardo0", detail: "detailBardo0" },
    { line: "tapBardo1", detail: "detailBardo1" },
    { line: "tapBardo2", detail: "detailBardo2" },
    { line: "tapBardo3", detail: "detailBardo3" },
    { line: "tapBardo4", detail: "detailBardo4" },
    { line: "tapBardo5", detail: "detailBardo5" }
  ]},
  womb: { code: "J01-B49" },
  lights: { code: "J02-B42" },
  judge: { code: "J03-B35" },
  wish: { code: "J04-B28" },
  chonyid: { code: "J04-B15", cal: 18, entry: true, canon: "chonyid", blurb: "blurbEntry", hits: [
    { line: "tapRays", detail: "detailRays" },
    { line: "tapBodySafe", detail: "detailBodySafe" },
    { line: "tapFamily0", detail: "detailFamily0" },
    { line: "tapFamily1", detail: "detailFamily1" },
    { line: "tapFamily2", detail: "detailFamily2" },
    { line: "tapFamily3", detail: "detailFamily3" },
    { line: "tapFamily4", detail: "detailFamily4" }
  ]},
  w14: { code: "J05-B14", cal: 17, info: "infoW14", kind: "row", flame: "#e0c36a", figures: [
    { key: "door-tiger", line: "tapDoorTiger", detail: "detailDoor", colour: "#f4f1e6" },
    { key: "door-sow", line: "tapDoorSow", detail: "detailDoor", colour: "#c4a24a" },
    { key: "door-lion", line: "tapDoorLion", detail: "detailDoor", colour: "#a33b32" },
    { key: "door-serpent", line: "tapDoorSerpent", detail: "detailDoor", colour: "#3f6b48" }
  ]},
  w13: { code: "J06-B13", cal: 16, info: "infoW13", kind: "row", flame: "#a33b32", figures: [
    { key: "kerima", line: "tapKerima", detail: "detailKerima", colour: "#f4f1e6" },
    { key: "lion", line: "tapLionHead", detail: "detailAnimal", colour: "#5c3a2e" },
    { key: "tiger", line: "tapTigerHead", detail: "detailAnimal", colour: "#a33b32" },
    { key: "fox", line: "tapFoxHead", detail: "detailAnimal", colour: "#1c1c1c" },
    { key: "wolf", line: "tapWolfHead", detail: "detailAnimal", colour: "#3a4a72" }
  ]},
  w12: { code: "J07-B12", cal: 15, info: "infoW12", kind: "pair", body: "#1e4a3a", faces: ["#f7f4ea", "#1e4a3a", "#a33b32"], consort: "#2f6a52", flame: "#6e8f62", figures: [
    { key: "heruka", line: "tapKarmaH", detail: "detailKarmaH" },
    { key: "consort", line: "tapKarmaK", detail: "detailKarmaK" }
  ]},
  w11: { code: "J08-B11", cal: 14, info: "infoW11", kind: "pair", body: "#6e2430", faces: ["#f7f4ea", "#6e2430", "#3a4a72"], consort: "#8e3a48", flame: "#a33b32", figures: [
    { key: "heruka", line: "tapPadmaH", detail: "detailPadmaH" },
    { key: "consort", line: "tapPadmaK", detail: "detailPadmaK" }
  ]},
  w10: { code: "J09-B10", cal: 13, info: "infoW10", kind: "pair", body: "#a8842a", faces: ["#f7f4ea", "#8a6a22", "#a33b32"], consort: "#c4a24a", flame: "#e0c36a", figures: [
    { key: "heruka", line: "tapRatnaH", detail: "detailRatnaH" },
    { key: "consort", line: "tapRatnaK", detail: "detailRatnaK" }
  ]},
  w09: { code: "J10-B09", cal: 12, info: "infoW09", kind: "pair", body: "#2a3a6a", faces: ["#f7f4ea", "#2a3a6a", "#a33b32"], consort: "#3a4a82", flame: "#6a7f92", figures: [
    { key: "heruka", line: "tapVajraH", detail: "detailVajraH" },
    { key: "consort", line: "tapVajraK", detail: "detailVajraK" }
  ]},
  w08: { code: "J11-B08", cal: 11, info: "infoW08", kind: "pair", body: "#5c3a2e", faces: ["#f7f4ea", "#5c3a2e", "#a33b32"], consort: "#6e4a3a", flame: "#c47a3a", figures: [
    { key: "heruka", line: "tapBuddhaH", detail: "detailBuddhaH" },
    { key: "consort", line: "tapBuddhaK", detail: "detailBuddhaK" }
  ]},
  c19: {
    code: "J19-B00", milli: 250, clear: 19, clearKind: "secondary", blurb: "blurbC19",
    hits: [
      { line: "tapClearSec", detail: "detailClearSec" },
      { line: "tapRelatives", detail: "detailRelatives" },
      { line: "tapThought", detail: "detailThought" }
    ]
  },
  c20: {
    code: "J20-B00", milli: 0, clear: 20, clearKind: "primary", blurb: "blurbC20",
    hits: [
      { line: "tapClearPri", detail: "detailClearPri" },
      null,
      null,
      { line: "tapSlider", detail: "detailSlider" }
    ]
  },
  liberation: { code: "J20-B00/liberation", clearKind: "liberation" },
  visions: { code: "J01-B49/visions", cal: 49, branch: 1, canon: "visions", blurb: "blurbVisions", hits: [
    { line: "tapEast", detail: "detailEast" },
    { line: "tapSouth", detail: "detailSouth" },
    { line: "tapWestC", detail: "detailWestC" },
    { line: "tapNorthC", detail: "detailNorthC" },
    { line: "tapSignDeva", detail: "detailSignDeva" },
    { line: "tapSignAsura", detail: "detailSignAsura" },
    { line: "tapSignHuman", detail: "detailSignHuman" },
    { line: "tapSignAnimal", detail: "detailSignAnimal" },
    { line: "tapSignPreta", detail: "detailSignPreta" },
    { line: "tapSignHell", detail: "detailSignHell" }
  ]},
  shelter: { code: "J01-B49/shelter", cal: 49, branch: 2, canon: "shelter", blurb: "blurbShelter", hits: [
    { line: "tapFuries", detail: "detailFuries" }
  ]},
  choice: { code: "J01-B49/choice", cal: 49, branch: 3, canon: "choice", blurb: "blurbChoice", hits: [
    { line: "takeAmitabha", detail: "detailTakeA" },
    { line: "takeTushita", detail: "detailTakeT" },
    { line: "takeJambu", detail: "detailTakeJ" },
    { line: "takeKarma", detail: "detailTakeK" }
  ]},
  amitabha: { code: "J01-B49/amitabha" },
  tushita: { code: "J01-B49/tushita" },
  jambu: { code: "J01-B49/jambu" },
  coda: { code: "J00-C1", tour: true, frame: true, canon: "coda", blurb: "blurbCoda", hits: [
    { line: "tapPurpose", detail: "detailPurpose" },
    { line: "tapCaveat2", detail: "detailCaveat2" },
    { line: "tapSources", detail: "detailSources" },
    { line: "tapComputed", detail: "detailComputed" },
    { line: "tapVerses", detail: "detailVerses" }
  ]},
  good: { code: "J01-B49/good" },
  deva: { code: "J01-B49/deva" },
  asura: { code: "J01-B49/asura" },
  human: { code: "J01-B49/human" },
  animal: { code: "J01-B49/animal" },
  preta: { code: "J01-B49/preta" },
  hell: { code: "J01-B49/hell" }
};

function codeOf(id) {
  return (SCREEN[id] && SCREEN[id].code) || id;
}
const REALMS = ["deva", "asura", "human", "animal", "preta", "hell"];
const CLEAR_ID = { 18: "p1", 19: "c19", 20: "c20", 21: "liberation" };
const WOMB_ID = {
  0: "womb", 1: "visions", 2: "shelter", 3: "choice",
  10: "amitabha", 11: "tushita", 12: "jambu",
  20: "deva", 21: "asura", 22: "human", 23: "animal", 24: "preta", 25: "hell"
};
const ENDINGS = ["good", "liberation", "amitabha", "tushita", "jambu"].concat(
  ["deva", "asura", "human", "animal", "preta", "hell"]
);
function holdsScreen(id) {
  if (ANCHOR[id]) return true;
  const spec = SCREEN[id];
  return !!(spec && (spec.tour || spec.cal || Object.prototype.hasOwnProperty.call(spec, "milli")));
}
let dissolve = 0;
let dissolveStage = 0;
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
    ? CLIMB.slice()
    : ["wish", "judge", "lights", "womb"];
  if (direction === 0) return teach.concat(["liberation", "good"]).concat(REALMS);
  return teach.concat(["good"]).concat(REALMS);
}

function firstId() {
  return direction === 0 ? "womb" : "wish";
}

function screenFromScene(scene) {
  return SCENE_ID[scene] || "clock";
}

function remember(button, extra) {
  const entry = { screen: screenId, id: codeOf(screenId), button: button, t: Date.now() };
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
  if (lineKey) return lineKey.indexOf(" ") >= 0 ? lineKey : t(lineKey);
  if (arrivalKey) return arrivalKey.indexOf(" ") >= 0 ? arrivalKey : t(arrivalKey);
  if (SCREEN[screenId] && SCREEN[screenId].blurb) return t(SCREEN[screenId].blurb);
  return t(infoKey(scene));
}

function infoKey(scene) {
  if (viewMode === "opening" || screenId === "opening") return "title";
  if (screenId === "good") return "infoGood";
  if (screenId === "liberation") return "infoLiberation";
  if (screenId === "amitabha") return "infoAmitabha";
  if (screenId === "tushita") return "infoTushita";
  if (screenId === "jambu") return "infoJambu";
  if (REALM_INFO[screenId]) return REALM_INFO[screenId];
  if (SCREEN[screenId] && SCREEN[screenId].info) return SCREEN[screenId].info;
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
  if (viewMode !== "opening" && !endingLocked && !holdsScreen(screenId)) {
    screenId = screenFromScene(side[0]);
  }
  state.dataset.scene = String(side[0]);
  state.dataset.screen = screenId;
  state.dataset.id = codeOf(screenId);
  const sid = document.getElementById("sid");
  if (sid) sid.textContent = codeOf(screenId);
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
  const teaching = CLIMB.indexOf(screenId) >= 0 || !!(SCREEN[screenId] && SCREEN[screenId].branch);
  const ending = viewMode === "ending";
  document.body.classList.toggle("is-opening", viewMode === "opening");
  document.body.classList.toggle("is-ending", ending);
  document.body.classList.toggle("has-again", ending || screenId === "coda");
  document.body.classList.toggle("has-choice", teaching);
  const followButton = document.getElementById("follow");
  const dontButton = document.getElementById("dont");
  if (screenId === "c20") {
    followButton.textContent = t("remain");
    dontButton.textContent = t("moment");
  } else if (screenId === "c19") {
    followButton.textContent = t("recognise");
    dontButton.textContent = t("moment");
  } else {
    followButton.textContent = t("follow");
    dontButton.textContent = t("dont");
  }
  const dissolveBox = document.getElementById("dissolve");
  if (dissolveBox) dissolveBox.hidden = screenId !== "c20";
  const dissolveLabel = document.getElementById("dissolve-label");
  if (dissolveLabel && screenId === "c20") {
    dissolveLabel.textContent = t("dissolveLabel") + ". " + t("dissolve" + dissolveStage);
  }
  document.getElementById("enter").textContent = currentInfo(side[0]);
  const quote = document.getElementById("quote");
  if (ending) {
    const quoteKey = {
      good: "quoteGood", liberation: "quoteLiberation",
      amitabha: "quoteAmitabha", tushita: "quoteTushita", jambu: "quoteJambu"
    }[screenId] || REALM_QUOTE[screenId];
    quote.textContent = quoteKey ? t(quoteKey) : "";
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
    curves: curves,
    wrath: SCREEN[screenId] && SCREEN[screenId].kind ? SCREEN[screenId] : null,
    peace: SCREEN[screenId] && SCREEN[screenId].peace ? SCREEN[screenId] : null,
    clearKind: (SCREEN[screenId] && SCREEN[screenId].clearKind) || "",
    canon: (SCREEN[screenId] && SCREEN[screenId].canon) || "",
    dissolve: dissolveStage
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
    if (window.__autoCover) {
      requestAnimationFrame(tick);
      return;
    }
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
  const dissolveBox = document.getElementById("dissolve");
  if (dissolveBox) {
    const sliderTop = (stage.y + stage.h - 118) + "px";
    dissolveBox.style.top = sliderTop;
    dissolveBox.style.left = left;
    dissolveBox.style.width = width;
  }
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
  if (autoQuiet) return;
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
    arrivalKey = forcedArrival || (REALMS.indexOf(id) >= 0 ? pullKey() : (ARRIVE[id] || ""));
  }
  forcedArrival = "";
  document.getElementById("more").hidden = true;
  if (id === "opening") {
    viewMode = "opening";
    endingLocked = false;
    turned = false;
  } else if (holdsScreen(id)) {
    viewMode = "tour";
    endingLocked = false;
    if (id !== "wish") turned = false;
    if (SCREEN[id] && Object.prototype.hasOwnProperty.call(SCREEN[id], "milli")) {
      milli = SCREEN[id].milli;
    } else if (ANCHOR[id] || (SCREEN[id] && SCREEN[id].cal)) {
      milli = ada.exports.bardo_milli_of_day(ANCHOR[id] || SCREEN[id].cal);
    }
    if (id === "c20") applyDissolve(0);
  } else {
    viewMode = "ending";
    endingLocked = true;
    turned = false;
  }
  cardsKey = "";
  render();
}

function applyDissolve(level) {
  if (!ada) return;
  const clamped = ada.exports.bardo_dissolve_clamp(level);
  dissolveStage = ada.exports.bardo_dissolve_stage(clamped);
  dissolve = clamped;
  const range = document.getElementById("dissolve-range");
  if (range && Number(range.value) !== clamped) range.value = String(clamped);
  const read = document.getElementById("dissolve-read");
  if (read) read.textContent = t("dissolve" + dissolveStage);
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
    showScreen(direction === 0 ? "f1" : firstId(), "next");
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
  const from = screenId;
  const at = CLIMB.indexOf(from);
  const karmaBefore = karma;
  karma = follow
    ? ada.exports.bardo_karma_lighten(karma)
    : ada.exports.bardo_karma_heavy(karma);
  if (SCREEN[from] && SCREEN[from].branch) {
    let pick = follow ? 0 : 9;
    if (SCREEN[from].branch === 3) pick = follow ? 3 : 4;
    const code = ada.exports.bardo_womb_path(SCREEN[from].branch, pick, destination, karma);
    const next = WOMB_ID[code];
    if (!next) return;
    if (code >= 20) destination = code - 20;
    showScreen(next, follow ? "follow" : "dont");
    if (via === "auto") noteStep(follow ? "follow" : "dont", from, screenId, { karmaBefore: karmaBefore });
    return;
  }
  if (at < 0) return;
  if (SCREEN[from] && SCREEN[from].frame && from !== "coda") {
    const next = follow ? CLIMB[at + 1] : (at > 0 ? CLIMB[at - 1] : from);
    showScreen(next, follow ? "follow" : "dont");
    if (via === "auto") noteStep(follow ? "follow" : "dont", from, screenId, { karmaBefore: karmaBefore });
    return;
  }
  if (!follow && from === "womb") {
    const code = ada.exports.bardo_womb_path(0, 0, destination, karma);
    showScreen(WOMB_ID[code] || "visions", "dont");
    if (via === "auto") noteStep("dont", from, screenId, { karmaBefore: karmaBefore });
    return;
  }
  if (SCREEN[from] && SCREEN[from].clear) {
    const nextCode = ada.exports.bardo_clear_step(SCREEN[from].clear, follow ? 1 : 0);
    const next = CLEAR_ID[nextCode];
    if (!next) return;
    if (!follow && nextCode === 18) forcedArrival = "arrivePass19";
    if (!follow && nextCode === 19) forcedArrival = "arrivePass20";
    showScreen(next, follow ? "follow" : "dont");
    if (via === "auto") noteStep(follow ? "follow" : "dont", from, screenId, { karmaBefore: karmaBefore });
    return;
  }
  if (follow && from === "p1") {
    const nextCode = ada.exports.bardo_clear_step(18, 1);
    const next = CLEAR_ID[nextCode];
    showScreen(next, "follow");
    if (via === "auto") noteStep("follow", from, screenId, { karmaBefore: karmaBefore });
    return;
  }
  if (!follow && SCREEN[from] && SCREEN[from].peace) {
    const code = ada.exports.bardo_dull_realm(SCREEN[from].book);
    const realmCode = code < 0 ? ada.exports.bardo_karma_realm(karma) : code;
    destination = realmCode;
    forcedArrival = code < 0 ? "" : ("arrivePeace" + SCREEN[from].book);
    showScreen(REALMS[realmCode], "dont");
    if (via === "auto") noteStep("dont", from, screenId, { karmaBefore: karmaBefore });
    return;
  }
  const next = follow ? CLIMB[at + 1] : (at === 0 ? rebirthId() : CLIMB[at - 1]);
  showScreen(next, follow ? "follow" : "dont");
  if (via === "auto") noteStep(follow ? "follow" : "dont", from, screenId, { karmaBefore: karmaBefore });
}

function explainOf(action, arg) {
  if (action === 24 && SCREEN[screenId] && SCREEN[screenId].hits && SCREEN[screenId].hits[arg]) {
    const item = SCREEN[screenId].hits[arg];
    return { line: item.line, detail: item.detail };
  }
  if ((action === 21 || action === 22 || action === 23) && SCREEN[screenId]) {
    const group = action === 21 ? "figures" : action === 22 ? "lights" : "emblems";
    const item = (SCREEN[screenId][group] || [])[arg];
    if (item) return { line: item.line, detail: item.detail };
  }
  if (action === 20 && SCREEN[screenId] && SCREEN[screenId].figures && SCREEN[screenId].figures[arg]) {
    const fig = SCREEN[screenId].figures[arg];
    return { line: fig.line, detail: fig.detail };
  }
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
  if (action === 10) return { line: "tapLord", detail: "detailLord" };
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
  if (region.action === 24 && screenId === "choice" && selectedKey === key && region.arg <= 3) {
    takePath([1, 2, 3, 4][region.arg], via, ["amitabha", "tushita", "jambu", "karma"][region.arg]);
    return;
  }
  const acts = region.action >= 1 && region.action <= 7;
  if (selectedKey === key && acts) {
    const from = screenId;
    const before = methodsDone;
    if (region.action === 1 && from === "womb" && before === 4 && region.arg === 5) {
      const chance = ada.exports.bardo_karma_chance(karma);
      const roll = Math.floor(Math.random() * 1000);
      const natural = roll < chance;
      const ok = via === "auto" ? true : natural;
      if (!ok) {
        const code = ada.exports.bardo_womb_path(0, 0, destination, karma);
        showScreen(WOMB_ID[code] || "visions", "fail");
        if (via === "auto") noteStep("fail", from, screenId, {});
        return;
      }
    }
    applyAction(region.action, region.arg);
    if (via !== "auto") playClick();
    if (region.action === 1 && from === "womb" && methodsDone >= 5) {
      const forced = via === "auto" && ada.exports.bardo_karma_chance(karma) < 1000;
      showScreen("good", "petals");
      if (via === "auto") noteStep("petals", from, "good", { forced: forced });
      return;
    }
    const outcome = sidpa()[1];
    if (outcome === 8) lineKey = "outOrder";
    else if (region.action === 1 && methodsDone > before) lineKey = "tapClosed";
    else if (outcome === 6) {
      showScreen("liberation", "recognise");
      if (via === "auto") noteStep("recognise", from, "liberation", {});
      return;
    }
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
  const step = {
    screen: from,
    id: codeOf(from),
    ledId: codeOf(led),
    action: action,
    led: led,
    t: Date.now(),
    karma: karma
  };
  if (extra) {
    Object.keys(extra).forEach(function (key) { step[key] = extra[key]; });
  }
  life.steps.push(step);
  life.stepCount = (life.stepCount || 0) + 1;
  stepTotal += 1;
  life.karma = karma;
  touchDiary(from, action, led);
  trimSteps();
  if (led === "good" || led === "liberation" || led === "amitabha" || led === "tushita" || led === "jambu" || REALMS.indexOf(led) >= 0) {
    life.ended = led;
    if (lifeTotals) {
      lifeTotals.lives += 1;
      if (led === "good") lifeTotals.good += 1;
      else if (led === "liberation") lifeTotals.liberation += 1;
      else if (led === "amitabha" || led === "tushita" || led === "jambu") lifeTotals.chosen += 1;
      else if (lifeTotals.rebirths[led] !== undefined) lifeTotals.rebirths[led] += 1;
    }
    lives.push(life);
    life = { steps: [], karma: karma, stepCount: 0 };
    window.__autoLives = lifeTotals ? lifeTotals.lives : lives.length;
  }
  publishCoverage();
}

function freshTotals() {
  const totals = { lives: 0, good: 0, liberation: 0, chosen: 0, incomplete: 0, rebirths: {} };
  REALMS.forEach(function (name) { totals.rebirths[name] = 0; });
  return totals;
}

function trimSteps() {
  while (stepTotal > STEP_CAP) {
    let dropped = false;
    for (let i = 0; i < lives.length; i++) {
      if (lives[i].steps && lives[i].steps.length) {
        lives[i].steps.shift();
        lives[i].stepsOmitted = (lives[i].stepsOmitted || 0) + 1;
        stepTotal -= 1;
        runTruncated = true;
        dropped = true;
        break;
      }
    }
    if (!dropped && life && life.steps.length > 1) {
      life.steps.shift();
      life.stepsOmitted = (life.stepsOmitted || 0) + 1;
      stepTotal -= 1;
      runTruncated = true;
    } else if (!dropped) {
      break;
    }
  }
}

function touchDiary(from, action, led) {
  const code = codeOf(from);
  const ledCode = codeOf(led);
  if (!diary.screens[code]) diary.screens[code] = { visited: 0, choices: {} };
  diary.screens[code].visited += 1;
  const rec = diary.screens[code].choices[action] || { count: 0, led: {} };
  rec.count += 1;
  rec.led[ledCode] = (rec.led[ledCode] || 0) + 1;
  diary.screens[code].choices[action] = rec;
  diaryDirty = true;
}

function idOfCode(code) {
  const keys = Object.keys(SCREEN);
  for (let i = 0; i < keys.length; i++) {
    if (SCREEN[keys[i]].code === code) return keys[i];
  }
  return "";
}

function applyDiary() {
  tries = {};
  seenScreens = {};
  seenLinks = {};
  const screens = diary.screens || {};
  Object.keys(screens).forEach(function (code) {
    const id = idOfCode(code);
    if (!id) return;
    seenScreens[id] = true;
    const choices = screens[code].choices || {};
    Object.keys(choices).forEach(function (action) {
      const rec = choices[action];
      const count = rec.count || 0;
      if (!count) return;
      tries[id + ">" + action] = count;
      seenLinks[id + ">" + action] = true;
      Object.keys(rec.led || {}).forEach(function (ledCode) {
        const led = idOfCode(ledCode);
        if (led) seenScreens[led] = true;
      });
    });
  });
}

function loadDiary() {
  diary = { screens: {} };
  try {
    const raw = localStorage.getItem(DIARY_KEY);
    if (raw) diary = JSON.parse(raw);
    if (!diary.screens) diary.screens = {};
  } catch (err) {
    diary = { screens: {} };
  }
  applyDiary();
}

function saveDiary() {
  if (!diaryDirty) return;
  try { localStorage.setItem(DIARY_KEY, JSON.stringify(diary)); } catch (err) { /* private mode */ }
  diaryDirty = false;
}

function clearDiary() {
  diary = { screens: {} };
  tries = {};
  seenScreens = {};
  seenLinks = {};
  diaryDirty = false;
  try { localStorage.removeItem(DIARY_KEY); } catch (err) { /* private mode */ }
  publishCoverage();
}

function lifeScreens() {
  return CLIMB.concat(["visions", "shelter", "choice", "good", "liberation", "amitabha", "tushita", "jambu", "coda"]).concat(REALMS);
}

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
      { id: "pebble-b", kind: "hit", action: 9, arg: 0 },
      { id: "lord", kind: "hit", action: 10, arg: 0 }
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
  if (ENDINGS.indexOf(screen) >= 0) {
    return [
      { id: "again", kind: "again" },
      { id: "coda", kind: "coda" }
    ];
  }
  if (screen === "coda" || (SCREEN[screen] && (SCREEN[screen].frame || SCREEN[screen].entry || SCREEN[screen].branch))) {
    const list = screen === "coda"
      ? [{ id: "again", kind: "again" }]
      : screen === "f1"
        ? [{ id: "follow", kind: "follow" }]
        : [
          { id: "follow", kind: "follow" },
          { id: "dont", kind: "dont" }
        ];
    if (screen === "choice") {
      list.push({ id: "amitabha", kind: "path", choice: 1 });
      list.push({ id: "tushita", kind: "path", choice: 2 });
    }
    (SCREEN[screen].hits || []).forEach(function (hit, i) {
      if (!hit) return;
      list.push({ id: "hit-" + i, kind: "clear", arg: i });
    });
    return list;
  }
  if (SCREEN[screen] && SCREEN[screen].clear) {
    const list = [
      { id: "follow", kind: "follow" },
      { id: "dont", kind: "dont" }
    ];
    (SCREEN[screen].hits || []).forEach(function (hit, i) {
      if (!hit) return;
      list.push({ id: "clear-" + i, kind: "clear", arg: i });
    });
    return list;
  }
  if (SCREEN[screen] && SCREEN[screen].peace) {
    const spec = SCREEN[screen];
    const list = [
      { id: "follow", kind: "follow" },
      { id: "dont", kind: "dont" }
    ];
    (spec.figures || []).forEach(function (_, i) { list.push({ id: "fig-" + i, kind: "peace", group: "figures", arg: i }); });
    (spec.lights || []).forEach(function (_, i) { list.push({ id: "beam-" + i, kind: "peace", group: "lights", arg: i }); });
    (spec.emblems || []).forEach(function (_, i) { list.push({ id: "emblem-" + i, kind: "peace", group: "emblems", arg: i }); });
    return list;
  }
  if (SCREEN[screen] && SCREEN[screen].figures) {
    const list = [
      { id: "follow", kind: "follow" },
      { id: "dont", kind: "dont" }
    ];
    SCREEN[screen].figures.forEach(function (fig, index) {
      list.push({ id: fig.key, kind: "figure", arg: index });
    });
    return list;
  }
  return [];
}

function requiredLinks() {
  const links = [];
  lifeScreens().forEach(function (screen) {
    actionsFor(screen).forEach(function (action) {
      links.push({ from: screen, button: action.id });
    });
  });
  links.push({ from: "womb", button: "petals" });
  return links;
}

function unreachedNow() {
  return {
    screens: lifeScreens().filter(function (id) { return !seenScreens[id]; }),
    links: requiredLinks().filter(function (link) {
      return !seenLinks[link.from + ">" + link.button];
    })
  };
}

function coverageNow() {
  const gaps = unreachedNow();
  const screens = (lifeScreens().length - gaps.screens.length) + "/" + lifeScreens().length;
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
  window.__gaps = unreachedNow();
}

function coverageComplete() {
  return coverageNow().complete;
}

function runFile() {
  const totals = lifeTotals || freshTotals();
  const done = coverageComplete();
  const stored = [];
  lives.forEach(function (item) { stored.push(item); });
  if (life && life.steps && life.steps.length && !life.ended) {
    stored.push({
      steps: life.steps,
      stepsOmitted: life.stepsOmitted || 0,
      stepCount: life.stepCount || life.steps.length,
      ended: "",
      karma: karma,
      incomplete: true
    });
  }
  return {
    schema: "bardo-run",
    stamp: STAMP,
    complete: done,
    finished: done,
    finishedAt: done ? new Date().toISOString() : null,
    truncated: runTruncated,
    stepsStored: stepTotal,
    coverage: coverageNow(),
    diary: diary,
    lives: stored.map(function (item) {
      return {
        steps: item.steps,
        stepsOmitted: item.stepsOmitted || 0,
        stepCount: item.stepCount || (item.steps ? item.steps.length : 0),
        ended: item.ended || "",
        karma: item.karma,
        incomplete: item.incomplete === true
      };
    }),
    totals: totals,
    unreached: unreachedNow(),
    deadEnds: []
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

function hideAutoCover() {
  autoPrompt = false;
  autoQuiet = false;
  window.__autoCover = false;
  const cover = document.getElementById("auto-cover");
  if (cover) cover.hidden = true;
  const ask = document.getElementById("auto-ask");
  const run = document.getElementById("auto-run");
  if (ask) ask.hidden = true;
  if (run) run.hidden = false;
}

function paintAutoStats() {
  const cov = coverageNow();
  const line = t("autoLives") + " " + (lifeTotals ? lifeTotals.lives : 0)
    + " · " + t("autoScreens") + " " + cov.screens
    + " · " + t("autoLinks") + " " + cov.links
    + " · " + t("autoKarma") + " " + karma;
  const stats = document.getElementById("auto-stats");
  const ask = document.getElementById("auto-ask-stats");
  if (stats) stats.textContent = line;
  if (ask) ask.textContent = line;
  window.__autoLives = lifeTotals ? lifeTotals.lives : 0;
}

function showAutoCover() {
  window.__autoCover = true;
  const cover = document.getElementById("auto-cover");
  const ask = document.getElementById("auto-ask");
  const run = document.getElementById("auto-run");
  if (cover) cover.hidden = false;
  if (run) run.hidden = false;
  if (ask) ask.hidden = true;
  paintAutoStats();
}

function finishAuto() {
  autoRunning = false;
  autoStopRequested = false;
  autoQuiet = false;
  if (life && life.steps && life.steps.length && !life.ended) {
    life.ended = "";
    life.incomplete = true;
    if (lifeTotals) lifeTotals.incomplete += 1;
    lives.push(life);
  }
  life = null;
  runComplete = coverageComplete();
  saveDiary();
  hideAutoCover();
  downloadRun();
  render();
}

function showFinishPrompt() {
  autoPrompt = true;
  autoQuiet = false;
  const run = document.getElementById("auto-run");
  const ask = document.getElementById("auto-ask");
  if (run) run.hidden = true;
  if (ask) ask.hidden = false;
  paintAutoStats();
  saveDiary();
}

function autoFrameStep() {
  if (!autoRunning || autoPrompt) return;
  const started = performance.now();
  autoQuiet = true;
  let steps = 0;
  try {
    const cap = window.__autoBatch || 400;
    while (autoRunning && !autoStopRequested && !autoPrompt && steps < cap) {
      performAutoAction();
      steps += 1;
      if (!autoKeepGoing && coverageComplete()) {
        showFinishPrompt();
        break;
      }
      if (performance.now() - started > 12) break;
    }
  } catch (err) {
    autoQuiet = false;
    showError(String(err && err.message ? err.message : err));
    finishAuto();
    return;
  }
  autoQuiet = false;
  paintAutoStats();
  if (diaryDirty) saveDiary();
  if (autoStopRequested) {
    finishAuto();
    return;
  }
  if (autoRunning && !autoPrompt) requestAnimationFrame(autoFrameStep);
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
  showScreen("womb", "again");
  if (via === "auto") noteStep("again", from, "womb", { karmaBefore: karmaBefore });
}

function takePath(pick, via, actionId) {
  const from = screenId;
  const karmaBefore = karma;
  if (pick === 1 || pick === 2 || pick === 3) karma = ada.exports.bardo_karma_lighten(karma);
  const code = ada.exports.bardo_womb_path(3, pick, destination, karma);
  if (code >= 20) destination = code - 20;
  const next = WOMB_ID[code];
  if (!next) return;
  showScreen(next, actionId || "path");
  if (via === "auto") noteStep(actionId || "path", from, screenId, { karmaBefore: karmaBefore });
}

function actionHelps(action) {
  if (action.kind === "follow" || action.kind === "dont" || action.kind === "again" || action.kind === "path" || action.kind === "coda") {
    const pending = actionsFor(screenId).some(function (other) {
      return other.kind !== "follow" && other.kind !== "dont" && other.kind !== "again"
        && other.kind !== "path" && other.kind !== "coda"
        && !seenLinks[screenId + ">" + other.id];
    });
    if (pending) return false;
  }
  if (action.kind === "follow") {
    const at = CLIMB.indexOf(screenId);
    const nxt = at >= 0 ? CLIMB[at + 1] : "";
    if (nxt && (!seenScreens[nxt] || actionsFor(nxt).some(function (other) { return !seenLinks[nxt + ">" + other.id]; }))) return true;
  }
  const link = screenId + ">" + action.id;
  if (!seenLinks[link]) return true;
  if (action.kind === "light" && !seenScreens[REALMS[action.arg]]) return true;
  if (action.kind === "figure" && !seenLinks[link]) return true;
  if (action.kind === "petal" && action.arg === methodsDone + 1 && !seenLinks["womb>petals"]) return true;
  if (action.kind === "follow" && screenId === "wish" && !seenScreens.w14) return true;
  if (action.kind === "follow" && SCREEN[screenId] && SCREEN[screenId].cal) {
    const at = CLIMB.indexOf(screenId);
    const nxt = CLIMB[at + 1];
    if (nxt && !seenScreens[nxt]) return true;
  }
  if (action.kind === "dont" && screenId === "womb") {
    const realm = destination >= 0 && destination <= 5
      ? REALMS[destination]
      : REALMS[ada.exports.bardo_karma_realm(karma)];
    if (!seenScreens[realm]) return true;
  }
  if (action.kind === "dont" && screenId === "wish" && !seenScreens.judge) return true;
  if (action.kind === "dont" && screenId === "judge" && !seenScreens.lights) return true;
  if (action.kind === "dont" && screenId === "lights" && !seenScreens.womb) return true;
  if (action.kind === "dont" && SCREEN[screenId] && SCREEN[screenId].peace) {
    const code = ada.exports.bardo_dull_realm(SCREEN[screenId].book);
    const realm = code < 0 ? REALMS[ada.exports.bardo_karma_realm(karma)] : REALMS[code];
    if (!seenScreens[realm]) return true;
  }
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
  const choice = helpful.length ? helpful : pool;
  const unseen = choice.filter(function (action) { return !tries[screenId + ">" + action.id]; });
  const ready = unseen.length ? unseen : choice;
  const back = ready.filter(function (action) { return action.kind === "dont"; });
  const use = back.length && ready.some(function (action) { return action.kind === "follow"; }) ? back : ready;
  return use[Math.floor(Math.random() * use.length)];
}

function autoApply(action) {
  const from = screenId;
  const karmaBefore = karma;
  const key = from + ">" + action.id;
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
  if (action.kind === "coda") {
    showScreen("coda", "coda");
    noteStep("coda", from, "coda", { karmaBefore: karmaBefore });
    return;
  }
  if (action.kind === "path") {
    takePath(action.choice, "auto", action.id);
    return;
  }
  if (action.kind === "clear") {
    const item = SCREEN[from].hits[action.arg];
    lineKey = item.line;
    detailKey = item.detail;
    arrivalKey = "";
    if (action.arg === 3) applyDissolve(1000);
    noteStep(action.id, from, from, { karmaBefore: karmaBefore });
    render();
    return;
  }
  if (action.kind === "peace") {
    const item = SCREEN[from][action.group][action.arg];
    lineKey = item.line;
    detailKey = item.detail;
    arrivalKey = "";
    noteStep(action.id, from, from, { karmaBefore: karmaBefore });
    render();
    return;
  }
  if (action.kind === "figure") {
    const fig = SCREEN[from].figures[action.arg];
    lineKey = fig.line;
    detailKey = fig.detail;
    arrivalKey = "";
    noteStep(action.id, from, from, { karmaBefore: karmaBefore });
    render();
    return;
  }
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
  if (action.action === 5 && sidpa()[1] === 6) {
    showScreen("liberation", "recognise");
    noteStep(action.id, from, "liberation", { karmaBefore: karmaBefore });
    return;
  }
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
    showScreen(direction === 0 ? "f1" : "wish", "auto");
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
  autoPrompt = false;
  autoKeepGoing = false;
  runComplete = false;
  runTruncated = false;
  stepTotal = 0;
  lives = [];
  life = { steps: [], karma: karma, stepCount: 0 };
  lifeTotals = freshTotals();
  window.__autoLives = 0;
  applyDiary();
  if (screenId === "opening" || screenId === "clock") showScreen(direction === 0 ? "f1" : "wish", "auto");
  seenScreens[screenId] = true;
  publishCoverage();
  if (!autoKeepGoing && coverageComplete()) {
    showAutoCover();
    showFinishPrompt();
    document.getElementById("auto").textContent = t("stop");
    document.getElementById("auto").setAttribute("aria-pressed", "true");
    return;
  }
  showAutoCover();
  render();
  requestAnimationFrame(autoFrameStep);
}

function requestStop() {
  if (!autoRunning && !autoPrompt) return;
  autoStopRequested = true;
  autoPrompt = false;
  finishAuto();
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
    screen: codeOf(screenId),
    screenKey: screenId,
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
  await loadIconography();
  loadDiary();
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
  if (viewMode !== "opening") screenId = "clock";
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
  screenId = "clock";
  milli = ada.exports.bardo_milli_of_day(Number(event.target.value));
  if (viewMode === "opening") viewMode = "tour";
  cardsKey = "";
  render();
});
document.getElementById("go").addEventListener("click", function () {
  if (viewMode === "opening") showScreen(direction === 0 ? "f1" : firstId(), "enter");
});
document.getElementById("dissolve-range").addEventListener("input", function (event) {
  applyDissolve(Number(event.target.value));
  render();
});
document.getElementById("dissolve-range").addEventListener("pointerdown", function () {
  lineKey = "tapSlider";
  detailKey = "detailSlider";
  arrivalKey = "";
  render();
});
document.getElementById("dissolve-label").addEventListener("click", function () {
  lineKey = "tapSlider";
  detailKey = "detailSlider";
  arrivalKey = "";
  render();
});
document.getElementById("follow").addEventListener("click", function () { choose(true); });
document.getElementById("dont").addEventListener("click", function () { choose(false); });
document.getElementById("again").addEventListener("click", function () { beginAgain(); });
document.getElementById("coda").addEventListener("click", function () { showScreen("coda", "coda"); });
document.getElementById("auto").addEventListener("click", function () {
  if (autoRunning || autoPrompt) requestStop();
  else startAuto();
});
document.getElementById("auto-end").addEventListener("click", function () {
  requestStop();
});
document.getElementById("auto-keep").addEventListener("click", function () {
  if (!autoRunning) return;
  autoKeepGoing = true;
  autoPrompt = false;
  document.getElementById("auto-ask").hidden = true;
  document.getElementById("auto-run").hidden = false;
  requestAnimationFrame(autoFrameStep);
});
document.getElementById("diary-clear").addEventListener("click", clearDiary);
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
