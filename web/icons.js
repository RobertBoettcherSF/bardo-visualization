// Reads data/iconography.json and turns each Chonyid day into paint specs.
// Visible sentences are stored in STRINGS.en so a later overlay can replace them.
const WORD_HEX = {
  white: "#E6E0D4",
  "brilliant white": "#F4F1E6",
  red: "#8E3A3A",
  "dark red": "#6B2428",
  "darkish red": "#6B2428",
  "reddish black": "#3A1518",
  "reddish-black": "#3A1518",
  yellow: "#C4A24A",
  "dark yellow": "#A8842A",
  "darkish yellow": "#A8842A",
  golden: "#C4A24A",
  "golden-orange": "#C47A3A",
  "golden orange": "#C47A3A",
  green: "#3A6B48",
  "dark green": "#1A3328",
  blue: "#2C4A6E",
  "dark blue": "#1A2A44",
  "dark-blue": "#1A2A44",
  "deep blue": "#1B3354",
  "dark brown": "#4A3228",
  "dark-brown": "#4A3228",
  maroon: "#6B2428",
  black: "#1C1C1C",
  smoky: "#5C5550",
  grey: "#6E6A64",
  "ash-grey": "#6E6A64",
  "dull white": "#C9C3B5",
  "dull blue": "#3A4A62",
  "dull yellow": "#A89A55",
  "dull bluish-yellow": "#8F9A5C",
  "bluish-yellow": "#8F9A5C",
  "dull green": "#4A5E48",
  "dull red": "#7A4548",
  "dull reddish": "#7A4548",
  "five-coloured": "#C4A24A"
};

const UNSTATED = "#8A8478";
const MAROON = "#6B2428";
const JUNG_NOTE = "Jung lists the peaceful days in reverse, from day 7 back toward day 1. This tour follows that order. Colours follow the root text.";

function hexFromWords(text) {
  const raw = String(text || "").toLowerCase();
  const keys = Object.keys(WORD_HEX).sort(function (a, b) { return b.length - a.length; });
  for (let i = 0; i < keys.length; i++) {
    if (raw.indexOf(keys[i]) >= 0) return WORD_HEX[keys[i]];
  }
  return "";
}

function englishOnly(text) {
  return String(text || "")
    .replace(/\s*\(([^)]*)\)/g, function (_, inner) {
      if (/[^\x00-\x7F]/.test(inner)) return "";
      if (/\b(the|a|an|of|in|and|not|with|from|this|day|holding)\b/i.test(inner)) return " (" + inner + ")";
      return "";
    })
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
}

function putString(key, text) {
  STRINGS.en[key] = text;
}

function deityColour(deity) {
  if (deity.body_colour_hex && deity.body_colour_hex.value) return deity.body_colour_hex.value;
  const outside = deity.outside_source && deity.outside_source.body_colour;
  if (outside) {
    const hex = hexFromWords(outside);
    if (hex) return hex;
  }
  if (deity.body_colour_source) {
    const hex = hexFromWords(deity.body_colour_source);
    if (hex) return hex;
  }
  return UNSTATED;
}

function uncertainOf(deity) {
  const bits = [];
  const outside = deity.outside_source && (deity.outside_source.body_colour || deity.outside_source.consort_colour);
  if (!deity.body_colour_source && outside) {
    bits.push("the source does not state the body colour; the paint follows the checked table’s outside note (" + englishOnly(outside) + ")");
  } else if (!deity.body_colour_source && !deity._carried) {
    bits.push("the source does not state the body colour");
  }
  if (deity.faces > 1 && !deity.face_colours) bits.push("the face colours are not given");
  return bits.join(". ");
}

function familyWord(name) {
  const n = String(name || "").toLowerCase();
  if (n.indexOf("vairocana") >= 0) return "white";
  if (n.indexOf("vajrasattva") >= 0 || n.indexOf("akshobhya") >= 0) return "blue";
  if (n.indexOf("ratnasambhava") >= 0) return "yellow";
  if (n.indexOf("amit") >= 0) return "red";
  if (n.indexOf("amoghasiddhi") >= 0) return "green";
  return "";
}

function expandDeities(entry) {
  const out = [];
  (entry.deities || []).forEach(function (deity) {
    if (!deity.name_en) return;
    if (deity.role === "main_couple") {
      const buddha = deity.name_en.split(",")[0];
      const word = familyWord(buddha);
      out.push(Object.assign({}, deity, {
        name_en: buddha,
        body_colour_source: word,
        body_colour_hex: null,
        _carried: true,
        note: "Attributes are not itemised again on this day. The colour is the one the root text gives this Buddha on the earlier day. " + (deity.note || "")
      }));
      const cons = deity.outside_source || {};
      out.push({
        role: "consort",
        name_en: cons.consort_sanskrit || (buddha + ", consort"),
        outside_source: cons.consort_colour ? { body_colour: cons.consort_colour } : null,
        note: "Her colour is not stated on this day.",
        items: []
      });
      return;
    }
    out.push(deity);
  });
  return out;
}

