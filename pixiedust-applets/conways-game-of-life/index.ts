import { Applet } from "pixiedust";
import {
  ConwaysGameOfLife,
  ConwaysGameOfLifeOptions,
} from "./widgets/ConwaysGameOfLife";

const DEFAULT_FRAME_RATE = 10;
const DEFAULT_FRAME_COUNT = 70;

type ConwaysGameOfLifeAppletSchema = {
  frameRate?: number;
  frameCount?: number;
};

class ConwaysGameOfLifeApplet extends Applet {
  private frame: number = 0;
  protected setupHasBeenCalled = false;

  // Config Options
  private frameCount: number;

  // Components
  private conway1?: ConwaysGameOfLife;
  private conway2?: ConwaysGameOfLife;

  constructor(
    canvas: HTMLCanvasElement,
    config: ConwaysGameOfLifeAppletSchema = {}
  ) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.frameCount = config.frameCount ?? DEFAULT_FRAME_COUNT;
  }

  async setup() {
    this.frame = 0;
    this.conway1 = new ConwaysGameOfLife(this.ctx, {});
    await this.conway1.setup();
    this.conway2 = new ConwaysGameOfLife(this.ctx, { cellColor: "blue" });
    await this.conway2.setup();
    this.setupHasBeenCalled = true;
  }

  draw() {
    if (!this.setupHasBeenCalled)
      throw new Error("Must call .setup() before drawing.");

    if (!this.conway1 || !this.conway2) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.conway1.draw();
    this.conway2?.draw();

    // Stop animation after a certain number of frames
    this.frame += 1;
    this.isDone = this.frame >= this.frameCount;
  }
}

export default ConwaysGameOfLifeApplet;
