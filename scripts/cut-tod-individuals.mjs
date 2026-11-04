/**
 * Cut FIG Table of Difficulty individual elements (ACRO ToD 2025-2028,
 * printed pages 111-119) into pictures plus a JSON summary for transcription.
 *
 * Three page layouts, chosen with <mode>:
 * - grid: boxes with an "NNN-V n" label under each (Balance, Flexibility,
 *   Agilities p.114). Writes <id>.png.
 * - landing: each agility picture is followed by its landing table (rows
 *   A–I: a landing picture and its value; p.115-118). Writes <id>.png and
 *   <id>-<letter>.png for every landing with a value.
 * - tumbling: one table of columns 1-21 (a picture each) × twists (p.119).
 *   Writes col-<n>.png; values come from the summary.
 *
 * The grid comes from the rendered page; ids, values and letters from the
 * PDF's word positions (`pdftotext -bbox`).
 *
 * Usage: node scripts/cut-tod-individuals.mjs <mode> <page.png> <words.html> <dpi> <out-dir>
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

async function page(pagePath, wordsPath, dpi) {
  const { data, info } = await sharp(pagePath).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const dark = (x, y) => data[y * width + x] < DARK;
  const words = readWords(wordsPath, dpi / 72);
  const inside = (w, x0, y0, x1, y1) => w.cx >= x0 && w.cx <= x1 && w.cy >= y0 && w.cy <= y1;
  /** Horizontal lines covering at least `share` of [x0, x1]. */
  const hLines = (x0, x1, share, y0 = 0, y1 = height) =>
    dedupe(
      lines(y1 - y0, (i) => {
        let n = 0;
        for (let x = x0; x < x1; x++) if (dark(x, y0 + i)) n++;
        return n > (x1 - x0) * share;
      }).map((y) => y + y0),
      6,
    );
  /** Vertical lines covering at least `share` of [y0, y1]. */
  const vLines = (y0, y1, share, x0 = 0, x1 = width) =>
    dedupe(
      lines(x1 - x0, (i) => {
        let n = 0;
        for (let y = y0; y < y1; y++) if (dark(x0 + i, y)) n++;
        return n > (y1 - y0) * share;
      }).map((x) => x + x0),
      6,
    );
  async function save(box, file) {
    const inset = 3;
    const region = {
      left: Math.round(box.x0 + inset),
      top: Math.round(box.y0 + inset),
      width: Math.round(box.x1 - box.x0 - inset * 2),
      height: Math.round(box.y1 - box.y0 - inset * 2),
    };
    const cell = await sharp(pagePath).extract(region).flatten({ background: "#ffffff" }).toBuffer();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp(cell)
      .trim({ background: "#ffffff", threshold: 40 })
      .extend({ top: 4, bottom: 4, left: 4, right: 4, background: "#ffffff" })
      .png({ compressionLevel: 9, palette: true })
      .toFile(file);
  }
  const ink = (box) => {
    let n = 0;
    for (let y = Math.round(box.y0) + 4; y < box.y1 - 4; y++)
      for (let x = Math.round(box.x0) + 4; x < box.x1 - 4; x++) if (dark(x, y)) n++;
    return n;
  };
  /** Dark pixels along row y. */
  const darkAcross = (y) => {
    let n = 0;
    for (let x = 0; x < width; x++) if (dark(x, y)) n++;
    return n;
  };
  return { width, height, words, inside, hLines, vLines, save, ink, darkAcross };
}

/** Grid pages: picture bands, each with a label band ("001-V 1") under it. */
async function grid(p, outDir) {
  const rows = p.hLines(0, p.width, 0.55);
  const bands = rows.slice(1).map((y, i) => [rows[i], y]);
  const summary = [];
  for (let b = 0; b < bands.length - 1; b++) {
    const [y0, y1] = bands[b];
    const [l0, l1] = bands[b + 1];
    if (y1 - y0 < 100 || l1 - l0 > 60) continue; // need a picture band then a label band
    const cols = p.vLines(y0, y1, 0.9);
    const labels = p.words.filter((w) => p.inside(w, 0, l0 - 4, p.width, l1 + 4));
    for (let c = 0; c < cols.length - 1; c++) {
      const box = { x0: cols[c], y0, x1: cols[c + 1], y1 };
      const text = labels.filter((w) => w.cx > box.x0 && w.cx < box.x1).map((w) => w.text).join(" ");
      const m = text.match(/^(\d{3})(?:-V\s*(\d+))?/);
      if (!m) continue;
      const [, id, value] = m;
      if (!value) {
        if (p.ink(box) > 400) summary.push({ id, note: "picture without a value", text });
        continue;
      }
      const extra = p.words.filter((w) => p.inside(w, box.x0, y0, box.x1, y1)).map((w) => w.text).join(" ");
      await p.save(box, path.join(outDir, `${id}.png`));
      summary.push({ id, value: Number(value), text: extra });
    }
  }
  return summary;
}

