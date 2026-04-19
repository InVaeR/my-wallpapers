class RainDrop {
  constructor(x) {
    this.characters = [];
    this.length = Math.random() * 15 + 8;
    const speedInPixelsPerSecond = Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed;
    this.speed = speedInPixelsPerSecond / config.frameRate; // пикселей за кадр
    this.changeProbability = Math.random() * 0.02 + 0.01;
    this.x = x;
    this.hasReplacement = false;

    const initialOffset = Math.random() * 50 - 100;

    for (let i = 0; i < this.length; i++) {
      if (i === 0) {
        this.characters.push(
          new Character(
            this.x,
            initialOffset - i * config.textSize,
            this.speed,
            this.changeProbability,
            255,
            true
          )
        );
      } else {
        const brightness = map(i, this.length - 1, 0, 20, 220);
        this.characters.push(
          new Character(
            this.x,
            initialOffset - i * config.textSize,
            this.speed,
            this.changeProbability,
            brightness,
            false
          )
        );
      }
    }
  }

  update() {
    for (let character of this.characters)
      character.update();
  }

  show() {
    for (let character of this.characters) {
      character.show();
    }
  }

  isFinished() {
    return (
      this.characters[this.characters.length - 1].y >
      height + config.textSize
    );
  }

  isReady() {
    return this.characters[0].y > height;
  }
}