import { Applet, Font } from "pixiedust";
import { Dish, MENU } from "../lib/food";
import { PALETTE as P } from "../lib/palette";
import { SeasonalConfig, isSeasonActive } from "../lib/schedule";
import { drawSprite, spriteHeight, spriteWidth } from "../lib/sprite";
import { TextBitmap, drawText, inkRows, renderText } from "../lib/text";

const DEFAULT_FRAME_RATE = 15;
const DEFAULT_MESSAGE =
  "GOBBLE GOBBLE  *  PASS THE PIE  *  GIVE THANKS  *  SECONDS PLEASE  *  ";
const TABLE_TOP = 24; // hem row; dishes sit on the row above it
const DISH_GAP = 12;
const CLOTH_SPEED = 0.5; // the embroidery drifts slower than the dishes

export type HarvestTableSchema = SeasonalConfig & {
  frameRate?: number;
  message?: string;
  menu?: readonly Dish[];
};

type Placed = { dish: Dish; x: number };

/**
 * The dinner spread slides along a red tablecloth, steaming, while a message
 * stitched into the cloth drifts by underneath at half speed.
 */
export class HarvestTableApplet extends Applet {
  public id = "thanksgiving-harvest-table";
  public isDone = false;
  public isActive = false;
  protected gifQuality = 1;

  private config: HarvestTableSchema;
  private menu: readonly Dish[];
  private messageStr: string;

  private frame = 0;
  private placed: Placed[] = [];
  private spreadWidth = 0;
  private message?: TextBitmap;

  constructor(canvas: HTMLCanvasElement, config: HarvestTableSchema = {}) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.config = config;
    this.menu = config.menu ?? MENU;
    this.messageStr = config.message ?? DEFAULT_MESSAGE;
  }

  async setup() {
    this.frame = 0;
    this.isDone = false;
    this.isActive = isSeasonActive(this.config);
    if (!this.isActive) return;

    this.message = await renderText(this.messageStr, Font.MONO);
    let x = 0;
    this.placed = this.menu.map((dish) => {
      const p = { dish, x };
      x += spriteWidth(dish.sprite) + DISH_GAP;
      return p;
    });
    this.spreadWidth = x;
  }

  draw() {
    const { ctx, canvas } = this;
    const f = this.frame;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tablecloth: gold hem, red cloth, scrolling stitched message
    ctx.fillStyle = P.gold;
    ctx.fillRect(0, TABLE_TOP, canvas.width, 1);
    ctx.fillStyle = P.cloth;
    ctx.fillRect(0, TABLE_TOP + 1, canvas.width, canvas.height - TABLE_TOP - 1);
    if (this.message) {
      const [top] = inkRows(this.message);
      const y = TABLE_TOP + 2 - top;
      const offset = Math.floor(f * CLOTH_SPEED) % this.message.width;
      for (let x = -offset; x < canvas.width; x += this.message.width) {
        drawText(ctx, this.message, x, y, { color: P.cream });
      }
    }

    // Dishes slide right-to-left on a loop as long as the whole spread
    for (const { dish, x } of this.placed) {
      const w = spriteWidth(dish.sprite);
      const base = (((x - f) % this.spreadWidth) + this.spreadWidth) % this.spreadWidth;
      for (const sx of [base, base - this.spreadWidth]) {
        if (sx > canvas.width || sx + w < 0) continue;
        const sy = TABLE_TOP - spriteHeight(dish.sprite);
        drawSprite(ctx, dish.sprite, sx, sy);
        if (dish.hot) this.drawSteam(dish, sx, sy, f);
      }
    }

    this.frame += 1;
    // One full lap of the dishes
    this.isDone = this.frame >= Math.max(this.spreadWidth, canvas.width);
  }

  /** Wisps that rise and sway from each steam anchor, on a 12-frame loop. */
  private drawSteam(dish: Dish, sx: number, sy: number, f: number) {
    const { ctx } = this;
    const anchors = dish.steamFrom ?? [];
    anchors.forEach((ax, i) => {
      const t = (f + i * 5) % 12;
      for (let k = 0; k < 3; k++) {
        const rise = t / 2 + k * 2;
        const y = Math.round(sy - 2 - rise);
        if (y < 0) continue;
        const sway = Math.round(Math.sin((rise + i) * 0.9));
        ctx.fillStyle = k === 0 ? P.steam : P.star;
        if (k === 0 || (t + k) % 3 !== 0) ctx.fillRect(sx + ax + sway, y, 1, 1);
      }
    });
  }
}

export default HarvestTableApplet;
