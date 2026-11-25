import { PALETTE as P } from "./palette";
import { Sprite } from "./sprite";

/** Leaf shapes drawn in a single key ("L") and recolored per leaf. */
const L = { L: P.maple, S: P.mahogany };

export const MAPLE: Sprite = {
  legend: L,
  rows: ["..L..", "LLLLL", ".LLL.", "LLLLL", "..S.."],
};

export const MAPLE_TURNED: Sprite = {
  legend: L,
  rows: [".L.L.", "LLLLL", "LLLLL", ".LLL.", "..S.."],
};

export const OAK: Sprite = {
  legend: L,
  rows: [".LL.", "LLL.", ".LLL", "LLL.", ".LS."],
};

export const OAK_TURNED: Sprite = {
  legend: L,
  rows: [".LL.", ".LLL", "LLL.", ".LLL", ".SL."],
};

export const ELM: Sprite = {
  legend: L,
  rows: [".L.", "LLL", "LLL", ".S."],
};

export const ELM_TURNED: Sprite = {
  legend: L,
  rows: ["LL.", "LLL", ".LL", ".S."],
};

/** Pairs of [rest, flutter] frames. */
export const LEAF_SHAPES: readonly (readonly [Sprite, Sprite])[] = [
  [MAPLE, MAPLE_TURNED],
  [OAK, OAK_TURNED],
  [ELM, ELM_TURNED],
];

export const LEAF_COLORS = [P.crimson, P.maple, P.pumpkin, P.amber, P.gold];
