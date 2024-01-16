import { Bitmap, Font as BDFFont } from "bdfparser";
import { Font, loadFont } from "../util/fonts";
import Widget, { WidgetOptions } from "./Widget";

export type PixelColors = Record<"0" | "1" | "2", string | null>;

export enum TextAlignment {
  LEFT,
  RIGHT,
  //   CENTER, // TODO
}

export type TextOptions = {
  font?: Font;
  pixelColors?: PixelColors;
  width?: number;
  height?: number;
  alignment?: number;
} & WidgetOptions;

const DEFAULT_PIXEL_COLORS: PixelColors = {
  "0": null, // background
  "1": "#fff", // foreground
  "2": "red", // glow
};

export class Text extends Widget {
  protected str: string;
  protected font: Font;
  protected pixelColors: PixelColors;
  protected isReady = false;

  protected bdfFont?: BDFFont;
  protected text?: Bitmap;

  public width?: number;
  public height?: number;
  public alignment: TextAlignment;

  constructor(
    str: string,
    ctx: CanvasRenderingContext2D,
    options: TextOptions = {}
  ) {
    super(ctx, options);
    this.str = str;

    // Optional params
    this.width = options.width ?? undefined;
    this.height = options.height ?? undefined;
    this.font = options.font ?? Font.MONO;
    this.pixelColors = options.pixelColors ?? DEFAULT_PIXEL_COLORS;
    this.alignment = options.alignment ?? TextAlignment.LEFT;
  }

  async setup() {
    this.bdfFont = await loadFont(this.font);
    this.text = this.bdfFont.draw(this.str);

    if (!this.height) {
      this.height = this.text.height();
    }

    if (!this.width) {
      this.width = this.text.width();
    }

    this.isReady = true;
  }

  draw() {
    if (!this.isReady || !this.text || !this.width || !this.height)
      throw new Error("Must call .setup() before calling .draw()!");

    this.ctx.save();

    // Draw bounding box
    if (process.env.DEBUG) this.drawBoundingBox();

    let cropParams = [this.width, this.height, 0 as number] as const;
    let translation = [this.x, this.y] as const;

    if (this.alignment === TextAlignment.RIGHT) {
      cropParams = [
        this.width,
        this.height,
        -1 * (this.width - this.text.width()),
      ];
      translation = [this.x - this.text.width(), this.y] as const;
    }

    this.ctx.translate(...translation);
    this.text.crop(...cropParams).draw2canvas(this.ctx, this.pixelColors);

    this.ctx.restore();
  }

  drawBoundingBox() {
    if (!this.isReady || !this.width || !this.height || !this.text)
      throw new Error("Must call .setup() before calling .drawBoundingBox()!");

    let xy = [this.x, this.y] as const;
    if (this.alignment === TextAlignment.RIGHT) {
      xy = [this.x - this.text.width(), this.y] as const;
    }

    this.ctx.save();
    this.ctx.fillStyle = "blue";

    this.ctx.restore();
  }
}

export default Text;
