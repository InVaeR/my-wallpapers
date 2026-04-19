let offset = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  stroke(255);
  noFill();
}

function draw() {
  background(10, 5, 30);
  let spacing = 50;
  let horizon = height * 0.45;

  // Небо — звёзды
  randomSeed(42);
  for (let i = 0; i < 120; i++) {
    let sx = random(width);
    let sy = random(horizon);
    let brightness = random(100, 255);
    stroke(brightness, brightness, 255);
    strokeWeight(random(1, 2.5));
    point(sx, sy);
  }

  // Солнце
  noStroke();
  for (let r = 200; r > 0; r -= 4) {
    fill(255, map(r, 0, 200, 100, 0), map(r, 0, 200, 200, 50), map(r, 0, 200, 30, 5));
    ellipse(width / 2, horizon, r * 2, r);
  }

  // Горизонтальные линии
  stroke(120, 0, 255, 180);
  strokeWeight(1);
  for (let z = 0; z < 30; z++) {
    let t = (z * spacing + offset) % (30 * spacing);
    let y = map(1 / (t + 1), 0, 1 / spacing, horizon, height);
    if (y > horizon) {
      line(0, y, width, y);
    }
  }

  // Вертикальные линии
  stroke(0, 200, 255, 120);
  let cols = 20;
  for (let i = -cols; i <= cols; i++) {
    let xBottom = width / 2 + i * spacing * 3;
    let xTop = width / 2;
    let lx = map(0.3, 0, 1, xTop, xBottom);
    let lx2 = xBottom;
    line(lx, horizon, lx2, height);
  }

  offset += 1.5;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}