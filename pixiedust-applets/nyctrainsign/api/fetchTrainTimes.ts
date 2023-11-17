import {
  Direction,
  LastStop,
  Route,
  Station,
  Train,
  WTFStationResponse,
} from "./types";

import LAST_STOPS from "../data/last_stops.json";

const arrivalTimeDifference = (a: Train, b: Train) =>
  a.arrivalTime.getTime() - b.arrivalTime.getTime();

// NOTE: this will eventually live in the scheduler
// const FAVORITE_STATION_IDS: Station["id"][] = [
//   "D18", // 23rd St
//   "131", // 18th St
//   "A31", // 14th St / 8 Av
// ];

const API_URL = "https://api.wheresthefuckingtrain.com"; // TODO: make secret

export const getTerminal = (route: Route, direction: Direction) =>
  (LAST_STOPS as LastStop)[route][direction];

export const parseTrains = (
  rawTrains: { route: string; time: string }[],
  direction: Direction
): Train[] =>
  rawTrains
    .map((rawTrain) => ({
      route: rawTrain.route,
      terminal: getTerminal(rawTrain.route, direction),
      arrivalTime: new Date(rawTrain.time),
    }))
    .sort(arrivalTimeDifference);

export const parseStation = (res: WTFStationResponse) => {
  const rawStation = res.data[0];
  return {
    id: rawStation.id,
    name: rawStation.name,
    northbound: parseTrains(rawStation.N, "N"),
    southbound: parseTrains(rawStation.S, "S"),
    routes: rawStation.routes,
    updated: new Date(rawStation.last_update),
    location: rawStation.location,
  } as Station;
};

export const isStale = (res: WTFStationResponse) =>
  new Date(Date.now()).getTime() - new Date(res.data[0].last_update).getTime() >
  1 * 60 * 60 * 1000;

export const fetchStation = async (stationId: Station["id"]) => {
  const res = await fetch(`${API_URL}/by-id/${stationId}`);

  const json = await res.json();

  // if (isStale(json)) throw new Error("Data is stale, something is wrong.");

  return parseStation(json);
};
