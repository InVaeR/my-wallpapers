"""Генерирует лёгкое превью-видео для галереи.

Рендер в 1920x1080 -> downscale в 480p webm + poster.jpg (первый кадр).

Примеры:
    python tools/generate_preview.py matrix-rain
    python tools/generate_preview.py --all --duration 4
"""
import argparse
import asyncio
import shutil
import subprocess
from pathlib import Path

from capture import capture_frames, list_wallpapers, WALLPAPERS_DIR

RENDER_W, RENDER_H = 1920, 1080   # честный рендер
PREVIEW_H = 480                   # высота превью (ширина по соотношению)


async def make_preview(wallpaper_id: str, duration: float, fps: int, warmup: float):
    folder = WALLPAPERS_DIR / wallpaper_id
    n_frames = int(duration * fps)

    frames = await capture_frames(
        wallpaper_id, RENDER_W, RENDER_H,
        warmup=warmup, n_frames=n_frames, fps=fps,
    )
    frames_dir = folder / ".frames"

    # poster из первого кадра
    poster = folder / "poster.jpg"
    subprocess.run([
        "ffmpeg", "-y", "-i", str(frames[0]),
        "-vf", f"scale=-2:{PREVIEW_H}", "-q:v", "3", str(poster),
    ], check=True)

    # webm из всех кадров с downscale
    preview = folder / "preview.webm"
    subprocess.run([
        "ffmpeg", "-y", "-framerate", str(fps),
        "-i", str(frames_dir / "frame_%04d.png"),
        "-vf", f"scale=-2:{PREVIEW_H}",
        "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "34",
        "-pix_fmt", "yuv420p", "-an", str(preview),
    ], check=True)

    shutil.rmtree(frames_dir)
    print(f"[OK] {preview.name} + {poster.name} для {wallpaper_id}")


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wallpaper", nargs="?")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--duration", type=float, default=4.0, help="секунд видео")
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--warmup", type=float, default=2.0)
    args = ap.parse_args()

    targets = list_wallpapers() if args.all else [args.wallpaper]
    if not targets or targets == [None]:
        ap.error("укажите id обоев или --all")

    for wid in targets:
        await make_preview(wid, args.duration, args.fps, args.warmup)


if __name__ == "__main__":
    asyncio.run(main())