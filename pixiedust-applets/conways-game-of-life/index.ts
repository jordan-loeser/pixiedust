import { Applet } from "pixiedust";
import {
  ConwaysGameOfLife,
  ConwaysGameOfLifeOptions,
} from "./widgets/ConwaysGameOfLife";

// Default configs
const DEFAULT_FRAME_RATE = 10;
const DEFAULT_FRAME_COUNT = 70;
const DEFAULT_FADE_OUT = false;
const DEFAULT_FADE_DURATION = 10;
const DEFAULT_LAYERS = [{}];

type ConwaysGameOfLifeAppletSchema = {
  fadeOut?: boolean;
  fadeDuration?: number;
  frameRate?: number;
  frameCount?: number;
  layers?: ConwaysGameOfLifeOptions[];
  compositeOperation?: CanvasRenderingContext2D["globalCompositeOperation"];
};

class ConwaysGameOfLifeApplet extends Applet {
  // Abstract
  public id = "conways-game-of-life";
  public isDone = false;
  public isActive = true;

  // Config Options
  private frameCount: number;
  private layers: ConwaysGameOfLifeOptions[];
  private fadeOut: boolean;
  private fadeDuration: number;
  private compositeOperation?: CanvasRenderingContext2D["globalCompositeOperation"];

  // Helpers
  private frame: number = 0;
  private framesToAnimate: number;
  private sliceAlpha: number;

  // Components
  private conways: ConwaysGameOfLife[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    config: ConwaysGameOfLifeAppletSchema = {}
  ) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.frameCount = config.frameCount ?? DEFAULT_FRAME_COUNT;
    this.layers = config.layers ?? DEFAULT_LAYERS;
    this.fadeOut = config.fadeOut ?? DEFAULT_FADE_OUT;
    this.fadeDuration = config.fadeDuration ?? DEFAULT_FADE_DURATION;
    if (config.compositeOperation)
      this.compositeOperation = config.compositeOperation;

    if (this.fadeOut && this.fadeDuration > this.frameCount)
      throw new Error("frameCount must be > fadeDuration when fadeOut = true");

    // Calculate helpers
    this.framesToAnimate =
      this.frameCount - (this.fadeOut ? this.fadeDuration : 0);
    this.sliceAlpha = 1 / this.fadeDuration;
  }

  async setup() {
    this.frame = 0;
    this.conways = [];
    this.layers.forEach(async (options) => {
      const newConway = new ConwaysGameOfLife(this.ctx, options);
      await newConway.setup();
      this.conways.push(newConway);
    });
  }

  draw() {
    this.ctx.save();
    // If animating, set the composite operation and draw all layers
    if (this.frame < this.framesToAnimate) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.compositeOperation)
        this.ctx.globalCompositeOperation = this.compositeOperation;
      this.conways.forEach((conway) => conway.draw());
    } else {
      // Fade out if configured
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.sliceAlpha})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.ctx.restore();

    // Stop animation after a certain number of frames
    this.frame += 1;
    this.isDone = this.frame >= this.frameCount;
  }
}

export default ConwaysGameOfLifeApplet;
