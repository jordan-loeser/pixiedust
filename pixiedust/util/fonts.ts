import { $Font as BDFFont } from "bdfparser";
import getline from "readlineiter";
import path from "path";

const FONT_DIRECTORY = path.join(__dirname, "../fonts");

export enum Font {
  BITOCRA = "bitocra",
  CHERRY = "cherry",
  MONO = "mono",
  ARRIVAL_TIME = "arrival-time",
}

const fontPaths: Record<Font, string> = {
  // Custom Fonts
  [Font.ARRIVAL_TIME]: "custom/arrival-time/arrival-time-13.bdf",
  // From pixlet
  [Font.MONO]: "pixlet/CG-pixel-3x5-mono.bdf",
  // From bitmap-fonts
  [Font.BITOCRA]: "bitmap-fonts/bitmap/bitocra/bitocra.bdf",
  [Font.CHERRY]: "bitmap-fonts/bitmap/cherry/cherry-11-r.bdf",
};

export const loadFont = async (font: Font) => {
  const fontPath = path.join(FONT_DIRECTORY, fontPaths[font]);
  if (process.env.NODE_ENV == "development")
    console.debug("Loading font:", fontPath);
  return BDFFont(getline(fontPath)); // TODO: Is there some way to like.. cache this?
};
