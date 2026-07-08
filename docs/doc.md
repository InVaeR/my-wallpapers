# Документация

## Структура проекта

```text
my-wallpapers/
├─ docs/
│  └─ doc.md
├─ images/                          скриншоты (опционально)
├─ lib/
│  └─ p5.min.js
├─ res/
│  └─ MurMurch G.png
├─ tools/
│  ├─ build_index.py                сборщик manifest.json
│  ├─ capture.py                    общий модуль (Playwright)
│  ├─ generate_image.py             скриншот обоев
│  └─ generate_preview.py           превью-видео + poster
│
├─ wallpapers/                      папка с обоями (html+js+шейдеры)
│  ├─ ascii-perlin/
│  ├─ ascii-perlin-crt/
│  ├─ ascii-perlin-geolines/
│  ├─ matrix-code/
│  ├─ matrix-rain/
│  ├─ matrix-rain-cn/
│  └─ universe-within/
│
├─ .gitignore
├─ .nojekyll
├─ index.html                       галерея
├─ manifest.json                    список обоев
├── README.md
├── requirements.txt
└── style.css
```
