import { Image } from "canvas";
import { Applet } from "pixiedust";

const DEFAULT_DURATION_S = 20;
const DEFAULT_FRAME_RATE = 10; // fps
const DEFAULT_SHOW_TRAIL = false;

const IMAGE =
  "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAJCAYAAADtj3ZXAAAAQUlEQVQokWNgwA3+I2Fc8hgK/iPR//HwMWxhYMBuEDZDcSpCNwiX4VhdgK4AlxiKBnRMUB5fiBJyIUHnE6WQZJsBSnw7xZmNBscAAAAASUVORK5CYII=";

const COLORS = [
  "#0ef", // light blue
  "#f70", // orange
  "#02f", // dark blue
  "#fe0", // yellow
  "#f20", // red
  "#f08", // pink
  "#b0f", // purple
];

type DVDLogoAppletSchema = {
  frameRate?: number;
  showTrail?: boolean;
  duration?: number; // seconds
};

class DVDLogoApplet extends Applet {
  // Abstract
  public id = "dvdlogo";
  public isDone = false;
  public isActive = true;

  // Config Options
  private duration: number;
  private showTrail: boolean;

  // Helpers
  private frame: number = 0;
  private numXPositions: number;
  private numYPositions: number;
  private xPos: number = 0;
  private yPos: number = 0;
  private colorIndex: number = 0;
  private xVel = 1 | -1;
  private yVel = 1 | -1;

  // Components
  private image: Image;

  constructor(canvas: HTMLCanvasElement, config: DVDLogoAppletSchema = {}) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.duration = config.duration ?? DEFAULT_DURATION_S;
    this.showTrail = config.showTrail ?? DEFAULT_SHOW_TRAIL;

    this.image = new Image();
    this.image.src = `data:image/png;base64,${IMAGE}`; // Base64 encoded image
    this.numXPositions = this.canvas.width - this.image.width;
    this.numYPositions = this.canvas.height - this.image.height;
  }

  async setup() {
    this.frame = 0;
    // Choose a random starting point
    this.xPos = Math.floor(Math.random() * this.numXPositions);
    this.yPos = Math.floor(Math.random() * this.numYPositions);
    this.colorIndex = Math.floor(Math.random() * COLORS.length);
  }

  draw() {
    if (!this.showTrail)
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Check for Hit
    let hit = [false, false];
    if (this.xPos <= 0 || this.xPos >= this.numXPositions) {
      hit[0] = true;
    }
    if (this.yPos <= 0 || this.yPos >= this.numYPositions) {
      hit[1] = true;
    }
    if (hit[0] || hit[1]) {
      // Change color right when the logo hits a wall... satisfying!
      this.colorIndex = (this.colorIndex + 1) % COLORS.length;
    }
    // TODO: Do something special for corner hit

    // Draw color under logo
    this.ctx.fillStyle = COLORS[this.colorIndex];
    this.ctx.fillRect(
      this.xPos,
      this.yPos,
      this.image.width,
      this.image.height
    );
    // Draw logo mask
    this.ctx.drawImage(this.image as any, this.xPos, this.yPos);

    // Update velocity
    if (hit[0]) this.xVel *= -1;
    if (hit[1]) this.yVel *= -1;

    // Update position
    this.xPos += this.xVel;
    this.yPos += this.yVel;

    // Check for done
    this.frame += 1;
    this.isDone = this.frame >= this.frameRate * this.duration; // 10 seconds
  }
}

export default DVDLogoApplet;
