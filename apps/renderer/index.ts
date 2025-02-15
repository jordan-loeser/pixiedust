import express from "express";
import cors from "cors";
import helmet from "helmet";
import { JSDOM } from "jsdom";
import { Applet, Scheduler } from "pixiedust";

// Import individual applets
import ConwaysGameOfLifeApplet from "@applets/conways-game-of-life";
import DVDLogoApplet from "@applets/dvd-logo";
import NYCTrainApplet, { Direction } from "@applets/nyctrainsign";
import SpotifyApplet from "@applets/spotify";

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
scheduler.register(uptown18th);

const spotify = new SpotifyApplet(canvas, {
  getAccessToken: () => getSpotifyAccessToken(),
});
scheduler.register(spotify);

const downtown18th = new NYCTrainApplet(canvas, {
  stationId: "131",
  direction: Direction.SOUTH,
});
scheduler.register(downtown18th);

scheduler.register(spotify);

const conways2 = new ConwaysGameOfLifeApplet(canvas, {
  layers: [{ cellColor: "orange" }, { cellColor: "blue" }],
  compositeOperation: "screen",
  fadeOut: true,
});
scheduler.register(conways2);

scheduler.register(spotify);

const uptown14th = new NYCTrainApplet(canvas, {
  stationId: "A31",
  direction: Direction.NORTH,
});
scheduler.register(uptown14th);

scheduler.register(spotify);

const downtown14th = new NYCTrainApplet(canvas, {
  stationId: "A31",
  direction: Direction.SOUTH,
});
scheduler.register(downtown14th);

scheduler.register(spotify);

const dvdLogo = new DVDLogoApplet(canvas);
scheduler.register(dvdLogo);

enum Format {
  GIF = "gif",
  WebP = "webp",
}

const encode = async (applet: Applet, format: Format) => {
  if (format === Format.WebP) {
    return await applet.encodeAsWebP();
  }
  return await applet.encodeAsGif();
};

app.get("/render", async (req, res) => {
  const format = req.query.format as Format;
  let applet = scheduler.getApplet();
  let buffer = await encode(applet, format);

  while (buffer === null) {
    console.log(`${applet.id} returned null buffer, trying next applet...`);
    applet = scheduler.getApplet();
    buffer = await encode(applet, format);
  }

  res.set("Content-Type", format === Format.WebP ? "image/webp" : "image/gif");
  res.send(buffer);
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

// TODO: move to Redis
let localToken: SpotifyToken | null = null;
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

  res.json(json);
});

const getSpotifyAccessToken = async (): Promise<string> => {
  if (localToken !== null && localToken.expiration > new Date()) {
    return localToken.accessToken;
  }

  const newToken = await refreshSpotifyToken();

  return newToken.accessToken;
};

const refreshSpotifyToken = async (): Promise<SpotifyToken> => {
  if (localToken === null) {
    throw new Error("Local token is empty");
  }

  if (!localToken.refreshToken) {
    throw new Error("Refresh token is empty");
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

  const newToken = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || localToken.refreshToken,
    expiration: new Date(Date.now() + json.expires_in * 1000),
  } as SpotifyToken;

  localToken = newToken;

  return newToken;
};
