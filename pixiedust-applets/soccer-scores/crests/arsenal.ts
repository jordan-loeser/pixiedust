import { PixelArt } from "./types";

/**
 * Arsenal, redrawn for a 128x32 LED matrix.
 *
 * Simplified from the club crest: the wordmark becomes "ARS", the two-tone
 * field becomes a single bright red, and the cannon is drawn with a 9px
 * spoked wheel. Colors are chosen to survive gamma correction (gold is
 * pushed toward yellow, navy toward pure blue).
 */
const arsenal: PixelArt = {
  palette: {
    G: "#ffe860", // gold rim, cannon
    B: "#2040ff", // navy band
    W: "#ffffff", // pinstripe, wordmark
    R: "#ff0000", // field
  },
  rows: [
    ".....GGGGGGGGGGGGGG.....",
    ".GGGGWWWWWWWWWWWWWWGGGG.",
    "GWWWWRRRRRRRRRRRRRRWWWWG",
    "GBWWWRRRWRRWWRRRWWRWWWBG",
    "GBWRRRRWRWRWRWRWRRRRRWBG",
    "GBWRRRRWWWRWWRRRWRRRRWBG",
    "GBWRRRRWRWRWRWRRRWRRRWBG",
    "GBWRRRRWRWRWRWRWWRRRRWBG",
    "GBWRRRRRRRRRRRRRRRRRRWBG",
    "GBWRGRRRRRRRRRRRRRRGRWBG",
    "GBWGGGGGGGGGGGGGGGGGRWBG",
    "GBWGGGGGGGGGGGGGGGGGRWBG",
    "GBWRGRRRRGRRRRRGRRRGRWBG",
    "GBWRRRRRGRGRRRGRGRRRRWBG",
    "GBWRRRRRGRRGRGRRGRRRRWBG",
    "GBWRRRRRGRRRGRRRGRRRRWBG",
    ".GBWRRRRGRRGRGRRGRRRWBG.",
    ".GBWRRRRGRGRRRGRGRRRWBG.",
    "..GBWRRRRGRRRRRGRRRWBG..",
    "...GBWRRRRGGGGGRRRWBG...",
    "...GBWRRRRRRRRRRRRWBG...",
    "....GBWRRRRRRRRRRWBG....",
    ".....GBWWRRRRRRWWBG.....",
    "......GBBWRRRRWBBG......",
    ".......GGBWRRWBGG.......",
    ".........GBWWBG.........",
    "..........GBBG..........",
    "...........GG...........",
  ],
};

export default arsenal;
