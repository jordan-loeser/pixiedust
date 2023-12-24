import { Widget, WidgetOptions } from "pixiedust";
import { Train } from "../api/types";
import TrainSignRow from "./TrainSignRow";

export type TrainSignRowModel = {
  ctx: CanvasRenderingContext2D;
  topTrain?: Train;
  bottomTrain?: Train;
} & WidgetOptions;

class TrainSign extends Widget {
  private topTrain?: Train;
  private bottomTrain?: Train;
  private setupHasBeenCalled = false;
  private _isDone: boolean = false;

  // Components
  private topRow?: TrainSignRow;
  private bottomRow?: TrainSignRow;

  constructor(model: TrainSignRowModel) {
    if (process.env.NODE_ENV == "development")
      console.debug(
        "Building TrainSign...",
        JSON.stringify(
          { top: model.topTrain, bottom: model.bottomTrain },
          null,
          "\t"
        )
      );

    super(model.ctx, model);
    this.topTrain = model.topTrain;
    this.bottomTrain = model.bottomTrain;
  }

  async setup() {
    if (this.topTrain) {
      this.topRow = new TrainSignRow(this.ctx, {
        ...this.topTrain,
        y: 1,
      });
      await this.topRow.setup();
    }

    if (this.bottomTrain) {
      this.bottomRow = new TrainSignRow(this.ctx, {
        ...this.bottomTrain,
        y: 17,
      });
      await this.bottomRow.setup();
    }

    // Mark setup as complete
    this.setupHasBeenCalled = true;
  }

  draw() {
    if (!this.setupHasBeenCalled)
      throw new Error("Must call .setup() before drawing.");

    // Save the context
    this.ctx.save();

    // Clear the previous frame
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Draw the rows
    this.topRow?.draw();
    this.bottomRow?.draw();

    // Restore the context
    this.ctx.restore();

    // Mark the app as done when the topMarquee is done
    const rowIsDone = (row?: TrainSignRow) => row === undefined || row.isDone;
    this._isDone = rowIsDone(this.topRow) && rowIsDone(this.bottomRow);
  }

  get isDone() {
    return this._isDone;
  }
}

export default TrainSign;
