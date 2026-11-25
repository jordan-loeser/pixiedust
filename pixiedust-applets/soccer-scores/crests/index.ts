import arsenal from "./arsenal";
import { PixelArt } from "./types";

/**
 * Hand-drawn crests, keyed by ESPN team id. Teams listed here use their
 * pixel art instead of ESPN's downscaled logo.
 */
export const CUSTOM_CRESTS: Record<string, PixelArt> = {
  "359": arsenal,
};

export { PixelArt };
