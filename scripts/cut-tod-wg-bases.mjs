/**
 * Cut the base pyramid positions out of a TOD WG (Table of Difficulty
 * 2025-2028) group balance page: "Category N" blocks of rows (A, B, …), each
 * row a strip of numbered boxes, a row of pictures and a strip of values.
 *
 * Box numbers, values, row letters and categories come from the PDF's word
 * positions (`pdftotext -bbox`); a box's picture spans from its number strip
 * to its value strip, between the table's vertical lines around it. Numbers
 * that share one cell ("8a / 8b", "12 13") split it at their midpoint.
 * The page's printed number (bottom centre) is part of the ID: "58 A3".
 *
 * Usage: node scripts/cut-tod-wg-bases.mjs <page.png> <words.html> <dpi> <out-dir>
 * Render first: `pdftoppm -r 220 -png -f 61 -l 61 tod.pdf page` and
 * `pdftotext -f 61 -l 61 -bbox tod.pdf words.html`.
 * Writes <out-dir>/P<page>-C<category>-<row>-<box>.png and prints JSON (id "58 1A1" =
 * page, category, row, box) for the coach's review. The reviewed cut is what goes
 * into catalog/FIG/tod-wg-bases.json, renamed there to the sheet's IDs ("58 A1").
 * A row with a single box has no neighbour to measure, so its cut falls back to
 * its table cell; check those by hand.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

function readWords(htmlPath, scale) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const words = [];
  const re = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g;
  for (let m; (m = re.exec(html)); ) {
    const [x0, y0, x1, y1] = m.slice(1, 5).map((v) => Number(v) * scale);
    words.push({ x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, text: m[5] });
  }
  return words;
}

/** Words on one text line (same baseline within `tol`), left to right. */
function textLines(words, tol) {
  const lines = [];
  for (const w of [...words].sort((a, b) => a.cy - b.cy)) {
    const line = lines.find((l) => Math.abs(l.cy - w.cy) <= tol);
    if (line) line.words.push(w);
    else lines.push({ cy: w.cy, words: [w] });
  }
  for (const l of lines) l.words.sort((a, b) => a.cx - b.cx);
  return lines;
}

const BOX = /^\d+[a-z]?$/;

