"""Rebuild the exhibition webfont from Adobe's SourceHanSansCN-VF.ttf (release 2.005)."""
from html.parser import HTMLParser
from pathlib import Path
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.characters = set(chr(n) for n in range(32, 127))
        self.ignored = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "metadata"}:
            self.ignored += 1
        for name, value in attrs:
            if name in {"data-en", "data-zh", "data-alt-en", "aria-label", "alt", "title"}:
                self.characters.update(value or "")

    def handle_endtag(self, tag):
        if tag in {"script", "style", "metadata"}:
            self.ignored = max(0, self.ignored - 1)

    def handle_data(self, data):
        if not self.ignored:
            self.characters.update(data)


if __name__ == "__main__":
    source = TTFont(sys.argv[1], recalcTimestamp=False)
    text = VisibleText()
    text.feed((ROOT / "works/index.html").read_text())
    for file in ("work-directory.mjs", "work-reel.mjs", "demo-showcase.mjs", "new-work-previews.mjs"):
        text.characters.update((ROOT / "assets" / file).read_text())
    options = subset.Options()
    options.name_IDs = ["*"]
    sub = subset.Subsetter(options=options)
    sub.populate(text="".join(sorted(text.characters)))
    sub.subset(source)
    names = source["name"]
    # The upstream licence reserves "Source". Give the derived subset its own family name.
    for record in names.names:
        if record.nameID < 256 and record.nameID not in {1, 3, 4, 6, 16, 17, 21, 22, 25}:
            continue
        value = record.toUnicode()
        for old, new in [("Source Han Sans CN VF", "Exhibit Sans"),
                         ("SourceHanSansCNVF", "ExhibitSans"),
                         ("SourceHanSansCN", "ExhibitSans"), ("思源黑体", "Exhibit Sans")]:
            value = value.replace(old, new)
        if record.nameID in {1, 3, 4, 16, 21}:
            value = "Exhibit Sans"
        if record.nameID in {6, 25}:
            value = "ExhibitSans"
        record.string = value.encode(record.getEncoding(), errors="replace")
    source.flavor = "woff"
    source.save(ROOT / "assets/work/type/exhibit-sans.woff")
