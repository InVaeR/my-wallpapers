// ═══════════════════════════════════════════════════════════
//  THE UNIVERSE WITHIN — p5.js адаптация
//  Оригинал: Martijn Steinrucken (BigWings), 2018
//  Shadertoy: https://www.shadertoy.com/view/lscczl
//  Адаптация: зелёная палитра в стиле Matrix
// ═══════════════════════════════════════════════════════════

let universeShader;

// ─── Вершинный шейдер ─────────────────────────────────────
// Просто передаёт координаты вершин quad'а на весь экран
// и вычисляет UV-координаты для фрагментного шейдера
const vertSrc = `
precision highp float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  // Преобразуем 0..1 в -1..1 (clip space)
  vec4 pos = vec4(aPosition, 1.0);
  pos.xy = pos.xy * 2.0 - 1.0;
  gl_Position = pos;
}
`;

// ─── Фрагментный шейдер ───────────────────────────────────
const fragSrc = `
precision highp float;

varying vec2 vTexCoord;

uniform vec2  uResolution;   // размер экрана в пикселях
uniform float uTime;         // время в секундах
uniform vec2  uMouse;        // позиция курсора (не используется, можно оставить 0)

// Макрос плавного перехода (alias для smoothstep)
#define S(a, b, t) smoothstep(a, b, t)

// Количество слоёв "паутины" — каждый движется с разной скоростью,
// создавая ощущение глубины/zoom'а
#define NUM_LAYERS 4.

// ═══════════════════════════════════════════════════════════
//  ЗЕЛЁНАЯ ПАЛИТРА (в стиле Matrix)
//  Меняй эти цвета — и получишь любую другую тональность
// ═══════════════════════════════════════════════════════════
const vec3 COLOR_CORE  = vec3(0.2, 1.0, 0.3);   // ярко-зелёный (линии)
const vec3 COLOR_GLOW  = vec3(0.0, 0.8, 0.2);   // свечение точек
const vec3 COLOR_DEEP  = vec3(0.0, 0.3, 0.1);   // тёмный фон/градиент


// ─── Хеш-функция: псевдослучайное число из vec2 ──────────
// Даёт детерминированное "случайное" значение для каждой клетки сетки.
// Используется для размещения точек в узлах сетки.
float N21(vec2 p) {
  vec3 a = fract(vec3(p.xyx) * vec3(213.897, 653.453, 253.098));
  a += dot(a, a.yzx + 79.76);
  return fract((a.x + a.y) * a.z);
}

// ─── Позиция точки в ячейке сетки ────────────────────────
// id    — координаты текущей ячейки
// offs  — смещение к соседней ячейке (-1..1, -1..1)
// t     — время (для анимации движения точек)
//
// Каждая точка колеблется по кругу с индивидуальной скоростью,
// что создаёт "живое" пульсирующее поле узлов.
vec2 GetPos(vec2 id, vec2 offs, float t) {
  float n  = N21(id + offs);         // уникальный seed для этой точки
  float n1 = fract(n * 10.);         // частота по X
  float n2 = fract(n * 100.);        // частота по Y
  float a  = t + n;                  // фазовый сдвиг
  return offs + vec2(sin(a*n1), cos(a*n2)) * 0.4;
}

// ─── Расстояние от точки P до отрезка AB ─────────────────
// Классическая формула: проецируем P на прямую AB,
// ограничиваем проекцию пределами отрезка, считаем расстояние.
float df_line(in vec2 a, in vec2 b, in vec2 p) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// ─── Рисование одной линии ───────────────────────────────
// Возвращает яркость пикселя uv на линии A-B.
// Линия плавно исчезает, если точки слишком далеко друг от друга,
// и ярче всего около длины ~0.75 (даёт органичный "пульс").
float line(vec2 a, vec2 b, vec2 uv) {
  float r1 = 0.04;                   // "мягкая" граница линии
  float r2 = 0.01;                   // ядро линии

  float d   = df_line(a, b, uv);
  float d2  = length(a - b);         // длина отрезка

  // Линия гаснет, когда точки расходятся (> 1.5) или слишком близко
  float fade = S(1.5, 0.5, d2);
  // Дополнительная "вспышка" при длине около 0.75
  fade += S(0.05, 0.02, abs(d2 - 0.75));

  return S(r1, r2, d) * fade;
}

// ─── Слой сети ───────────────────────────────────────────
// Отрисовывает одну сетку из точек и линий между ними.
// n — смещение слоя (чтобы разные слои отличались), t — время.
float NetLayer(vec2 st, float n, float t) {
  vec2 id = floor(st) + n;          // ID текущей клетки
  st = fract(st) - 0.5;             // локальные координаты (-0.5..0.5)

  // Получаем позиции 9 точек: центральная + 8 соседей (3x3)
  vec2 p[9];
  int i = 0;
  for (float y = -1.; y <= 1.; y++) {
    for (float x = -1.; x <= 1.; x++) {
      p[i++] = GetPos(id, vec2(x, y), t);
    }
  }

  float m       = 0.;               // итоговая яркость линий
  float sparkle = 0.;               // свечение узлов

  // Соединяем центральную точку [4] со всеми 8 соседями
  // и рисуем яркие "звёзды" в узлах
  for (int i = 0; i < 9; i++) {
    m += line(p[4], p[i], st);

    // Яркость точки убывает как 1/d² (реалистичное свечение)
    float d = length(st - p[i]);
    float s = (0.005 / (d * d));
    s *= S(1.0, 0.7, d);

    // Пульсация узлов — дышащий эффект
    float pulse = sin((fract(p[i].x) + fract(p[i].y) + t) * 5.) * 0.4 + 0.6;
    pulse = pow(pulse, 20.);        // резкие вспышки
    s *= pulse;

    sparkle += s;
  }

  // Дополнительные диагональные связи между соседями
  // (образуют характерный "паутинный" узор)
  m += line(p[1], p[3], st);
  m += line(p[1], p[5], st);
  m += line(p[7], p[5], st);
  m += line(p[7], p[3], st);

  // Общая фаза свечения всего слоя — медленно дышит
  float sPhase = (sin(t + n) + sin(t * 0.1)) * 0.25 + 0.5;
  sPhase += pow(sin(t * 0.1) * 0.5 + 0.5, 50.) * 5.;  // редкие сильные вспышки
  m += sparkle * sPhase;

  return m;
}

// ═══════════════════════════════════════════════════════════
//  ГЛАВНАЯ ФУНКЦИЯ ШЕЙДЕРА
// ═══════════════════════════════════════════════════════════
void main() {
  // Координата пикселя в пикселях
  vec2 fragCoord = vTexCoord * uResolution;

  // Нормализованные UV: центр экрана в (0,0), диапазон ~-1..1 по Y
  vec2 uv = (fragCoord - uResolution.xy * 0.5) / uResolution.y;

  // Смещение от "мыши" (в Lively не используется — остаётся 0)
  vec2 M = uMouse - 0.5;

  float t = uTime * 0.1;            // замедленное время для поворота

  // Матрица вращения всей сцены
  float s = sin(t);
  float c = cos(t);
  mat2 rot = mat2(c, -s, s, c);
  vec2 st = uv * rot;
  M *= rot * 2.;

  // ─── Накапливаем несколько слоёв с разным zoom'ом ───
  // Ближние слои крупные, дальние — мелкие.
  // Плавный fade создаёт бесконечное "погружение".
  float m = 0.;
  for (float i = 0.; i < 1.; i += 1. / NUM_LAYERS) {
    float z    = fract(t + i);
    float size = mix(15., 1., z);           // zoom: от мелкого к крупному
    float fade = S(0., 0.6, z) * S(1., 0.8, z);

    m += fade * NetLayer(st * size - M * z, i, uTime);
  }

  // ─── Окрашивание ───
  // В оригинале цвет менялся во времени (RGB по синусам).
  // Здесь — фиксированная зелёная палитра.
  vec3 col = COLOR_CORE * m;

  // Лёгкое свечение снизу (как нижняя подсветка)
  float glow = -uv.y * 0.3;
  col += COLOR_GLOW * max(glow, 0.0) * 0.5;

  // Виньетка — затемнение к краям экрана
  col *= 1. - dot(uv, uv);

  // Добавляем глубокий зелёный подтон в тёмных областях
  col += COLOR_DEEP * 0.08;

  // Плавное появление/исчезание цикла (230 секунд)
  float cycleT = mod(uTime, 230.);
  col *= S(0., 20., cycleT) * S(224., 200., cycleT);

  gl_FragColor = vec4(col, 1.0);
}
`;

// ═══════════════════════════════════════════════════════════
//  p5.js SETUP / DRAW
// ═══════════════════════════════════════════════════════════
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  noStroke();

  universeShader = createShader(vertSrc, fragSrc);
  shader(universeShader);
}

function draw() {
  shader(universeShader);

  universeShader.setUniform('uResolution', [width, height]);
  universeShader.setUniform('uTime', millis() / 1000.0);
  universeShader.setUniform('uMouse', [0.5, 0.5]); // статично — обои

  // Полноэкранный quad, на котором выполняется шейдер
  rect(-width / 2, -height / 2, width, height);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}