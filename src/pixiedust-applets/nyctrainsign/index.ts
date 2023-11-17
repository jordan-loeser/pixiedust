import { Applet } from "../../pixiedust";
import TrainSign from "./widgets/TrainSign";
import { fetchStation } from "./api/fetchTrainTimes";
import { Station } from "./api/types";

type NYCTrainAppletSchema = {
  stationId: Station["id"];
  showNorthbound?: boolean;
  showSouthbound?: boolean;
};

class NYCTrainApplet extends Applet {
  private frame: number = 0;
  protected setupHasBeenCalled = false;

  // Config Options
  private stationId: Station["id"];
  private showNorthbound: boolean;
  private showSouthbound: boolean;

  // Train data
  private station?: Station;

  // Components
  private northboundSign?: TrainSign;
  private southboundSign?: TrainSign;

  constructor(canvas: HTMLCanvasElement, config: NYCTrainAppletSchema) {
    super(canvas);
    const { stationId, showNorthbound, showSouthbound } = config;
    this.stationId = stationId;
    this.showNorthbound = showNorthbound ?? true;
    this.showSouthbound = showSouthbound ?? true;
  }

  async setup() {
    // Fetch train times
    this.station = await fetchStation(this.stationId);

    if ((this.showNorthbound ?? true) && this.station.northbound.length > 0) {
      this.northboundSign = new TrainSign({
        ctx: this.ctx,
        topTrain: this.station.northbound.shift(),
        bottomTrain: this.station.northbound.shift(),
      });
      await this.northboundSign.setup();
    }

    if ((this.showSouthbound ?? true) && this.station.southbound.length > 0) {
      this.southboundSign = new TrainSign({
        ctx: this.ctx,
        topTrain: this.station.southbound.shift(),
        bottomTrain: this.station.southbound.shift(),
      });
      await this.southboundSign.setup();
    }

    this.setupHasBeenCalled = true;
  }

  // TODO: if total number of frames > 1 minute then print warning
  draw() {
    if (!this.setupHasBeenCalled)
      throw new Error("Must call .setup() before drawing.");

    if (
      this.showNorthbound &&
      this.northboundSign &&
      !this.northboundSign.isDone
    ) {
      this.northboundSign.draw();
      return;
    }

    if (
      this.showSouthbound &&
      this.southboundSign &&
      !this.southboundSign.isDone
    ) {
      this.southboundSign.draw();
      return;
    }

    const signIsDone = (wasVisible: boolean, sign?: TrainSign) =>
      !wasVisible || !sign || sign.isDone;
    this.isDone =
      signIsDone(this.showNorthbound, this.northboundSign) &&
      signIsDone(this.showSouthbound, this.southboundSign);
  }
}

export default NYCTrainApplet;
