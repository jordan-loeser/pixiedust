export enum Direction {
  NORTH = "N",
  SOUTH = "S",
}

export type LastStop = Record<Route, Record<Direction, string>>;

export type Location = [lat: number, long: number];

export type Route = string;

export type Train = {
  route: Route;
  terminal: Station["name"];
  arrivalTime: Date;
};

export type Station = {
  id: string | number;
  name: string;
  northbound: Train[];
  southbound: Train[];
  routes: Route[];
  updated: Date;
  location: Location;
};

// The raw response from the API before we parse it into types
export type WTFStationResponse = {
  data: {
    id: string;
    N: {
      route: string;
      time: string;
    }[];
    S: {
      route: string;
      time: string;
    }[];
    routes: string[];
    last_update: string;
    location: [number, number];
    name: string;
    stops: Record<string, [number, number]>;
  }[];
  updated: Date;
};
