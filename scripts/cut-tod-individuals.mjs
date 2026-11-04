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
  /**
   * Save the whole landing drawing of the row centred at `cy`, even where it
   * spills into the next rows (some landing cells are merged): the strokes in
   * `area` (table lines ignored), grouped into drawings, each drawing given to
   * the row whose centre is nearest its own; everything else whitened.
   */
  async function saveFigure(cy, rowCentres, area, file) {
    const ax0 = Math.round(area.x0), ay0 = Math.round(area.y0);
    const w = Math.round(area.x1) - ax0, h = Math.round(area.y1) - ay0;
    const on = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) if (dark(ax0 + x, ay0 + y)) row++;
      if (row > w * 0.6) continue; // a table line
      for (let x = 0; x < w; x++) if (dark(ax0 + x, ay0 + y)) on[y * w + x] = 1;
    }
    for (let x = 0; x < w; x++) {
      let col = 0;
      for (let y = 0; y < h; y++) if (on[y * w + x]) col++;
      if (col > h * 0.6) for (let y = 0; y < h; y++) on[y * w + x] = 0; // a column line
    }
    // Stubs of a cell border run in from the cell's left or right edge: erase them.
    for (let y = 0; y < h; y++) {
      const thin = (x) => !on[Math.max(0, y - 4) * w + x] && !on[Math.min(h - 1, y + 4) * w + x];
      for (const fromLeft of [true, false]) {
        let run = 0;
        for (let k = 0; k < w; k++) {
          const x = fromLeft ? k : w - 1 - k;
          if (!on[y * w + x] && run === 0 && k < 6) continue; // gap at the very edge
          if (!on[y * w + x] || !thin(x)) break;
          run++;
        }
        if (run >= 15)
          for (let k = 0, erased = 0; k < w && erased < run; k++) {
            const x = fromLeft ? k : w - 1 - k;
            if (on[y * w + x]) {
              on[y * w + x] = 0;
              erased++;
            }
          }
      }
    }
    // Drop border segments and dashes (thin and wide, or tiny) so they don't join drawings.
    {
      const seen = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        if (!on[i] || seen[i]) continue;
        const stack = [i], pixels = [];
        seen[i] = 1;
        let x0 = w, x1 = 0, y0 = h, y1 = 0;
        while (stack.length) {
          const j = stack.pop();
          pixels.push(j);
          const x = j % w, y = (j / w) | 0;
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const xx = x + dx, yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
              const k = yy * w + xx;
              if (on[k] && !seen[k]) {
                seen[k] = 1;
                stack.push(k);
              }
            }
        }
        // A border segment is long and thin; a dash is short and thin.
        const segment = y1 - y0 <= 6 && x1 - x0 >= 30;
        const dash = y1 - y0 <= 5 && x1 - x0 <= 16;
        if (segment || dash || pixels.length < 12) for (const j of pixels) on[j] = 0;
      }
    }
    // Strokes 4 px apart belong to one drawing.
    const label = new Int32Array(w * h).fill(-1);
    const keep = new Set();
    const drawings = [];
    const nearest = (y) => rowCentres.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
    let n = 0;
    for (let i = 0; i < w * h; i++) {
      if (!on[i] || label[i] >= 0) continue;
      const stack = [i];
      label[i] = n;
      let count = 0, minX = w, minY = h, maxX = 0, maxY = 0;
      const perRow = new Map();
      while (stack.length) {
        const j = stack.pop();
        const x = j % w, y = (j / w) | 0;
        count++;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        const row = nearest(ay0 + y);
        perRow.set(row, (perRow.get(row) ?? 0) + 1);
        for (let dy = -4; dy <= 4; dy++)
          for (let dx = -4; dx <= 4; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const k = yy * w + xx;
            if (on[k] && label[k] < 0) {
              label[k] = n;
              stack.push(k);
            }
          }
      }
      drawings.push({ id: n, count, perRow, box: [minX, minY, maxX, maxY] });
      n++;
    }
    // Big drawings belong to the row holding most of their pixels; small pieces
    // (broken leg strokes) to the nearest big drawing.
    const big = drawings.filter((d) => d.count > 200);
    const owner = new Map();
    for (const d of big) owner.set(d.id, [...d.perRow].sort((a, b) => b[1] - a[1])[0][0]);
    const gap = (a, b) =>
      Math.max(0, a.box[0] - b.box[2], b.box[0] - a.box[2]) + Math.max(0, a.box[1] - b.box[3], b.box[1] - a.box[3]);
    for (const d of drawings) {
      if (owner.has(d.id) || d.count < 12 || big.length === 0) continue;
      const near = big.reduce((a, b) => (gap(d, b) < gap(d, a) ? b : a));
      owner.set(d.id, owner.get(near.id));
    }
    for (const [id, row] of owner) if (row === cy) keep.add(id);
    const { data: rgb } = await sharp(pagePath).extract({ left: ax0, top: ay0, width: w, height: h })
      .flatten({ background: "#ffffff" }).greyscale().raw().toBuffer({ resolveWithObject: true });
    if (keep.size === 0) return false; // nothing clearly this row's: the caller crops the row
    const out = Buffer.alloc(w * h * 3, 255);
    for (let i = 0; i < w * h; i++) if (keep.has(label[i])) out[i * 3] = out[i * 3 + 1] = out[i * 3 + 2] = rgb[i];
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp(out, { raw: { width: w, height: h, channels: 3 } })
      .trim({ background: "#ffffff", threshold: 40 })
      .extend({ top: 4, bottom: 4, left: 4, right: 4, background: "#ffffff" })
      .png({ compressionLevel: 9, palette: true })
      .toFile(file);
    return true;
  }
  /** Dark pixels along row y. */
  const darkAcross = (y) => {
    let n = 0;
    for (let x = 0; x < width; x++) if (dark(x, y)) n++;
    return n;
  };
  return { width, height, words, inside, hLines, vLines, save, saveFigure, ink, darkAcross };
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
        // The landing's own cell: merged cells (a drawing spanning E and F) are
        // taller, so the whole drawing is inside it.
        const cellLines = p.hLines(Math.round(picX0), Math.round(picX1), 0.85, Math.round(y0) - 2, Math.round(y1) + 2);
        const cellTop = cellLines.filter((y) => y < letter.cy).at(-1) ?? y0;
        const cellBottom = cellLines.find((y) => y > letter.cy) ?? y1;
        const cell = { x0: picX0 + 3, y0: cellTop + 3, x1: picX1 - 3, y1: cellBottom - 3 };
        const sharing = letters.filter((w) => Math.abs(w.x0 - lx) < 10 && w.cy > cellTop && w.cy < cellBottom);
        const file = path.join(outDir, `${id}-${letter.text}.png`);
        if (p.ink(box) > 80) {
          // Its drawings (border segments dropped); a cell shared by two landings is split.
          const centres = sharing.length > 1 ? sharing.map((w) => w.cy) : [letter.cy];
          if (!(await p.saveFigure(letter.cy, centres, cell, file))) await p.save(box, file);
        }
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
