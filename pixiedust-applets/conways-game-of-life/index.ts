import { Applet } from "pixiedust";
import {
  ConwaysGameOfLife,
  ConwaysGameOfLifeOptions,
} from "./widgets/ConwaysGameOfLife";

const DEFAULT_FRAME_RATE = 10;
const DEFAULT_FRAME_COUNT = 70;
const DEFAULT_LAYERS = [{}];

type ConwaysGameOfLifeAppletSchema = {
  frameRate?: number;
  frameCount?: number;
  layers?: ConwaysGameOfLifeOptions[];
};

class ConwaysGameOfLifeApplet extends Applet {
  private frame: number = 0;
  protected setupHasBeenCalled = false;

  // Config Options
  private frameCount: number;
  private layers: ConwaysGameOfLifeOptions[];

  // Components
  private conways: ConwaysGameOfLife[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    config: ConwaysGameOfLifeAppletSchema = {}
  ) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.frameCount = config.frameCount ?? DEFAULT_FRAME_COUNT;
    this.layers = config.layers ?? DEFAULT_LAYERS;
  }

  async setup() {
    this.frame = 0;
    this.layers.forEach(async (options) => {
      const newConway = new ConwaysGameOfLife(this.ctx, options);
      await newConway.setup();
      this.conways.push(newConway);
    });

    this.setupHasBeenCalled = true;
  }

  draw() {
    if (!this.setupHasBeenCalled)
      throw new Error("Must call .setup() before drawing.");

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.conways.forEach((conway) => conway.draw());

    // Stop animation after a certain number of frames
    this.frame += 1;
    this.isDone = this.frame >= this.frameCount;
  }
}

export default ConwaysGameOfLifeApplet;
