import express from "express";
import cors from "cors";
import helmet from "helmet";
import { JSDOM } from "jsdom";
import NYCTrainApplet from "./pixiedust-applets/nyctrainsign";
import { Direction } from "./pixiedust-applets/nyctrainsign/api/types";

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

app.get("/render", async (_req, res) => {
  const dom = new JSDOM();
  const canvas = dom.window.document.createElement("canvas");

  canvas.width = 128;
  canvas.height = 32;

  const testApp = new NYCTrainApplet(canvas, {
    stationId: "D18",
    direction: Direction.SOUTH,
  });

  const gif = await testApp.encodeAsGif();

  res.set("Content-Type", "image/gif");
  res.send(gif);
});
