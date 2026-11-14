# TOD WG motions (wheel arrows)

Reads the motion values of the Women's Group top wheels (TOD 2025-2028, PDF pages 57-60 = printed 54-57) from the PDF's vector drawing, not by eye. The reviewed result is in `catalog/FIG/tod-wg-tops.json` (`motions` of each wheel table).

Run it in an empty working folder (the scripts read and write files in the current folder); `TOD` is the path to the PDF and `S` this scripts folder:

```sh
TOD="/path/to/en_2025-2028 ACRO Table of Difficulty.pdf"
S=/path/to/tariff_wizard/scripts/tod-wg-motions
for p in 57 58 59 60; do
  pdftocairo -svg -f $p -l $p "$TOD" p$p.svg
  pdftotext -bbox -f $p -l $p "$TOD" w$p.html
  node $S/read-page.mjs p$p.svg w$p.html   # -> p$p.json: white circles and their numbers, arrows, position letters
  node $S/match-chains.mjs $p              # -> m$p.json: one entry per motion (side, from, to, vals from group 1 to 4)
done
```

- Each motion arrow is a two-headed filled path; each end points at a row of 4 white circles. A motion X->Y takes the row at the Y end. From the arrowhead outwards the values go group 4 -> group 1.
- `match-chains.mjs` tries several starting circles per arrow end, scores how straight and evenly spaced the row is, and assigns rows to arrow ends wheel-wide so no circle is used twice. Arrows with no row at either end (stray marks) are dropped. If exactly one arrow end and one row of 4 circles are left over, it gives that row to that end and says so: check those on an overlay (it happens on PDF 57 right wheel, Table 2 A->B, and PDF 58 right wheel).
- Arrows to or from a position the table lacks (G in tables 6, 9, 12; C in 7, 10, 13) end on rows of "-": they are left out of `m$p.json`, so 7-position wheels give 42 motions and 6-position wheels 30.
- Check the report: no missing pairs, no duplicates, and 0 unused circles, except PDF 60, which has 4 spare "-" circles per wheel.
- Left wheel = side 0, right = side 1: 57 Tab1/Tab2, 58 Tab6/Tab7, 59 Tab9/Tab10, 60 Tab12/Tab13.
- The geometry is tuned to this PDF (page width split at x = 396 pt, wheel radius 260 pt, circle and font sizes, arrow path point order). Another edition of the TOD may need these constants changed.
