class Character {
  constructor(x, y, speed, changeProbability, brightness, isLeading) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.changeProbability = changeProbability;
    this.char = this.getRandomMatrixChar();
    this.brightness = brightness;
    this.isLeading = isLeading;
  }

  getRandomMatrixChar() {
    const matrixChars = " 我操你吗你是小姐爱茶美女说班温啤酒甜";
    return matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
  }

  update() {
    this.y += this.speed;

    if (Math.random() < this.changeProbability) {
      this.char = this.getRandomMatrixChar();
    }
  }

  show() {
    const realY = Math.floor(this.y / config.textSize) * config.textSize;
    
    if (this.isLeading) {
      // Ведущий символ
      fill(180, 255, 200);
      
      // Эффект свечения для ведущего символа
      drawingContext.shadowColor = color(180, 255, 200, 150);
      drawingContext.shadowBlur = 20;
    } else {
      // Обычные символы
      fill(0, 255, 70, this.brightness);
      drawingContext.shadowBlur = 0;
    }

    text(this.char, this.x, realY);
    
    // Сброс тени после отрисовки
    drawingContext.shadowBlur = 0;
  }
}