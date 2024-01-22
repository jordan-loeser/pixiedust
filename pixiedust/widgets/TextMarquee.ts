import Text, { TextOptions } from "./Text";

type PixelColors = Record<"0" | "1" | "2", string | null>;

type ScrollDirection = "horizontal"; // | "vertical"; // TODO

const DEFAULT_PIXEL_COLORS: PixelColors = {
  "0": null, // background
  "1": "#fff", // foreground
  "2": "red", // glow
};

interface TextMarqueeOptions extends TextOptions {
  scrollDirection?: ScrollDirection;
  reverse?: boolean;
  /**
   * Scroll even if the text is less wide than the marquee.
   */
  forceScroll?: boolean;
}

export class TextMarquee extends Text {
  private options;

  private offset: number = -1;
  private hasExited: boolean = false;

  private _isDone: boolean = false;

  constructor(
    str: string,
    ctx: CanvasRenderingContext2D,
    options: TextMarqueeOptions = {}
  ) {
    super(str, ctx, options);
    this.options = options;
  }

  async setup() {
    await super.setup();
  }

  scrollAndDraw(amount = 1) {
    if (!this.isReady || !this.text || !this.width || !this.height)
      throw new Error("Must call .setup() before calling .scrollAndDraw()!");

    this.ctx.save();

    // Draw bounding box
    if (process.env.DEBUG) this.drawBoundingBox();

    // Facilitate translation
    this.offset += amount;

    this.ctx.translate(this.x, this.y);

    // Draw translated text within bounding box
    this.text
      .clone()
      .crop(this.width, this.height, this.offset)
      .draw2canvas(this.ctx, this.pixelColors);

    this.ctx.restore();

    // Loop back one time
    // TODO make work for vertical

    const needsToScroll = this.text.width() >= this.width;
    const hasAlreadyScrolled = this.hasExited && this.offset >= -1;
    if (hasAlreadyScrolled || !(needsToScroll || this.options.forceScroll)) {
      this._isDone = true;
    }

    // Check if the text has scrolled off the screen
    if (!this.hasExited && this.offset >= this.text.width()) {
      this.hasExited = true;
      this.offset = -1 * this.width; // Move the text to the far side of the screen
    }
  }

  drawBoundingBox() {
    if (!this.isReady || !this.width || !this.height)
      throw new Error("Must call .setup() before calling .drawBoundingBox()!");

    this.ctx.save();
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
    this.ctx.restore();
  }

  get isDone() {
    return this._isDone;
  }
}

export default TextMarquee;
