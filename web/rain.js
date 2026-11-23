// Evolved from interactive-formulas rain.js (v0.11).
// Pitch 14, glyph 13, gap 14, head #d9ffc3, trail #83c79d.
// frameMs is the motion timebase (how far a column used to move per 60 ms
// tick), not a frame cap. Columns spell whole grapheme clusters.
// Each mantra is drawn once into a strip and blitted, so a wide window
// does not call fillText for every glyph on every frame.
const RAIN = {
  columnPitch: 14,
  fontSize: 13,
  glyphGap: 14,
  minTrail: 36,
  head: "#d9ffc3",
  body: "#83c79d",
  frameMs: 60
};

function startRain(opts) {
  const canvas = opts.canvas;
  const button = opts.button;
  const ctx = canvas.getContext("2d");
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = media.matches;
  let width = 0;
  let height = 0;
  let columns = [];
  let last = 0;
  let strips = {};
  let rainDpr = 1;

  function trailLength(h) {
    return Math.max(RAIN.minTrail, Math.ceil(h / RAIN.glyphGap));
  }

  function fillGlyphs(mantra, trail) {
    const seq = opts.sequences[mantra];
    const glyphs = new Array(trail);
    for (let i = 0; i < trail; i++) {
      const fromTop = trail - 1 - i;
      glyphs[i] = seq[fromTop % seq.length];
    }
    return glyphs;
  }

  function strip(mantra, trail, alphaScale) {
    const key = mantra + ":" + trail + ":" + alphaScale + ":" + rainDpr;
    if (strips[key]) return strips[key];
    const glyphs = fillGlyphs(mantra, trail);
    const w = RAIN.columnPitch;
    const h = trail * RAIN.glyphGap + RAIN.fontSize;
    const image = document.createElement("canvas");
    image.width = Math.max(1, Math.round(w * rainDpr));
    image.height = Math.max(1, Math.round(h * rainDpr));
    const pen = image.getContext("2d");
    pen.setTransform(rainDpr, 0, 0, rainDpr, 0, 0);
    pen.font = RAIN.fontSize + 'px "Rain Devanagari", serif';
    pen.textAlign = "center";
    for (let i = 0; i < glyphs.length; i++) {
      const base = Math.max(0.08, (1 - i / (glyphs.length + 1)) * 0.85);
      pen.globalAlpha = Math.min(1, base * alphaScale);
      pen.fillStyle = i === 0 ? RAIN.head : RAIN.body;
      pen.fillText(glyphs[i], w / 2, trail * RAIN.glyphGap - i * RAIN.glyphGap);
    }
    strips[key] = image;
    return image;
  }

  function makeColumns() {
    const count = Math.max(0, Math.ceil(width / RAIN.columnPitch));
    const trail = trailLength(height);
    columns = [];
    for (let i = 0; i < count; i++) {
      const mantra = (i % 3) + 1;
      columns.push({
        x: i * RAIN.columnPitch + RAIN.columnPitch / 2,
        y: Math.random() * (height + trail * RAIN.glyphGap) - trail * RAIN.glyphGap,
        speed: 0.7 + Math.random() * 1.6,
        mantra: mantra
      });
    }
  }

  function resize() {
    width = innerWidth;
    height = innerHeight;
    rainDpr = 1;
    strips = {};
    canvas.width = Math.round(width * rainDpr);
    canvas.height = Math.round(height * rainDpr);
    ctx.setTransform(rainDpr, 0, 0, rainDpr, 0, 0);
    makeColumns();
    draw(RAIN.frameMs);
  }

  function draw(dt) {
    const scale = opts.scales();
    const speedScale = scale.speed / 1000;
    const alphaScale = scale.alpha / 1000;
    const stride = scale.stride || 1;
    const step = dt / RAIN.frameMs;
    ctx.clearRect(0, 0, width, height);
    const trail = trailLength(height);
    const stripH = trail * RAIN.glyphGap + RAIN.fontSize;
    for (let c = 0; c < columns.length; c++) {
      const column = columns[c];
      column.y += column.speed * 3.2 * speedScale * step;
      if (column.y - trail * RAIN.glyphGap > height) {
        column.y = -RAIN.glyphGap;
        column.mantra = (column.mantra % 3) + 1;
      }
      if (c % stride !== 0) continue;
      const image = strip(column.mantra, trail, alphaScale);
      ctx.drawImage(
        image,
        column.x - RAIN.columnPitch / 2,
        column.y - trail * RAIN.glyphGap,
        RAIN.columnPitch,
        stripH
      );
    }
  }

  function refreshLabels() {
    const labels = opts.labels();
    button.textContent = paused ? labels.play : labels.pause;
    button.setAttribute("aria-pressed", String(paused));
  }

  function frame(time) {
    if (!paused && !document.hidden) {
      const dt = last === 0 ? RAIN.frameMs : Math.min(48, time - last);
      last = time;
      draw(dt);
    }
    requestAnimationFrame(frame);
  }

  button.addEventListener("click", function () {
    paused = !paused;
    refreshLabels();
  });
  media.addEventListener("change", function (event) {
    paused = event.matches;
    refreshLabels();
  });
  addEventListener("resize", resize);
  resize();
  document.fonts.load(RAIN.fontSize + 'px "Rain Devanagari"').then(function () {
    strips = {};
    draw(0);
  });
  refreshLabels();
  requestAnimationFrame(frame);

  return {
    refreshLabels: refreshLabels,
    isPaused: function () { return paused; },
    prefersReduced: function () { return media.matches; }
  };
}
