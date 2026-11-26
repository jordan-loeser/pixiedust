import { Applet, Font } from "pixiedust";
import { line, px } from "../lib/draw";
import { PALETTE as P } from "../lib/palette";
import { SeasonalConfig, isSeasonActive } from "../lib/schedule";
import { Sprite, drawSprite } from "../lib/sprite";
import { TextBitmap, drawText, inkRows, renderText } from "../lib/text";

const DEFAULT_FRAME_RATE = 12;

// Geometry (rest pose)
const APEX = { x: 64, y: 13 };
const ARM_DX = 19;
const ARM_Y = 26;
const BREAK_T = 0.3; // fraction down the right arm where it snaps

// Timeline, in frames
const T_GRAB = 10;
const T_SNAP = 44;
const T_END = 112;

/** A gloved fist seen from the side, knuckles toward the viewer. */
const FIST: Sprite = {
  legend: { C: P.cream, M: P.steam },
  rows: [
    ".CCCCC.",
    "CMCMCMC",
    "CMCMCMC",
    "CCCCCCC",
    ".CCCCC.",
  ],
};

export type WishboneSchema = SeasonalConfig & { frameRate?: number };

/**
 * Two hands tug a wishbone, it shudders, snaps, and the winning half is
 * hoisted in a burst of sparkles: WISH GRANTED.
 */
export class WishboneApplet extends Applet {
  public id = "thanksgiving-wishbone";
  public isDone = false;
  public isActive = false;
  protected gifQuality = 1;

  private config: WishboneSchema;
  private frame = 0;
  private before?: TextBitmap;
  private after?: TextBitmap;

  constructor(canvas: HTMLCanvasElement, config: WishboneSchema = {}) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.config = config;
  }

  async setup() {
    this.frame = 0;
    this.isDone = false;
    this.isActive = isSeasonActive(this.config);
    if (!this.isActive) return;
    this.before = await renderText("MAKE A WISH", Font.CHERRY);
    this.after = await renderText("WISH GRANTED!", Font.CHERRY);
  }

  private bone(x0: number, y0: number, x1: number, y1: number) {
    // Two-pixel-thick bone with a highlight edge
    line(this.ctx, x0, y0, x1, y1, P.plate);
    line(this.ctx, x0, y0 + 1, x1, y1 + 1, P.steam);
    line(this.ctx, x0, y0 - 1, x1, y1 - 1, P.cream);
  }

  draw() {
    const { ctx, canvas } = this;
    const f = this.frame;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tension builds, with a shudder that grows toward the snap
    const pull = f < T_GRAB ? 0 : Math.min(1, (f - T_GRAB) / (T_SNAP - T_GRAB));
    const shake = f < T_SNAP && f >= T_GRAB ? ((f % 2) * 2 - 1) * Math.round(pull * 1.4) : 0;
    const stretch = Math.round(pull * 4);

    const ax = APEX.x;
    const ay = APEX.y + Math.round(pull * 2);
    let lx = ax - ARM_DX - stretch;
    let rx = ax + ARM_DX + stretch;
    let ly = ARM_Y + shake;
    let ry = ARM_Y - shake;

    // Hands slide in from the edges during the grab
    const grab = Math.min(1, f / T_GRAB);
    const handIn = Math.round((1 - grab) * 30);

    if (f < T_SNAP) {
      this.bone(ax, ay, lx, ly);
      this.bone(ax, ay, rx, ry);
      // Knob at the apex
      px(ctx, ax, ay - 1, P.cream);
      px(ctx, ax - 1, ay, P.plate);
      px(ctx, ax + 1, ay, P.plate);
    } else {
      // After the snap: winner (left, with the apex) is hoisted up and left,
      // the short stub falls away to the right.
      const k = f - T_SNAP;
      const lift = Math.min(3, Math.round(k * 0.5));
      const slide = Math.min(8, k);
      const bx = ax + (rx - ax) * BREAK_T;
      const by = ay + (ry - ay) * BREAK_T;

      this.bone(ax - slide, ay - lift, lx - slide, ly - lift);
      this.bone(ax - slide, ay - lift, bx - slide, by - lift);
      px(ctx, ax - slide, ay - lift - 1, P.cream);
      lx -= slide;
      ly -= lift;

      const fall = Math.min(3, Math.round(k * 0.4));
      this.bone(bx + slide, by + fall, rx + slide, ry + fall);
      rx += slide;
      ry += fall;

      // Snap flash, then sparkles around the winner
      if (k < 4) this.flash(bx, by, k);
      this.sparkles(ax - slide, ay - lift, k);
    }

    this.arm(lx - 6 - handIn, ly - 2, "left");
    this.arm(rx - 1 + handIn, ry - 2, "right");

    // Caption
    const text = f < T_SNAP ? this.before : this.after;
    if (text) {
      const [top] = inkRows(text);
      const x = Math.round((canvas.width - text.width) / 2);
      if (f >= T_SNAP || f >= 4)
        drawText(ctx, text, x, 1 - top, {
          color: f < T_SNAP ? P.cream : P.gold,
          shadow: P.mahogany,
          // Type the result on, a letter at a time
          revealX: f < T_SNAP ? Infinity : x + (f - T_SNAP - 2) * 6,
        });
    }

    this.frame += 1;
    this.isDone = this.frame >= T_END;
  }

  /** Fist plus a sleeve that runs off the edge of the panel. */
  private arm(x: number, y: number, side: "left" | "right") {
    const { ctx, canvas } = this;
    const w = 7;
    const sleeveX = side === "left" ? 0 : x + w;
    const sleeveW = side === "left" ? Math.max(0, x) : Math.max(0, canvas.width - x - w);
    ctx.fillStyle = P.cloth;
    ctx.fillRect(sleeveX, y + 1, sleeveW, 3);
    // Cuff
    ctx.fillStyle = P.red;
    ctx.fillRect(side === "left" ? x - 2 : x + w, y + 1, 2, 3);
    drawSprite(ctx, FIST, x, y);
  }

  private flash(x: number, y: number, k: number) {
    const r = k + 1;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      px(this.ctx, x + dx * r, y + dy * r, k < 2 ? P.cream : P.gold);
    }
    px(this.ctx, x, y, P.cream);
  }

  private sparkles(x: number, y: number, k: number) {
    const spots = [[-12, -4], [10, -6], [-6, 8], [14, 4], [0, -9], [-16, 3]];
    spots.forEach(([dx, dy], i) => {
      const phase = (k + i * 3) % 12;
      if (phase > 5) return;
      const c = phase < 2 ? P.cream : phase < 4 ? P.gold : P.orange;
      const sx = x + dx;
      const sy = y + dy;
      px(this.ctx, sx, sy, c);
      if (phase >= 1 && phase <= 3) {
        px(this.ctx, sx + 1, sy, c);
        px(this.ctx, sx - 1, sy, c);
        px(this.ctx, sx, sy + 1, c);
        px(this.ctx, sx, sy - 1, c);
      }
    });
  }
}

export default WishboneApplet;
