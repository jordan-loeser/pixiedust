import express from "express";
import cors from "cors";
import helmet from "helmet";
import { JSDOM } from "jsdom";
import NYCTrainApplet from "./pixiedust-applets/nyctrainsign";
import { Direction } from "./pixiedust-applets/nyctrainsign/api/types";
import { Scheduler } from "./pixiedust/Scheduler";

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

const scheduler = new Scheduler();

// const uptown23rd = new NYCTrainApplet(canvas, {
//   stationId: "D18",
//   direction: Direction.NORTH,
// });
// scheduler.register(uptown23rd);

// const downtown23rd = new NYCTrainApplet(canvas, {
//   stationId: "D18",
//   direction: Direction.SOUTH,
// });
// scheduler.register(downtown23rd);

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
