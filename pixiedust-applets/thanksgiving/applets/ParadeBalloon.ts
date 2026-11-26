import { Applet } from "pixiedust";
import { disc, line, px } from "../lib/draw";
import { PALETTE as P } from "../lib/palette";
import { SeasonalConfig, isSeasonActive } from "../lib/schedule";
import { mulberry32 } from "../lib/sprite";

const DEFAULT_FRAME_RATE = 15;
const STREET_Y = 31;
const SKY_TOP = "#18286a";
const SKY_LOW = "#2a4a9a";
const CONFETTI = [P.gold, P.red, P.cream, P.orange, P.face, P.green];

const BALLOON_R = 7; // body radius
const FAN_R = 11; // tail fan radius
const SPAN = FAN_R * 2 + 2;

type Building = { x: number; w: number; h: number; windows: [number, number][] };
type Bit = { x: number; y: number; vy: number; drift: number; color: string };

export type ParadeBalloonSchema = SeasonalConfig & { frameRate?: number };

/**
 * A giant turkey balloon drifts over a city street on its tethers, bobbing in
 * the wind, while confetti falls past the lit windows.
 */
export class ParadeBalloonApplet extends Applet {
  public id = "thanksgiving-parade-balloon";
  public isDone = false;
  public isActive = false;
  protected gifQuality = 1;

  private config: ParadeBalloonSchema;
  private frame = 0;
  private buildings: Building[] = [];
  private confetti: Bit[] = [];
  private rand = mulberry32(1);

