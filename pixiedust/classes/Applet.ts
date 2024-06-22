import GIFEncoder from "gif-encoder";
import WebP from "node-webpmux";

const DEFAULT_FRAME_RATE = 20; // fps
const DEFAULT_GAMMA = 2.8; // Correction factor

interface AppletInterface {
  /**
   * Abstract member variable to flag when rendering is complete.
   */
  isDone: boolean;

  /**
   * Abstract method that must be implemented by derived applets for initialization.
   */
  setup(): Promise<void>;

  /**
   * Abstract method that must be implemented by derived applets to render the next frame on the canvas element.
   */
  draw(): void;
}

/**
 * Abstract class representing the foundation for creating animated applets on an HTML canvas.
 */
export abstract class Applet implements AppletInterface {
  abstract isDone: boolean;
  abstract isActive: boolean;
  abstract setup(): Promise<void>;
  abstract draw(): void;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  /**
   * Frames per second for the applet animation.
   */
  protected frameRate: number;

  /**
   * Frames duration in ms, derived from frameRate.
   */
  private frameDuration;

  /**
   * Track if {@link WebP.Image.initLib()} has been called for optimization.
   */
  static isLibWebPInitialized = false;

  /**
   * Constructor for the Applet class.
   * @param canvas - The HTML canvas element to render the applet.
   * @param frameRate - Frames per second (default is 20 fps).
   */
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

  /**
   * Clears the canvas and calls the abstract setup function.
   */
  async reset() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    await this.setup();
  }

  /**
   * Plays the animated applet by repeatedly calling the draw method at the specified frame rate.
   */
  async play() {
    await this.reset();

    const interval = setInterval(() => {
      this.draw();
      if (this.isDone) clearInterval(interval);
    }, this.frameDuration);
  }

  /**
   * Encodes the applet as an animated GIF image.
   * @returns A promise that resolves to a Buffer containing the encoded GIF.
   */
  async encodeAsGif(): Promise<Buffer | null> {
    await this.reset();

    if (!this.isActive) return null;

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

      const pixels = Applet.gammaCorrect(
        this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      );

      encoder.addFrame(pixels);
    }

    // Write output
    encoder.finish();
    const result = encoder.read();

    if (result === null) {
      throw new Error("Gif encoding returned empty result.");
    }

    return result;
  }

  /**
   * Encodes the applet as an animated WebP image.
   * @returns A promise that resolves to a Buffer containing the encoded WebP.
   */
  async encodeAsWebP(): Promise<Buffer | null> {
    await this.reset();

    if (!this.isActive) return null;

    const frames = [];

    this.isDone = false;
    while (!this.isDone) {
      this.draw();
      frames.push(await Applet.generateWebPFrameFromCanvas(this.canvas));
    }

    return WebP.Image.save(null, {
      width: this.canvas.width,
      height: this.canvas.height,
      delay: this.frameDuration,
      dispose: true,
      frames,
    });
  }

  /**
   * Static function that generates a WebP frame from the given canvas.
   * @param canvas - The HTML canvas element.
   * @param lossless - Lossless compression level for WebP encoding (default is 5).
   * @returns A promise that resolves to a Buffer containing the WebP frame.
   */
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
    const pixels = Applet.gammaCorrect(canvasImageData);

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

  /**
   * Applies gamma coreection to ImageData and returns the corrected ImageData["data"]. Learn more about why gamma correction is needed {@link https://learn.adafruit.com/led-tricks-gamma-correction | here}.
   * @param imageData - the image data to be corrected.
   * @param gamma the correction factor (default is 2.8)
   * @returns
   */
  static gammaCorrect = (
    imageData: ImageData,
    gamma = DEFAULT_GAMMA
  ): ImageData["data"] =>
    imageData.data.map((d) => Math.pow(d / 255, gamma) * 255 + 0.5);
}

export default Applet;
