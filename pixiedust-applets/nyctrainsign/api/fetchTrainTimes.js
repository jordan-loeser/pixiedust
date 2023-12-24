"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchStation = exports.isStale = exports.parseStation = exports.parseTrains = exports.getTerminal = void 0;
const types_1 = require("./types");
const last_stops_json_1 = __importDefault(require("../data/last_stops.json"));
const arrivalTimeDifference = (a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime();
// NOTE: this will eventually live in the scheduler
// const FAVORITE_STATION_IDS: Station["id"][] = [
//   "D18", // 23rd St
//   "131", // 18th St
//   "A31", // 14th St / 8 Av
// ];
const API_URL = "https://api.wheresthefuckingtrain.com"; // TODO: make secret
const getTerminal = (route, direction) => {
    const terminals = last_stops_json_1.default[route];
    if (!terminals)
        throw new Error(`Terminal not found for route: ${route}`);
    return terminals[direction];
};
exports.getTerminal = getTerminal;
const parseTrains = (rawTrains, direction) => rawTrains
    .map((rawTrain) => ({
    route: rawTrain.route,
    terminal: (0, exports.getTerminal)(rawTrain.route, direction),
    arrivalTime: new Date(rawTrain.time),
}))
    .sort(arrivalTimeDifference);
exports.parseTrains = parseTrains;
const parseStation = (res) => {
    const rawStation = res.data[0];
    return {
        id: rawStation.id,
        name: rawStation.name,
        northbound: (0, exports.parseTrains)(rawStation.N, types_1.Direction.NORTH),
        southbound: (0, exports.parseTrains)(rawStation.S, types_1.Direction.SOUTH),
        routes: rawStation.routes,
        updated: new Date(rawStation.last_update),
        location: rawStation.location,
    };
};
exports.parseStation = parseStation;
const isStale = (res) => {
    const now = new Date(Date.now()).getTime();
    const updated = new Date(res.data[0].last_update).getTime();
    const hour_ms = 1 * 60 * 60 * 1000;
    return now - updated > hour_ms;
};
exports.isStale = isStale;
const fetchStation = (stationId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch(`${API_URL}/by-id/${stationId}`);
    const json = yield res.json();
    if ((0, exports.isStale)(json))
        throw new Error("Data is stale, something is wrong.");
    return (0, exports.parseStation)(json);
});
exports.fetchStation = fetchStation;
