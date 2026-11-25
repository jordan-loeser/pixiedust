import { Applet, Font } from "pixiedust";
import { PALETTE as P } from "../lib/palette";
import { SeasonalConfig, isSeasonActive } from "../lib/schedule";
import { mulberry32 } from "../lib/sprite";
import { TextBitmap, drawText, renderText } from "../lib/text";
import {
  HeadPose,
  LegPose,
  TURKEY_HEIGHT,
  TURKEY_WIDTH,
  drawTurkey,
} from "../lib/turkey";

const DEFAULT_FRAME_RATE = 10;
const GROUND_Y = 28; // first soil row
const WALK_SPEED = 2; // px per frame
const STOP_X = 100; // where the turkey stops to show off
const TEXT_REGION = STOP_X - 2; // text centers in the space left of the turkey

// Timeline, in frames
const WALK_END = Math.ceil((STOP_X + TURKEY_WIDTH) / WALK_SPEED);
const FAN_OPEN = 8;
const GOBBLE = 24;
const FAN_CLOSE = 6;
const PECK = 18;
const HOLD = 16;

const T_FAN_OPEN = WALK_END;
const T_GOBBLE = T_FAN_OPEN + FAN_OPEN;
const T_FAN_CLOSE = T_GOBBLE + GOBBLE;
const T_PECK = T_FAN_CLOSE + FAN_CLOSE;
const T_HOLD = T_PECK + PECK;
const T_END = T_HOLD + HOLD;

const WALK_CYCLE: { legs: LegPose; head: HeadPose; bob: number }[] = [
  { legs: "stepA", head: "bob", bob: 1 },
  { legs: "stand", head: "up", bob: 0 },
  { legs: "stepB", head: "bob", bob: 1 },
  { legs: "stand", head: "up", bob: 0 },
];

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export type TurkeyTrotSchema = SeasonalConfig & {
  frameRate?: number;
  line1?: string;
  line2?: string;
};

/**
 * A turkey struts in from the left. The greeting appears in its wake as it
 * passes, then it stops, fans its tail, gobbles twice, and pecks at the
 * stubble.
 */
export class TurkeyTrotApplet extends Applet {
  public id = "thanksgiving-turkey-trot";
  public isDone = false;
  public isActive = false;
  protected gifQuality = 1;

  private config: TurkeyTrotSchema;
  private line1Str: string;
  private line2Str: string;

  private frame = 0;
  private line1?: TextBitmap;
  private line2?: TextBitmap;
  private stars: { x: number; y: number; phase: number }[] = [];
  private stubble: { x: number; h: number; color: string }[] = [];

  constructor(canvas: HTMLCanvasElement, config: TurkeyTrotSchema = {}) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.config = config;
    this.line1Str = config.line1 ?? "HAPPY";
    this.line2Str = config.line2 ?? "THANKSGIVING";
  }

  async setup() {
    this.frame = 0;
    this.isDone = false;
    this.isActive = isSeasonActive(this.config);
    if (!this.isActive) return;

    this.line1 = await renderText(this.line1Str, Font.CHERRY);
    this.line2 = await renderText(this.line2Str, Font.CHERRY);

    const rand = mulberry32(Date.now());
    this.stars = Array.from({ length: 9 }, () => ({
      x: Math.floor(rand() * this.canvas.width),
      y: Math.floor(rand() * 6),
      phase: Math.floor(rand() * 20),
    }));
    this.stubble = [];
    for (let x = 0; x < this.canvas.width; x += 2 + Math.floor(rand() * 3)) {
      this.stubble.push({
        x,
        h: 1 + Math.floor(rand() * 2),
        color: rand() > 0.5 ? P.wheat : P.gold,
      });
    }
  }

  private turkeyX(f: number) {
    if (f >= WALK_END) return STOP_X;
    return -TURKEY_WIDTH + f * WALK_SPEED;
  }

  draw() {
    const { ctx, canvas } = this;
    const f = this.frame;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars: slow twinkle
    for (const s of this.stars) {
      if ((f + s.phase) % 20 < 14) {
        ctx.fillStyle = P.star;
        ctx.fillRect(s.x, s.y, 1, 1);
      }
    }

    // Field: soil with a stubble fringe
    ctx.fillStyle = P.soil;
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    for (const s of this.stubble) {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, GROUND_Y - s.h, 1, s.h);
    }

    // Greeting, revealed behind the turkey's tail
    const tx = this.turkeyX(f);
    const revealX = tx + 4;
    if (this.line1 && this.line2) {
      const x1 = Math.round((TEXT_REGION - this.line1.width) / 2);
      const x2 = Math.round((TEXT_REGION - this.line2.width) / 2);
      drawText(ctx, this.line1, x1, 2, {
        color: P.gold,
        shadow: P.mahogany,
        revealX,
      });
      drawText(ctx, this.line2, x2, 13, {
        color: P.cream,
        shadow: P.mahogany,
        revealX,
      });
    }

    // Turkey
    const ty = GROUND_Y - TURKEY_HEIGHT;
    let head: HeadPose = "up";
    let legs: LegPose = "stand";
    let bob = 0;
    let fan = 0;

    if (f < WALK_END) {
      const step = WALK_CYCLE[f % WALK_CYCLE.length];
      head = step.head;
      legs = step.legs;
      bob = step.bob;
    } else if (f < T_GOBBLE) {
      fan = easeOut((f - T_FAN_OPEN) / FAN_OPEN);
    } else if (f < T_FAN_CLOSE) {
      fan = 1;
      // Two gobbles: throw head back for 4 frames, settle for 8
      const g = (f - T_GOBBLE) % 12;
      head = g < 4 ? "gobble" : "up";
      if (g < 4) this.drawGobble(tx, ty, g);
    } else if (f < T_PECK) {
      fan = 1 - easeOut((f - T_FAN_CLOSE) / FAN_CLOSE);
    } else if (f < T_HOLD) {
      const p = (f - T_PECK) % 9;
      head = p < 3 ? "peck" : "up";
      if (p === 1) this.drawDust(tx, f);
    }

    drawTurkey(ctx, tx, ty, { head, legs, fan, bob });

    this.frame += 1;
    this.isDone = this.frame >= T_END;
  }

  /** Little sound arcs off the beak. */
  private drawGobble(tx: number, ty: number, g: number) {
    const { ctx } = this;
    const bx = tx + 23;
    const by = ty + 1;
    ctx.fillStyle = g % 2 === 0 ? P.cream : P.gold;
    const arcs = [
      [0, 0],
      [1, 1],
      [0, 2],
    ];
    for (let ring = 0; ring <= Math.min(g, 1); ring++) {
      for (const [dx, dy] of arcs) {
        ctx.fillRect(bx + dx + ring * 2, by + dy - ring, 1, 1 + ring);
      }
    }
  }

  /** A couple of kicked-up stubble pixels when the beak hits the ground. */
  private drawDust(tx: number, f: number) {
    const { ctx } = this;
    ctx.fillStyle = P.wheat;
    const bx = tx + 24;
    ctx.fillRect(bx, GROUND_Y - 3 - (f % 2), 1, 1);
    ctx.fillRect(bx + 2, GROUND_Y - 2, 1, 1);
  }
}

export default TurkeyTrotApplet;
