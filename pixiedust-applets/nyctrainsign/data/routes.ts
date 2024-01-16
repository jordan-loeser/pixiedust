import { Route } from "../api/types";

type RouteMetaData = {
  color: string;
  isExpress?: boolean;
  symbol?: Route;
};

// Route Colors: https://en.wikipedia.org/wiki/New_York_City_Subway_nomenclature#Colors_and_trunk_lines
const RED = "#ee352e";
const GREEN = "#00933c";
const PURPLE = "#b933ad";
const ORANGE = "#ff6319";
const BLUE = "#0039a6";
const LIME = "#6cbe45";
const BROWN = "#996633";
const YELLOW = "#fccc0a";
const DARK_SLATE_GRAY = "#808183";
const LIGHT_SLATE_GRAY = "#a7a9ac";

// Scraped from MTAPI
export const ROUTE_METADATA: Record<Route, RouteMetaData> = {
  "1": { color: RED },
  "2": { color: RED },
  "3": { color: RED },
  "4": { color: GREEN },
  "5": { color: GREEN },
  "6": { color: GREEN },
  "6X": { color: GREEN, isExpress: true, symbol: "6" },
  "7": { color: PURPLE },
  "7X": { color: PURPLE, isExpress: true, symbol: "7" },
  A: { color: BLUE },
  B: { color: ORANGE },
  C: { color: BLUE },
  D: { color: ORANGE },
  E: { color: BLUE },
  F: { color: ORANGE },
  FS: { color: ORANGE, isExpress: true, symbol: "F" },
  G: { color: LIME },
  H: { color: DARK_SLATE_GRAY, symbol: "SR" },
  J: { color: BROWN },
  L: { color: LIGHT_SLATE_GRAY },
  M: { color: ORANGE },
  N: { color: YELLOW },
  Q: { color: YELLOW },
  R: { color: YELLOW },
  S: { color: DARK_SLATE_GRAY },
  SI: { color: DARK_SLATE_GRAY },
  W: { color: YELLOW },
};
