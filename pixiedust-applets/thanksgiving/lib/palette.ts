/**
 * Thanksgiving palette, authored for the panel rather than the monitor.
 *
 * Applet.gammaCorrect raises every channel to the 2.8 power at encode time,
 * so anything below about 0x60 goes dark. Browns don't survive that, so
 * "brown" here means saturated rust and mahogany, which land as deep
 * red-orange on the LEDs. Black is LEDs off: the night sky is free.
 */
export const PALETTE = {
  // Feather bands, outermost first
  cream: "#fff4c8",
  gold: "#ffd23a",
  orange: "#ff9a18",
  red: "#ff2a10",

  // Turkey body
  rust: "#e8641c",
  mahogany: "#b8320c",
  wattle: "#ff1430",
  face: "#9cd8ff",
  beak: "#ffe41e",
  leg: "#ffb030",

  // Leaves
  crimson: "#b81020",
  maple: "#ff2a10",
  pumpkin: "#ff9a18",
  amber: "#ffc82a",

  // Field and table
  soil: "#a8480c",
  wheat: "#f8c03a",
  husk: "#ffe88a",
  moon: "#ffb468",
  star: "#b8ac94",
  cloth: "#c01018",
  plate: "#e0d8c8",
  steam: "#b0a8a0",
  green: "#5ad21e",
  berry: "#ff1048",
  crust: "#ffb030",
  filling: "#f07018",
  roll: "#ffd27a",
} as const;

export type PaletteKey = keyof typeof PALETTE;
