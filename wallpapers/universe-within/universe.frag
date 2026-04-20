// ═══════════════════════════════════════════════════════════
//  THE UNIVERSE WITHIN — фрагментный шейдер
//  Оригинал: Martijn Steinrucken (BigWings), 2018
//  Адаптация: зелёная палитра Matrix
// ═══════════════════════════════════════════════════════════

precision highp float;

varying vec2 vTexCoord;

uniform vec2  uResolution;   // размер экрана в пикселях
uniform float uTime;         // время в секундах

// Псевдоним для smoothstep — чаще встречается в коде
#define S(a, b, t) smoothstep(a, b, t)

// Количество слоёв сетки (больше = плотнее, тяжелее для GPU)
#define NUM_LAYERS 4.

// ═══════════════════════════════════════════════════════════
//  ЦВЕТОВАЯ ПАЛИТРА
//  Меняй эти три цвета — получишь любую тональность
// ═══════════════════════════════════════════════════════════
const vec3 COLOR_CORE = vec3(0.2, 1.0, 0.3);   // линии (ярко-зелёный)
const vec3 COLOR_GLOW = vec3(0.0, 0.8, 0.2);   // свечение узлов
const vec3 COLOR_DEEP = vec3(0.0, 0.3, 0.1);   // тёмный подтон

// ─── Хеш: псевдослучайное число из vec2 ──────────────────
float N21(vec2 p) {
  vec3 a = fract(vec3(p.xyx) * vec3(213.897, 653.453, 253.098));
  a += dot(a, a.yzx + 79.76);
  return fract((a.x + a.y) * a.z);
}

// ─── Позиция анимированной точки в ячейке сетки ──────────
vec2 GetPos(vec2 id, vec2 offs, float t) {
  float n  = N21(id + offs);
  float n1 = fract(n * 10.);
  float n2 = fract(n * 100.);
  float a  = t + n;
  return offs + vec2(sin(a * n1), cos(a * n2)) * 0.4;
}

// ─── Расстояние от точки P до отрезка AB ─────────────────
float df_line(vec2 a, vec2 b, vec2 p) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// ─── Отрисовка линии между двумя точками ─────────────────
float line(vec2 a, vec2 b, vec2 uv) {
  float d  = df_line(a, b, uv);
  float d2 = length(a - b);

  // Линия гаснет при слишком большом или малом расстоянии
  float fade = S(1.5, 0.5, d2);
  // Дополнительная "вспышка" при длине ~0.75
  fade += S(0.05, 0.02, abs(d2 - 0.75));

  return S(0.04, 0.01, d) * fade;
}

// ─── Свечение одной точки (узла) ─────────────────────────
float sparklePoint(vec2 p, vec2 st, float t) {
  float d = length(st - p);
  float s = 0.005 / (d * d);              // ~1/d² свечение
  s *= S(1.0, 0.7, d);

  // Пульсация с индивидуальной фазой
  float pulse = sin((fract(p.x) + fract(p.y) + t) * 5.0) * 0.4 + 0.6;
  pulse = pow(pulse, 20.0);               // резкие вспышки
  return s * pulse;
}

// ─── Слой сети (9 точек 3x3 + линии между ними) ──────────
float NetLayer(vec2 st, float n, float t) {
  vec2 id = floor(st) + n;
  st = fract(st) - 0.5;

  // Девять позиций сетки (развёрнуто вручную для совместимости)
  vec2 p00 = GetPos(id, vec2(-1.,-1.), t);
  vec2 p10 = GetPos(id, vec2( 0.,-1.), t);
  vec2 p20 = GetPos(id, vec2( 1.,-1.), t);
  vec2 p01 = GetPos(id, vec2(-1., 0.), t);
  vec2 p11 = GetPos(id, vec2( 0., 0.), t);  // центр
  vec2 p21 = GetPos(id, vec2( 1., 0.), t);
  vec2 p02 = GetPos(id, vec2(-1., 1.), t);
  vec2 p12 = GetPos(id, vec2( 0., 1.), t);
  vec2 p22 = GetPos(id, vec2( 1., 1.), t);

  // Линии от центра ко всем 8 соседям
  float m = 0.;
  m += line(p11, p00, st);
  m += line(p11, p10, st);
  m += line(p11, p20, st);
  m += line(p11, p01, st);
  m += line(p11, p21, st);
  m += line(p11, p02, st);
  m += line(p11, p12, st);
  m += line(p11, p22, st);

  // Диагональные связи между соседями — создают паутину
  m += line(p10, p01, st);
  m += line(p10, p21, st);
  m += line(p12, p21, st);
  m += line(p12, p01, st);

  // Свечение всех 9 узлов
  float sparkle = 0.;
  sparkle += sparklePoint(p00, st, t);
  sparkle += sparklePoint(p10, st, t);
  sparkle += sparklePoint(p20, st, t);
  sparkle += sparklePoint(p01, st, t);
  sparkle += sparklePoint(p11, st, t);
  sparkle += sparklePoint(p21, st, t);
  sparkle += sparklePoint(p02, st, t);
  sparkle += sparklePoint(p12, st, t);
  sparkle += sparklePoint(p22, st, t);

  // Общая "дышащая" фаза слоя + редкие яркие вспышки
  float sPhase = (sin(t + n) + sin(t * 0.1)) * 0.25 + 0.5;
  sPhase += pow(sin(t * 0.1) * 0.5 + 0.5, 50.0) * 5.0;
  m += sparkle * sPhase;

  return m;
}

// ═══════════════════════════════════════════════════════════
//  ОСНОВНАЯ ФУНКЦИЯ
// ═══════════════════════════════════════════════════════════
void main() {
  vec2 fragCoord = vTexCoord * uResolution;

  // Центрируем координаты, нормализуем по высоте
  vec2 uv = (fragCoord - uResolution.xy * 0.5) / uResolution.y;

  // Медленное время для вращения
  float t = uTime * 0.1;

  // Матрица поворота сцены
  float s = sin(t);
  float c = cos(t);
  mat2 rot = mat2(c, -s, s, c);
  vec2 st = uv * rot;

  // ─── Накапливаем слои с разным масштабом ───
  float m = 0.;
  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYERS) {
    float z    = fract(t + i);
    float size = mix(15.0, 1.0, z);                 // zoom слоя
    float fade = S(0.0, 0.6, z) * S(1.0, 0.8, z);   // появление/исчезание
    m += fade * NetLayer(st * size, i, uTime);
  }

  // ─── Окрашивание ───
  vec3 col = COLOR_CORE * m;

  // Лёгкое свечение снизу
  float glow = max(-uv.y * 0.3, 0.0);
  col += COLOR_GLOW * glow * 0.5;

  // Виньетка и фоновый подтон
  col *= 1.0 - dot(uv, uv);
  col += COLOR_DEEP * 0.08;

  // Плавное появление/исчезание каждые 230 секунд
  float cycleT = mod(uTime, 230.0);
  col *= S(0.0, 20.0, cycleT) * S(224.0, 200.0, cycleT);

  gl_FragColor = vec4(col, 1.0);
}