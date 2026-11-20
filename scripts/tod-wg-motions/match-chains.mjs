import fs from "node:fs";
const page = process.argv[2];
if (!/^\d+$/.test(page ?? "") || !fs.existsSync(`p${page}.json`)) {
  console.error("Usage: node match-chains.mjs <pdf-page>   (run read-page.mjs first; reads p<page>.json in the current folder)");
  process.exit(1);
}
const { white, arrows, letters } = JSON.parse(fs.readFileSync(`p${page}.json`, "utf8"));
const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const out = []; const report = [];
for (const side of [0, 1]) {
  const inSide = (x) => (side ? x > 396 : x < 396);
  const L = letters.filter((l) => inSide(l.x));
  const nonG = L.filter((l) => l.t !== "G");
  const cx = nonG.reduce((s, l) => s + l.x, 0) / nonG.length, cy = nonG.reduce((s, l) => s + l.y, 0) / nonG.length;
  const pos = {};
  for (const l of L) if (!pos[l.t] || Math.hypot(l.x - cx, l.y - cy) < Math.hypot(pos[l.t].x - cx, pos[l.t].y - cy)) pos[l.t] = l;
  const ang = (x, y) => Math.atan2(y - cy, x - cx);
  const adiff = (a, b) => Math.abs(((a - b + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
  const near = (p) => Object.values(pos).map((l) => ({ l, s: adiff(ang(l.x, l.y), ang(p[0], p[1])) })).sort((a, b) => a.s - b.s)[0].l.t;
  const W = white.filter((c) => inSide(c.x)).map((c, i) => ({ ...c, i, p: [c.x, c.y] }));
  const real = arrows.filter((a) => inSide(a.a[0]) && Math.abs(a.a[0] - 396) > 6 && Math.hypot(a.a[0] - cx, a.a[1] - cy) < 260);
  const tips = real.flatMap((ar, k) => [{ k, tip: ar.a, other: ar.b }, { k, tip: ar.b, other: ar.a }]);
  const grow = (first, dir0) => {
    const ch = [first]; let dir = dir0, cost = 0, step0 = null;
    while (ch.length < 4) {
      const cur = ch.at(-1);
      const opts = W.filter((o) => !ch.includes(o)).map((o) => { const v = [o.x - cur.x, o.y - cur.y], l = Math.hypot(...v); return { o, l, cos: (v[0] * dir[0] + v[1] * dir[1]) / l }; })
        .filter((x) => x.l < 1.7 * (cur.r + x.o.r) && x.l > 0.7 * (cur.r + x.o.r) && x.cos > 0.5);
      opts.sort((p, q) => (1 - p.cos) * 3 + p.l / (cur.r + p.o.r) - ((1 - q.cos) * 3 + q.l / (cur.r + q.o.r)));
      const b = opts[0]; if (!b) return null;
      cost += (1 - b.cos) * 20 + (step0 ? Math.abs(b.l / step0 - 1) * 5 : 0);
      step0 ??= b.l; dir = [(b.o.x - cur.x) / b.l, (b.o.y - cur.y) / b.l]; ch.push(b.o);
    }
    return { ch, cost };
  };
  const cand = [];
  for (const [ti, t] of tips.entries()) {
    const ad = [t.tip[0] - t.other[0], t.tip[1] - t.other[1]]; const an = Math.hypot(...ad);
    const firsts = W.map((c) => ({ c, s: d(c.p, t.tip) })).filter((x) => x.s < 32).sort((a, b) => a.s - b.s).slice(0, 4);
    for (const { c, s } of firsts) {
      const td = [c.x - t.tip[0], c.y - t.tip[1]]; const tn = Math.hypot(...td) || 1;
      for (const dir0 of [[ad[0] / an, ad[1] / an], [td[0] / tn, td[1] / tn]]) {
        const g = grow(c, dir0); if (g) cand.push({ ti, ch: g.ch, s: s + g.cost });
      }
    }
  }
  cand.sort((a, b) => a.s - b.s);
  const usedC = new Set(), doneT = new Map();
  for (const c of cand) {
    if (doneT.has(c.ti) || c.ch.some((x) => usedC.has(x.i))) continue;
    doneT.set(c.ti, c.ch); c.ch.forEach((x) => usedC.add(x.i));
  }
  // an arrow with neither end on a row is not a motion arrow (stray mark): drop it
  const dead = new Set(tips.map((t, ti) => ti).filter((ti) => !doneT.has(ti) && !doneT.has(tips.findIndex((o, oi) => o.k === tips[ti].k && oi !== ti))).map((ti) => tips[ti].k));
  if (dead.size) report.push(`  p${page} s${side}: dropped ${dead.size} arrow(s) with no circles at either end`);
  const unT = tips.map((t, ti) => ti).filter((ti) => !doneT.has(ti) && !dead.has(tips[ti].k));
  const unC = W.filter((c) => !usedC.has(c.i));
  if (unT.length === 1 && unC.length === 4) {
    const t = tips[unT[0]];
    const ch = unC.sort((a, b) => d(a.p, t.tip) - d(b.p, t.tip));
    doneT.set(unT[0], ch); ch.forEach((x) => usedC.add(x.i)); report.push(`  p${page} s${side}: leftover row assigned to the one unmatched arrow end (check it on the overlay)`);
  }
  const ends = tips.map((t, ti) => { const ch = doneT.get(ti); const at = ch ? [ch.reduce((s, c) => s + c.x, 0) / 4, ch.reduce((s, c) => s + c.y, 0) / 4] : t.tip; return { ...t, ch, to: near(at) }; });
  const mot = [];
  for (const e of ends.filter((e) => !dead.has(e.k))) {
    const partner = ends.find((o) => o.k === e.k && o !== e);
    mot.push({ side, from: partner.to, to: e.to, vals: e.ch ? e.ch.map((c) => c.t).reverse() : null, chain: e.ch?.map(({ x, y, t }) => ({ x, y, t })), tip: e.tip });
  }
  const ok = mot.filter((m) => m.vals);
  const pairs = {}; for (const o of ok) { const k = o.from + o.to; pairs[k] = (pairs[k] || 0) + 1; }
  const P = Object.keys(pos).sort(); const missing = []; for (const a of P) for (const b of P) if (a !== b && !pairs[a + b]) missing.push(a + b);
  report.push(`p${page} s${side}: arrows ${real.length}, matched ${ok.length}, missing ${missing.join(" ") || "-"}, dup ${Object.entries(pairs).filter(([, v]) => v > 1).map(([k]) => k).join(" ") || "-"}, unused circles ${W.length - usedC.size}: ${W.filter((c) => !usedC.has(c.i)).map((c) => c.t).join(",")}`);
  // Arrows to or from a position the table lacks end on rows of "-" (or blanks): not motions.
  const motions = ok.filter((m) => m.vals.some((v) => /^\d+$/.test(v)));
  report.push(`  p${page} s${side}: ${motions.length} motions written, ${ok.length - motions.length} without values (position not in the table) left out`);
  out.push(...motions);
}
fs.writeFileSync(`m${page}.json`, JSON.stringify(out, null, 1));
console.log(report.join("\n"));
