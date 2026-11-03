/**
 * Cut element pictures out of a FIG Pre-Youth (11-16) compulsory table page:
 * rows of numbered boxes ("Box 1", "Box 3b", "T5"), each row with its own
 * box widths, and a VALUE band under every picture row.
 *
 * The grid comes from the rendered page; box labels, values and the text in
 * each box (rotations, holds) from the PDF's word positions
 * (`pdftotext -bbox`). Writes <table>/<ROW-I-1|T-5>.png per box and prints a
 * JSON summary for transcription and checking.
 *
 * Usage: node scripts/cut-box-table.mjs <page.png> <words.html> <dpi> <out-dir>
 * Render first: `pdftoppm -r 220 -png -f 29 -l 29 rules.pdf page` and
 * `pdftotext -f 29 -l 29 -bbox rules.pdf words.html`.
 * The page's tables are written to <out-dir>/balance and <out-dir>/dynamic.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DARK = 140;

function lines(length, isLine) {
  const found = [];
  let start = -1;
  for (let i = 0; i <= length; i++) {
    const on = i < length && isLine(i);
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      found.push(Math.round((start + i - 1) / 2));
      start = -1;
    }
  }
  return found;
}

const dedupe = (positions, gap) => positions.filter((p, i) => i === 0 || p - positions[i - 1] > gap);

function readWords(htmlPath, scale) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const words = [];
  const re = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g;
  for (let m; (m = re.exec(html)); ) {
    const [x0, y0, x1, y1] = m.slice(1, 5).map((v) => Number(v) * scale);
    const text = m[5].replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    words.push({ x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, text });
  }
  return words;
}

export async function cutBoxTable(pagePath, wordsPath, dpi, outDir) {
  const { data, info } = await sharp(pagePath).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const dark = (x, y) => data[y * width + x] < DARK;
  const words = readWords(wordsPath, dpi / 72);
  const inside = (w, x0, y0, x1, y1) => w.cx >= x0 && w.cx <= x1 && w.cy >= y0 && w.cy <= y1;

  const rowLines = dedupe(
    lines(height, (y) => {
      let n = 0;
      for (let x = 0; x < width; x++) if (dark(x, y)) n++;
      return n > width * 0.55;
    }),
    6,
  );
  const bands = rowLines.slice(1).map((y, i) => [rowLines[i], y]);

  // Which table (balance / dynamic) a band belongs to: the last title above it.
  const titles = words
    .filter((w) => w.text === "BALANCE" || w.text === "DYNAMIC")
    .map((w) => ({ y: w.cy, family: w.text === "BALANCE" ? "balance" : "dynamic" }))
    .sort((a, b) => a.y - b.y);
  const familyAt = (y) => titles.filter((t) => t.y < y).at(-1)?.family;

  const summary = [];
  let currentRow = null;
  for (let b = 0; b < bands.length; b++) {
    const [y0, y1] = bands[b];
    const family = familyAt(y0);
    if (!family || y1 - y0 < 60 * (dpi / 220)) continue; // headers and VALUE bands
    const bandWords = words.filter((w) => inside(w, 0, y0, width, y1));
    if (bandWords.some((w) => /^(PRE-YOUTH|EXERCISE)$/.test(w.text))) continue;

    const cols = dedupe(
      lines(width, (x) => {
        let n = 0;
        for (let y = y0 + 3; y < y1 - 3; y++) if (dark(x, y)) n++;
        return n > (y1 - y0 - 6) * 0.85;
      }),
      6,
    );
    if (cols.length < 3) continue;
    const label = bandWords.filter((w) => w.cx < cols[1]);
    const rowWord = label.findIndex((w) => w.text === "ROW");
    const roman = label.find((w, i) => i > rowWord && /^[IVX]+$/.test(w.text))?.text;
    if (rowWord >= 0 && roman) currentRow = roman;

    // The VALUE band right under this picture band.
    const next = bands[b + 1];
    const valueWords = next
      ? words.filter((w) => inside(w, 0, next[0], width, next[1]) && /^(-|\d\.\d)$/.test(w.text))
      : [];

    for (let c = 1; c < cols.length - 1; c++) {
      const [x0, x1] = [cols[c], cols[c + 1]];
      if (x1 - x0 < 30) continue;
      const cellWords = bandWords.filter((w) => inside(w, x0, y0, x1, y1));
      const text = cellWords.map((w) => w.text).join(" ");
      if (/OPTIONAL|Support/.test(text)) continue;
      let name = null;
      const i = cellWords.findIndex((w) => /Box\d*$/i.test(w.text));
      if (i >= 0) {
        const glued = cellWords[i].text.replace(/^.*box/i, "");
        const num = glued || cellWords.slice(i + 1).find((w) => /^\d+[a-z]?$/.test(w.text))?.text;
        if (num) name = `ROW-${currentRow}-${num}`;
      }
      const t = cellWords.find((w) => /^T\d+$/.test(w.text));
      if (!name && t) name = `T-${t.text.slice(1)}`;
      if (!name) {
        if (text) summary.push({ family, skipped: text });
        continue;
      }
      const values = valueWords.filter((w) => w.cx >= x0 && w.cx <= x1).map((w) => w.text);
      const inset = 4;
      const cell = await sharp(pagePath)
        .extract({ left: x0 + inset, top: y0 + inset, width: x1 - x0 - inset * 2, height: y1 - y0 - inset * 2 })
        .flatten({ background: "#ffffff" })
        .toBuffer();
      const dir = path.join(outDir, family);
      fs.mkdirSync(dir, { recursive: true });
      await sharp(cell)
        .trim({ background: "#ffffff", threshold: 40 })
        .extend({ top: 4, bottom: 4, left: 4, right: 4, background: "#ffffff" })
        .png({ compressionLevel: 9, palette: true })
        .toFile(path.join(dir, `${name}.png`));
      summary.push({ family, name, values, text });
    }
  }
  return summary;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [pagePath, wordsPath, dpi, outDir] = process.argv.slice(2);
  if (!pagePath || !wordsPath || !dpi || !outDir) {
    console.error("Usage: node scripts/cut-box-table.mjs <page.png> <words.html> <dpi> <out-dir>");
    process.exit(1);
  }
  console.log(JSON.stringify(await cutBoxTable(pagePath, wordsPath, Number(dpi), outDir), null, 1));
}
