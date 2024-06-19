import express from "express";
import cors from "cors";
import helmet from "helmet";
import { JSDOM } from "jsdom";
import { Scheduler } from "pixiedust";
import NYCTrainApplet, { Direction } from "@applets/nyctrainsign";
import ConwaysGameOfLifeApplet from "@applets/conways-game-of-life";
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

const downtown18th = new NYCTrainApplet(canvas, {
  stationId: "131",
  direction: Direction.SOUTH,
});
scheduler.register(downtown18th);

const conways2 = new ConwaysGameOfLifeApplet(canvas, {
  layers: [{ cellColor: "orange" }, { cellColor: "blue" }],
  compositeOperation: "screen",
  fadeOut: true,
});
scheduler.register(conways2);

const uptown14th = new NYCTrainApplet(canvas, {
  stationId: "A31",
  direction: Direction.NORTH,
});
scheduler.register(uptown14th);

const downtown14th = new NYCTrainApplet(canvas, {
  stationId: "A31",
  direction: Direction.SOUTH,
});
scheduler.register(downtown14th);

const conways3 = new ConwaysGameOfLifeApplet(canvas, {
  layers: [
    { cellSize: 4, cellColor: "red" },
    { cellSize: 2, cellColor: "blue" },
  ],
  compositeOperation: "screen",
  frameCount: 50,
});
scheduler.register(conways3);

// const conways = new ConwaysGameOfLifeApplet(canvas, {
//   layers: [{ cellColor: "#5500aa" }],
//   fadeOut: true,
// });
// scheduler.register(conways);

// const conways4 = new ConwaysGameOfLifeApplet(canvas, {
//   layers: [
//     { cellSize: 2, cellColor: "pink" },
//     { cellSize: 1, cellColor: "purple" },
//     // { cellSize: 2, cellColor: "blue" },
//   ],
//   compositeOperation: "hard-light",
//   frameCount: 50,
// });
// scheduler.register(conways4);

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
// scheduler.register(conways4);

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
