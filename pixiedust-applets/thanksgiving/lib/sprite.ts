/**
 * Palette-indexed pixel sprites. Each row is a string and each character is a
 * key into the sprite's legend. "." is always transparent. Authoring art as
 * text keeps it diffable, keeps it in the repo's own license, and needs no
 * PNG loading at runtime.
 */
export type Sprite = {
  rows: readonly string[];
  legend: Readonly<Record<string, string>>;
};

export const spriteWidth = (s: Sprite) =>
  Math.max(...s.rows.map((r) => r.length));
export const spriteHeight = (s: Sprite) => s.rows.length;

export type DrawSpriteOptions = {
  flipX?: boolean;
  /** Override one or more legend colors for this draw (e.g. a recolored leaf). */
  recolor?: Readonly<Record<string, string>>;
};

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  { flipX = false, recolor }: DrawSpriteOptions = {}
) {
  const w = spriteWidth(sprite);
  const ox = Math.round(x);
  const oy = Math.round(y);
  sprite.rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const key = row[rx];
      if (key === "." || key === " ") continue;
      const color = recolor?.[key] ?? sprite.legend[key];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + (flipX ? w - 1 - rx : rx), oy + ry, 1, 1);
    }
  });
}

/** Deterministic PRNG so a render's randomness is seeded per-setup. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
