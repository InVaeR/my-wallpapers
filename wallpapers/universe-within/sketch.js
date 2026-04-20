// ═══════════════════════════════════════════════════════════
//  THE UNIVERSE WITHIN — p5.js адаптация
//  Оригинал: Martijn Steinrucken (BigWings), 2018
//  Shadertoy: https://www.shadertoy.com/view/lscczl
//  Адаптация: зелёная палитра в стиле Matrix
// ═══════════════════════════════════════════════════════════

let universeShader;
let shaderReady = false;

// Загружаем шейдеры асинхронно до setup()
function preload() {
  universeShader = loadShader(
    'universe.vert',
    'universe.frag',
    () => {
      shaderReady = true;
    },
    (err) => {
      console.error('❌ Ошибка загрузки шейдера:', err);
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  noStroke();
}

function draw() {
  if (!shaderReady || !universeShader) {
    background(0);
    return;
  }

  shader(universeShader);
  universeShader.setUniform('uResolution', [width, height]);
  universeShader.setUniform('uTime', millis() / 1000.0);

  // Полноэкранный quad, на котором исполняется шейдер
  rect(-width / 2, -height / 2, width, height);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}