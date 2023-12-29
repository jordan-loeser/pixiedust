import { Widget, WidgetOptions } from "pixiedust";

const DEFAULT_CELL_SIZE = 1;
const DEFAULT_CELL_COLOR = "orange";

export type ConwaysGameOfLifeOptions = {
  cellSize?: number;
  cellColor?: string;
} & WidgetOptions;

export class ConwaysGameOfLife extends Widget {
  private setupHasBeenCalled = false;
  private canvas: HTMLCanvasElement;

  // Config Options
  private cellSize: number;
  private cellColor: string;

  // For Calculations
  private grid: number[][] = [];
  private numRows: number;
  private numCols: number;

  constructor(
    ctx: CanvasRenderingContext2D,
    options: ConwaysGameOfLifeOptions
  ) {
    super(ctx, options);
    this.cellSize = options.cellSize ?? DEFAULT_CELL_SIZE;
    this.cellColor = options.cellColor ?? DEFAULT_CELL_COLOR;
    this.canvas = this.ctx.canvas;
    this.numRows = this.canvas.height / this.cellSize;
    this.numCols = this.canvas.width / this.cellSize;
  }

  async setup() {
    this.initializeGrid();
    this.setupHasBeenCalled = true;
  }

  initializeGrid() {
    this.grid = [];
    for (let i = 0; i < this.numRows; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.numCols; j++) {
        this.grid[i][j] = Math.random() > 0.5 ? 1 : 0;
      }
    }
  }

  // TODO: make this a pixiedust helper
  drawGrid() {
    this.ctx.save();
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        if (this.grid[i][j] === 1) {
          this.ctx.fillStyle = this.cellColor;
          this.ctx.fillRect(
            j * this.cellSize,
            i * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }
    this.ctx.restore();
  }

  updateGrid() {
    const newGrid: typeof this.grid = [];
    for (let i = 0; i < this.numRows; i++) {
      newGrid[i] = [];
      for (let j = 0; j < this.numCols; j++) {
        const neighbors = this.countNeighbors(i, j);
        if (this.grid[i][j] === 1) {
          newGrid[i][j] = neighbors === 2 || neighbors === 3 ? 1 : 0;
        } else {
          newGrid[i][j] = neighbors === 3 ? 1 : 0;
        }
      }
    }
    this.grid = newGrid;
  }

  countNeighbors(row: number, col: number) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (
          newRow >= 0 &&
          newRow < this.numRows &&
          newCol >= 0 &&
          newCol < this.numCols
        ) {
          count += this.grid[newRow][newCol];
        }
      }
    }
    count -= this.grid[row][col]; // Exclude the center cell itself
    return count;
  }

  draw() {
    if (!this.setupHasBeenCalled)
      throw new Error("Must call .setup() before drawing.");

    this.drawGrid();
    this.updateGrid();
  }
}
