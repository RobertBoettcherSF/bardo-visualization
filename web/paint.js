// Painted scenes. Everything is drawn in code inside a centred 3:4 stage
// so a wide window letterboxes instead of stretching strokes to the edges.
let regions = [];
let originX = 0;
let originY = 0;
let bg = null;
let bgKey = "";
let regionKey = "";

const REALM_WASH = {
  deva: "#c9c3b5",
  asura: "#4a5e48",
  human: "#a89a55",
  animal: "#3a4a62",
  preta: "#7a4548",
  hell: "#5c5550"
};

function stageBox(width, height, opening, ending) {
  const bar = 72;
  const caption = opening ? 108 : ending ? 168 : 56;
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
    const px = cx + Math.cos(angle) * radius * 0.58;
    const py = cy + Math.sin(angle) * radius * 0.58;
    ctx.save();
    ctx.translate(px + sway, py);
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
  ctx.fillStyle = "#d9d3c4";
  ctx.beginPath();
  ctx.ellipse(cx - rx - 36, cy + 16, 12, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.ellipse(cx + rx + 36, cy + 16, 12, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5c4030";
  ctx.beginPath();
  ctx.ellipse(cx, cy - ry - 28, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  addDisc(10, 0, cx, cy - ry - 28, 24);
  addDisc(8, 0, cx - rx - 36, cy, 28);
  addDisc(9, 0, cx + rx + 36, cy, 28);
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

function drawRealmLight(ctx, w, h, screen) {
  const colour = REALM_WASH[screen] || "#a89a55";
  const cx = w / 2;
  const cy = h * 0.46;
  const r = Math.min(w, h) * 0.28;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.4);
  glow.addColorStop(0, colour);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e0c36a";
  ctx.lineWidth = 6;
  ctx.stroke();
}

function drawWrathful(ctx, w, h, spec) {
  const flame = spec.flame || "#c47a3a";
  ctx.strokeStyle = flame;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(4, w * 0.02);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.42, Math.min(w, h) * (0.28 + i * 0.06), Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (spec.kind === "row") {
    const n = spec.figures.length;
    spec.figures.forEach(function (fig, i) {
      const x = w * (0.18 + (0.64 * i) / Math.max(1, n - 1));
      const y = h * 0.46;
      ctx.fillStyle = fig.colour;
      ctx.beginPath();
      ctx.ellipse(x, y + 18, 16, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - 16, 14, 0, Math.PI * 2);
      ctx.fill();
      addDisc(20, i, x, y, 26);
    });
    return;
  }
  const cx = w * 0.46;
  const cy = h * 0.48;
  ctx.fillStyle = spec.body;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, w * 0.16, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  const faces = spec.faces;
  [[-22, faces[0]], [0, faces[1]], [22, faces[2]]].forEach(function (face) {
    ctx.fillStyle = face[1];
    ctx.beginPath();
    ctx.arc(cx + face[0], cy - h * 0.16, 16, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = spec.body;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy);
  ctx.lineTo(cx - 58, cy - 20);
  ctx.moveTo(cx + 30, cy);
  ctx.lineTo(cx + 58, cy - 16);
  ctx.stroke();
  addDisc(20, 0, cx, cy, Math.min(w, h) * 0.16);
  const kx = w * 0.68;
  ctx.fillStyle = spec.consort;
  ctx.beginPath();
  ctx.ellipse(kx, cy + 16, w * 0.09, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(kx, cy - h * 0.08, 12, 0, Math.PI * 2);
  ctx.fill();
  addDisc(20, 1, kx, cy, 28);
}

function drawMark(ctx, x, y, colour, rainbow, scale) {
  const s = scale || 1;
  if (rainbow) {
    ["#E6E0D4", "#C4A24A", "#8E3A3A", "#3A6B48", "#2C4A6E"].forEach(function (band, i) {
      ctx.fillStyle = band;
      ctx.fillRect(x - 12 * s, y - 16 * s + i * 6 * s, 24 * s, 6 * s);
    });
    return;
  }
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x, y + 6 * s, 12 * s, 16 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 14 * s, 9 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(247, 244, 234, 0.35)";
  ctx.beginPath();
  ctx.arc(x - 3 * s, y - 16 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeam(ctx, x, y, light, tall) {
  const h = tall || 36;
  ctx.globalAlpha = light.withheld ? 0.45 : light.dull ? 0.75 : 0.95;
  if (light.rainbow) {
    ["#E6E0D4", "#C4A24A", "#8E3A3A", "#3A6B48", "#2C4A6E"].forEach(function (band, i) {
      ctx.fillStyle = band;
      ctx.fillRect(x - 10 + i * 4, y, 4, h);
    });
  } else {
    ctx.fillStyle = light.colour;
    ctx.fillRect(x - 7, y, 14, h);
  }
  if (light.withheld) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#E0C36A";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 9, y, 18, h);
  }
  ctx.globalAlpha = 1;
}

function drawEmblem(ctx, x, y, name, colour) {
  const n = String(name || "").toLowerCase();
  ctx.fillStyle = colour || "#E0C36A";
  ctx.strokeStyle = "#F4F1E6";
  ctx.lineWidth = 2;
  if (/wheel/.test(n)) {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8);
      ctx.stroke();
    }
  } else if (/vajra/.test(n)) {
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x - 4, y);
    ctx.lineTo(x, y + 9);
    ctx.lineTo(x + 4, y);
    ctx.closePath();
    ctx.fill();
  } else if (/jewel/.test(n)) {
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 7, y);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x - 7, y);
    ctx.closePath();
    ctx.fill();
  } else if (/lotus|flower/.test(n)) {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3, 5, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (/lion|elephant|horse|peacock|garuda|throne/.test(n)) {
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8, y - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(x - 6, y - 6, 12, 12);
  }
}

function drawPeace(ctx, w, h, spec) {
  ctx.fillStyle = "#12140f";
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w / 2, h * 0.46, 10, w / 2, h * 0.46, Math.max(w, h) * 0.55);
  glow.addColorStop(0, "#2c2818");
  glow.addColorStop(1, "#12140f");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  const lights = spec.lights || [];
  const wisdom = [];
  const dull = [];
  lights.forEach(function (light, i) {
    (light.dull ? dull : wisdom).push(i);
  });
  function placeRow(indexes, y, tall) {
    indexes.forEach(function (index, n) {
      const x = indexes.length === 1 ? w * 0.5 : w * (0.12 + (0.76 * n) / (indexes.length - 1));
      const light = lights[index];
      drawBeam(ctx, x, y, light, tall);
      addDisc(22, index, x, y + tall / 2, Math.max(16, tall / 2));
    });
  }
  if (wisdom.length <= 1 && dull.length <= 1) {
    wisdom.forEach(function (index) {
      drawBeam(ctx, w * 0.32, 16, lights[index], Math.min(110, h * 0.16));
      addDisc(22, index, w * 0.32, 16 + h * 0.06, 24);
    });
    dull.forEach(function (index) {
      drawBeam(ctx, w * 0.68, 16, lights[index], Math.min(110, h * 0.16));
      addDisc(22, index, w * 0.68, 16 + h * 0.06, 24);
    });
  } else {
    placeRow(wisdom, 8, 26);
    placeRow(dull, 40, 22);
  }
  const figures = spec.figures || [];
  const foot = h - 86;
  const emblemCount = (spec.emblems || []).length;
  const emblemPer = emblemCount > 8 && emblemCount <= 10 ? emblemCount : 8;
  const emblemRows = Math.max(1, Math.ceil(emblemCount / emblemPer));
  const emblemTop = foot - (emblemRows - 1) * 26;
  const bandBot = emblemTop - 34;
  const bandTop = Math.min(Math.max(120, h * 0.24), bandBot - 70);
  function bandY(frac) {
    return bandTop + (bandBot - bandTop) * frac;
  }
  if (spec.layout === "grid") {
    const cols = 7;
    const rows = Math.ceil(figures.length / cols);
    const top = 86;
    const bottom = foot - 28;
    figures.forEach(function (fig, i) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = w * (0.1 + (0.8 * col) / (cols - 1));
      const y = top + ((bottom - top) * row) / Math.max(1, rows - 1);
      drawMark(ctx, x, y, fig.colour, fig.rainbow, 0.72);
      addDisc(21, i, x, y, 14);
    });
  } else if (spec.layout === "mandala") {
    const pairAt = [
      [0.42, 0.42, 0.58, 0.46],
      [0.42, 0.08, 0.58, 0.08],
      [0.78, 0.42, 0.78, 0.62],
      [0.42, 0.78, 0.58, 0.78],
      [0.22, 0.42, 0.22, 0.62]
    ];
    for (let p = 0; p < 5; p++) {
      const spot = pairAt[p];
      const a = p * 2;
      const b = a + 1;
      if (figures[a]) {
        drawMark(ctx, w * spot[0], bandY(spot[1]), figures[a].colour, figures[a].rainbow, p === 0 ? 1.7 : 1.15);
        addDisc(21, a, w * spot[0], bandY(spot[1]), p === 0 ? 28 : 20);
      }
      if (figures[b]) {
        drawMark(ctx, w * spot[2], bandY(spot[3]), figures[b].colour, figures[b].rainbow, 0.95);
        addDisc(21, b, w * spot[2], bandY(spot[3]), 16);
      }
    }
    if (figures[10]) {
      drawMark(ctx, w * 0.5, bandY(0.98), figures[10].colour, figures[10].rainbow, 0.8);
      addDisc(21, 10, w * 0.5, bandY(0.98), 16);
    }
  } else {
    const cx = w * 0.4;
    const cy = h * 0.46;
    if (figures[0]) {
      drawMark(ctx, cx, cy, figures[0].colour, figures[0].rainbow, 2.1);
      addDisc(21, 0, cx, cy, 36);
    }
    if (figures[1]) {
      drawMark(ctx, w * 0.64, cy + 10, figures[1].colour, figures[1].rainbow, 1.45);
      addDisc(21, 1, w * 0.64, cy + 10, 24);
    }
    for (let i = 2; i < figures.length; i++) {
      const x = w * (0.16 + ((i - 2) % 4) * 0.22);
      const y = h * 0.68;
      drawMark(ctx, x, y, figures[i].colour, figures[i].rainbow, 0.95);
      addDisc(21, i, x, y, 16);
    }
  }
  const emblems = spec.emblems || [];
  const per = emblemPer;
  emblems.forEach(function (emblem, i) {
    const row = Math.floor(i / per);
    const col = i % per;
    const n = Math.min(per, emblems.length - row * per);
    const x = n === 1 ? w * 0.5 : w * (0.12 + (0.76 * col) / (n - 1));
    const y = foot - row * 26;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.7, 1.7);
    drawEmblem(ctx, 0, 0, emblem.name, emblem.colour);
    ctx.restore();
    addDisc(23, i, x, y, 16);
  });
}

