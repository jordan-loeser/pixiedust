import { Applet, Font } from "pixiedust";
import { Dish, MENU } from "../lib/food";
import { PALETTE as P } from "../lib/palette";
import { SeasonalConfig, isSeasonActive } from "../lib/schedule";
import { drawSprite, spriteHeight, spriteWidth } from "../lib/sprite";
import { TextBitmap, drawText, inkRows, renderText } from "../lib/text";
import { NYC, WeatherConfig, weatherLine } from "../lib/weather";

const DEFAULT_FRAME_RATE = 15;
const DEFAULT_MESSAGE = "HAPPY THANKSGIVING";
const SEPARATOR = "  *  ";
const TABLE_TOP = 24; // hem row; dishes sit on the row above it
const DISH_GAP = 8;
const CLOTH_SPEED = 1; // the cloth moves with the dishes, like a conveyor
const STEAM = "#c8beb4";
const STEAM_FADE = "#8a8078";

export type HarvestTableSchema = SeasonalConfig & {
  frameRate?: number;
  /** Greeting stitched after the weather. */
  message?: string;
  /** Where to read the weather for; false for greeting only. Default NYC. */
  weather?: WeatherConfig | false;
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

    // Weather first, then the greeting; greeting alone if the lookup fails
    const weather =
      this.config.weather === false ? null : await weatherLine(this.config.weather ?? NYC);
    const line = [weather, this.messageStr].filter(Boolean).join(SEPARATOR) + SEPARATOR;
    this.message = await renderText(line, Font.MONO);
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

  /**
   * Steam: a continuous, gently waving wisp per anchor. The wave travels
   * upward and the top fades, so it reads as one rising curl rather than
   * separate specks.
   */
  private drawSteam(dish: Dish, sx: number, sy: number, f: number) {
    const { ctx } = this;
    const anchors = dish.steamFrom ?? [];
    anchors.forEach((ax, i) => {
      const phase = f * 0.22 + i * 2.1;
      // Each wisp breathes: grows to full height, then thins out
      const height = 4 + Math.round((Math.sin(f * 0.07 + i * 1.7) + 1) * 1.5);
      for (let r = 0; r < height; r++) {
        const y = sy - 2 - r;
        if (y < 0) break;
        const x = sx + ax + Math.round(Math.sin(r * 0.8 - phase) * 1.2);
        ctx.fillStyle = r < height - 2 ? STEAM : STEAM_FADE;
        ctx.fillRect(x, y, 1, 1);
      }
    });
  }
}

export default HarvestTableApplet;
