import { Applet } from "pixiedust";

const DEFAULT_CELL_SIZE = 1;
const DEFAULT_FRAME_RATE = 10;
const DEFAULT_FRAME_COUNT = 70;
const DEFAULT_COLOR = "orange";

type ConwaysGameOfLifeAppletSchema = {
  cellSize?: number;
  frameRate?: number;
  frameCount?: number;
  color?: string;
};

class ConwaysGameOfLifeApplet extends Applet {
  private frame: number = 0;
  protected setupHasBeenCalled = false;

  // Config Options
  private cellSize: number;
  private frameCount: number;
  private color: string;

  // For Calculations
  private grid: number[][] = [];
  private numRows: number;
  private numCols: number;

  constructor(
    canvas: HTMLCanvasElement,
    config: ConwaysGameOfLifeAppletSchema = {}
  ) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.cellSize = config.cellSize ?? DEFAULT_CELL_SIZE;
    this.frameCount = config.frameCount ?? DEFAULT_FRAME_COUNT;
    this.color = config.color ?? DEFAULT_COLOR;
    this.numRows = canvas.height / this.cellSize;
    this.numCols = canvas.width / this.cellSize;
  }

  async setup() {
    this.frame = 0;
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        if (this.grid[i][j] === 1) {
          this.ctx.fillStyle = this.color;
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

    // Stop animation after a certain number of frames
    this.frame += 1;
    this.isDone = this.frame >= this.frameCount;
  }
}

export default ConwaysGameOfLifeApplet;
