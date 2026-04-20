// ═══════════════════════════════════════════════════════════
//  Вершинный шейдер — полноэкранный quad
//  Просто передаёт UV-координаты во фрагментный шейдер
// ═══════════════════════════════════════════════════════════

precision highp float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;

  // Преобразуем координаты 0..1 в clip-space -1..1
  vec4 pos = vec4(aPosition, 1.0);
  pos.xy = pos.xy * 2.0 - 1.0;
  gl_Position = pos;
}