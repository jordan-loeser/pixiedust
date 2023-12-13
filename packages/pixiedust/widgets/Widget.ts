export interface WidgetOptions {
  x?: number;
  y?: number;
}

export class Widget {
  protected ctx: CanvasRenderingContext2D;

  public x: number;
  public y: number;

  constructor(ctx: CanvasRenderingContext2D, options: WidgetOptions = {}) {
    this.ctx = ctx;
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
  }
}

export default Widget;
