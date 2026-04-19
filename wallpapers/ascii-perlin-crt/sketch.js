// ============================================
// ASCII Perlin noise + изображение по центру
// + VHS/CRT шейдер (пост-обработка)
// ============================================

// --- Настройки сетки ---
const CELL_H = 20;
const CELL_W = CELL_H * 0.7;

// --- Набор символов от "тёмного" к "светлому" ---
const CHARSET = ' .-:=+*#%@';
const CHARSET_LEN = CHARSET.length;

// --- Цветовые настройки ---
const BG_COLOR = [10, 10, 10];
const COLOR_BOOST = 2;

// --- Шрифт ---
const FONT_NAME = 'Consolas';
const FONT_SIZE = CELL_H;

// --- Параметры шума ---
const NOISE_SCALE = 1200;
const NOISE_SPEED = 0.003;
const NOISE_MIN = 0.3;
const NOISE_MAX = 0.8;
const NOISE_RANGE = NOISE_MAX - NOISE_MIN;

// --- Параметры цвета (RGB-каналы) ---
const COLOR_R = 50;
const COLOR_G = 255;
const COLOR_B = 70;

// --- Параметры изображения ---
const IMG_PATH = 'logo.png';
const IMG_HEIGHT_RATIO = 0.7;
const IMG_WEIGHT = 1;

// --- Переменные состояния ---
let cols, rows;
let t = 0;
let img;
let imgReady = false;
let imgScale = 1;
let imgOffsetX = 0;
let imgOffsetY = 0;
let brightnessCache = null;

// --- Шейдерные переменные ---
let sceneBuffer;   // оффскрин-буфер для ASCII-рендеринга (P2D)
let crtShader;     // шейдер VHS/CRT

// --- Вершинный шейдер (просто передаёт UV) ---
const vertSrc = `
precision highp float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  // Флип Y для корректного отображения текстуры
  vTexCoord.y = 1.0 - vTexCoord.y;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

// --- Фрагментный шейдер: VHS + CRT ---
const fragSrc = `
precision highp float;

varying vec2 vTexCoord;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;

// ==============================
// Параметры — крутите как хотите
// ==============================

// CRT искривление экрана
const float CURVATURE      = 8.0;

// Сканлайны
const float SCANLINE_WEIGHT = 0.18;
const float SCANLINE_COUNT  = 800.0;

// Виньетирование
const float VIGNETTE_STRENGTH = 0.2;

// Хроматическая аберрация
const float CHROMA_OFFSET = 0.003;

// VHS горизонтальный сдвиг (glitch)
const float VHS_SHIFT_AMOUNT  = 0.005;
const float VHS_SHIFT_SPEED   = 3.0;

// VHS вертикальная полоса помехи
const float VHS_BAND_SPEED    = 1.2;
const float VHS_BAND_WIDTH    = 0.05;
const float VHS_BAND_STRENGTH = 0.08;

// Шум (зернистость)
const float NOISE_STRENGTH = 0.08;

// RGB-субпиксели
const float SUBPIXEL_SIZE = 3.0;


// ==============================
// Вспомогательные функции
// ==============================

// Псевдо-случайное число
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// CRT-искривление UV
vec2 crtCurve(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) / CURVATURE;
  uv = uv + uv * offset * offset;
  uv = uv * 0.5 + 0.5;
  return uv;
}