  constructor(canvas: HTMLCanvasElement, config: ParadeBalloonSchema = {}) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.config = config;
  }

  async setup() {
    this.frame = 0;
    this.isDone = false;
    this.isActive = isSeasonActive(this.config);
    if (!this.isActive) return;
    this.rand = mulberry32(Date.now());

    // Skyline: alternating tall and short blocks with a few lit windows
    this.buildings = [];
    for (let x = 0; x < this.canvas.width; ) {
      const w = 7 + Math.floor(this.rand() * 9);
      const h = 4 + Math.floor(this.rand() * 7);
      const windows: [number, number][] = [];
      for (let wy = STREET_Y - h + 2; wy < STREET_Y - 1; wy += 3)
        for (let wx = x + 1; wx < x + w - 1; wx += 2)
          if (this.rand() < 0.35) windows.push([wx, wy]);
      this.buildings.push({ x, w, h, windows });
      x += w + (this.rand() < 0.3 ? 1 : 0);
    }
    this.confetti = Array.from({ length: 22 }, () => this.spawnBit(true));
  }

  private spawnBit(anywhere = false): Bit {
    return {
      x: this.rand() * this.canvas.width,
      y: anywhere ? this.rand() * this.canvas.height : -1,
      vy: 0.3 + this.rand() * 0.4,
      drift: this.rand() * Math.PI * 2,
      color: CONFETTI[Math.floor(this.rand() * CONFETTI.length)],
    };
  }

  draw() {
    const { ctx, canvas } = this;
    const f = this.frame;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky: two bands of deep blue
    ctx.fillStyle = SKY_TOP;
    ctx.fillRect(0, 0, canvas.width, 12);
    ctx.fillStyle = SKY_LOW;
    ctx.fillRect(0, 12, canvas.width, canvas.height - 12);

    // Balloon position: left to right, bobbing, leaning into the wind
    const cx = -SPAN / 2 + f * 0.75;
    const cy = 11 + Math.sin(f * 0.18) * 1.2;
    const lean = Math.sin(f * 0.09) * 0.12;

    this.drawBalloon(cx, cy, lean);

    // Skyline in front of the tethers' lower half
    for (const b of this.buildings) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(b.x, STREET_Y - b.h, b.w, b.h + 1);
      for (const [wx, wy] of b.windows) {
        // A few windows blink on and off
        if ((wx * 7 + wy * 3 + Math.floor(f / 18)) % 11 !== 0) px(ctx, wx, wy, P.gold);
      }
    }

    // Tethers run down in front of the skyline to the handlers on the street
    const handlers = [-9, -3, 4, 10];
    // Each rope ends at a hand held out beside the body (on the balloon's
    // side), so there is a clear pixel above every head.
    const handlerX = (hx: number, i: number) =>
      Math.round(cx + hx + Math.sin(f * 0.3 + i) * 0.5);
    const handSide = (hx: number) => (hx < 0 ? 1 : -1);
    handlers.forEach((hx, i) => {
      const hand = handlerX(hx, i) + handSide(hx);
      line(ctx, cx + hx * 0.4, cy + BALLOON_R - 1, hand, STREET_Y - 2, P.plate);
    });

    // Handlers: tiny figures on the street, in front of the buildings
    handlers.forEach((hx, i) => {
      const sx = handlerX(hx, i);
      // Head, then a two-pixel coat, so they read as people
      px(ctx, sx, STREET_Y - 3, P.cream);
      px(ctx, sx, STREET_Y - 2, i % 2 ? P.red : P.face);
      px(ctx, sx, STREET_Y - 1, i % 2 ? P.red : P.face);
    });
    ctx.fillStyle = P.mahogany;
    ctx.fillRect(0, STREET_Y, canvas.width, 1);

    // Confetti
    for (const b of this.confetti) {
      b.y += b.vy;
      b.x += Math.sin(f * 0.2 + b.drift) * 0.3;
      if (b.y > STREET_Y) Object.assign(b, this.spawnBit());
      // Flicker as it tumbles
      if ((f + Math.floor(b.drift * 10)) % 6 !== 0) px(ctx, b.x, b.y, b.color);
    }

    this.frame += 1;
    this.isDone = cx - SPAN / 2 > canvas.width;
  }

  /** Front-facing turkey balloon: fan, plump body with a shine, head. */
  private drawBalloon(cx: number, cy: number, lean: number) {
    const { ctx } = this;
    // Tail fan: full upper semicircle of colored bands with seams
    disc(ctx, cx, cy - 1, FAN_R, (dx, dy, d) => {
      if (dy > 2) return null;
      const a = Math.atan2(-dy, dx) + lean;
      const seam = Math.abs(Math.sin(a * 5)) < 0.18 && d > 7;
      if (d > FAN_R - 1.4) return P.cream;
      if (seam) return P.mahogany;
      if (d > FAN_R - 2.8) return P.gold;
      if (d > FAN_R - 4.4) return P.orange;
      return P.red;
    });
    // Body
    disc(ctx, cx, cy + 1, BALLOON_R, (dx, dy, d) => {
      if (d > BALLOON_R - 1) return P.mahogany;
      // Inflatable shine, upper left
      if (dx >= -4 && dx <= -2 && dy >= -4 && dy <= -2 && dx + dy <= -6) return P.cream;
      if (dy > 3) return P.rust;
      return P.rust;
    });
    // Wing hints
    for (const s of [-1, 1]) {
      line(ctx, cx + s * 4, cy + 1, cx + s * 6, cy + 5, P.mahogany);
    }
    // Head: blue face, big balloon eyes, beak, wattle
    const hx = Math.round(cx);
    const hy = Math.round(cy - 5);
    disc(ctx, hx, hy, 3, () => P.face);
    px(ctx, hx - 1, hy - 1, P.cream);
    px(ctx, hx + 1, hy - 1, P.cream);
    px(ctx, hx - 1, hy, "#000000");
    px(ctx, hx + 1, hy, "#000000");
    px(ctx, hx, hy + 1, P.beak);
    px(ctx, hx, hy + 2, P.wattle);
    px(ctx, hx, hy + 3, P.wattle);
    // Feet dangling
    px(ctx, cx - 2, cy + BALLOON_R + 1, P.leg);
    px(ctx, cx + 2, cy + BALLOON_R + 1, P.leg);
  }
}

export default ParadeBalloonApplet;