export async function cutTodWgBases(pagePath, wordsPath, dpi, outDir) {
  const scale = dpi / 72;
  const words = readWords(wordsPath, scale);
  const { data, info } = await sharp(pagePath).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  /** x positions of vertical lines that run through most of the band y0..y1. */
  const verticalLines = (y0, y1) => {
    const found = [];
    for (let x = 0; x < width; x++) {
      let dark = 0;
      for (let y = y0; y < y1; y++) if (data[y * width + x] < 140) dark++;
      if (dark > 0.85 * (y1 - y0) && !(found.length && x - found.at(-1) <= 3)) found.push(x);
    }
    return found;
  };
  // The footer ("TOD Acro 2025-2028   58") holds the printed page number; the tables are above it.
  const footer = words.find((w) => w.text === "TOD")?.cy ?? height;
  const pageNo = words.filter((w) => /^\d+$/.test(w.text) && Math.abs(w.cy - footer) < 4 * scale).at(-1)?.text;
  const categories = words
    .filter((w, i) => w.text === "Category" && /^\d+$/.test(words[i + 1]?.text ?? ""))
    .map((w) => ({ cy: w.cy, n: Number(words[words.indexOf(w) + 1].text) }));
  const rowLetters = words.filter((w) => /^[A-H]$/.test(w.text) && w.cx < 60 * scale);
  const lines = textLines(
    words.filter((w) => BOX.test(w.text) && w.cy < footer - 4 * scale && w.cx > 60 * scale),
    3 * scale,
  );

  // A row: its number strip (every box numbered) is the numeric line just above
  // its letter, the value strip (only the boxes with a figure) just below.
  const rows = [];
  for (const letter of rowLetters) {
    const above = lines.filter((l) => l.cy < letter.cy && l.words.length >= 2).at(-1);
    const below = lines.find((l) => l.cy > letter.cy);
    if (!above || !below) {
      console.warn(`Row ${letter.text} at y=${Math.round(letter.cy)}: no number or value strip found; skipped`);
      continue;
    }
    const category = categories.filter((c) => c.cy < letter.cy).at(-1)?.n;
    rows.push({ letter: letter.text, category, numbers: above.words, values: below.words, top: above.cy, bottom: below.cy });
  }

  fs.mkdirSync(outDir, { recursive: true });
  const boxes = [];
  for (const row of rows) {
    const y0 = Math.round(row.top + 6 * scale);
    const y1 = Math.round(row.bottom - 6 * scale);
    const grid = verticalLines(y0, y1);
    const centers = row.numbers.map((w) => w.cx);
    const gaps = centers.slice(1).map((c, i) => c - centers[i]);
    const spacing = gaps.length ? Math.min(...gaps) : 60 * scale;
    const cellOf = (cx) => [grid.filter((x) => x < cx).at(-1), grid.find((x) => x > cx)];
    for (const [i, num] of row.numbers.entries()) {
      const [gl, gr] = cellOf(num.cx);
      // Neighbouring numbers in the same cell share it: split at the midpoint.
      const prev = centers[i - 1], next = centers[i + 1];
      const left = prev !== undefined && (gl === undefined || prev > gl) ? (prev + num.cx) / 2 : (gl ?? num.cx - spacing / 2);
      const right = next !== undefined && (gr === undefined || next < gr) ? (num.cx + next) / 2 : (gr ?? num.cx + spacing / 2);
      // The value printed under this box, inside its cell (two figures of one
      // cell can share one). No value: an empty box.
      const inCell = row.values.filter((v) => (gl === undefined || v.cx > gl) && (gr === undefined || v.cx < gr));
      if (inCell.length === 0) {
        console.warn(`${pageNo} ${row.category}${row.letter}${num.text}: no value under the box; skipped`);
        continue;
      }
      const value = inCell.reduce((best, v) => (Math.abs(v.cx - num.cx) < Math.abs(best.cx - num.cx) ? v : best));
      const x0 = Math.max(0, Math.round(left + 2 * scale));
      const x1 = Math.min(width, Math.round(right - 2 * scale));
      const file = `P${pageNo}-C${row.category}-${row.letter}-${num.text}.png`;
      if (x1 <= x0 || y1 <= y0) throw new Error(`${file}: empty area ${x0},${y0} → ${x1},${y1}`);
      // Cut the box, then trim the white around the figure, keeping a small margin.
      const box = await sharp(pagePath)
        .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
        .flatten({ background: "#ffffff" })
        .png()
        .toBuffer();
      const trimmed = await sharp(box)
        .trim({ background: "#ffffff", threshold: 30 })
        .extend({ top: 6, bottom: 6, left: 6, right: 6, background: "#ffffff" })
        .png()
        .toBuffer()
        .catch(() => box); // an empty box: keep it as cut
      fs.writeFileSync(path.join(outDir, file), trimmed);
      boxes.push({
        id: `${pageNo} ${row.category}${row.letter}${num.text}`,
        page: Number(pageNo),
        category: row.category,
        row: row.letter,
        box: num.text,
        value: Number(value.text),
        image: file,
        // Where it was cut, and its whole table cell (for re-cutting by hand).
        rect: [x0, y0, x1, y1],
        cell: [Math.round(gl ?? left), y0, Math.round(gr ?? right), y1],
      });
    }
  }
  return boxes;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [pagePath, wordsPath, dpi, outDir] = process.argv.slice(2);
  if (!outDir || !(Number(dpi) > 0)) {
    console.error("Usage: node scripts/cut-tod-wg-bases.mjs <page.png> <words.html> <dpi> <out-dir>");
    process.exit(1);
  }
  const boxes = await cutTodWgBases(pagePath, wordsPath, Number(dpi), outDir);
  console.log(JSON.stringify(boxes, null, 1));
}
