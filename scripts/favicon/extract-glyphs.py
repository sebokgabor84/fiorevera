"""
scripts/favicon/extract-glyphs.py — Cormorant Garamond outlines for the favicon crest.

Only needed when the crest gets a NEW letter or a NEW weight; the shipped outlines are already
committed in scripts/favicon/glyphs.ts and `npm run favicon` does not call this script.

Dependencies (Python 3.9+, not part of the npm install):

    python3 -m pip install fonttools brotli

  fonttools  reads the variable font and instantiates one weight (varLib.instancer)
  brotli     decompresses .woff2 — without it fontTools cannot open the files in public/fonts/

Run from anywhere:

    python3 scripts/favicon/extract-glyphs.py /tmp/glyphs.json

The JSON maps "<style>-<weight>-<char>" (e.g. "regular-700-F") to { d, bounds, adv, upm }: the SVG
path in font units (1000 upm, y up), the bounding box and the advance width. Copy the entries the
crest needs into scripts/favicon/glyphs.ts (same shape: d, bounds, advance) — that file is the only
thing the TypeScript side reads. To extract other letters, edit the two `chars` strings below.
"""
import json, sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

# The repo's self-hosted fonts, resolved from this file so the script runs in any checkout.
REPO = str(Path(__file__).resolve().parents[2] / "public" / "fonts") + "/"
out = {}
for fname, key, chars in [
    ("cormorant-garamond-latin.woff2", "regular", "FVfV"),
    ("cormorant-garamond-latin-italic.woff2", "italic", "fFV"),
]:
    f = TTFont(REPO + fname)
    axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in f["fvar"].axes} if "fvar" in f else {}
    print(fname, "axes", axes, "upm", f["head"].unitsPerEm, file=sys.stderr)
    for wght in (500, 600, 700):
        inst = instancer.instantiateVariableFont(TTFont(REPO + fname), {"wght": wght}) if axes else f
        gs = inst.getGlyphSet()
        cmap = inst.getBestCmap()
        for ch in set(chars):
            g = gs[cmap[ord(ch)]]
            pen = SVGPathPen(gs); g.draw(pen)
            bp = BoundsPen(gs); g.draw(bp)
            out[f"{key}-{wght}-{ch}"] = {"d": pen.getCommands(), "bounds": bp.bounds, "adv": g.width, "upm": inst["head"].unitsPerEm}
json.dump(out, open(sys.argv[1], "w"))
print("wrote", len(out), "glyphs", file=sys.stderr)