function fillAwareness(ctx, w, h, time, calm) {
  const breathe = !calm && time ? Math.sin(time / 1600) * 0.05 : 0;
  const glow = ctx.createRadialGradient(
    w / 2, h * 0.4, 8,
    w / 2, h * 0.4, Math.max(w, h) * (0.58 + breathe)
  );
  glow.addColorStop(0, "#fffaf0");
  glow.addColorStop(0.22, "#f3ecda");
  glow.addColorStop(0.5, "#d5cbb2");
  glow.addColorStop(1, "#241f16");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  if (!calm && time) {
    const flicker = 0.08 + Math.sin(time / 900) * 0.04;
    const core = ctx.createRadialGradient(w / 2, h * 0.4, 4, w / 2, h * 0.4, w * 0.22);
    core.addColorStop(0, "rgba(255, 253, 248, " + flicker + ")");
    core.addColorStop(1, "rgba(255, 253, 248, 0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawDissolution(ctx, w, h, stage) {
  const top = h * 0.7;
  const band = Math.max(28, h * 0.1);
  if (stage < 2) {
    const earth = stage === 0 ? band : band * 0.32;
    ctx.fillStyle = "#6b5434";
    ctx.fillRect(0, top + band - earth, w, earth);
  }
  if (stage > 0) {
    ctx.fillStyle = stage === 2 ? "#3e6270" : "rgba(62, 98, 112, 0.8)";
    ctx.fillRect(0, top, w, stage === 2 ? band : band * 0.72);
  }
  addDisc(24, 3, w / 2, top + band / 2, Math.min(w * 0.36, 90));
}

function drawClear(ctx, w, h, model, time) {
  if (model.clearKind === "secondary") {
    ctx.fillStyle = "#14120f";
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.3, 8, w * 0.5, h * 0.3, w * 0.42);
    glow.addColorStop(0, "rgba(247, 244, 234, 0.62)");
    glow.addColorStop(1, "rgba(247, 244, 234, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.3, w * 0.38, 0, Math.PI * 2);
    ctx.fill();
    addDisc(24, 0, w * 0.5, h * 0.3, Math.min(w, h) * 0.16);
    [[0.2, 0.58], [0.3, 0.66], [0.16, 0.68]].forEach(function (spot, i) {
      ctx.fillStyle = i === 1 ? "#5c5348" : "#3a3630";
      ctx.beginPath();
      ctx.ellipse(w * spot[0], h * spot[1], 11, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * spot[0], h * spot[1] - 26, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    addDisc(24, 1, w * 0.23, h * 0.62, 52);
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#f7f4ea";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.ellipse(w * 0.66, h * 0.58, 14, 32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.66, h * 0.58 - 44, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    addDisc(24, 2, w * 0.66, h * 0.55, 42);
    return;
  }
  fillAwareness(ctx, w, h, time, model.clearKind === "liberation");
  if (model.clearKind === "primary") {
    addDisc(24, 0, w / 2, h * 0.4, Math.min(w, h) * 0.24);
    drawDissolution(ctx, w, h, model.dissolve);
  }
}

function drawCanon(ctx, w, h, model) {
  ctx.fillStyle = "#14160f";
  ctx.fillRect(0, 0, w, h);
  const kind = model.canon;
  if (kind === "frame" || kind === "coda") {
    const n = kind === "frame" ? 3 : 5;
    for (let i = 0; i < n; i++) {
      const y = h * (0.22 + i * (0.56 / Math.max(1, n - 1)));
      ctx.fillStyle = i === n - 1 ? "#e0c36a" : "#3a4038";
      ctx.fillRect(w * 0.18, y, w * 0.64, 18);
      addDisc(24, i, w * 0.5, y + 9, 22);
    }
    return;
  }
  if (kind === "interval") {
    const bands = ["#f7f4ea", "#c4a24a", "#7a4548"];
    bands.forEach(function (colour, i) {
      const x = w * (0.2 + i * 0.28);
      ctx.fillStyle = colour;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x - 28, h * 0.16, 56, 22);
      ctx.globalAlpha = 1;
      addDisc(24, i, x, h * 0.16 + 11, 24);
    });
    const series = [
      [model.curves.clarity, "#f7f4ea", 3],
      [model.curves.intensity, "#e0c36a", 4],
      [model.curves.complexity, "#8e3a3a", 5]
    ];
    series.forEach(function (seriesItem) {
      const data = seriesItem[0];
      ctx.strokeStyle = seriesItem[1];
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let day = 0; day <= 49; day++) {
        const x = w * (0.12 + 0.76 * day / 49);
        const y = h * (0.78 - 0.4 * (data[day] || 0) / 1000);
        if (day === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      addDisc(24, seriesItem[2], w * 0.5, h * (0.42 + seriesItem[2] * 0.06), 18);
    });
    return;
  }
  if (kind === "bardos") {
    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = w * (0.25 + col * 0.25);
      const y = h * (0.32 + row * 0.28);
      ctx.fillStyle = i >= 3 ? "#e0c36a" : "#3a4038";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      addDisc(24, i, x, y, 26);
    }
    return;
  }
  if (kind === "visions") {
    const colours = ["#7f91a3", "#c4a24a", "#a33b32", "#3f5348", "#c9c3b5", "#4a5e48", "#a89a55", "#3a4a62", "#7a4548", "#5c5550"];
    for (let i = 0; i < 10; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = w * (0.14 + col * 0.18);
      const y = h * (0.32 + row * 0.28);
      ctx.fillStyle = colours[i];
      ctx.fillRect(x - 16, y - 22, 32, 44);
      addDisc(24, i, x, y, 24);
    }
    return;
  }
  if (kind === "shelter") {
    ctx.fillStyle = "#2a2418";
    ctx.fillRect(w * 0.28, h * 0.34, w * 0.44, h * 0.28);
    ctx.fillStyle = "#5c5348";
    for (let i = 0; i < 4; i++) {
      const x = i < 2 ? w * 0.16 : w * 0.84;
      const y = h * (0.4 + (i % 2) * 0.16);
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    addDisc(24, 0, w * 0.5, h * 0.48, 40);
    return;
  }
  if (kind === "choice") {
    const colours = ["#8e3a3a", "#e0c36a", "#c4a24a", "#5c5550"];
    for (let i = 0; i < 4; i++) {
      const x = w * (0.2 + (i % 2) * 0.4);
      const y = h * (0.32 + Math.floor(i / 2) * 0.28);
      ctx.fillStyle = colours[i];
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
      addDisc(24, i, x, y, 32);
    }
    return;
  }
  if (kind === "chonyid") {
    ctx.strokeStyle = "#e0c36a";
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.42);
      ctx.lineTo(w * 0.5 + Math.cos(a) * w * 0.42, h * 0.42 + Math.sin(a) * h * 0.28);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    addDisc(24, 0, w * 0.5, h * 0.18, 20);
    const family = ["#E6E0D4", "#2C4A6E", "#C4A24A", "#8E3A3A", "#3A6B48"];
    const spots = [[0.5, 0.42], [0.5, 0.28], [0.68, 0.48], [0.5, 0.58], [0.32, 0.48]];
    family.forEach(function (colour, i) {
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(w * spots[i][0], h * spots[i][1], i === 0 ? 18 : 14, 0, Math.PI * 2);
      ctx.fill();
      addDisc(24, i + 2, w * spots[i][0], h * spots[i][1], 20);
    });
    ctx.strokeStyle = "#f7f4ea";
    ctx.setLineDash([3, 4]);
    ctx.strokeRect(w * 0.72, h * 0.7, 18, 36);
    ctx.setLineDash([]);
    addDisc(24, 1, w * 0.76, h * 0.74, 22);
  }
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
  const box = stageBox(width, height, model.opening, model.ending);
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
  if (model.opening) {
    const cx = box.w / 2;
    const cy = box.h * 0.52;
    const r = Math.min(box.w, box.h) * 0.42;
    drawHalo(ctx, cx, cy - box.h * 0.04, r, t);
    drawBuddha(ctx, cx, cy, Math.min(box.w, box.h) * 0.46);
  } else if (model.screen === "good") {
    const radius = Math.min(box.w, box.h) * 0.3;
    drawPetals(ctx, box.w / 2, box.h * 0.42, radius, 5, t);
  } else if (REALM_WASH[model.screen]) {
    drawRealmLight(ctx, box.w, box.h, model.screen);
  } else if (model.canon) {
    drawCanon(ctx, box.w, box.h, model);
  } else if (model.clearKind) {
    drawClear(ctx, box.w, box.h, model, t);
  } else if (model.wrath) {
    drawWrathful(ctx, box.w, box.h, model.wrath);
  } else if (model.peace) {
    drawPeace(ctx, box.w, box.h, model.peace);
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
  const key = [
    model.screen, model.methods, model.bright,
    Math.round(box.x), Math.round(box.y), Math.round(box.w), Math.round(box.h)
  ].join(":");
  if (key !== regionKey) {
    regionKey = key;
    const rect = canvas.getBoundingClientRect();
    window.__regions = regions.map(function (region) {
      const x = region.kind === "disc" ? region.x : region.hitX;
      const y = region.kind === "disc" ? region.y : region.hitY;
      return { action: region.action, arg: region.arg, clientX: rect.left + x, clientY: rect.top + y };
    });
  }
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
