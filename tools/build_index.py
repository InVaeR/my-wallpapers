"""Собирает manifest.json из meta.json всех папок обоев.
Запускать после добавления/изменения обоев."""
import json
from pathlib import Path

from capture import WALLPAPERS_DIR, list_wallpapers

ROOT = WALLPAPERS_DIR.parent


def build():
    items = []
    for wid in list_wallpapers():
        folder = WALLPAPERS_DIR / wid
        meta_file = folder / "meta.json"
        meta = {"id": wid, "title": wid.upper(), "desc": "", "tags": []}
        if meta_file.exists():
            meta.update(json.loads(meta_file.read_text(encoding="utf-8")))
        meta["id"] = wid  # id всегда = имя папки

        # фиксируем наличие сгенерированных медиа
        meta["hasPreview"] = (folder / "preview.webm").exists()
        meta["hasPoster"] = (folder / "poster.jpg").exists()
        items.append(meta)

    manifest = ROOT / "manifest.json"
    manifest.write_text(
        json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[OK] {manifest.name}: {len(items)} обоев")


if __name__ == "__main__":
    build()