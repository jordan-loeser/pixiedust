import { Applet } from "pixiedust";
import TrainSign from "./widgets/TrainSign";
import { fetchStation } from "./api/fetchTrainTimes";
import { Direction, Station } from "./api/types";

type NYCTrainSignAppletSchema = {
  stationId: Station["id"];
  direction: Direction;
};

class NYCTrainSignApplet extends Applet {
  // Abstract
  public isDone = false;
  public isActive = false;

  // Config Options
  private stationId: Station["id"];
  private direction: Direction;

  // Train data
  private station?: Station;

  // Pixiedust Components
  private sign?: TrainSign;

  constructor(canvas: HTMLCanvasElement, config: NYCTrainSignAppletSchema) {
    super(canvas);
    const { stationId, direction } = config;
    this.stationId = stationId;
    this.direction = direction;
  }

  async setup() {
    try {
      // Fetch train times
      this.station = await fetchStation(this.stationId);
      this.isActive = true;

      const trains =
        this.direction === Direction.NORTH
          ? this.station.northbound
          : this.station.southbound;

      if (trains.length > 0) {
        this.sign = new TrainSign({
          ctx: this.ctx,
          topTrain: trains.shift(),
          bottomTrain: trains.shift(),
        });

        await this.sign.setup();
      }
    } catch (e) {
      console.error("nyctrainsign setup error:", (e as Error).message);
    }
  }

  draw() {
    if (!this.sign) return;

    this.sign.draw();

    this.isDone = this.sign.isDone;
  }
}

export default NYCTrainSignApplet;

export { Direction, Station };
