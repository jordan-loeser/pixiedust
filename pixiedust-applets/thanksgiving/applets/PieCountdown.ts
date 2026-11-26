import { Applet, Font } from "pixiedust";
import { px } from "../lib/draw";
import { PALETTE as P } from "../lib/palette";
import { SeasonalConfig, isSeasonActive } from "../lib/schedule";
import { mulberry32 } from "../lib/sprite";
import { TextBitmap, drawText, inkRows, renderText } from "../lib/text";

const DEFAULT_FRAME_RATE = 10;
const SLICES = 8;
const PIE_CX = 16;
const PIE_CY = 16;
const PIE_R = 12.5;
const PLATE_R = 14.5;
const TEXT_LEFT = 34;

// Timeline, in frames
const INTRO = 12;
const SLIDE = 5; // slice slides out
const PAUSE = 7; // beat before the next one
const PER_SLICE = SLIDE + PAUSE;
const T_EMPTY = INTRO + SLICES * PER_SLICE;
const OUTRO = 26;

export type PieCountdownSchema = SeasonalConfig & { frameRate?: number };

/**
 * A pumpkin pie disappears one slice at a time while the count ticks down,
 * ending on an empty, crumb-dusted plate asking for seconds.
 */
export class PieCountdownApplet extends Applet {
  public id = "thanksgiving-pie-countdown";
  public isDone = false;
  public isActive = false;
  protected gifQuality = 1;

  private config: PieCountdownSchema;
  private frame = 0;
  private labels: TextBitmap[] = [];
  private left?: TextBitmap;
  private seconds?: TextBitmap;
  private crumbs: { x: number; y: number }[] = [];
  private order: number[] = [];

  constructor(canvas: HTMLCanvasElement, config: PieCountdownSchema = {}) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.config = config;
  }

  async setup() {
    this.frame = 0;
    this.isDone = false;
    this.isActive = isSeasonActive(this.config);
    if (!this.isActive) return;

    this.labels = [];
    for (let n = SLICES; n >= 1; n--) {
      this.labels.push(await renderText(`${n} SLICE${n === 1 ? "" : "S"}`, Font.CHERRY));
    }
    this.left = await renderText("LEFT", Font.CHERRY);
    this.seconds = await renderText("SECONDS?", Font.CHERRY);

    // Eat slices in a slightly random order so it isn't a clock sweep
    const rand = mulberry32(Date.now());
    this.order = Array.from({ length: SLICES }, (_, i) => i).sort(() => rand() - 0.5);
    this.crumbs = [];
  }

  /** Which slice a pixel offset falls in, and how close it is to a cut. */
  private sliceAt(dx: number, dy: number) {
    const a = (Math.atan2(dy, dx) + Math.PI * 2.5) % (Math.PI * 2);
    const t = (a / (Math.PI * 2)) * SLICES;
    const i = Math.floor(t);
    const within = t - i;
    return { i, edge: Math.min(within, 1 - within) };
  }

  draw() {
    const { ctx, canvas } = this;
    const f = this.frame;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Which slice is on its way out, and which are already gone
    const k = f - INTRO;
    const step = k < 0 ? -1 : Math.min(SLICES, Math.floor(k / PER_SLICE));
    const phase = k < 0 ? 0 : k % PER_SLICE;
    const gone = new Set<number>();
    let sliding = -1;
    let slideT = 0;
    if (step >= SLICES) {
      this.order.forEach((i) => gone.add(i));
    } else if (step >= 0) {
      this.order.slice(0, step).forEach((i) => gone.add(i));
      if (phase < SLIDE) {
        sliding = this.order[step];
        slideT = phase / SLIDE;
      } else {
        gone.add(this.order[step]);
      }
    }
    const shown = SLICES - gone.size - (sliding >= 0 && slideT > 0.5 ? 1 : 0);

    // Plate
    for (let dy = -15; dy <= 15; dy++) {
      for (let dx = -15; dx <= 15; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > PLATE_R + 0.2) continue;
        let color: string | null = null;
        if (d > PLATE_R - 1) color = P.plate;
        else if (d > PIE_R) color = P.steam;
        if (d <= PIE_R) {
          const { i, edge } = this.sliceAt(dx, dy);
          if (gone.has(i) || i === sliding) color = d > PIE_R - 0.8 ? P.steam : "#5a5048";
          else color = this.pieColor(d, edge, dx, dy);
        }
        if (color) px(ctx, PIE_CX + dx, PIE_CY + dy, color);
      }
    }

    // Crumbs left behind on the plate
    for (const c of this.crumbs) px(ctx, c.x, c.y, P.crust);

    // The slice being served slides outward along its bisector
    if (sliding >= 0) {
      const mid = ((sliding + 0.5) / SLICES) * Math.PI * 2 - Math.PI * 2.5;
      const ox = Math.cos(mid) * slideT * 9;
      const oy = Math.sin(mid) * slideT * 9;
      for (let dy = -13; dy <= 13; dy++) {
        for (let dx = -13; dx <= 13; dx++) {
          const d = Math.hypot(dx, dy);
          if (d > PIE_R) continue;
          const { i, edge } = this.sliceAt(dx, dy);
          if (i !== sliding) continue;
          px(ctx, PIE_CX + dx + ox, PIE_CY + dy + oy, this.pieColor(d, edge, dx, dy));
        }
      }
      // Drop a crumb or two where it left
      if (phase === 1) {
        this.crumbs.push({
          x: Math.round(PIE_CX + Math.cos(mid) * 6),
          y: Math.round(PIE_CY + Math.sin(mid) * 6),
        });
      }
    }

    // Count
    if (shown > 0 && this.left) {
      const label = this.labels[SLICES - shown];
      const [top] = inkRows(label);
      drawText(ctx, label, TEXT_LEFT + 2, 4 - top, { color: P.gold, shadow: P.mahogany });
      drawText(ctx, this.left, TEXT_LEFT + 2, 16 - top, { color: P.cream, shadow: P.mahogany });
    } else if (this.seconds) {
      const [top, bottom] = inkRows(this.seconds);
      const y = Math.round((canvas.height - (bottom - top + 1)) / 2) - top;
      // Wobble the question in
      const k = f - T_EMPTY;
      const dx = k < 8 ? Math.round(Math.sin(k * 1.6) * 2) : 0;
      drawText(ctx, this.seconds, TEXT_LEFT + 4 + dx, y, { color: P.cream, shadow: P.crimson });
    }

    this.frame += 1;
    this.isDone = this.frame >= T_EMPTY + OUTRO;
  }

  private pieColor(d: number, edge: number, dx: number, dy: number) {
    if (d > PIE_R - 1.6) return (Math.round(Math.atan2(dy, dx) * 8) & 1) ? P.crust : P.wheat;
    if (edge < 0.06 && d > 2) return P.mahogany;
    // Dollop of cream near the crust on every slice
    const { edge: e } = this.sliceAt(dx, dy);
    if (d > 7 && d < 9.6 && e > 0.3) return P.cream;
    return P.filling;
  }
}

export default PieCountdownApplet;