/** Landing pages: [element picture][letters A–I][landing picture][value] × 5 per block. */
async function landing(p, outDir) {
  // Block borders span the whole table; landing row lines only part of it, so
  // keep the lines nearly as long as the longest one.
  const candidates = p.hLines(0, p.width, 0.5);
  const longest = Math.max(...candidates.map(p.darkAcross));
  const rows = candidates.filter((y) => p.darkAcross(y) > longest * 0.9);
  const summary = [];
  // A block is the tall band between two full-width lines whose next band holds the ids.
  const bands = rows.slice(1).map((y, i) => [rows[i], y]);
  for (let b = 0; b < bands.length; b++) {
    const [y0, y1] = bands[b];
    if (y1 - y0 < 300) continue;
    const footer = bands[b + 1];
    const ids = p.words.filter(
      (w) => /^\d{3}$/.test(w.text) && footer && p.inside(w, 0, footer[0] - 4, p.width, footer[1] + 4),
    );
    const letters = p.words.filter((w) => /^[A-GI]$/.test(w.text) && p.inside(w, 0, y0, p.width, y1));
    const values = p.words.filter((w) => /^\d{1,2}$/.test(w.text) && p.inside(w, 0, y0, p.width, y1));
    // Letter columns: one per element, left to right.
    const letterXs = dedupe([...new Set(letters.filter((w) => w.text === "A").map((w) => Math.round(w.x0)))].sort((a, b) => a - b), 20);
    const cols = p.vLines(y0, y1, 0.9);
    for (const [k, lx] of letterXs.entries()) {
      // The element picture sits left of its letter column; its id is the footer word under it.
      const right = cols.filter((x) => x < lx - 2).at(-1);
      const left = cols.filter((x) => x < right - 20).at(-1);
      const id = ids.find((w) => w.cx > left && w.cx < right)?.text;
      if (!id) {
        summary.push({ note: `no id for letter column ${k}`, lx });
        continue;
      }
      // Landing table columns: letter | picture | value.
      const tableCols = cols.filter((x) => x > right - 2).slice(0, 4);
      const [, picX0, picX1, valX1] = tableCols;
      // Each landing row is centred on its letter; rows are 1/8 of the table.
      const rowH = (y1 - y0) / 8;
      const landings = [];
      for (const letter of letters.filter((w) => Math.abs(w.x0 - lx) < 10)) {
        const top = letter.cy - rowH / 2;
        const bottom = letter.cy + rowH / 2;
        const value = values.find((w) => w.cx > picX1 && w.cx < valX1 && Math.abs(w.cy - letter.cy) < rowH * 0.35);
        if (!value) continue;
        // Stay clear of the row lines above and below.
        const box = { x0: picX0 + 4, y0: top + rowH * 0.12, x1: picX1 - 4, y1: bottom - rowH * 0.12 };
        if (p.ink(box) > 80) await p.save(box, path.join(outDir, `${id}-${letter.text}.png`));
        landings.push({ letter: letter.text, value: Number(value.text), picture: p.ink(box) > 80 });
      }
      if (!landings.length) continue; // an empty box in the table
      const elementBox = { x0: left, y0, x1: right, y1 };
      await p.save(elementBox, path.join(outDir, `${id}.png`));
      const extra = p.words.filter((w) => p.inside(w, left, y0, right, y1)).map((w) => w.text).join(" ");
      summary.push({ id, text: extra, landings });
    }
  }
  return summary;
}

/** Tumbling: column pictures 1–21 and the value grid (rows = twists 0°…1080°). */
async function tumbling(p, outDir) {
  const numbers = p.words.filter((w) => /^\d+$/.test(w.text));
  // The header row of column numbers 1..21 sits right under the pictures.
  const header = numbers.filter((w) => Number(w.text) <= 21);
  const byRow = new Map();
  for (const w of header) {
    const key = Math.round(w.cy / 6);
    byRow.set(key, [...(byRow.get(key) ?? []), w]);
  }
  const headerRow = [...byRow.values()].find((r) => r.length >= 20).sort((a, b) => a.cx - b.cx);
  const twists = p.words.filter((w) => /^\d+°$/.test(w.text)).sort((a, b) => a.cy - b.cy);
  const cols = p.vLines(Math.round(headerRow[0].y0 - 150), Math.round(headerRow[0].y0 - 10), 0.8);
  const rowTop = Math.round(headerRow[0].y0 - 6);
  const picLines = p.hLines(cols[0], cols.at(-1), 0.6, rowTop - 260, rowTop);
  const picTop = picLines.at(-2) ?? rowTop - 140;
  const summary = [];
  for (const h of headerRow) {
    const col = Number(h.text);
    const x0 = cols.filter((x) => x < h.cx).at(-1);
    const x1 = cols.find((x) => x > h.cx);
    await p.save({ x0, y0: picTop, x1, y1: rowTop }, path.join(outDir, `col-${col}.png`));
    const values = twists.map((t) => {
      const v = numbers.find((w) => Math.abs(w.cy - t.cy) < 6 && w.cx > x0 && w.cx < x1);
      return v ? Number(v.text) : null;
    });
    summary.push({ col, values: Object.fromEntries(twists.map((t, i) => [t.text, values[i]])) });
  }
  return summary;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [mode, pagePath, wordsPath, dpi, outDir] = process.argv.slice(2);
  const modes = { grid, landing, tumbling };
  if (!modes[mode] || !outDir) {
    console.error("Usage: node scripts/cut-tod-individuals.mjs <grid|landing|tumbling> <page.png> <words.html> <dpi> <out-dir>");
    process.exit(1);
  }
  const p = await page(pagePath, wordsPath, Number(dpi));
  console.log(JSON.stringify(await modes[mode](p, outDir), null, 1));
}
