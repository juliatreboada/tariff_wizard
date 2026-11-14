import fs from "node:fs";
import { paths } from "./svg-paths.mjs";
const [svg, wordsFile] = process.argv.slice(2);
if (!svg || !wordsFile || !fs.existsSync(svg) || !fs.existsSync(wordsFile)) {
  console.error("Usage: node read-page.mjs <page.svg> <words.html>   (from pdftocairo -svg and pdftotext -bbox)");
  process.exit(1);
}
const ps = paths(svg);
const words = [...fs.readFileSync(wordsFile, "utf8").matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)]
  .map((m) => ({ x: (+m[1] + +m[3]) / 2, y: (+m[2] + +m[4]) / 2, h: +m[4] - +m[2], t: m[5].replace("&#8211;", "–") }));
const isWhite = (f) => f === "rgb(100%, 100%, 100%)", isGrey = (f) => /^rgb\(7[45]/.test(f ?? "");
const circ = (test) => ps.filter((p) => p.curves > 0 && p.stroke && p.sw < 0.36 && p.sw > 0.1 && test(p.fill) && p.bbox[2] - p.bbox[0] < 21)
  .map((p) => ({ x: (p.bbox[0] + p.bbox[2]) / 2, y: (p.bbox[1] + p.bbox[3]) / 2, r: (p.bbox[2] - p.bbox[0]) / 2 }));
const white = circ(isWhite), grey = circ(isGrey);
const small = words.filter((w) => w.h < 9 && /^[0-9–-]+$/.test(w.t));
for (const c of [...white, ...grey]) {
  const w = small.map((w) => ({ w, d: Math.hypot(w.x - c.x, w.y - c.y) })).filter((o) => o.d < c.r + 1).sort((a, b) => a.d - b.d)[0]?.w;
  c.t = w ? w.t.replace("–", "-") : "?";
}
const arrows = ps.filter((p) => !p.stroke && p.fill === "rgb(0%, 0%, 0%)" && p.curves === 0 && p.pts.length >= 8 && p.pts.length <= 11)
  .map((p) => { const a = p.pts[5], b = p.pts.length === 11 ? p.pts[8] : p.pts[1]; return { a, b }; });
const letters = words.filter((w) => /^[A-G]$/.test(w.t) && w.h > 10 && w.h < 13);
console.log("white", white.length, "grey", grey.length, "arrows", arrows.length, "letters", letters.map((l) => l.t).join(""), "r", white[0]?.r.toFixed(1));
fs.writeFileSync(svg.replace(".svg", ".json"), JSON.stringify({ white, grey, arrows, letters }));