function figureOf(deity, book, index) {
  const items = (deity.items || []).map(function (item) { return englishOnly(item.item_en); }).filter(Boolean);
  const five = /five colour|five-colour|all five/i.test(deity.body_colour_source || "");
  const unsure = uncertainOf(deity);
  const mount = deity.mount_or_throne && deity.mount_or_throne.en ? englishOnly(deity.mount_or_throne.en) : "";
  const parts = [englishOnly(deity.name_en || "A figure")];
  if (deity._carried && deity.body_colour_source) parts.push(deity.body_colour_source + ", carried from the earlier day");
  else if (deity.body_colour_source) parts.push(englishOnly(deity.body_colour_source));
  if (items.length) parts.push("Emblem: " + items.join(", "));
  if (mount) parts.push(mount);
  if (deity.note) parts.push(englishOnly(deity.note));
  if (unsure) parts.push("Uncertain: " + unsure);
  parts.push(JUNG_NOTE);
  const line = "p" + book + "f" + index;
  const detail = line + "d";
  putString(line, englishOnly(deity.name_en || "Figure"));
  putString(detail, parts.join(". ").replace(/\.\.+/g, "."));
  return {
    name: deity.name_en || "Figure",
    colour: five ? "#C4A24A" : deityColour(deity),
    rainbow: five,
    line: line,
    detail: detail,
    items: items,
    mount: mount,
    role: deity.role || ""
  };
}

function lightOf(entry, book, index) {
  const src = englishOnly(entry.colour_source || "");
  const withheld = entry.kind === "wisdom_withheld" || /does not appear|withheld/i.test(entry.colour_source || "") || /withheld/i.test(entry.name_en || "");
  const dull = entry.kind === "dull_realm" || (!entry.name_en && !!entry.realm_en);
  let name = englishOnly(entry.name_en || "");
  if (!name && entry.realm_en) name = src + ", " + englishOnly(entry.realm_en);
  if (!name) name = src || "Light";
  const parts = [name];
  if (src && parts[0].indexOf(src) < 0) parts.push(src);
  if (entry.from) parts.push("From " + englishOnly(entry.from));
  if (entry.note) {
    englishOnly(entry.note).split(/(?<=\.)\s+/).forEach(function (sentence) {
      if (/^Proposed link/i.test(sentence)) return;
      if (sentence) parts.push(sentence);
    });
  }
  if (/does not use the word hell|does not say hell|day 2 does not/i.test(entry.note || "")) {
    parts.push("Uncertain as a name: this day does not say hell");
  }
  if (/bluish/.test(entry.colour_source || "") && /dull yellow/i.test(entry.note || "")) {
    parts.push("Uncertain: this day says bluish-yellow; a later day says dull yellow");
  }
  parts.push(JUNG_NOTE);
  const line = "p" + book + "l" + index;
  const detail = line + "d";
  putString(line, name);
  putString(detail, parts.join(". ").replace(/\.\.+/g, "."));
  const rainbow = /five-colour|five colour/i.test(entry.colour_source || "");
  const hex = entry.colour_hex && entry.colour_hex.value;
  return {
    name: name,
    colour: hex || hexFromWords(entry.colour_source) || "#C4A24A",
    rainbow: rainbow,
    withheld: withheld,
    dull: dull,
    line: line,
    detail: detail
  };
}

function peaceSpec(entry) {
  const book = entry.chonyid_day;
  const deities = expandDeities(entry);
  const figures = deities.map(function (deity, index) { return figureOf(deity, book, index); });
  const lights = (entry.lights || []).map(function (light, index) { return lightOf(light, book, index); });
  const emblems = [];
  figures.forEach(function (fig, index) {
    fig.items.forEach(function (item) {
      const n = emblems.length;
      const line = "p" + book + "e" + n;
      const detail = line + "d";
      putString(line, item);
      putString(detail, fig.name + " — " + item + ". " + JUNG_NOTE);
      emblems.push({ name: item, colour: "#E0C36A", line: line, detail: detail, owner: index });
    });
    if (fig.mount) {
      const n = emblems.length;
      const line = "p" + book + "e" + n;
      const detail = line + "d";
      putString(line, fig.mount);
      putString(detail, fig.name + " — " + fig.mount + ". " + JUNG_NOTE);
      emblems.push({ name: fig.mount, colour: "#C4A24A", line: line, detail: detail, owner: index });
    }
  });
  const jung = 19 - book;
  const layout = book === 6 ? "grid" : book === 7 ? "mandala" : "seat";
  let blurb = englishOnly(entry.title_en || "").replace(/^Step \d+ — /, "");
  if (entry.direction && String(entry.direction).length < 40) blurb += " (" + entry.direction + ")";
  if (lights.some(function (light) { return light.withheld; })) {
    blurb += ". The green all-accomplishing path is withheld.";
  }
  const blurbKey = "p" + book + "blurb";
  putString(blurbKey, blurb);
  return {
    id: "p" + book,
    code: "J" + (jung < 10 ? "0" : "") + jung + "-B0" + book,
    cal: entry.calendar_day,
    book: book,
    peace: true,
    blurb: blurbKey,
    layout: layout,
    figures: figures,
    lights: lights,
    emblems: emblems
  };
}

