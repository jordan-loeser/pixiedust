import {
  Widget,
  Text,
  TextMarquee,
  PixelColors,
  TextAlignment,
  WidgetOptions,
  Font,
} from "../../../pixiedust";
import { Route, Train } from "../api/types";
import { ROUTE_METADATA } from "../data/routes";

const RADIUS = 6.5;
const PADDING_START = 1;

// Pulled from this palette https://lospec.com/palette-list/6-bit-rgb
const GREEN_PIXEL_COLORS: PixelColors = {
  "0": null, // background
  "1": "#bfff50", // foreground
  "2": "null", // glow
};

const ORANGE_PIXEL_COLORS: PixelColors = {
  "0": null, // background
  "1": "#ffaa00", // foreground
  "2": "null", // glow
};

export type TrainSignRowOptions = Train & WidgetOptions;

class TrainSignRow extends Widget {
  private frame: number;
  private setupHasBeenCalled = false;
  private route: Route;
  private routeText: Text;
  private marquee: TextMarquee;
  private timeText: Text;
  private minText: Text;

  constructor(ctx: CanvasRenderingContext2D, options: TrainSignRowOptions) {
    console.log("Building TrainSignRow...", options);

    console.log("ctx:", ctx);
    super(ctx, options);

    this.frame = 0;

    this.route = options.route;

    const msReminaing =
      options.arrivalTime.getTime() - new Date(Date.now()).getTime();

    const minutesRemaining = Math.floor(msReminaing / 1000 / 60);

    this.routeText = new Text(options.route, ctx, {
      font: Font.BITOCRA,
      x: 6,
      y: 0,
      pixelColors: {
        "0": null, // background
        "1": "#000", // foreground
        "2": "null", // glow
      },
    });

    this.marquee = new TextMarquee(options.terminal, ctx, {
      font: Font.ARRIVAL_TIME,
      x: (PADDING_START + RADIUS) * 2,
      y: 1,
      width: 87,
      pixelColors: GREEN_PIXEL_COLORS,
    });

    this.timeText = new Text(minutesRemaining.toString(), ctx, {
      font: Font.ARRIVAL_TIME,
      alignment: TextAlignment.RIGHT,
      x: ctx.canvas.width - 21,
      y: 1,
      pixelColors: ORANGE_PIXEL_COLORS,
    });

    this.minText = new Text("min", ctx, {
      font: Font.ARRIVAL_TIME,
      alignment: TextAlignment.RIGHT,
      x: ctx.canvas.width - 1 + 4,
      y: 1,
      pixelColors: GREEN_PIXEL_COLORS,
    });
  }

  async setup() {
    await this.marquee.setup();
    await this.timeText.setup();
    await this.minText.setup();
    await this.routeText.setup();

    this.setupHasBeenCalled = true;
  }

  draw() {
    if (!this.setupHasBeenCalled)
      throw new Error("Must call .setup() before drawing.");

    this.ctx.save();

    this.ctx.translate(this.x, this.y);

    // Draw the circle
    // TODO: convert to bitmap on disk
    // TODO: deduplicate repeated drawing by clearing smaller rects
    // TODO: if route isExpress, draw diamond instead
    this.ctx.beginPath();
    this.ctx.fillStyle = ROUTE_METADATA[this.route].color;
    this.ctx.arc(RADIUS + PADDING_START, RADIUS, RADIUS, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.closePath();

    // Draw the text marquee
    this.marquee.scrollAndDraw(this.marquee.isDone || this.frame <= 20 ? 0 : 1);

    // Draw a background on the time text for aesthetics
    this.ctx.fillStyle = "#000";
    const timeWidth = this.timeText.width! + 2;
    this.ctx.fillRect(
      this.ctx.canvas.width - 21 - timeWidth,
      1,
      timeWidth,
      this.timeText.height!
    );

    // // Draw the text
    this.timeText.draw();
    this.minText.draw();
    this.routeText.draw();

    this.ctx.restore();

    this.frame += 1;
  }

  get isDone() {
    return this.marquee.isDone;
  }
}

export default TrainSignRow;
