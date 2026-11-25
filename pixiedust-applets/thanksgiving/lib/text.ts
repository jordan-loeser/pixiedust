import { Font, loadFont } from "pixiedust";

/**
 * A pre-rendered bitmap line of text: a grid of 0/1 rows. pixiedust's Text
 * widget can't center, clip, or drop a shadow, so this draws the BDF bitmap
 * directly.
 */
export type TextBitmap = { width: number; height: number; data: number[][] };

const cache = new Map<string, TextBitmap>();

export async function renderText(str: string, font: Font): Promise<TextBitmap> {
  const key = `${font}:${str}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const bdf = await loadFont(font);
  const bitmap = bdf.draw(str);
  const data = bitmap.todata(2) as number[][];
  const result = { width: bitmap.width(), height: bitmap.height(), data };
  cache.set(key, result);
  return result;
}

export type DrawTextOptions = {
  color: string;
  /** Color for a 1px drop shadow down-right; omit for none. */
  shadow?: string;
  /** Only draw pixels whose canvas x is < revealX. */
  revealX?: number;
};

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: TextBitmap,
  x: number,
  y: number,
  { color, shadow, revealX = Infinity }: DrawTextOptions
) {
  const ox = Math.round(x);
  const oy = Math.round(y);
  const pass = (dx: number, dy: number, fill: string) => {
    ctx.fillStyle = fill;
    text.data.forEach((row, ry) =>
      row.forEach((v, rx) => {
        const px = ox + rx + dx;
        if (v === 1 && px < revealX) ctx.fillRect(px, oy + ry + dy, 1, 1);
      })
    );
  };
  if (shadow) pass(1, 1, shadow);
  pass(0, 0, color);
}

/** Rows of the bitmap that actually contain ink: [first, last]. */
export function inkRows(text: TextBitmap): [number, number] {
  let first = -1;
  let last = -1;
  text.data.forEach((row, i) => {
    if (row.some((v) => v === 1)) {
      if (first < 0) first = i;
      last = i;
    }
  });
  return [Math.max(first, 0), Math.max(last, 0)];
}
