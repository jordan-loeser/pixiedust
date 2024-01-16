import { $Font as BDFFont } from "bdfparser";
import getline from "readlineiter";
import path from "path";

const FONT_DIRECTORY = path.join(__dirname, "../fonts");

/**
 * Friendly-named fonts for convenience.
 */
export enum Font {
  BITOCRA = "bitocra",
  CHERRY = "cherry",
  MONO = "mono",
  DINA = "dina",
  ARRIVAL_TIME = "arrival-time",
}

/**
 * Maps the {@link Font} enums to their paths relative to the directory.
 */
const fontPaths: Record<Font, string> = {
  // Custom Fonts
  [Font.ARRIVAL_TIME]: "custom/arrival-time/arrival-time-13.bdf",
  // From pixlet
  [Font.MONO]: "pixlet/CG-pixel-3x5-mono.bdf",
  [Font.DINA]: "pixlet/Dina_r400-6.bdf",
  // From bitmap-fonts
  [Font.BITOCRA]: "bitmap-fonts/bitmap/bitocra/bitocra.bdf",
  [Font.CHERRY]: "bitmap-fonts/bitmap/cherry/cherry-11-r.bdf",
};

/**
 * Loads a .bdf font file from the /fonts directory.
 * @param font either a friendly-named font from the {@link Font} enum or a string representing the path to the .bdf file relative to the /fonts directory.
 */
export const loadFont = async (font: Font | string) => {
  const fontPath = path.join(
    FONT_DIRECTORY,
    font in fontPaths ? fontPaths[font as Font] : font
  );
  if (process.env.NODE_ENV == "development")
    console.debug("Loading font:", fontPath);
  return BDFFont(getline(fontPath)); // TODO: Is there some way to like.. cache this?
};