void main() {
  vec2 uv = vTexCoord;

  // --- 1. CRT-искривление ---
  uv = crtCurve(uv);

  // Если за пределами экрана — чёрный
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // --- 2. VHS горизонтальный сдвиг (glitch-полосы) ---
  float vhsLine = rand(vec2(floor(uv.y * 120.0), floor(uTime * VHS_SHIFT_SPEED)));
  float shift = 0.0;
  if (vhsLine > 0.98) {
    shift = VHS_SHIFT_AMOUNT * (rand(vec2(uTime, uv.y)) - 0.5);
  }
  uv.x += shift;

  // --- 3. VHS вертикальная бегущая полоса помехи ---
  float bandPos = fract(uTime * VHS_BAND_SPEED);
  float bandDist = abs(uv.y - bandPos);
  float band = smoothstep(VHS_BAND_WIDTH, 0.0, bandDist);
  uv.x += band * VHS_BAND_STRENGTH * (rand(vec2(uTime)) - 0.5);

  // --- 4. Хроматическая аберрация ---
  float r = texture2D(uScene, vec2(uv.x + CHROMA_OFFSET, uv.y)).r;
  float g = texture2D(uScene, uv).g;
  float b = texture2D(uScene, vec2(uv.x - CHROMA_OFFSET, uv.y)).b;
  vec3 color = vec3(r, g, b);

  // --- 5. VHS-полоса осветляет ---
  color += band * 0.08;

  // --- 6. Сканлайны ---
  float scanline = sin(uv.y * SCANLINE_COUNT * 3.14159) * 0.5 + 0.5;
  color -= SCANLINE_WEIGHT * (1.0 - scanline);

  // --- 7. RGB-субпиксели (имитация CRT маски) ---
  float pixelX = mod(gl_FragCoord.x, SUBPIXEL_SIZE * 3.0);
  vec3 mask = vec3(1.0);
  if (pixelX < SUBPIXEL_SIZE) {
    mask = vec3(1.2, 0.8, 0.8);
  } else if (pixelX < SUBPIXEL_SIZE * 2.0) {
    mask = vec3(0.8, 1.2, 0.8);
  } else {
    mask = vec3(0.8, 0.8, 1.2);
  }
  color *= mask;

  // --- 8. Виньетирование ---
  vec2 vigUV = vTexCoord * (1.0 - vTexCoord);
  float vig = vigUV.x * vigUV.y * 15.0;
  vig = pow(vig, VIGNETTE_STRENGTH);
  color *= vig;

  // --- 9. Шум / зернистость ---
  float n = rand(uv + fract(uTime)) * NOISE_STRENGTH;
  color += n - NOISE_STRENGTH * 0.5;

  // --- 10. Лёгкий мерцающий эффект (как у старого монитора) ---
  float flicker = 1.0 - 0.02 * sin(uTime * 15.0);
  color *= flicker;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

// ===========================
// Исходные функции без изменений
// ===========================

function preload() {
  img = loadImage(
    IMG_PATH,
    () => { imgReady = true; },
    () => {
      console.warn(`Не удалось загрузить "${IMG_PATH}".`);
      imgReady = false;
    }
  );
}

function buildBrightnessCache() {
  const w = img.width;
  const h = img.height;
  const px = img.pixels;
  brightnessCache = new Float32Array(w * h);
  for (let i = 0, len = w * h; i < len; i++) {
    const idx = i * 4;
    brightnessCache[i] = (0.299 * px[idx] + 0.587 * px[idx + 1] + 0.114 * px[idx + 2]) / 255;
  }
}

function charmap(val) {
  return CHARSET[constrain(floor(val * CHARSET_LEN), 0, CHARSET_LEN - 1)];
}

function noisemap(val) {
  val = (val - NOISE_MIN) / NOISE_RANGE;
  if (val < 0) return 0;
  if (val > 1) return 1;
  return val;
}

function recalcImageLayout() {
  if (!imgReady) return;
  const targetH = windowHeight * IMG_HEIGHT_RATIO;
  imgScale = targetH / img.height;
  const scaledW = img.width * imgScale;
  imgOffsetX = (windowWidth - scaledW) / 2;
  imgOffsetY = (windowHeight - targetH) / 2;
}

function recalcGrid() {
  cols = Math.floor(windowWidth / CELL_W);
  rows = Math.floor(windowHeight / CELL_H);
}

function getImageBrightness(screenX, screenY) {
  const imgX = Math.floor((screenX - imgOffsetX) / imgScale);
  const imgY = Math.floor((screenY - imgOffsetY) / imgScale);
  if (imgX < 0 || imgX >= img.width || imgY < 0 || imgY >= img.height) return -1;
  return brightnessCache[imgY * img.width + imgX];
}

// ===========================
// Setup — создаём WEBGL canvas + оффскрин-буфер
// ===========================
function setup() {
  // Основной canvas — WEBGL для шейдеров
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();

  // Оффскрин-буфер для ASCII-рендеринга (обычный 2D)
  sceneBuffer = createGraphics(windowWidth, windowHeight);
  sceneBuffer.textFont(FONT_NAME);
  sceneBuffer.textStyle(BOLD);
  sceneBuffer.textSize(FONT_SIZE);
  sceneBuffer.textAlign(LEFT, TOP);

  // Создаём шейдер из строк
  crtShader = createShader(vertSrc, fragSrc);

  recalcGrid();
  noiseDetail(4, 0.5);

  if (imgReady) {
    img.loadPixels();
    buildBrightnessCache();
    recalcImageLayout();
  }
}

// ===========================
// Рендер ASCII-сцены в оффскрин-буфер
// ===========================
function renderASCII() {
  const buf = sceneBuffer;
  buf.background(BG_COLOR);

  t += NOISE_SPEED;

  const invNoiseScale = 1 / NOISE_SCALE;
  const hasImage = imgReady && brightnessCache !== null;

  for (let i = 0; i < cols; i++) {
    const x = i * CELL_W;
    const nX = x * invNoiseScale;

    for (let j = 0; j < rows; j++) {
      const y = j * CELL_H;
      const nY = y * invNoiseScale;

      let val = noisemap(noise(nX, nY, t));

      if (hasImage) {
        const br = getImageBrightness(x, y);
        if (br >= 0) {
          val += br * IMG_WEIGHT * cos(10*t);
        }
      }

      if (val > 1) val = 1;

      const v = val * COLOR_BOOST;
      buf.fill(v * COLOR_R, v * COLOR_G, v * COLOR_B);
      buf.text(charmap(val), x, y);
    }
  }
}

// ===========================
// Главный цикл
// ===========================
function draw() {
  // 1. Рендерим ASCII-сцену в 2D-буфер
  renderASCII();

  // 2. Применяем шейдер VHS/CRT
  shader(crtShader);

  crtShader.setUniform('uScene', sceneBuffer);
  crtShader.setUniform('uResolution', [width, height]);
  crtShader.setUniform('uTime', millis() / 1000.0);

  // Рисуем полноэкранный прямоугольник (quad) — шейдер применяется к нему
  rect(-width / 2, -height / 2, width, height);
}

// ===========================
// Ресайз
// ===========================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Пересоздаём оффскрин-буфер нового размера
  sceneBuffer.remove();
  sceneBuffer = createGraphics(windowWidth, windowHeight);
  sceneBuffer.textFont(FONT_NAME);
  sceneBuffer.textStyle(BOLD);
  sceneBuffer.textSize(FONT_SIZE);
  sceneBuffer.textAlign(LEFT, TOP);

  recalcGrid();
  recalcImageLayout();
}