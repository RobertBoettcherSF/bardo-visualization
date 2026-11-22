import { readFileSync } from "node:fs";

const mantras = [
  "ॐमणिपद्मेहूँ",
  "ॐअमिताभह्रीः",
  "ॐआःहूँवज्रगुरुपद्मसिद्धिहूँ"
];
const conjuncts = ["द्मे", "ह्रीः", "ज्र", "द्म", "द्धि"];
const segmenter = new Intl.Segmenter("hi", { granularity: "grapheme" });

function clusters(text) {
  return [...segmenter.segment(text)].map((part) => part.segment);
}

const segmented = mantras.map(clusters);
for (const group of segmented) {
  for (const cluster of group) {
    if (cluster === "\u094D" || cluster.endsWith("\u094D")) {
      throw new Error("lone or trailing virama: " + cluster);
    }
  }
}
const flat = segmented.flat();
for (const conjunct of conjuncts) {
  if (!flat.includes(conjunct)) {
    throw new Error("conjunct is not one cluster: " + conjunct);
  }
}

const source = readFileSync(new URL("../src/bardo-rain.adb", import.meta.url), "utf8");
const flatMatch = source.match(/Flat : constant Byte_Array \(0 \.\. \d+\) := \[([\s\S]*?)\];/);
if (!flatMatch) throw new Error("Ada flat table not found");
const adaBytes = [...flatMatch[1].matchAll(/16#([0-9A-Fa-f]{2})#/g)].map((m) => parseInt(m[1], 16));
const jsBytes = [...Buffer.from(flat.join(""), "utf8")];
if (adaBytes.length !== jsBytes.length || adaBytes.some((byte, i) => byte !== jsBytes[i])) {
  throw new Error("Ada grapheme bytes do not match Intl.Segmenter");
}
const lens = [...source.matchAll(/Len => (\d+)/g)].map((m) => Number(m[1]));
const expectLens = flat.map((cluster) => Buffer.byteLength(cluster));
if (lens.length !== expectLens.length || lens.some((len, i) => len !== expectLens[i])) {
  throw new Error("Ada span lengths do not match the clusters");
}
if (segmented[0].length !== 6 || segmented[1].length !== 6 || segmented[2].length !== 12) {
  throw new Error("unexpected cluster counts");
}
console.log("graphemes ok", flat.length, "clusters");
