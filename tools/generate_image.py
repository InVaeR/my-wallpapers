"""Создаёт статичный скриншот обоев заданного разрешения.

Примеры:
    python tools/generate_image.py matrix-rain --res 3840x2160
    python tools/generate_image.py --all --res 1920x1080
"""
import argparse
import asyncio
from pathlib import Path

from capture import capture_frames, list_wallpapers, WALLPAPERS_DIR


def parse_res(s: str) -> tuple[int, int]:
    w, h = s.lower().split("x")
    return int(w), int(h)


async def make_image(wallpaper_id: str, width: int, height: int, warmup: float):
    frames = await capture_frames(
        wallpaper_id, width, height, warmup=warmup, n_frames=1
    )
    out = WALLPAPERS_DIR / wallpaper_id / f"wallpaper_{width}x{height}.png"
    frames[0].replace(out)
    # чистим временную папку
    (WALLPAPERS_DIR / wallpaper_id / ".frames").rmdir()
    print(f"[OK] {out.relative_to(WALLPAPERS_DIR.parent)}")


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wallpaper", nargs="?", help="id папки обоев")
    ap.add_argument("--all", action="store_true", help="для всех обоев")
    ap.add_argument("--res", default="1920x1080", help="например 3840x2160")
    ap.add_argument("--warmup", type=float, default=2.0)
    args = ap.parse_args()

    width, height = parse_res(args.res)
    targets = list_wallpapers() if args.all else [args.wallpaper]
    if not targets or targets == [None]:
        ap.error("укажите id обоев или --all")

    for wid in targets:
        await make_image(wid, width, height, args.warmup)


if __name__ == "__main__":
    asyncio.run(main())