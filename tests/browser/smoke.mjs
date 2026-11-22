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
  for (const [name, width, height] of [["desktop", 1280, 800], ["phone", 390, 844], ["narrow", 320, 700]]) {
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
    assert(await onScreen("#menu"), name + " menu missing");
    assert(await onScreen("#prev") && await onScreen("#start") && await onScreen("#next"), name + " nav missing");
    assert(await onScreen("#viz"), name + " drawing missing");
    assert(!(await onScreen("#sound")), name + " sound leaked onto the scene");
    assert(!(await onScreen("#day")), name + " scrubber leaked onto the scene");
    assert(!(await onScreen("#debug")), name + " debug leaked onto the scene");
    assert(!(await onScreen("#dir-jung")), name + " direction leaked onto the scene");
    const rainDim = await page.$eval("#rain", (el) => getComputedStyle(el).opacity);
    assert(Number(rainDim) <= 0.35, name + " rain not dimmed " + rainDim);
    await page.click("#menu");
    await page.click("#lang-de");
    const de = await page.$eval("#enter", (el) => el.textContent);
    assert(de.includes("Bardo"), name + " german title " + de);
    const lang = await page.$eval("html", (el) => el.lang);
    assert(lang === "de", name + " lang " + lang);
    await page.click("#lang-en");
    await page.click("#menu");
    await page.click("#next");
    let scene = await page.$eval("#state", (el) => el.dataset.scene);
    assert(scene === "1", name + " expected womb, got " + scene);
    const regions = await page.evaluate(() => window.__regions.map((r) => r.action));
    assert(regions.includes(1) && !regions.includes(4), name + " lights leaked into the womb " + regions.join(","));
    if (width === 390) await page.screenshot({ path: join(outDir, "sidpa-womb-390.png"), fullPage: false });
    const petal = await page.evaluate(() => window.__regions.find((r) => r.action === 1 && r.arg === 1));
    await page.mouse.click(petal.clientX, petal.clientY);
    const methods = await page.$eval("#state", (el) => el.dataset.methods);
    assert(methods === "1", name + " petal did not close " + methods);
    await page.click("#next");
    scene = await page.$eval("#state", (el) => el.dataset.scene);
    assert(scene === "2", name + " expected lights, got " + scene);
    const light = await page.evaluate(() => window.__regions.find((r) => r.action === 4 && r.arg === 0));
    await page.mouse.click(light.clientX, light.clientY);
    const bright = await page.$eval("#state", (el) => el.dataset.brightest);
    assert(bright === "0", name + " brightest " + bright);
    if (width === 390) await page.screenshot({ path: join(outDir, "sidpa-lights-390.png"), fullPage: false });
    await page.click("#next");
    scene = await page.$eval("#state", (el) => el.dataset.scene);
    assert(scene === "3", name + " expected judgement, got " + scene);
    if (width === 390) await page.screenshot({ path: join(outDir, "sidpa-judgement-390.png"), fullPage: false });
    await page.click("#next");
    scene = await page.$eval("#state", (el) => el.dataset.scene);
    assert(scene === "4", name + " expected wish-body, got " + scene);
    if (width === 390) await page.screenshot({ path: join(outDir, "sidpa-wish-390.png"), fullPage: false });
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
    assert(logs.length === 0, name + " console " + logs.join(" | "));
    await page.close();
  }

  const reduced = await open(browser, 390, 844, true);
  await reduced.page.click("#menu");
  const pressed = await reduced.page.$eval("#rain-toggle", (el) => el.getAttribute("aria-pressed"));
  assert(pressed === "true", "reduced motion did not start paused");
  assert(reduced.logs.length === 0, "reduced console " + reduced.logs.join(" | "));
  await reduced.page.close();

  const reportPage = await open(browser, 1280, 800, false);
  await reportPage.page.click("#menu");
  await reportPage.page.type("#note", "expected the Sidpa end");
  await reportPage.page.click("#debug");
  const report = await readReport("bardo-report.json");
  assert(report.stamp === stamp, "report stamp");
  assert(report.note === "expected the Sidpa end", "report note");
  assert(typeof report.fps === "number", "report fps");
  assert(Array.isArray(report.errors), "report errors");
  assert(report.crash && report.crash.afterReload === false, "report crash");
  await rm(join(outDir, "bardo-report.json"), { force: true });
  await reportPage.page.keyboard.press("F9");
  const f9 = await readReport("bardo-report.json");
  assert(f9.stamp === stamp, "F9 stamp");
  assert(reportPage.logs.length === 0, "report console");
  await reportPage.page.close();
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  for (const name of ["sidpa-womb-390.png", "sidpa-lights-390.png", "sidpa-judgement-390.png", "sidpa-wish-390.png"]) {
    await copyFile(join(outDir, name), join("/opt/cursor/artifacts", name));
  }
  console.log("browser smoke ok", stamp);
} finally {
  await browser.close();
  server.close();
}
