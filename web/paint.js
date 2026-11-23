// Painted scenes. Everything is drawn in code inside a centred 3:4 stage
// so a wide window letterboxes instead of stretching strokes to the edges.
let regions = [];
let originX = 0;
let originY = 0;
let bg = null;
let bgKey = "";

function stageBox(width, height, opening) {
  const bar = 72;
  const caption = opening ? 108 : 56;
  const top = 40;
  const availW = Math.max(40, width - 16);
  const availH = Math.max(40, height - bar - caption - top);
  const aspect = 3 / 4;
  let w = availW;
  let h = w / aspect;
  if (h > availH) {
    h = availH;
    w = h * aspect;
  }
  return {
    x: (width - w) / 2,
    y: top + Math.max(0, (availH - h) / 2),
    w: w,
    h: h
  };
}

function addDisc(action, arg, x, y, r) {
  regions.push({ kind: "disc", action: action, arg: arg, x: originX + x, y: originY + y, r: r });
}

function ridge(ctx, pts, colour) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
}

function cloud(ctx, x, y, r) {
  ctx.fillStyle = "rgba(244, 240, 228, 0.9)";
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
  ctx.ellipse(x - r * 0.45, y + r * 0.08, r * 0.55, r * 0.32, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.4, y + r * 0.06, r * 0.5, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function waterfall(ctx, x, y, len) {
  const w = Math.max(10, len * 0.09);
  ctx.fillStyle = "rgba(236, 242, 236, 0.9)";
  ctx.fillRect(x, y, w, len);
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fillRect(x + w * 0.35, y, w * 0.25, len);
}

function drawLandscape(ctx, w, h, nearer) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#efe2c4");
  sky.addColorStop(0.42, "#d5dcc8");
  sky.addColorStop(1, "#7f917f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  cloud(ctx, w * 0.22, h * 0.14, w * 0.16);
  cloud(ctx, w * 0.7, h * 0.11, w * 0.14);
  ridge(ctx, [
    [0, h * 0.46], [w * 0.1, h * 0.3], [w * 0.2, h * 0.48],
    [w * 0.3, h * 0.34], [w * 0.38, h * 0.52], [w * 0.2, h], [0, h]
  ], "#8ea090");
  ridge(ctx, [
    [w, h * 0.44], [w * 0.88, h * 0.28], [w * 0.76, h * 0.5],
    [w * 0.64, h * 0.33], [w * 0.56, h * 0.54], [w * 0.76, h], [w, h]
  ], "#6e7f72");
  waterfall(ctx, w * 0.14, h * 0.38, h * 0.2);
  waterfall(ctx, w * 0.84, h * 0.36, h * 0.18);
  if (nearer) {
    ridge(ctx, [
      [0, h * 0.7], [w * 0.14, h * 0.56], [w * 0.26, h * 0.72], [w * 0.12, h], [0, h]
    ], "#3f5348");
    ridge(ctx, [
      [w, h * 0.68], [w * 0.84, h * 0.54], [w * 0.7, h * 0.7], [w * 0.86, h], [w, h]
    ], "#31443c");
  }
  ctx.fillStyle = "#c9d2c4";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.8, w * 0.2, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBuddha(ctx, cx, cy, s) {
  ctx.fillStyle = "#c47a8a";
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.4, s * 0.5, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e7b4c0";
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.28, cy + s * 0.38, s * 0.18, s * 0.07, -0.5, 0, Math.PI * 2);
  ctx.ellipse(cx + s * 0.28, cy + s * 0.38, s * 0.18, s * 0.07, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e0c36a";
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.28, s * 0.32, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a33b32";
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.32, cy + s * 0.24);
  ctx.lineTo(cx + s * 0.32, cy + s * 0.24);
  ctx.lineTo(cx + s * 0.18, cy - s * 0.02);
  ctx.lineTo(cx - s * 0.18, cy - s * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.18, cy);
  ctx.quadraticCurveTo(cx - s * 0.24, cy - s * 0.24, cx - s * 0.1, cy - s * 0.34);
  ctx.lineTo(cx + s * 0.1, cy - s * 0.34);
  ctx.quadraticCurveTo(cx + s * 0.24, cy - s * 0.24, cx + s * 0.18, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e0c36a";
  ctx.fillRect(cx - s * 0.12, cy - s * 0.18, s * 0.24, s * 0.055);
  ctx.fillStyle = "#e6c48a";
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.15, cy - s * 0.46, s * 0.035, s * 0.07, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + s * 0.15, cy - s * 0.46, s * 0.035, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.48, s * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.6, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a6238";
  ctx.fillRect(cx - s * 0.055, cy - s * 0.51, s * 0.028, s * 0.012);
  ctx.fillRect(cx + s * 0.027, cy - s * 0.51, s * 0.028, s * 0.012);
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.04, s * 0.09, s * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHalo(ctx, cx, cy, r, time) {
  const colours = ["#a33b32", "#c47a3a", "#e0c36a", "#6e8f62", "#6a7f92"];
  const shimmer = 0.45 + 0.2 * Math.sin(time / 650);
  const glow = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
  glow.addColorStop(0, "rgba(224, 195, 106, " + (0.35 + 0.1 * Math.sin(time / 500)) + ")");
  glow.addColorStop(1, "rgba(224, 195, 106, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  colours.forEach(function (colour, i) {
    ctx.beginPath();
    ctx.strokeStyle = colour;
    ctx.globalAlpha = shimmer;
    ctx.lineWidth = Math.max(3, r * 0.04);
    ctx.arc(cx, cy, r * (0.62 + i * 0.07), Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function paintStatic(ctx, w, h, kind) {
  if (kind === "open") {
    drawLandscape(ctx, w, h, true);
    return;
  }
  if (kind === "mist") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#d9d3c4");
    g.addColorStop(1, "#8a8d86");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    cloud(ctx, w * 0.3, h * 0.16, w * 0.18);
    cloud(ctx, w * 0.72, h * 0.2, w * 0.12);
    return;
  }
  drawLandscape(ctx, w, h, false);
}

function drawPetals(ctx, cx, cy, radius, done, time) {
  const next = done < 5 ? done : -1;
  for (let i = 0; i < 5; i++) {
    const sway = Math.sin(time / 800 + i) * 1.5;
    const angle = -Math.PI / 2 + i * (Math.PI * 2 / 5);
    const px = cx + Math.cos(angle) * radius * 0.58 + sway;
    const py = cy + Math.sin(angle) * radius * 0.58;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.36, radius * 0.18, 0, 0, Math.PI * 2);
    ctx.closePath();
    if (i < done) ctx.fillStyle = "#3f6b48";
    else if (i === next) ctx.fillStyle = "#e0c36a";
    else ctx.fillStyle = "#c47a8a";
    ctx.fill();
    ctx.restore();
    addDisc(1, i + 1, px, py, Math.max(28, radius * 0.22));
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 16 + done * 6, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = done >= 5 ? "#f7f4ea" : "#e0c36a";
  ctx.fill();
}

function drawPlaces(ctx, cx, cy, radius) {
  const places = [
    [0, 3, 0, "#7f91a3"],
    [Math.PI / 2, 3, 1, "#c4a24a"],
    [Math.PI, 3, 2, "#a33b32"],
    [-Math.PI / 2, 3, 3, "#3f5348"],
    [Math.PI * 0.75, 2, 0, "#8e3a3a"],
    [Math.PI * 1.2, 2, 1, "#e0c36a"]
  ];
  places.forEach(function (place) {
    const dist = place[1] === 2 ? radius * 0.92 : radius * 1.18;
    const x = cx + Math.cos(place[0]) * dist;
    const y = cy + Math.sin(place[0]) * dist;
    ctx.fillStyle = place[3];
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    addDisc(place[1], place[2], x, y, 26);
  });
}

function drawWheel(ctx, cx, cy, radius, bright) {
  const colours = ["#c9c3b5", "#4a5e48", "#a89a55", "#3a4a62", "#7a4548", "#5c5550"];
  for (let i = 0; i < 6; i++) {
    const a0 = -Math.PI / 2 + i * Math.PI / 3;
    const a1 = a0 + Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.closePath();
    ctx.fillStyle = colours[i];
    ctx.globalAlpha = bright === i ? 1 : 0.72;
    ctx.fill();
    ctx.globalAlpha = 1;
    if (bright === i) {
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#e0c36a";
      ctx.stroke();
    }
    const mid = (a0 + a1) / 2;
    regions.push({
      kind: "sector", action: 4, arg: i,
      cx: originX + cx, cy: originY + cy, radius: radius, a0: a0, a1: a1,
      hitX: originX + cx + Math.cos(mid) * radius * 0.62,
      hitY: originY + cy + Math.sin(mid) * radius * 0.62
    });
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#1c1c1c";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = "#e0c36a";
  ctx.fill();
}

function drawMirror(ctx, w, h) {
  const cx = w / 2;
  const cy = h * 0.46;
  const rx = w * 0.28;
  const ry = h * 0.24;
  ctx.fillStyle = "#e0c36a";
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 8, ry + 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7f4ea";
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  addDisc(5, 0, cx, cy, Math.min(rx, ry) * 0.85);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(cx - rx - 22, cy - 24 + i * 14, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#f4f1e6";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + rx + 22, cy - 24 + i * 14, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#1c1c1c";
    ctx.fill();
  }
  const py = cy + ry + 28;
  ctx.strokeStyle = "#5c5550";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, py, 12, 0, Math.PI * 2);
  ctx.stroke();
  addDisc(6, 0, cx, py, 22);
}

function drawWishBody(ctx, w, h, model) {
  const colours = ["#f4f1e6", "#1c1c1c", "#a33b32"];
  const yA = h * 0.72;
  colours.forEach(function (colour, i) {
    const ax = w * (0.22 + i * 0.28);
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(ax, yA, 18, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    addDisc(7, i, ax, yA, 26);
  });
  const x = (model.x / 1000) * w;
  const y = (model.y / 1000) * (h * 0.45) + h * 0.12;
  const glow = ctx.createRadialGradient(x, y, 4, x, y, 36);
  glow.addColorStop(0, "rgba(244, 241, 230, 0.95)");
  glow.addColorStop(1, "rgba(244, 241, 230, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7f4ea";
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
}

function ensureBg(kind, box, dpr) {
  const paintKind = kind === "4" ? "mist" : kind === "open" ? "open" : "land";
  const key = paintKind + ":" + Math.round(box.w) + "x" + Math.round(box.h);
  const pw = Math.max(1, Math.round(box.w * dpr));
  const ph = Math.max(1, Math.round(box.h * dpr));
  if (!bg) bg = document.createElement("canvas");
  if (bgKey !== key || bg.width !== pw || bg.height !== ph) {
    bg.width = pw;
    bg.height = ph;
    const c = bg.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintStatic(c, box.w, box.h, paintKind);
    bgKey = key;
  }
  return bg;
}

function paintAll(time, model) {
  const canvas = document.getElementById("viz");
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pw = Math.max(1, Math.round(width * dpr));
  const ph = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
    bgKey = "";
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const box = stageBox(width, height, model.opening);
  window.__stage = box;
  const kind = model.opening ? "open" : String(model.scene);
  const layer = ensureBg(kind, box, dpr);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.drawImage(layer, box.x, box.y, box.w, box.h);
  ctx.translate(box.x, box.y);
  regions = [];
  originX = box.x;
  originY = box.y;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t = reduced ? 0 : time;
  if (model.opening || model.scene === 0 && model.opening) {
    const cx = box.w / 2;
    const cy = box.h * 0.52;
    const r = Math.min(box.w, box.h) * 0.42;
    drawHalo(ctx, cx, cy - box.h * 0.04, r, t);
    drawBuddha(ctx, cx, cy, Math.min(box.w, box.h) * 0.46);
  } else if (model.scene === 0) {
    paintAxesLocal(ctx, box.w, box.h, model);
  } else if (model.scene === 1) {
    const radius = Math.min(box.w, box.h) * 0.3;
    drawPlaces(ctx, box.w / 2, box.h * 0.48, radius);
    drawPetals(ctx, box.w / 2, box.h * 0.48, radius, model.methods, t);
  } else if (model.scene === 2) {
    drawWheel(ctx, box.w / 2, box.h * 0.46, Math.min(box.w, box.h) * 0.34, model.bright);
  } else if (model.scene === 3) {
    drawMirror(ctx, box.w, box.h);
  } else if (model.scene === 4) {
    drawWishBody(ctx, box.w, box.h, model);
  }
  ctx.restore();
  const rect = canvas.getBoundingClientRect();
  window.__regions = regions.map(function (region) {
    const x = region.kind === "disc" ? region.x : region.hitX;
    const y = region.kind === "disc" ? region.y : region.hitY;
    return { action: region.action, arg: region.arg, clientX: rect.left + x, clientY: rect.top + y };
  });
}

function paintAxesLocal(ctx, w, h, model) {
  const left = w * 0.12;
  const top = h * 0.16;
  const plotW = w * 0.76;
  const plotH = h * 0.62;
  ctx.strokeStyle = "#3f5348";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, top + plotH);
  ctx.lineTo(left + plotW, top + plotH);
  ctx.stroke();
  function line(series, colour) {
    ctx.beginPath();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 3;
    for (let d = 0; d <= 49; d++) {
      const x = left + (d / 49) * plotW;
      const y = top + plotH - ((series[d] || 0) / 1000) * plotH;
      if (d === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  line(model.curves.clarity, "#6e8f62");
  line(model.curves.intensity, "#c47a3a");
  line(model.curves.complexity, "#6a7f92");
}

function hitContains(region, x, y) {
  if (region.kind === "disc") {
    const dx = x - region.x;
    const dy = y - region.y;
    return dx * dx + dy * dy <= region.r * region.r;
  }
  const dx = x - region.cx;
  const dy = y - region.cy;
  const dist = Math.hypot(dx, dy);
  if (dist > region.radius || dist < region.radius * 0.18) return false;
  let ang = Math.atan2(dy, dx);
  const start = region.a0;
  while (ang < start) ang += Math.PI * 2;
  while (ang >= start + Math.PI * 2) ang -= Math.PI * 2;
  return ang >= start && ang <= region.a1;
}
