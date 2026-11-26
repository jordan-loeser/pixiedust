import { PALETTE as P } from "./palette";
import * as H from "./henryFood";
import { Sprite } from "./sprite";

/**
 * Original dinner-table sprites, bottom-aligned (the last row sits on the
 * table). Each dish can mark itself hot, which gives it steam.
 *
 * To swap in a CC0 sheet (e.g. Henry Software's Food.png), replace a dish's
 * sprite with one generated from the sheet's cell; the applet only needs
 * `sprite`, `hot`, and the steam anchor.
 */
export type Dish = {
  name: string;
  sprite: Sprite;
  hot: boolean;
  /** x offsets (within the sprite) that steam rises from */
  steamFrom?: number[];
};

const PLATE = P.plate;

export const ROAST_TURKEY: Dish = {
  name: "roast turkey",
  hot: true,
  steamFrom: [6, 11],
  sprite: {
    legend: {
      C: P.cream,
      B: P.crust,
      R: P.rust,
      G: P.gold,
      M: P.mahogany,
      P: PLATE,
      g: P.green,
    },
    rows: [
      ".C..............C.",
      "CC..............CC",
      ".CB............BC.",
      "..BB..RRRRRR..BB..",
      "..BBRRRGGGRRRRBB..",
      "...RRGGBBRRRRRR...",
      "..RRRGBRRRRRRRRR..",
      "..RRRRRRRRRRRRRR..",
      ".g.MRRRRRRRRRRM.g.",
      "PgPPMMMMMMMMMMPPgP",
      ".PPPPPPPPPPPPPPPP.",
    ],
  },
};

export const PUMPKIN_PIE: Dish = {
  name: "pumpkin pie",
  hot: true,
  steamFrom: [5, 10],
  sprite: {
    legend: { C: P.crust, F: P.filling, W: P.cream, M: P.mahogany, P: PLATE },
    rows: [
      "....WW..........",
      "...WWWW.........",
      "..CCCCCCCCCCCC..",
      ".CFFFFFFFFFFFFC.",
      "CFFFFFFFFFFFFFFC",
      "CCCCCCCCCCCCCCCC",
      ".CMCMCMCMCMCMCM.",
      "..PPPPPPPPPPPP..",
    ],
  },
};

export const CORN: Dish = {
  name: "corn",
  hot: false,
  sprite: {
    legend: { Y: P.husk, y: P.gold, g: P.green },
    rows: [
      "g.............",
      "gg.YyYyYyYyY..",
      ".gYyYyYyYyYyY.",
      "ggYyYyYyYyYyYY",
      ".gyYyYyYyYyYy.",
      "gg.yYyYyYyYy..",
      "g.............",
    ],
  },
};

export const CRANBERRY: Dish = {
  name: "cranberry sauce",
  hot: false,
  sprite: {
    legend: { B: P.berry, b: P.crimson, P: PLATE },
    rows: [
      "..BBBBBB..",
      ".BBBBBBBB.",
      ".bbbbbbbb.",
      ".BBBBBBBB.",
      ".bbbbbbbb.",
      ".BBBBBBBB.",
      ".bbbbbbbb.",
      "PPPPPPPPPP",
      ".PPPPPPPP.",
    ],
  },
};

export const ROLLS: Dish = {
  name: "rolls",
  hot: true,
  steamFrom: [4, 9],
  sprite: {
    legend: { R: P.roll, C: P.cream, W: P.wheat, M: P.mahogany },
    rows: [
      "...CC...CC...",
      "..RCRR.RCRR..",
      ".RRRRRRRRRRR.",
      "MWMWMWMWMWMWM",
      ".WMWMWMWMWMW.",
      "..WWWWWWWWW..",
    ],
  },
};

export const POTATOES: Dish = {
  name: "mashed potatoes",
  hot: true,
  steamFrom: [4, 8],
  sprite: {
    legend: { Y: P.beak, P: PLATE, C: P.cream, B: P.face },
    rows: [
      ".....YY.....",
      "...PPYYP....",
      "..PPCPPPPP..",
      ".PPPPPPCPPP.",
      "BBBBBBBBBBBB",
      ".BBBBBBBBBB.",
      "..BBBBBBBB..",
    ],
  },
};

/** The original hand-drawn spread. */
export const ORIGINAL_MENU: readonly Dish[] = [
  ROLLS,
  CORN,
  ROAST_TURKEY,
  CRANBERRY,
  POTATOES,
  PUMPKIN_PIE,
];

const henry = (name: string, sprite: Sprite, steamFrom?: number[]): Dish => ({
  name,
  sprite,
  hot: !!steamFrom,
  steamFrom,
});

/**
 * Default spread, from Henry Software's CC0 Free Pixel Food (see
 * assets/henry-food). Serving order, left to right as the table slides by.
 */
export const MENU: readonly Dish[] = [
  henry("rolls", H.ROLL, [7]),
  henry("roast", H.CHICKEN, [5, 10]),
  henry("cranberry", H.JAM),
  henry("potatoes", H.POTATO, [7]),
  henry("pumpkin pie", H.PIEPUMPKIN, [8]),
  henry("apple pie", H.PIEAPPLE, [8]),
];

/** Extra CC0 dishes, left out of the default spread to keep the GIF small. */
export const EXTRA_DISHES: readonly Dish[] = [
  henry("drumstick", H.CHICKENLEG),
  henry("turnip", H.TURNIP),
];
