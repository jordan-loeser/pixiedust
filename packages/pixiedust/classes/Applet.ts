import GIFEncoder from "gif-encoder";
import WebP from "node-webpmux";
import { gammaCorrect } from "../util/gammaCorrect";

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

  static isLibWebPInitialized = false;

  constructor(
    canvas: HTMLCanvasElement,
    frameRate: number = DEFAULT_FRAME_RATE
  ) {
    this.canvas = canvas;
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
    encoder.setDispose(3);
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

  async encodeAsWebP(): Promise<Buffer> {
    await this.setup();

    const frames = [];

    this.isDone = false;
    while (!this.isDone) {
      this.draw();
      frames.push(await Applet.generateWebPFrameFromCanvas(this.canvas));
    }

    // TODO: make lossy? figure out color quality issues?
    return WebP.Image.save(null, {
      width: this.canvas.width,
      height: this.canvas.height,
      delay: this.frameDuration,
      dispose: true,
      frames,
    });
  }

  // Static Functions
  static async generateWebPFrameFromCanvas(
    canvas: HTMLCanvasElement,
    lossless: WebP.SetImageDataOptions["lossless"] = 5
  ) {
    if (!this.isLibWebPInitialized) {
      await WebP.Image.initLib();
      this.isLibWebPInitialized = true;
    }

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const canvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = gammaCorrect(canvasImageData);

    const img = await WebP.Image.getEmptyImage();
    await img.setImageData(Buffer.from(pixels), {
      // TODO: use canvasImageData.data.buffer as Buffer?
      width: canvas.width,
      height: canvas.height,
      lossless,
    });

    // Convert the image data into a frame
    const frame = await WebP.Image.generateFrame({ img });
    return frame;
  }
}

export default Applet;
