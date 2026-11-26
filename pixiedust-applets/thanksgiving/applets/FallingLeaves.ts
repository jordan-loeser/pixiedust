import { Applet, Font } from "pixiedust";
import * as K from "../lib/kamiPumpkins";
import { LEAF_COLORS, LEAF_SHAPES } from "../lib/leaves";
import { PALETTE as P } from "../lib/palette";
import { SeasonalConfig, isSeasonActive } from "../lib/schedule";
import {
  Sprite,
  drawSprite,
  mapColors,
  mulberry32,
  spriteHeight,
  spriteWidth,
} from "../lib/sprite";
import { TextBitmap, drawText, inkRows, renderText } from "../lib/text";

const DEFAULT_FRAME_RATE = 12;
const DEFAULT_DURATION_S = 15;
const DEFAULT_TEXT = "GIVE THANKS";
const PILE_MAX = 6; // rows the drift may climb to

type Leaf = {
  shape: readonly [Sprite, Sprite];
  color: string;
  x0: number;
  y: number;
  vy: number;
  sway: number;
  swayRate: number;
  phase: number;
  front: boolean;
};

/**
 * Kami's pumpkins are shaded in muted oranges that gamma turns to brick.
 * Snap them to solid orange with rust ridges; keep the black outline and
 * green stems. With pumpkins on, leaves avoid orange (PUMPKIN_LEAF_COLORS)
 * so the pumpkins stand apart on the panel.
 */
const panelPumpkin = (s: Sprite) =>
  mapColors(s, (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    if (r < 0x30 || g > r) return hex; // outline or stem
    const lum = 0.6 * r + 0.4 * g;
    return lum < 170 ? P.rust : P.orange;
  });

const PUMPKIN_LEAF_COLORS = [P.crimson, P.maple, P.gold];

export type FallingLeavesSchema = SeasonalConfig & {
  frameRate?: number;
  duration?: number;
  /** Wordmark; pass "" for leaves only. */
  text?: string;
  /** Set a few pumpkins (CC0, Kami's Pixel Pumpkins) in the leaf bed. */
  pumpkins?: boolean;
};

/**
 * Maple, oak, and elm leaves sway down past a harvest moon and a wordmark,
 * flutter as they turn, and settle into a pile that builds up along the
 * bottom of the panel.
 */
export class FallingLeavesApplet extends Applet {
  public id = "thanksgiving-falling-leaves";
  public isDone = false;
  public isActive = false;
  protected gifQuality = 1;

  private config: FallingLeavesSchema;
  private duration: number;
  private textStr: string;

  private frame = 0;
  private rand = mulberry32(1);
  private colors: readonly string[] = LEAF_COLORS;
  private leaves: Leaf[] = [];
  /** Settled pile: one color (or null) per pixel. */
  private pile: (string | null)[][] = [];
  /** Height of the pile in each column. */
  private pileTop: number[] = [];
  /** Highest row the pile may reach in each column. */
  private maxTop: number[] = [];
  private pumpkins: { sprite: Sprite; x: number; y: number }[] = [];
  private text?: TextBitmap;

