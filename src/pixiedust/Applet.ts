import GIFEncoder from "gif-encoder";
import { gammaCorrect } from "./util/gammaCorrect";

const DEFAULT_FRAME_RATE = 20; // fps

interface AppletInterface {
  setup(): Promise<void>;
  draw(): void;
}

export abstract class Applet implements AppletInterface {
  protected abstract setupHasBeenCalled: boolean;
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected isDone: boolean = false;

  public frameRate: number; // fps

  private frameDuration; // ms

  constructor(
    canvas: HTMLCanvasElement,
    frameRate: number = DEFAULT_FRAME_RATE
  ) {
    this.canvas = canvas;
    console.log(">>>", "getContext");
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    if (this.ctx === null) {
      throw new Error("Could not get canvas context.");
    }

    this.frameRate = frameRate;
    this.frameDuration = 1000 / frameRate;
  }

  // These functions must be implemented by the derived applets
  abstract setup(): Promise<void>;
  abstract draw(): void;

  // Member functions
  play() {
    const interval = setInterval(() => {
      this.draw();
      if (this.isDone) clearInterval(interval);
    }, this.frameDuration);
  }

  async encodeAsGif(): Promise<Buffer | null> {
    await this.setup();

    // Initialize encoder
    const encoder = new GIFEncoder(this.canvas.width, this.canvas.height, {
      highWaterMark: 5 * 1024 * 1024, // 5MB
    });
    encoder.setFrameRate(this.frameRate);
    encoder.setQuality(10);
    encoder.writeHeader();

    // Generate frames
    this.isDone = false;
    while (!this.isDone) {
      this.draw();

      const pixels = gammaCorrect(
        this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      );

      encoder.addFrame(pixels);
    }

    // Write output
    encoder.finish();
    return encoder.read();
  }
}

export default Applet;
