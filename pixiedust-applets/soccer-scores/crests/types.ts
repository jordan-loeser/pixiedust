/**
 * A hand-drawn image. Each string in `rows` is one row of pixels; each
 * character is a key into `palette`. Characters missing from the palette
 * (e.g. ".") are transparent.
 */
export type PixelArt = {
  palette: Record<string, string>;
  rows: string[];
};