function applyWrathful(table) {
  const byDay = { 8: "w08", 9: "w09", 10: "w10", 11: "w11", 12: "w12", 13: "w13", 14: "w14" };
  (table.entries || []).forEach(function (entry) {
    const id = byDay[entry.chonyid_day];
    if (!id || !SCREEN[id]) return;
    const deities = entry.deities || [];
    if (entry.chonyid_day >= 13) {
      const picked = entry.chonyid_day === 14
        ? deities.filter(function (d) { return d.role === "female_door_keeper"; })
        : [deities[0]].concat(deities.filter(function (d) { return d.role === "htamenma"; }).slice(0, 4));
      picked.forEach(function (deity, index) {
        const fig = SCREEN[id].figures[index];
        if (!fig || !deity) return;
        fig.colour = deityColour(deity);
      });
      return;
    }
    const heruka = deities.filter(function (d) { return d.role === "heruka"; })[0];
    const consort = deities.filter(function (d) { return d.role === "consort"; })[0];
    if (!heruka) return;
    let body = deityColour(heruka);
    const faces = heruka.face_colours || {};
    if (entry.chonyid_day === 8) body = MAROON;
    SCREEN[id].body = body;
    SCREEN[id].faces = [
      hexFromWords(faces.right || "white") || "#E6E0D4",
      entry.chonyid_day === 8 ? body : (hexFromWords(faces.middle || heruka.body_colour_source) || body),
      hexFromWords(faces.left || "red") || "#8E3A3A"
    ];
    const fig = SCREEN[id].figures && SCREEN[id].figures[0];
    if (entry.chonyid_day === 8 && fig) {
      putString("tapBuddhaH", "Buddha Heruka, painted maroon, three faces, six hands.");
      putString("detailBuddhaH", "Book day 8. The root text calls the Great Glorious Buddha Heruka dark brown, right face white, left face red, centre dark brown, and says he is Vairochana. The checked table records the Dudjom card’s central figure as maroon-red. This screen is painted maroon. Uncertain against the root text: the book says dark brown.");
    } else if (fig && !heruka.face_colours) {
      const key = fig.detail;
      const text = STRINGS.en[key] || "";
      if (!/face colour/i.test(text)) {
        putString(key, text + " Uncertain: the three face colours are not given for this day.");
      }
    }
    if (consort && SCREEN[id].figures[1] && !consort.body_colour_source) {
      const key = SCREEN[id].figures[1].detail;
      const text = STRINGS.en[key] || "";
      if (!/body colour/i.test(text)) {
        putString(key, text + " Uncertain: her body colour is not stated.");
      }
    }
  });
}

async function loadIconography() {
  if (window.__iconsReady) return;
  const response = await fetch("data/iconography.json", { cache: "no-store" });
  if (!response.ok) throw new Error("iconography " + response.status);
  const table = await response.json();
  applyWrathful(table);
  [7, 6, 5, 4, 3, 2, 1].forEach(function (day) {
    const entry = (table.entries || []).filter(function (item) {
      return item.kind === "chonyid_day" && item.chonyid_day === day && item.phase === "peaceful";
    })[0];
    if (!entry) throw new Error("missing peaceful day " + day);
    const spec = peaceSpec(entry);
    if (spec.figures.length < 1) throw new Error("empty peaceful day " + day);
    SCREEN[spec.id] = spec;
    if (CLIMB.indexOf(spec.id) < 0) CLIMB.push(spec.id);
  });
  if (SCREEN.p6 && SCREEN.p6.figures.length !== 42) {
    throw new Error("day 6 figures " + SCREEN.p6.figures.length);
  }
  ["c19", "c20"].forEach(function (id) {
    if (CLIMB.indexOf(id) < 0) CLIMB.push(id);
  });
  window.__iconsReady = true;
  window.__screenCodes = CLIMB.map(function (id) { return SCREEN[id].code; });
}
