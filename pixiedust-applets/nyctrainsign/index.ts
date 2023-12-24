import { Applet } from "pixiedust";
import TrainSign from "./widgets/TrainSign";
import { fetchStation } from "./api/fetchTrainTimes";
import { Direction, Station } from "./api/types";

type NYCTrainAppletSchema = {
  stationId: Station["id"];
  direction: Direction;
};

class NYCTrainApplet extends Applet {
  private frame: number = 0;
  protected setupHasBeenCalled = false;

  // Config Options
  private stationId: Station["id"];
  private direction: Direction;

  // Train data
  private station?: Station;

  // Components
  private sign?: TrainSign;

  constructor(canvas: HTMLCanvasElement, config: NYCTrainAppletSchema) {
    super(canvas);
    const { stationId, direction } = config;
    this.stationId = stationId;
    this.direction = direction;
  }

  async setup() {
    // Fetch train times
    this.station = await fetchStation(this.stationId);

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

    this.setupHasBeenCalled = true;
  }

  // TODO: if total number of frames > 1 minute then print warning
  draw() {
    if (!this.setupHasBeenCalled)
      throw new Error("Must call .setup() before drawing.");

    if (!this.sign) return;

    this.sign.draw();

    this.isDone = this.sign.isDone;
  }
}

export default NYCTrainApplet;

export { Direction, Station };
