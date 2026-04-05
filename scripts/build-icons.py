#!/usr/bin/env python3
"""Regenerate icon-16/48/128.png from repo-root icon.png (letterbox, transparent)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "icon.png"


def export_contain(size: int, dest: Path) -> None:
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    scale = min(size / w, size / h)
    nw = max(1, int(round(w * scale)))
    nh = max(1, int(round(h * scale)))
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox, oy = (size - nw) // 2, (size - nh) // 2
    canvas.paste(img, (ox, oy), img)
    canvas.save(dest, format="PNG", optimize=True)


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Missing {SRC}")
    for s in (16, 48, 128):
        export_contain(s, ROOT / f"icon-{s}.png")
        print("Wrote", ROOT / f"icon-{s}.png")


if __name__ == "__main__":
    main()
