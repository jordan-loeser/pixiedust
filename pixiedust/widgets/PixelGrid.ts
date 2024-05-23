import { Widget } from "../classes";

/**
 * Represents the color (as a valid canvas fillStyle) of each pixel at position [x][y].
 */
type Grid = CanvasFillStrokeStyles["fillStyle"][][];

export class PixelGrid extends Widget {
  protected grid: Grid;

  constructor(grid: Grid, ctx: CanvasRenderingContext2D) {
    super(ctx);
    this.grid = grid;
  }

  draw() {
    this.grid.forEach((row, x) => {
      row.forEach((pixelColor, y) => {
        this.ctx.save();

        this.ctx.fillStyle = pixelColor;
        this.ctx.fillRect(x, y, 1, 1);
        this.ctx.restore();
      });
    });
  }
}
