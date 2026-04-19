// ══════════════════════════════════════════
//  MATRIX TERMINAL — Оптимизированные обои
// ══════════════════════════════════════════

const CELL_SIZE = 30;
const SPAWN_RATE = 2;
const FADE_SPEED = 3;
const CHAR_CHANGE_RATE = 0.01;
const MATRIX_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz|:+*_=<>";

let cols, rows;
let matrixFont = null;
let fontLoaded = false;

// ── Пул символов: используем типизированные массивы ──
const MAX_CHARS = 2000;
let poolSize = 0;

// Массивы данных (Structure of Arrays — быстрее чем массив объектов)
const posX = new Float32Array(MAX_CHARS);
const posY = new Float32Array(MAX_CHARS);
const brightness = new Float32Array(MAX_CHARS);
const glowIntensity = new Float32Array(MAX_CHARS);
const chars = new Array(MAX_CHARS);

// ══════════════════════════════════════════
//  PRELOAD
// ══════════════════════════════════════════
function preload() {
  matrixFont = loadFont(
    'https://fonts.cdnfonts.com/s/11243/matrix code nfi.woff',
    () => { fontLoaded = true; },
    () => { fontLoaded = false; }
  );
}

// ══════════════════════════════════════════
//  SETUP
// ══════════════════════════════════════════
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  if (fontLoaded && matrixFont) {
    textFont(matrixFont);
  } else {
    textFont('Consolas');
  }

  textSize(CELL_SIZE);
  textAlign(CENTER, CENTER);
  noStroke();

  cols = Math.floor(width / CELL_SIZE);
  rows = Math.floor(height / CELL_SIZE);

  background(0);
}

// ══════════════════════════════════════════
//  Утилиты
// ══════════════════════════════════════════
function randomChar() {
  return MATRIX_CHARS.charAt(Math.floor(Math.random() * MATRIX_CHARS.length));
}

function spawnChar() {
  if (poolSize >= MAX_CHARS) return;

  let gridX = Math.floor(Math.random() * cols);
  let gridY = Math.floor(Math.random() * rows);

  let i = poolSize;
  posX[i] = gridX * CELL_SIZE + CELL_SIZE / 2;
  posY[i] = gridY * CELL_SIZE + CELL_SIZE / 2;
  brightness[i] = 255;
  glowIntensity[i] = 20;
  chars[i] = randomChar();
  poolSize++;
}

// ══════════════════════════════════════════
//  DRAW
// ══════════════════════════════════════════
function draw() {
  background(5, 10, 5, 150);

  // Спавн новых символов
  for (let s = 0; s < SPAWN_RATE; s++) {
    spawnChar();
  }

  let ctx = drawingContext;
  let writeIdx = 0;

  for (let i = 0; i < poolSize; i++) {
    // ── Обновление ──
    if (Math.random() < CHAR_CHANGE_RATE) {
      chars[i] = randomChar();
    }

    brightness[i] -= FADE_SPEED;
    if (brightness[i] <= 0) continue; // пропускаем мёртвые

    let br = brightness[i];
    glowIntensity[i] = br * (20 / 255);

    // ── Рендер ──
    let t = br / 255;
    let t1 = Math.sqrt(t);
    let t2 = t * t;

    let r = t2 * 255;
    let g = 100 + t2 * 155;
    let b = t2 * 255;
    let a = t1 * 255;

    fill(r, g, b, a);

    ctx.shadowColor = `rgb(${r | 0},${g | 0},${b | 0})`;
    ctx.shadowBlur = glowIntensity[i];

    text(chars[i], posX[i], posY[i]);

    // ── Уплотнение живых символов (swap-remove) ──
    if (writeIdx !== i) {
      posX[writeIdx] = posX[i];
      posY[writeIdx] = posY[i];
      brightness[writeIdx] = brightness[i];
      glowIntensity[writeIdx] = glowIntensity[i];
      chars[writeIdx] = chars[i];
    }
    writeIdx++;
  }

  ctx.shadowBlur = 0;
  poolSize = writeIdx;
}

// ══════════════════════════════════════════
//  RESIZE
// ══════════════════════════════════════════
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  cols = Math.floor(width / CELL_SIZE);
  rows = Math.floor(height / CELL_SIZE);
}