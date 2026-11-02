/**
 * Cut element pictures out of a rendered difficulty table (ROW I… × columns A–D).
 *
 * Finds the table's grid lines, takes each tall picture row (the short "Valor"
 * row under it is skipped), trims every cell to its drawing and writes
 * ROW-<row>-<column>.png. Empty cells are skipped.
 *
 * Usage: node scripts/cut-table-cells.mjs <page.png> <out-dir>
 * Render PDF pages first, e.g. `pdftoppm -r 220 -png tables.pdf page`.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const COLUMNS = ["A", "B", "C", "D", "E"];
const DARK = 110;

/** Positions where a run of `isLine(i)` is true, merged into line centres. */
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

/** Drop lines closer than `gap` px to the previous one (double borders). */
function dedupe(positions, gap) {
  return positions.filter((p, i) => i === 0 || p - positions[i - 1] > gap);
}

export async function cutTable(pagePath, outDir) {
  const { data, info } = await sharp(pagePath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const dark = (x, y) => data[y * width + x] < DARK;

  // Table rows: horizontal lines spanning most of the page width.
  const rowLines = dedupe(
    lines(height, (y) => {
      let n = 0;
      for (let x = 0; x < width; x++) if (dark(x, y)) n++;
      return n > width * 0.6;
    }),
    8,
  );
  const top = rowLines[0];
  const bottom = rowLines[rowLines.length - 1];

  // Columns: vertical lines spanning most of the table body.
  const colLines = dedupe(
    lines(width, (x) => {
      let n = 0;
      for (let y = top; y <= bottom; y++) if (dark(x, y)) n++;
      return n > (bottom - top) * 0.6;
    }),
    8,
  );
  // Label column + one per element column.
  const cellCols = colLines.slice(1);
  if (cellCols.length < 5) {
    throw new Error(`${pagePath}: found ${colLines.length} column lines`);
  }

  // Picture rows are the tall bands; each is followed by a short Valor band.
  const bands = rowLines.slice(1).map((y, i) => [rowLines[i], y]);
  const tallest = Math.max(...bands.map(([a, b]) => b - a));
  const pictureRows = bands.filter(([a, b]) => b - a > tallest * 0.6);
  if (process.env.DEBUG) console.error({ rowLines, colLines, pictureRows });

  fs.mkdirSync(outDir, { recursive: true });
  const written = [];
  for (const [r, [y0, y1]] of pictureRows.entries()) {
    for (let c = 0; c < cellCols.length - 1; c++) {
      const inset = 6;
      const left = cellCols[c] + inset;
      const cellTop = y0 + inset;
      const w = cellCols[c + 1] - cellCols[c] - inset * 2;
      const h = y1 - y0 - inset * 2;
      let ink = 0;
      for (let y = cellTop; y < cellTop + h; y++) {
        for (let x = left; x < left + w; x++) if (dark(x, y)) ink++;
      }
      if (ink < 150) continue; // empty cell
      const name = `ROW-${ROMAN[r]}-${COLUMNS[c]}.png`;
      // sharp trims before it extracts, so cut the cell out first.
      const cell = await sharp(pagePath)
        .extract({ left, top: cellTop, width: w, height: h })
        .flatten({ background: "#ffffff" })
        .toBuffer();
      await sharp(cell)
        .trim({ background: "#ffffff", threshold: 40 })
        .extend({ top: 4, bottom: 4, left: 4, right: 4, background: "#ffffff" })
        .png({ compressionLevel: 9, palette: true })
        .toFile(path.join(outDir, name));
      written.push(name);
    }
  }
  return written;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [pagePath, outDir] = process.argv.slice(2);
  if (!pagePath || !outDir) {
    console.error("Usage: node scripts/cut-table-cells.mjs <page.png> <out-dir>");
    process.exit(1);
  }
  const written = await cutTable(pagePath, outDir);
  console.log(`${written.length} cells → ${outDir}: ${written.join(" ")}`);
}
