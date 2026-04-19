let particles = [];
const COUNT = 300;

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < COUNT; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  background(0, 25);
  for (let p of particles) {
    p.update();
    p.show();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-1, 1);
    this.vy = random(-2, -0.5);
    this.size = random(2, 6);
    this.color = color(random(100, 255), random(50, 200), random(200, 255), 200);
    this.life = random(100, 300);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.life < 0 || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.reset();
      this.y = height;
    }
  }

  show() {
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.size);
  }
}