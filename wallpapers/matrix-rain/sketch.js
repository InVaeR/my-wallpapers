let streams = [];
const symbolSize = 18;

function setup() {
  createCanvas(windowWidth, windowHeight);
  let cols = ceil(width / symbolSize);
  for (let i = 0; i < cols; i++) {
    streams.push(new Stream(i * symbolSize, random(-1000, 0)));
  }
  textFont('monospace');
  textSize(symbolSize);
}

function draw() {
  background(0, 50);
  for (let s of streams) {
    s.update();
    s.show();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Stream {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(3, 8);
    this.length = floor(random(10, 30));
    this.chars = [];
    for (let i = 0; i < this.length; i++) {
      this.chars.push(String.fromCharCode(0x30A0 + floor(random(96))));
    }
  }

  update() {
    this.y += this.speed;
    if (this.y - this.length * symbolSize > height) {
      this.y = random(-500, 0);
      this.speed = random(3, 8);
    }
    if (random() < 0.05) {
      let idx = floor(random(this.chars.length));
      this.chars[idx] = String.fromCharCode(0x30A0 + floor(random(96)));
    }
  }

  show() {
    for (let i = 0; i < this.chars.length; i++) {
      let yPos = this.y - i * symbolSize;
      if (yPos < 0 || yPos > height) continue;
      if (i === 0) {
        fill(180, 255, 180);
      } else {
        fill(0, map(i, 0, this.length, 255, 50), 0);
      }
      text(this.chars[i], this.x, yPos);
    }
  }
}