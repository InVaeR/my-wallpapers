// ============================================
// ASCII Perlin noise + изображение по центру
// ============================================

// --- Настройки сетки ---
const CELL_H = 20;
const CELL_W = CELL_H * 0.7;

// --- Набор символов от "тёмного" к "светлому" ---
const CHARSET = ' .-:=+*#%@';
const CHARSET_LEN = CHARSET.length;

// --- Цветовые настройки ---
const BG_COLOR = [10, 10, 10];
const COLOR_BOOST = 1;

// --- Шрифт ---
const FONT_NAME = 'Consolas';
const FONT_SIZE = CELL_H;

// --- Параметры шума ---
const NOISE_SCALE = 1200;
const NOISE_SPEED = 0.004;
const NOISE_MIN = 0.3;
const NOISE_MAX = 0.8;
// Предвычисленный диапазон маппинга шума
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

// Предвычисленная таблица яркости изображения (кэш)
let brightnessCache = null;

// --- Предзагрузка ---
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

// --- Предвычисление таблицы яркости ---
// Вызывается один раз. Гораздо быстрее, чем img.get() на каждый кадр.
function buildBrightnessCache() {
  const w = img.width;
  const h = img.height;
  const px = img.pixels; // RGBA массив: [r,g,b,a, r,g,b,a, ...]

  brightnessCache = new Float32Array(w * h);

  for (let i = 0, len = w * h; i < len; i++) {
    const idx = i * 4;
    // ITU-R BT.601
    brightnessCache[i] = (0.299 * px[idx] + 0.587 * px[idx + 1] + 0.114 * px[idx + 2]) / 255;
  }
}

// --- Маппинг значения в символ (инлайн-оптимизация) ---
function charmap(val) {
  return CHARSET[constrain(floor(val * CHARSET_LEN), 0, CHARSET_LEN - 1)];
}

// --- Маппинг шума (без вызова map() — вручную для скорости) ---
function noisemap(val) {
  val = (val - NOISE_MIN) / NOISE_RANGE; // эквивалент map(val, NOISE_MIN, NOISE_MAX, 0, 1)
  if (val < 0) return 0;
  if (val > 1) return 1;
  return val;
}

// --- Макет изображения ---
function recalcImageLayout() {
  if (!imgReady) return;

  const targetH = windowHeight * IMG_HEIGHT_RATIO;
  imgScale = targetH / img.height;

  const scaledW = img.width * imgScale;
  const scaledH = targetH;

  imgOffsetX = (windowWidth - scaledW) / 2;
  imgOffsetY = (windowHeight - scaledH) / 2;
}

// --- Пересчёт сетки ---
function recalcGrid() {
  cols = Math.floor(windowWidth / CELL_W+1);
  rows = Math.floor(windowHeight / CELL_H+1);
}

// --- Яркость пикселя изображения по экранным координатам ---
// Возвращает -1 если вне изображения
function getImageBrightness(screenX, screenY) {
  const imgX = Math.floor((screenX - imgOffsetX) / imgScale);
  const imgY = Math.floor((screenY - imgOffsetY) / imgScale);

  if (imgX < 0 || imgX >= img.width || imgY < 0 || imgY >= img.height) {
    return -1;
  }

  return brightnessCache[imgY * img.width + imgX];
}

// --- Setup ---
function setup() {
  createCanvas(windowWidth, windowHeight);

  recalcGrid();

  textFont(FONT_NAME);
  textStyle(BOLD);
  textSize(FONT_SIZE);
  textAlign(LEFT, TOP);
  noiseDetail(4, 0.5);

  if (imgReady) {
    img.loadPixels();
    buildBrightnessCache();
    recalcImageLayout();
  }
}

// --- Главный цикл ---
function draw() {
  background(BG_COLOR);
  t += NOISE_SPEED;

  const invNoiseScale = 1 / NOISE_SCALE; // деление → умножение (быстрее в цикле)
  const hasImage = imgReady && brightnessCache !== null;

  for (let i = 0; i < cols; i++) {
    const x = i * CELL_W;
    const nX = x * invNoiseScale;

    for (let j = 0; j < rows; j++) {
      const y = j * CELL_H;
      const nY = y * invNoiseScale;

      // Шум Перлина
      let val = noisemap(noise(nX, nY, t));

      // Добавляем яркость изображения
      if (hasImage) {
        const brightness = getImageBrightness(x, y);
        if (brightness >= 0) {
          val += brightness * IMG_WEIGHT * cos(10*t);
        }
      }

      // Ограничиваем
      if (val > 1) val = 1;

      // Цвет (инлайн вместо вызова colormap)
      const v = val * COLOR_BOOST;
      // v уже в [0,1] после constrain выше, COLOR_BOOST=1
      fill(v * COLOR_R, v * COLOR_G, v * COLOR_B);
      text(charmap(val), x, y);
    }
  }
}

// --- Ресайз ---
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  recalcGrid();
  recalcImageLayout();
}