const config = {
	textSize: 30,
	columnWidth: 35,
	frameRate: 120,
	minSpeed: 150, // px/sec 200 better but harder
	maxSpeed: 400, // px/sec
};

let rainDrops = [];

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(config.frameRate);
	textSize(config.textSize);
	textAlign(CENTER, CENTER);

	initializeRainDrops();
}

function initializeRainDrops() {
  rainDrops = [];
  const columns = Math.ceil(width / config.columnWidth);
  for (let i = 0; i < columns; i++) {
    rainDrops.push(new RainDrop(i * config.columnWidth));
  }
}

function draw() {
  background(10, 20, 10, 90);
  let dt = deltaTime / 1000;

  checkAndCreateNewRainDrops();

  for (let rainDrop of rainDrops) {
    rainDrop.update(dt);
    rainDrop.show();
  }

  removeFinishedRainDrops();
}


function checkAndCreateNewRainDrops() {
  for (let i = 0; i < rainDrops.length; i++) {
    const drop = rainDrops[i];
    if (drop.isReady() && !drop.hasReplacement) {
      rainDrops.push(new RainDrop(drop.x));
      drop.hasReplacement = true;
    }
  }
}

function removeFinishedRainDrops() {
  for (let i = rainDrops.length - 1; i >= 0; i--) {
    if (rainDrops[i].isFinished()) {
      rainDrops.splice(i, 1);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeRainDrops();
}