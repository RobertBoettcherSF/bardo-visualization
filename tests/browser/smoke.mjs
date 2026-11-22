import { readFileSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
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
    const enterBox = await page.$eval("#enter", (el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    });
    const vh = await page.evaluate(() => innerHeight);
    assert(enterBox.top >= 0 && enterBox.bottom <= vh + 1, name + " enter below the fold " + enterBox.bottom + "/" + vh);
    const soundOff = await page.$eval("#sound", (el) => el.getAttribute("aria-pressed"));
    assert(soundOff === "false", name + " sound was on");
    await page.screenshot({ path: join(outDir, name + "-open.png"), fullPage: false });
    await page.click("#enter");
    const scene = await page.$eval("#state", (el) => el.dataset.scene);
    assert(scene === "1", name + " expected womb, got " + scene);
    const stageH = await page.$eval("#stage", (el) => el.getBoundingClientRect().height);
    assert(stageH > vh * 0.35, name + " stage short " + stageH);
    const barTop = await page.$eval("#bar", (el) => el.getBoundingClientRect().top);
    assert(barTop < vh, name + " bar off screen");
    await page.click("#next");
    const lights = await page.$eval("#state", (el) => el.dataset.scene);
    assert(lights === "2", name + " expected lights, got " + lights);
    await page.click("#cards button");
    const bright = await page.$eval("#state", (el) => el.dataset.brightest);
    assert(bright === "0", name + " brightest " + bright);
    await page.screenshot({ path: join(outDir, name + ".png"), fullPage: false });
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
    await page.click("#lang-de");
    const de = await page.$eval("h1", (el) => el.textContent);
    assert(de.includes("Bardo"), name + " german title " + de);
    const lang = await page.$eval("html", (el) => el.lang);
    assert(lang === "de", name + " lang " + lang);
    assert(logs.length === 0, name + " console " + logs.join(" | "));
    await page.close();
  }

  const reduced = await open(browser, 390, 844, true);
  const pressed = await reduced.page.$eval("#rain-toggle", (el) => el.getAttribute("aria-pressed"));
  assert(pressed === "true", "reduced motion did not start paused");
  assert(reduced.logs.length === 0, "reduced console " + reduced.logs.join(" | "));
  await reduced.page.close();

  const reportPage = await open(browser, 1280, 800, false);
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
  console.log("browser smoke ok", stamp);
} finally {
  await browser.close();
  server.close();
}
