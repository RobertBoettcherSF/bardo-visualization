import { readFileSync } from "node:fs";
import { mkdir, rm, copyFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const stamp = readFileSync(join(root, "version.txt"), "utf8").trim();
const outDir = "/tmp/bardo-smoke";
const chrome = process.env.CHROME || "/usr/bin/google-chrome";

function serve(dir) {
  const server = createServer((req, res) => {
    const path = new URL(req.url, "http://127.0.0.1").pathname.replace(/^\/+/, "");
    const file = join(dir, path || "index.html");
    if (path === "favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    try {
      const body = readFileSync(file);
      const type = file.endsWith(".woff2") ? "font/woff2"
        : file.endsWith(".txt") ? "text/plain" : "text/html";
      res.writeHead(200, { "content-type": type });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("missing");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function open(browser, width, height, reduced) {
  const page = await browser.newPage();
  const logs = [];
  page.on("pageerror", (err) => logs.push("pageerror " + err.message));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const where = msg.location() ? msg.location().url : "";
    if (where.includes("raw.githubusercontent.com")) return;
    logs.push("console " + msg.text() + " @ " + where);
  });
  page.on("request", (req) => {
    if (/\.(mp3|ogg|wav|m4a)(\?|$)/i.test(req.url())) logs.push("audio file " + req.url());
  });
  page.on("response", (res) => {
    if (res.status() < 400) return;
    if (res.url().endsWith("/favicon.ico")) return;
    if (res.url().includes("raw.githubusercontent.com")) return;
    logs.push("http " + res.status() + " " + res.url());
  });
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const client = await page.createCDPSession();
  await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: outDir });
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
    await page.goto("http://127.0.0.1:" + port + "/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__bardoReady === true, { timeout: 15000 });
  return { page, logs };
}

async function readReport(name) {
  const file = join(outDir, name);
  for (let i = 0; i < 50; i++) {
    try {
      return JSON.parse(readFileSync(file, "utf8"));
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("missing " + name);
}

const server = await serve(root);
const port = server.address().port;
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"]
});

try {
  for (const [name, width, height] of [["phone", 390, 844], ["narrow", 320, 568], ["desktop", 1366, 768], ["wide", 1920, 1080]]) {
    const { page, logs } = await open(browser, width, height, false);
    const shown = await page.$eval("#stamp", (el) => el.textContent.trim());
    assert(shown === stamp, name + " stamp " + shown);
    const box = await page.$eval("#stamp", (el) => {
      const style = getComputedStyle(el);
      return { bg: style.backgroundColor, pe: style.pointerEvents };
    });
    assert(box.bg === "rgb(245, 230, 66)", name + " stamp colour " + box.bg);
    assert(box.pe === "none", name + " stamp is interactive");
    const state = await page.$eval("#state", (el) => ({ ...el.dataset }));
    assert(state.day === "49", name + " did not start at day 49");
    assert(state.phase.includes("Sidpa"), name + " phase " + state.phase);
    assert(state.clarity === "0", name + " clarity " + state.clarity);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, name + " overflow " + overflow);
    const vh = await page.evaluate(() => innerHeight);
    async function onScreen(sel) {
      return page.$eval(sel, (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2 && r.top < innerHeight && r.bottom > 0;
      });
    }
    assert(await onScreen("#enter"), name + " info line missing");
    assert(await onScreen("#go"), name + " enter missing");
    const edge = await page.evaluate(() => {
      const c = document.getElementById("viz");
      const px = c.getContext("2d").getImageData(c.width - 2, Math.floor(c.height / 2), 1, 1).data;
      const stage = window.__stage;
      return { g: px[1], a: px[3], x: stage.x, w: stage.w, h: stage.h };
    });
    assert(edge.g < 40 && edge.a < 20, name + " edge pixel " + edge.g + "/" + edge.a);
    assert(Math.abs(edge.w / edge.h - 0.75) < 0.04, name + " aspect " + (edge.w / edge.h));
    if (width >= 1366) assert(edge.x > 80, name + " stage not letterboxed " + edge.x);
    await page.evaluate(() => {
      const b = document.getElementById("reload");
      const hide = () => { if (!b.hidden) b.hidden = true; };
      hide();
      new MutationObserver(hide).observe(b, { attributes: true, attributeFilter: ["hidden"] });
    });
    const shot = async (label) => {
      if (width !== 390 && width !== 1366) return;
      await page.evaluate(() => { const b = document.getElementById("reload"); if (b) b.hidden = true; });
      await page.screenshot({ path: join(outDir, label + "-" + width + ".png"), fullPage: false });
    };
    await shot("opening");
    assert(await onScreen("#menu"), name + " menu missing");
    assert(await onScreen("#prev") && await onScreen("#start") && await onScreen("#auto") && await onScreen("#next"), name + " nav missing");
    assert(await onScreen("#viz"), name + " drawing missing");
    assert(!(await onScreen("#sound")), name + " sound leaked onto the scene");
    assert(!(await onScreen("#day")), name + " scrubber leaked onto the scene");
    assert(!(await onScreen("#debug")), name + " debug leaked onto the scene");
    assert(!(await onScreen("#dir-jung")), name + " direction leaked onto the scene");
    const rainDim = await page.$eval("#rain", (el) => getComputedStyle(el).opacity);
    assert(Number(rainDim) <= 0.35, name + " rain not dimmed " + rainDim);
    await page.click("#menu");
    assert(await page.$("#lang-de") === null, name + " language switch still present");
    const title = await page.$eval("#enter", (el) => el.textContent);
    assert(title.includes("Bardo"), name + " title " + title);
    const lang = await page.$eval("html", (el) => el.lang);
    assert(lang === "en-GB", name + " lang " + lang);
    await page.click("#menu");
    await page.click("#next");
    let scene = await page.$eval("#state", (el) => el.dataset.scene);
    assert(scene === "1", name + " expected womb, got " + scene);
    const screen = await page.$eval("#state", (el) => el.dataset.screen);
    assert(screen === "womb", name + " screen " + screen);
    assert(await onScreen("#follow") && await onScreen("#dont"), name + " choices missing");
    const regions = await page.evaluate(() => window.__regions.map((r) => r.action));
    assert(regions.includes(1) && !regions.includes(4), name + " lights leaked into the womb " + regions.join(","));
    await shot("sidpa-womb");
    const petal = await page.evaluate(() => window.__regions.find((r) => r.action === 1 && r.arg === 1));
    await page.mouse.click(petal.clientX, petal.clientY);
    const explained = await page.$eval("#enter", (el) => el.textContent);
    assert(/resolve/i.test(explained), name + " petal explain " + explained);
    const heldMethods = await page.$eval("#state", (el) => el.dataset.methods);
    assert(heldMethods === "0", name + " first tap closed a petal " + heldMethods);
    await page.mouse.click(petal.clientX, petal.clientY);
    const methods = await page.$eval("#state", (el) => el.dataset.methods);
    assert(methods === "1", name + " petal did not close " + methods);
    await page.click("#next");
    scene = await page.$eval("#state", (el) => el.dataset.scene);
    assert(scene === "2", name + " expected lights, got " + scene);
    const light = await page.evaluate(() => window.__regions.find((r) => r.action === 4 && r.arg === 0));
    await page.mouse.click(light.clientX, light.clientY);
    const lightLine = await page.$eval("#enter", (el) => el.textContent);
    assert(/white|gods/i.test(lightLine), name + " light explain " + lightLine);
    const brightHeld = await page.$eval("#state", (el) => el.dataset.brightest);
    assert(brightHeld === "-1", name + " first tap chose a light " + brightHeld);
    await page.mouse.click(light.clientX, light.clientY);
    const bright = await page.$eval("#state", (el) => el.dataset.brightest);
    assert(bright === "0", name + " brightest " + bright);
    await shot("sidpa-lights");
    await page.click("#next");
    scene = await page.$eval("#state", (el) => el.dataset.scene);
    assert(scene === "3", name + " expected judgement, got " + scene);
    await shot("sidpa-judgement");
    await page.click("#next");
    scene = await page.$eval("#state", (el) => el.dataset.scene);
    assert(scene === "4", name + " expected wish-body, got " + scene);
    await shot("sidpa-wish");
    await page.click("#menu");
    await page.$eval("#day", (el) => {
      el.value = "0";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const atStart = await page.$eval("#state", (el) => ({ ...el.dataset }));
    assert(atStart.day === "0", name + " day 0");
    assert(atStart.clarity === "1000", name + " clarity at 0 is " + atStart.clarity);
    assert(atStart.phase.includes("Clear Light"), name + " phase " + atStart.phase);
    await page.click("#dir-book");
    const book = await page.$eval("#state", (el) => el.dataset.day);
    assert(book === "0", name + " book order day " + book);
    await page.click("#dir-jung");
    const jung = await page.$eval("#state", (el) => el.dataset.day);
    assert(jung === "49", name + " jung day " + jung);
    await page.click("#sound");
    const soundOn = await page.$eval("#sound", (el) => el.getAttribute("aria-pressed"));
    assert(soundOn === "true", name + " sound did not switch on");
    await page.click("#rain-toggle");
    const paused = await page.$eval("#rain-toggle", (el) => el.getAttribute("aria-pressed"));
    assert(paused === "true", name + " pause");
    const debugBg = await page.$eval("#debug", (el) => getComputedStyle(el).backgroundColor);
    assert(debugBg === "rgb(198, 40, 40)", name + " debug colour " + debugBg);
    if (width === 390 || width === 1366) {
      const menuOpen = await page.$eval("#menu-panel", (el) => !el.hidden);
      if (menuOpen) await page.click("#menu");
      await page.click("#start");
      let now = await page.$eval("#state", (el) => el.dataset.screen);
      assert(now === "womb", name + " start screen " + now);
      await shot("choice");
      await page.click("#next");
      const sector = await page.evaluate(() => window.__regions.find((r) => r.action === 4 && r.arg === 0));
      await page.mouse.click(sector.clientX, sector.clientY);
      const wheelLine = await page.$eval("#enter", (el) => el.textContent);
      assert(/white|gods/i.test(wheelLine), name + " wheel line " + wheelLine);
      await shot("explain");
      await page.click("#enter");
      const panel = await page.evaluate(() => {
        const more = document.getElementById("more").getBoundingClientRect();
        const choices = document.getElementById("choices").getBoundingClientRect();
        const info = getComputedStyle(document.getElementById("enter"));
        const overlap = more.bottom > choices.top + 1 && more.top < choices.bottom - 1;
        return {
          hidden: document.getElementById("more").hidden,
          overlap: overlap,
          userSelect: info.userSelect,
          color: info.color
        };
      });
      assert(panel.hidden === false, name + " detail stayed closed");
      assert(!panel.overlap, name + " detail covers the choices");
      assert(panel.userSelect === "none", name + " info selects " + panel.userSelect);
      assert(panel.color === "rgb(247, 244, 234)", name + " info colour " + panel.color);
      await shot("detail");
      await page.click("#enter");
      await page.click("#next");
      await page.click("#dont");
      now = await page.$eval("#state", (el) => el.dataset.screen);
      assert(now === "lights", name + " dont from judge " + now);
      const arrived = await page.$eval("#enter", (el) => el.textContent);
      assert(/mirror/i.test(arrived) && /birth/i.test(arrived), name + " arrival " + arrived);
      await shot("arrive");
      await page.click("#start");
      await page.click("#follow");
      now = await page.$eval("#state", (el) => el.dataset.screen);
      assert(now === "good", name + " follow screen " + now);
      const goodLine = await page.$eval("#enter", (el) => el.textContent);
      assert(/closed|precious/i.test(goodLine), name + " good line " + goodLine);
      assert(await onScreen("#again"), name + " begin again missing");
      await shot("good");
      await page.click("#start");
      await page.click("#dont");
      now = await page.$eval("#state", (el) => el.dataset.screen);
      assert(now === "human", name + " rebirth " + now);
      const line = await page.$eval("#quote", (el) => el.textContent);
      assert(line.toLowerCase().includes("yellow"), name + " realm line " + line);
      await shot("rebirth");
      await page.click("#menu");
      if (await page.$eval("#sound", (el) => el.getAttribute("aria-pressed")) === "true") await page.click("#sound");
      if (await page.$eval("#rain-toggle", (el) => el.getAttribute("aria-pressed")) === "true") await page.click("#rain-toggle");
      assert(await onScreen("#note"), name + " note box missing");
      await shot("menu-note");
      await page.click("#menu");
    }
    if (width === 390 || width === 1366) {
      await mkdir("/opt/cursor/artifacts", { recursive: true });
      await rm(join(outDir, "bardo-report.json"), { force: true });
      await rm(join(outDir, "bardo-run.json"), { force: true });
      await page.evaluate(() => { window.__autoPace = 40; });
      await page.click("#start");
      await page.click("#auto");
      const stopLabel = await page.$eval("#auto", (el) => el.textContent.trim());
      assert(stopLabel === "Stop", name + " auto label " + stopLabel);
      await shot("auto");
      await page.click("#viz");
      await page.keyboard.press("F9");
      await page.waitForFunction(() => window.__autoLives >= 3, { timeout: 20000 });
      const still = await page.$eval("#auto", (el) => el.textContent.trim());
      assert(still === "Stop", name + " F9 stopped auto");
      await page.click("#auto");
      const run = await readReport("bardo-run.json");
      assert(run.schema === "bardo-run", name + " run schema");
      assert(run.totals.lives >= 3, name + " lives " + run.totals.lives);
      assert(Array.isArray(run.lives) && run.lives.length >= 3, name + " life list");
      assert(run.totals.good + Object.values(run.totals.rebirths).reduce((a, b) => a + b, 0) >= 3, name + " endings");
      assert(Array.isArray(run.unreached.screens) && Array.isArray(run.unreached.links), name + " unreached");
      assert(run.deadEnds && run.deadEnds[0].onward === "chonyid", name + " dead end");
      await copyFile(join(outDir, "bardo-run.json"), join("/opt/cursor/artifacts", "bardo-run.json"));
    }
    assert(logs.length === 0, name + " console " + logs.join(" | "));
    await page.close();
  }

  const reduced = await open(browser, 390, 844, true);
  await reduced.page.click("#menu");
  const pressed = await reduced.page.$eval("#rain-toggle", (el) => el.getAttribute("aria-pressed"));
  assert(pressed === "true", "reduced motion did not start paused");
  assert(reduced.logs.length === 0, "reduced console " + reduced.logs.join(" | "));
  await reduced.page.close();

  await rm(join(outDir, "bardo-report.json"), { force: true });
  const reportPage = await open(browser, 1280, 800, false);
  await reportPage.page.click("#next");
  await reportPage.page.click("#follow");
  await reportPage.page.click("#menu");
  await reportPage.page.type("#note", "expected the Sidpa end");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await reportPage.page.click("#debug");
  const report = await readReport("bardo-report.json");
  assert(report.stamp === stamp, "report stamp");
  assert(report.note === "expected the Sidpa end", "report note");
  assert(report.screen === "good", "report screen " + report.screen);
  assert(Array.isArray(report.path) && report.path.some((step) => step.screen === "good" && step.button === "follow"), "report path");
  assert(report.viewport && report.viewport.width === 1280 && report.viewport.height === 800, "report viewport");
  assert(typeof report.devicePixelRatio === "number", "report dpr");
  assert(typeof report.userAgent === "string" && report.userAgent.length > 8, "report agent");
  assert(typeof report.fps === "number" && report.fps >= 30, "report fps " + report.fps);
  assert(Array.isArray(report.errors), "report errors");
  assert(report.crash && report.crash.afterReload === false, "report crash");
  await rm(join(outDir, "bardo-report.json"), { force: true });
  await reportPage.page.keyboard.press("F9");
  const f9 = await readReport("bardo-report.json");
  assert(f9.stamp === stamp, "F9 stamp");
  assert(reportPage.logs.length === 0, "report console");
  await reportPage.page.close();
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  for (const name of ["explain-390.png", "explain-1366.png", "detail-390.png", "detail-1366.png", "auto-390.png", "auto-1366.png", "arrive-390.png", "arrive-1366.png"]) {
    await copyFile(join(outDir, name), join("/opt/cursor/artifacts", name));
  }
  console.log("browser smoke ok", stamp);
} finally {
  await browser.close();
  server.close();
}
