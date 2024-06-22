import express from "express";
import cors from "cors";
import helmet from "helmet";
import { JSDOM } from "jsdom";
import { Scheduler } from "pixiedust";
import NYCTrainApplet, { Direction } from "@applets/nyctrainsign";
import ConwaysGameOfLifeApplet from "@applets/conways-game-of-life";
import SpotifyApplet from "@applets/spotify";
import { errorMonitor } from "events";

const PORT: number = process.env.PORT
  ? parseInt(process.env.PORT as string, 10)
  : 3000;

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
  console.log(`\t➜  Local:   http://localhost:${PORT}/`);
});

app.get("/health", async (_req, res) => {
  res.send("ping");
});

// Initialize Applet Scheduler
const dom = new JSDOM();
const canvas = dom.window.document.createElement("canvas");

canvas.width = 128;
canvas.height = 32;

// TODO: implement scheduler UI rather than hard-coding

const scheduler = new Scheduler();

const uptown18th = new NYCTrainApplet(canvas, {
  stationId: "131",
  direction: Direction.NORTH,
});
// scheduler.register(uptown18th);

const downtown18th = new NYCTrainApplet(canvas, {
  stationId: "131",
  direction: Direction.SOUTH,
});
// scheduler.register(downtown18th);

const conways2 = new ConwaysGameOfLifeApplet(canvas, {
  layers: [{ cellColor: "orange" }, { cellColor: "blue" }],
  compositeOperation: "screen",
  fadeOut: true,
});
// scheduler.register(conways2);

const uptown14th = new NYCTrainApplet(canvas, {
  stationId: "A31",
  direction: Direction.NORTH,
});
// scheduler.register(uptown14th);

const downtown14th = new NYCTrainApplet(canvas, {
  stationId: "A31",
  direction: Direction.SOUTH,
});
// scheduler.register(downtown14th);

const conways3 = new ConwaysGameOfLifeApplet(canvas, {
  layers: [
    { cellSize: 4, cellColor: "red" },
    { cellSize: 2, cellColor: "blue" },
  ],
  compositeOperation: "screen",
  frameCount: 50,
});
// scheduler.register(conways3);

// const conways = new ConwaysGameOfLifeApplet(canvas, {
//   layers: [{ cellColor: "#5500aa" }],
//   fadeOut: true,
// });
// // scheduler.register(conways);

// const conways4 = new ConwaysGameOfLifeApplet(canvas, {
//   layers: [
//     { cellSize: 2, cellColor: "pink" },
//     { cellSize: 1, cellColor: "purple" },
//     // { cellSize: 2, cellColor: "blue" },
//   ],
//   compositeOperation: "hard-light",
//   frameCount: 50,
// });
// // scheduler.register(conways4);

// const conways4 = new ConwaysGameOfLifeApplet(canvas, {
//   layers: [
//     { cellSize: 1, cellColor: "rgb(255,0,0)" },
//     { cellSize: 1, cellColor: "rgb(0,255,0)" },
//     { cellSize: 1, cellColor: "rgb(0,0,255)" },
//     // { cellSize: 1, cellColor: "purple" },
//     // { cellSize: 2, cellColor: "blue" },
//   ],
//   compositeOperation: "lighter",
//   frameCount: 50,
// });
// // scheduler.register(conways4);

const spotify = new SpotifyApplet(canvas);
scheduler.register(spotify);

app.get("/render", async (req, res) => {
  const applet = scheduler.getApplet();

  if (req.query.format === "webp") {
    const webp = await applet.encodeAsWebP();
    res.set("Content-Type", "image/webp");
    res.send(webp);
  } else {
    const gif = await applet.encodeAsGif();
    res.set("Content-Type", "image/gif");
    res.send(gif);
  }
});

function generateRandomString(length: number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

type SpotifyToken = {
  accessToken: string;
  refreshToken: string;
  expiration: Date;
};

let localToken: SpotifyToken;
let localState: string;

app.get("/authenticate/spotify", async (_req, res) => {
  const state = generateRandomString(16);
  const scope = ["user-read-currently-playing"].join(" ");

  localState = state;

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_REDIRECT_URI) {
    return res.status(500).send("Environment variables misconfigured.");
  }

  return res.redirect(
    "https://accounts.spotify.com/authorize?" +
      "response_type=code" +
      "&client_id=" +
      encodeURIComponent(process.env.SPOTIFY_CLIENT_ID) +
      "&scope=" +
      encodeURIComponent(scope) +
      "&redirect_uri=" +
      encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI) +
      "&state=" +
      encodeURIComponent(state)
  );
});

app.get("/callback/spotify", async (req, res) => {
  var code = (req.query.code as string) || null;
  var state = (req.query.state as string) || null;

  if (code === null || state === null) {
    return res.status(400).send("Missing code or state");
  }

  if (state !== localState) {
    return res.status(400).send("Invalid state");
  }

  if (
    !process.env.SPOTIFY_REDIRECT_URI ||
    !process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET
  ) {
    return res.status(500).send("Environment variables misconfigured.");
  }

  const tokenBody =
    `code=${encodeURIComponent(code)}` +
    `&redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}` +
    `&grant_type=authorization_code` +
    `&client_id=${process.env.SPOTIFY_CLIENT_ID}` +
    `&client_secret=${process.env.SPOTIFY_CLIENT_SECRET}`;

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    body: tokenBody,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  const json = await tokenRes.json();

  localToken = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiration: new Date(Date.now() + json.expires_in * 1000),
  };

  getSpotifyAccessToken();

  res.json(json);
});

const getSpotifyAccessToken = async () => {
  if (localToken && localToken.expiration > new Date()) {
    return localToken.accessToken;
  }

  await refreshSpotifyToken();
  return localToken;
};

const refreshSpotifyToken = async () => {
  if (!localToken || !localToken.refreshToken) {
    throw new Error("No refresh token available");
  }

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    throw new Error("Environment variables misconfigured.");
  }

  const tokenBody =
    `&grant_type=refresh_token` +
    `&refresh_token=${encodeURIComponent(localToken.refreshToken)}` +
    `&client_id=${process.env.SPOTIFY_CLIENT_ID}` +
    `&client_secret=${process.env.SPOTIFY_CLIENT_SECRET}`;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    body: tokenBody,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  if (!res.ok) {
    return Promise.reject(`Failed to refresh token: ${res.statusText}`);
  }

  const json = await res.json();

  localToken = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiration: new Date(Date.now() + json.expires_in * 1000),
  };
};
