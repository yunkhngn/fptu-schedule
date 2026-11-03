#!/usr/bin/env python3
"""Draw the FPTU Schedule master icon (flat calendar + clock on the accent blue).

Writes a 512x512 RGBA PNG (default: repo-root icon.png). Run scripts/build-icons.py afterwards
to regenerate icon-16/48/128.png. Pure Pillow, no SVG renderer needed.

Palette follows popup.css / docs/styles.css: --accent #2563eb, --accent-hover #1d4ed8.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_SIZE = 512
SS = 4  # supersampling factor for smooth edges

ACCENT_TOP = (59, 130, 246)      # #3b82f6
ACCENT_BOTTOM = (29, 78, 216)    # #1d4ed8
NAVY = (30, 64, 175)             # #1e40af  calendar header
WHITE = (255, 255, 255)
SOFT = (219, 234, 254)           # #dbeafe  idle day cells
ACCENT = (37, 99, 235)           # #2563eb  highlighted day, clock rim
INK = (30, 58, 138)              # #1e3a8a  clock hands
TICK = (147, 197, 253)           # #93c5fd  clock ticks


def px(v):
    return int(round(v * SS))


def box(x0, y0, x1, y1):
    return [px(x0), px(y0), px(x1), px(y1)]


def gradient_square(size):
    img = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        c = tuple(int(round(a + (b - a) * t)) for a, b in zip(ACCENT_TOP, ACCENT_BOTTOM))
        d.line([(0, y), (size, y)], fill=c + (255,))
    return img


def main(out: Path) -> None:
    size = px(1024)

    # Background: rounded square filled with the accent gradient.
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(box(0, 0, 1024, 1024), radius=px(230), fill=255)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(gradient_square(size), (0, 0), mask)
    d = ImageDraw.Draw(canvas)

    # Calendar body, header band and binder rings.
    body = (196, 262, 828, 818)
    d.rounded_rectangle(box(*body), radius=px(78), fill=WHITE)
    header = Image.new("L", (size, size), 0)
    hd = ImageDraw.Draw(header)
    hd.rounded_rectangle(box(*body), radius=px(78), fill=255)
    hd.rectangle(box(0, 430, 1024, 1024), fill=0)  # keep only the top band
    canvas.paste(Image.new("RGBA", (size, size), NAVY + (255,)), (0, 0), header)
    d = ImageDraw.Draw(canvas)
    for cx in (340, 684):
        d.rounded_rectangle(box(cx - 27, 204, cx + 27, 332), radius=px(27), fill=WHITE)

    # Day grid (3 x 2); the first cell is the highlighted "today".
    cell, gap = 108, 34
    x_start = 196 + (632 - (3 * cell + 2 * gap)) // 2
    y_start = 482
    for row in range(2):
        for col in range(3):
            x = x_start + col * (cell + gap)
            y = y_start + row * (cell + gap)
            fill = ACCENT if (row, col) == (0, 0) else SOFT
            d.rounded_rectangle(box(x, y, x + cell, y + cell), radius=px(26), fill=fill)

    # Clock badge, bottom right, separated from the calendar by an accent ring.
    cx, cy = 768, 760
    d.ellipse(box(cx - 176, cy - 176, cx + 176, cy + 176), fill=ACCENT)
    d.ellipse(box(cx - 142, cy - 142, cx + 142, cy + 142), fill=WHITE)
    for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0)):
        tx, ty = cx + dx * 108, cy + dy * 108
        d.ellipse(box(tx - 9, ty - 9, tx + 9, ty + 9), fill=TICK)
    d.rounded_rectangle(box(cx - 12, cy - 92, cx + 12, cy + 12), radius=px(12), fill=INK)   # hour
    d.rounded_rectangle(box(cx - 12, cy - 12, cx + 78, cy + 12), radius=px(12), fill=INK)   # minute
    d.ellipse(box(cx - 20, cy - 20, cx + 20, cy + 20), fill=ACCENT)

    img = canvas.resize((OUT_SIZE, OUT_SIZE), Image.Resampling.LANCZOS)
    img.save(out, format="PNG", optimize=True)
    print("Wrote", out)


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "icon.png")
