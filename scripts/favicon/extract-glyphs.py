import json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

REPO = "/Users/gabor.seboek/Documents/Projects/Private/fiorevera/public/fonts/"
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
