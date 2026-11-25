import { PALETTE as P } from "./palette";
import { Sprite, drawSprite } from "./sprite";

/**
 * A 26×22 side-view turkey facing right. The tail fan is procedural so it can
 * open and close; body, head poses, and legs are hand-authored sprites.
 * Coordinates below are relative to the turkey's top-left corner.
 */
export const TURKEY_WIDTH = 26;
export const TURKEY_HEIGHT = 22;

const BODY: Sprite = {
  legend: { M: P.mahogany, R: P.rust, O: P.orange, G: P.gold, C: P.cream },
  rows: [
    "....MMMMMM....",
    "..MMRMMRMMRM..",
    ".MRMMRMMRMMRRM",
    "MMGGGGGGMRMRRR",
    "MOOOOOOGMMRRRR",
    "MMGGGGGOMRMRRR",
    "MOOOOOGMMRRRR.",
    ".MMGGGMMRMRRM.",
    "..MMRMMRMMRM..",
    "...MMMMMMMM...",
    ".....MMMM.....",
  ],
};

const HEAD_LEGEND = {
  F: P.face,
  K: "#000000",
  Y: P.beak,
  W: P.wattle,
  N: P.rust,
};

export type HeadPose = "up" | "bob" | "gobble" | "peck";

const HEADS: Record<HeadPose, { sprite: Sprite; x: number; y: number }> = {
  up: {
    x: 16,
    y: 0,
    sprite: {
      legend: HEAD_LEGEND,
      rows: [
        "..FF...",
        ".FFKF..",
        ".FFFFYY",
        "..WWF..",
        "..WWF..",
        "...WF..",
        "...FF..",
        "..NN...",
        ".NNN...",
      ],
    },
  },
  bob: {
    x: 17,
    y: 1,
    sprite: {
      legend: HEAD_LEGEND,
      rows: [
        "..FF...",
        ".FFKF..",
        ".FFFFYY",
        "..WWF..",
        "..WWF..",
        "..WFF..",
        ".NN....",
        "NNN....",
      ],
    },
  },
  gobble: {
    x: 15,
    y: 0,
    sprite: {
      legend: HEAD_LEGEND,
      rows: [
        "...FF.Y.",
        "..FKFFY.",
        "..FFF...",
        "..FFFYY.",
        "..WW....",
        "..WWW...",
        "..WWF...",
        "..NN....",
        ".NNN....",
      ],
    },
  },
  peck: {
    x: 16,
    y: 12,
    sprite: {
      legend: HEAD_LEGEND,
      rows: [
        "NN.......",
        ".NFF.....",
        "..FFF....",
        "...FFF...",
        "....FFF..",
        "....FKFF.",
        "....WFFF.",
        "....WWFYY",
        ".....W..Y",
      ],
    },
  },
};

export type LegPose = "stand" | "stepA" | "stepB";

const LEGS: Record<LegPose, Sprite> = {
  stand: {
    legend: { L: P.leg },
    rows: ["..L..L...", "..L..L...", "..L..L...", "..LL.LL.."],
  },
  stepA: {
    legend: { L: P.leg },
    rows: ["..L...L..", ".L.....L.", ".L.....L.", ".LL.....LL"],
  },
  stepB: {
    legend: { L: P.leg },
    rows: ["...LL....", "...LL....", "...L.L...", "...LLLL.."],
  },
};

const LEGS_X = 8;
const LEGS_Y = 18;
const BODY_X = 5;
const BODY_Y = 7;
const FAN_CX = 9;
const FAN_CY = 12;

/**
 * Draws the tail fan. `spread` 0 is folded (a narrow wedge pointing back),
 * 1 is fully displayed (a tall half-disc).
 */
export function drawFan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spread: number
) {
  const s = Math.max(0, Math.min(1, spread));
  const radius = 8 + 2.5 * s;
  const halfSpan = ((16 + 76 * s) * Math.PI) / 180;
  const center = ((162 - 70 * s) * Math.PI) / 180;
  const featherCount = 9;
  const featherWidth = (2 * halfSpan) / featherCount;

  const r0 = Math.ceil(radius);
  for (let dy = -r0; dy <= 2; dy++) {
    for (let dx = -r0; dx <= r0; dx++) {
      const r = Math.hypot(dx + 0.5, dy + 0.5);
      if (r > radius || r < 2) continue;
      const theta = Math.atan2(-(dy + 0.5), dx + 0.5);
      let d = theta - center;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      if (Math.abs(d) > halfSpan) continue;

      // Feather index across the fan, and position within that feather
      const t = (d + halfSpan) / featherWidth;
      const within = t - Math.floor(t);
      const isSeam = s > 0.3 && (within < 0.12 || within > 0.88) && r < radius - 1.2;

      let color: string;
      if (r > radius - 1.2) color = P.cream;
      else if (r > radius - 2.6) color = P.gold;
      else if (isSeam) color = P.mahogany;
      else if (r > radius - 4.6) color = P.orange;
      else if (r > radius - 6.6) color = P.red;
      else color = P.rust;

      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + FAN_CX + dx), Math.round(y + FAN_CY + dy), 1, 1);
    }
  }
}

export type TurkeyPose = {
  head: HeadPose;
  legs: LegPose;
  /** Tail fan openness, 0..1 */
  fan: number;
  /** Vertical bob in pixels (walk cycle) */
  bob?: number;
};

export function drawTurkey(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pose: TurkeyPose
) {
  const bx = Math.round(x);
  const by = Math.round(y) + (pose.bob ?? 0);
  drawSprite(ctx, LEGS[pose.legs], bx + LEGS_X, Math.round(y) + LEGS_Y);
  drawFan(ctx, bx, by, pose.fan);
  drawSprite(ctx, BODY, bx + BODY_X, by + BODY_Y);
  const head = HEADS[pose.head];
  drawSprite(ctx, head.sprite, bx + head.x, by + head.y);
}
