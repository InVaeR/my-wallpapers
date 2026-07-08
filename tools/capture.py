"""Общий модуль для захвата кадров из HTML-обоев через Playwright."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
WALLPAPERS_DIR = ROOT / "wallpapers"


def list_wallpapers() -> list[str]:
    """Все папки обоев, в которых есть index.html."""
    return sorted(
        p.name for p in WALLPAPERS_DIR.iterdir()
        if p.is_dir() and (p / "index.html").exists()
    )


async def capture_frames(
    wallpaper_id: str,
    width: int,
    height: int,
    *,
    warmup: float = 1.5,      # сколько ждать «прогрева» анимации
    n_frames: int = 1,        # 1 = статический скрин
    fps: int = 30,
    out_dir: Path | None = None,
) -> list[Path]:
    """Рендерит обои и сохраняет N кадров PNG. Возвращает пути к кадрам."""
    src = WALLPAPERS_DIR / wallpaper_id / "index.html"
    if not src.exists():
        raise FileNotFoundError(src)

    out_dir = out_dir or (WALLPAPERS_DIR / wallpaper_id / ".frames")
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(args=["--use-gl=angle", "--enable-webgl"])
        page = await browser.new_page(viewport={"width": width, "height": height})
        await page.goto(src.as_uri())
        await page.wait_for_timeout(int(warmup * 1000))

        interval = 1.0 / fps
        for i in range(n_frames):
            frame_path = out_dir / f"frame_{i:04d}.png"
            await page.screenshot(path=str(frame_path), clip={
                "x": 0, "y": 0, "width": width, "height": height
            })
            paths.append(frame_path)
            if n_frames > 1:
                await page.wait_for_timeout(int(interval * 1000))

        await browser.close()
    return paths