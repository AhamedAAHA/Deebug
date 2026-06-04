"""Prepare Dee Bug logo: remove background, keep white text only, light bold pass."""
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC_CANDIDATES = [
    ROOT / "DeeBug-logo.png",
    ROOT / "1.png",
]
OUT = Path(__file__).resolve().parents[1] / "public" / "logo.png"


def is_background_pixel(r: int, g: int, b: int, bg: tuple[int, int, int]) -> bool:
    brightness = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)
    dr = abs(r - bg[0])
    dg = abs(g - bg[1])
    db = abs(b - bg[2])
    if dr + dg + db <= 40:
        return True
    if brightness <= 48 and spread <= 24:
        return True
    if brightness >= 252 and spread <= 6:
        return True
    return False


def remove_background(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    bg = rgba.getpixel((0, 0))[:3]
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            brightness = (r + g + b) / 3
            if is_background_pixel(r, g, b, bg) or brightness < 90:
                px[x, y] = (0, 0, 0, 0)
            else:
                alpha = min(255, int(255 * (brightness - 90) / 165))
                px[x, y] = (255, 255, 255, max(alpha, 0))
    return rgba


def bold_strokes(img: Image.Image, radius: int = 2) -> Image.Image:
    if radius <= 0:
        return img
    r, g, b, a = img.split()
    size = radius * 2 + 1
    a_b = a.filter(ImageFilter.MaxFilter(size))
    return Image.merge("RGBA", (r, g, b, a_b))


def trim_transparent(img: Image.Image, pad: int = 8) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def main() -> None:
    src = next((p for p in SRC_CANDIDATES if p.exists()), OUT)
    img = Image.open(src)
    img = remove_background(img)
    img = bold_strokes(img, radius=2)
    img = trim_transparent(img)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, format="PNG", optimize=True)
    print(f"Wrote {OUT} ({img.size[0]}x{img.size[1]}) from {src}")


if __name__ == "__main__":
    main()
