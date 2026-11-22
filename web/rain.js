// Evolved from interactive-formulas rain.js (v0.11).
// Pitch 14, glyph 13, gap 14, head #d9ffc3, trail #83c79d, 60 ms frames.
// Columns spell whole grapheme clusters. A lone virama is never drawn.
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
        mantra: mantra,
        glyphs: fillGlyphs(mantra, trail)
      });
    }
  }

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeColumns();
    draw(false);
  }

  function draw(move) {
    const scale = opts.scales();
    const speedScale = scale.speed / 1000;
    const alphaScale = scale.alpha / 1000;
    const stride = scale.stride;
    ctx.clearRect(0, 0, width, height);
    ctx.font = RAIN.fontSize + 'px "Rain Devanagari", serif';
    ctx.textAlign = "center";
    const trail = trailLength(height);
    for (let c = 0; c < columns.length; c++) {
      const column = columns[c];
      if (move) {
        column.y += column.speed * 3.2 * speedScale;
        if (column.y - column.glyphs.length * RAIN.glyphGap > height) {
          column.y = -RAIN.glyphGap;
          column.mantra = (column.mantra % 3) + 1;
          column.glyphs = fillGlyphs(column.mantra, trail);
        }
      }
      if (c % stride !== 0) continue;
      for (let i = 0; i < column.glyphs.length; i++) {
        const base = Math.max(0.08, (1 - i / (column.glyphs.length + 1)) * 0.85);
        ctx.globalAlpha = Math.min(1, base * alphaScale);
        ctx.fillStyle = i === 0 ? RAIN.head : RAIN.body;
        ctx.fillText(column.glyphs[i], column.x, column.y - i * RAIN.glyphGap);
      }
    }
    ctx.globalAlpha = 1;
  }

  function refreshLabels() {
    const labels = opts.labels();
    button.textContent = paused ? labels.play : labels.pause;
    button.setAttribute("aria-pressed", String(paused));
  }

  function frame(time) {
    if (!paused && !document.hidden && time - last >= RAIN.frameMs) {
      draw(true);
      last = time;
      opts.onFrame();
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
    draw(false);
  });
  refreshLabels();
  requestAnimationFrame(frame);

  return {
    refreshLabels: refreshLabels,
    isPaused: function () { return paused; },
    prefersReduced: function () { return media.matches; }
  };
}