  constructor(canvas: HTMLCanvasElement, config: FallingLeavesSchema = {}) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.config = config;
    this.duration = config.duration ?? DEFAULT_DURATION_S;
    this.textStr = config.text ?? DEFAULT_TEXT;
  }

  async setup() {
    this.frame = 0;
    this.isDone = false;
    this.isActive = isSeasonActive(this.config);
    if (!this.isActive) return;

    this.text = this.textStr ? await renderText(this.textStr, Font.CHERRY) : undefined;
    this.rand = mulberry32(Date.now());
    this.colors = this.config.pumpkins ? PUMPKIN_LEAF_COLORS : LEAF_COLORS;
    const { width, height } = this.canvas;
    this.pile = Array.from({ length: height }, () =>
      Array<string | null>(width).fill(null)
    );
    this.pileTop = Array(width).fill(height);
    this.maxTop = Array(width).fill(height - PILE_MAX);
    this.pumpkins = [];
    if (this.config.pumpkins) {
      const spots: [Sprite, number][] = [
        [K.PUMPKINLARGE, 14],
        [K.PUMPKINSMALL, 30],
        [K.PUMPKINPATCH, 70],
        [K.PUMPKINMEDIUM, 96],
      ].map(([sp, x]) => [panelPumpkin(sp as Sprite), x as number]);
      for (const [sprite, x] of spots) {
        const y = height - 1 - spriteHeight(sprite);
        this.pumpkins.push({ sprite, x, y });
        // Leaves land on the pumpkins and may pile a little on top
        for (let dx = 0; dx < spriteWidth(sprite); dx++) {
          const first = sprite.rows.findIndex((r) => r[dx] && r[dx] !== ".");
          if (first < 0) continue;
          const col = x + dx;
          this.pileTop[col] = Math.min(this.pileTop[col], y + first);
          this.maxTop[col] = Math.min(this.maxTop[col], y + first - 1);
        }
      }
    }
    // A thin bed of leaves already on the ground
    for (let x = 0; x < width; x++) {
      const h = 1 + (this.rand() < 0.4 ? 1 : 0);
      for (let i = 0; i < h; i++) this.settlePixel(x, height - 1 - i, this.pick(this.colors));
    }
    // Start mid-fall so the first frame isn't empty
    this.leaves = Array.from({ length: 14 }, () =>
      this.spawn(this.rand() * height * 0.8 - 4)
    );
  }

  private pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rand() * arr.length)];
  }

  private spawn(y = -6): Leaf {
    return {
      shape: this.pick(LEAF_SHAPES),
      color: this.pick(this.colors),
      x0: this.rand() * (this.canvas.width + 8) - 4,
      y,
      vy: 0.25 + this.rand() * 0.3,
      sway: 2 + this.rand() * 4,
      swayRate: 0.08 + this.rand() * 0.08,
      phase: this.rand() * Math.PI * 2,
      front: this.rand() < 0.45,
    };
  }

  private settlePixel(x: number, y: number, color: string) {
    if (x < 0 || x >= this.canvas.width || y < 0) return;
    this.pile[y][x] = color;
    this.pileTop[x] = Math.min(this.pileTop[x], y);
  }

  private leafX(l: Leaf) {
    return l.x0 + Math.sin(this.frame * l.swayRate + l.phase) * l.sway;
  }

  /** A leaf flutters (shows its turned frame) while swinging fastest. */
  private leafFrame(l: Leaf): Sprite {
    const c = Math.cos(this.frame * l.swayRate + l.phase);
    return Math.abs(c) > 0.7 ? l.shape[1] : l.shape[0];
  }

  private drawLeaf(l: Leaf) {
    drawSprite(this.ctx, this.leafFrame(l), this.leafX(l), l.y, {
      recolor: { L: l.color },
    });
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Harvest moon, low on the right
    this.drawMoon(114, 9, 6);

    // Leaves behind the wordmark
    for (const l of this.leaves) if (!l.front) this.drawLeaf(l);

    // Wordmark, vertically centered on its ink in the sky above the pile
    if (this.text) {
      const [top, bottom] = inkRows(this.text);
      const x = Math.round((canvas.width - this.text.width) / 2);
      const y = Math.round((canvas.height - 6 - (bottom - top + 1)) / 2) - top;
      drawText(ctx, this.text, x, y, { color: P.cream, shadow: P.crimson });
    }

    // Pile
    for (let y = 0; y < canvas.height; y++) {
      const row = this.pile[y];
      for (let x = 0; x < canvas.width; x++) {
        const c = row[x];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Pumpkins over the pile: their black outline cuts a dark gap between
    // pumpkin and leaves, which keeps them distinct on the panel
    for (const p of this.pumpkins) drawSprite(ctx, p.sprite, p.x, p.y);

    // Leaves in front
    for (const l of this.leaves) if (l.front) this.drawLeaf(l);

    // Physics: fall, then settle onto the pile
    const keep: Leaf[] = [];
    for (const l of this.leaves) {
      l.y += l.vy;
      const sprite = this.leafFrame(l);
      const w = spriteWidth(sprite);
      const h = spriteHeight(sprite);
      const lx = Math.round(this.leafX(l));
      const bottom = Math.round(l.y) + h;
      let landed = false;
      for (let dx = 0; dx < w; dx++) {
        const col = lx + dx;
        if (col >= 0 && col < canvas.width && bottom >= this.pileTop[col]) {
          landed = true;
          break;
        }
      }
      if (landed) {
        this.stamp(l, sprite, lx);
        keep.push(this.spawn());
      } else {
        keep.push(l);
      }
    }
    this.leaves = keep;

    this.frame += 1;
    this.isDone = this.frame >= this.frameRate * this.duration;
  }

  /**
   * Press a landed leaf into the pile. Each column of the leaf drops onto its
   * own column of the pile, like sand, so the drift stays grounded.
   */
  private stamp(l: Leaf, sprite: Sprite, lx: number) {
    const w = spriteWidth(sprite);
    for (let dx = 0; dx < w; dx++) {
      const col = lx + dx;
      if (col < 0 || col >= this.canvas.width) continue;
      // A leaf lies flat: at most 2 pixels deep in any column
      const ink = sprite.rows.filter((r) => r[dx] && r[dx] !== ".").length;
      const depth = Math.min(2, Math.ceil(ink / 2));
      for (let i = 0; i < depth; i++) {
        const y = this.pileTop[col] - 1;
        if (y < this.maxTop[col]) break;
        this.settlePixel(col, y, l.color);
      }
    }
  }

  private drawMoon(cx: number, cy: number, r: number) {
    const { ctx } = this;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y);
        if (d > r + 0.2) continue;
        // Faint craters on the lower left
        const crater =
          (x === -2 && y === 1) || (x === -3 && y === 2) || (x === 1 && y === 3);
        ctx.fillStyle = crater ? P.amber : P.moon;
        ctx.fillRect(cx + x, cy + y, 1, 1);
      }
    }
  }
}

export default FallingLeavesApplet;
