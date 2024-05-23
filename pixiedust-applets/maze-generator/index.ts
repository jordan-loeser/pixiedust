import { Applet } from "pixiedust";

// Types
enum MazeGeneratorAlgorithm {
  RANDOM_TRAVERSAL,
}

type MazeGeneratorAppletSchema = {
  frameRate?: number;
  algorithm?: MazeGeneratorAlgorithm;
  cellSpacing?: number;
  cellWidth?: number;
  cellSize?: number;
};

type Cell = { index: number; direction: number };

// Default configs
const DEFAULT_FRAME_RATE = 60;
const DEFAULT_ALGORITHM = MazeGeneratorAlgorithm.RANDOM_TRAVERSAL;
const DEFAULT_CELL_SIZE = 1;
const DEFAULT_CELL_SPACING = 1;

var N = 1 << 0,
  S = 1 << 1,
  W = 1 << 2,
  E = 1 << 3;

class MazeGeneratorApplet extends Applet {
  // Abstract
  public isDone = false;

  // Config Options
  private algorithm: MazeGeneratorAlgorithm;
  private cellSize: number;
  private cellSpacing: number;
  private cellWidth: number;
  private cellHeight: number;

  // Helpers
  private cells: number[];
  private frontier: Cell[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    config: MazeGeneratorAppletSchema = {}
  ) {
    super(canvas, config.frameRate ?? DEFAULT_FRAME_RATE);
    this.algorithm = config.algorithm ?? DEFAULT_ALGORITHM;
    this.cellSize = config.cellSize ?? DEFAULT_CELL_SIZE; // Size of each cell in the maze // TODO: set default
    this.cellSpacing = config.cellSpacing ?? DEFAULT_CELL_SPACING;
    this.cellWidth = Math.floor(
      (this.canvas.width - this.cellSpacing) /
        (this.cellSize + this.cellSpacing)
    );
    this.cellHeight = Math.floor(
      (this.canvas.height - this.cellSpacing) /
        (this.cellSize + this.cellSpacing)
    );
    this.cells = new Array(this.cellWidth * this.cellHeight); // each cell’s edge bits

    console.log("this.celWidth", this.cellWidth);
    console.log("this.cellHeight", this.cellHeight);
  }

  async setup() {
    this.cells = new Array(this.cellWidth * this.cellHeight); // each cell’s edge bits
    this.frontier = [];
    var start = (this.cellHeight - 1) * this.cellWidth;
    this.cells[start] = 0;
    this.fillCell(start);
    this.frontier.push({ index: start, direction: N });
    this.frontier.push({ index: start, direction: E });
  }

  fillCell(index: number) {
    const i = index % this.cellWidth;
    const j = (index / this.cellWidth) | 0;
    this.ctx.fillRect(
      i * this.cellSize + (i + 1) * this.cellSpacing,
      j * this.cellSize + (j + 1) * this.cellSpacing,
      this.cellSize,
      this.cellSize
    );
  }

  exploreFrontier(): boolean {
    if ((edge = this.popRandom(this.frontier)) == null) return true;

    var edge,
      i0 = edge.index,
      d0 = edge.direction,
      i1 =
        i0 +
        (d0 === N
          ? -this.cellWidth
          : d0 === S
          ? this.cellWidth
          : d0 === W
          ? -1
          : +1),
      x0 = i0 % this.cellWidth,
      y0 = (i0 / this.cellWidth) | 0,
      x1,
      y1,
      d1,
      open = this.cells[i1] == null; // opposite not yet part of the maze

    this.ctx.fillStyle = open ? "white" : "black";
    if (d0 === N) this.fillSouth(i1), (x1 = x0), (y1 = y0 - 1), (d1 = S);
    else if (d0 === S) this.fillSouth(i0), (x1 = x0), (y1 = y0 + 1), (d1 = N);
    else if (d0 === W) this.fillEast(i1), (x1 = x0 - 1), (y1 = y0), (d1 = E);
    else this.fillEast(i0), (x1 = x0 + 1), (y1 = y0), (d1 = W);

    if (open) {
      this.fillCell(i1);
      (this.cells[i0] |= d0), (this.cells[i1] |= d1);
      this.ctx.fillStyle = "magenta";
      if (y1 > 0 && this.cells[i1 - this.cellWidth] == null)
        this.fillSouth(i1 - this.cellWidth),
          this.frontier.push({ index: i1, direction: N });
      if (y1 < this.cellHeight - 1 && this.cells[i1 + this.cellWidth] == null)
        this.fillSouth(i1), this.frontier.push({ index: i1, direction: S });
      if (x1 > 0 && this.cells[i1 - 1] == null)
        this.fillEast(i1 - 1), this.frontier.push({ index: i1, direction: W });
      if (x1 < this.cellWidth - 1 && this.cells[i1 + 1] == null)
        this.fillEast(i1), this.frontier.push({ index: i1, direction: E });
    }
    return false;
  }

  fillEast(index: number) {
    var i = index % this.cellWidth,
      j = (index / this.cellWidth) | 0;
    this.ctx.fillRect(
      (i + 1) * (this.cellSize + this.cellSpacing),
      j * this.cellSize + (j + 1) * this.cellSpacing,
      this.cellSpacing,
      this.cellSize
    );
  }

  fillSouth(index: number) {
    var i = index % this.cellWidth,
      j = (index / this.cellWidth) | 0;
    this.ctx.fillRect(
      i * this.cellSize + (i + 1) * this.cellSpacing,
      (j + 1) * (this.cellSize + this.cellSpacing),
      this.cellSize,
      this.cellSpacing
    );
  }

  popRandom(array: any[]) {
    if (!array.length) return;
    var n = array.length,
      i = (Math.random() * n) | 0,
      t;
    (t = array[i]), (array[i] = array[n - 1]), (array[n - 1] = t);
    return array.pop();
  }

  draw() {
    this.isDone = this.exploreFrontier();
  }
}

export default MazeGeneratorApplet;
