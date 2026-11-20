import fs from "node:fs";
// Parse an SVG from pdftocairo: every <path> with its transform applied, as point lists in PDF points (y down).
export function paths(file) {
  const svg = fs.readFileSync(file, "utf8");
  const out = [];
  const re = /<path ([^>]*?)\/>/g;
  for (let m; (m = re.exec(svg)); ) {
    const attrs = m[1];
    const d = attrs.match(/ d="([^"]*)"/)?.[1];
    if (!d) continue;
    const t = attrs.match(/transform="matrix\(([^)]*)\)"/)?.[1]?.split(",").map(Number) ?? [1, 0, 0, 1, 0, 0];
    const tok = d.trim().split(/\s+/);
    const pts = []; let curves = 0, subpaths = 0;
    for (let i = 0; i < tok.length; ) {
      const c = tok[i++];
      if (c === "M" || c === "L") { pts.push([+tok[i], +tok[i + 1]]); i += 2; if (c === "M") subpaths++; }
      else if (c === "C") { pts.push([+tok[i + 4], +tok[i + 5]]); i += 6; curves++; }
      else if (c === "Z") {}
    }
    const P = pts.map(([x, y]) => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]]);
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    out.push({ pts: P, curves, subpaths, stroke: /stroke="rgb/.test(attrs), fill: attrs.match(/fill="([^"]*)"/)?.[1], sw: +(attrs.match(/stroke-width="([^"]*)"/)?.[1] ?? 0),
      bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
  }
  return out;
}
