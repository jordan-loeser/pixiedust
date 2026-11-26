import { Applet } from "pixiedust";
import { SeasonalConfig, isSeasonActive } from "../lib/schedule";

export type HolidayRotationSchema = SeasonalConfig & {
  /** Applets to cycle through, one per turn. */
  applets: Applet[];
};

/**
 * One scheduler slot that plays a different holiday applet each time its turn
 * comes up. Register the same instance in several places in the schedule to
 * interleave holiday applets with the regular rotation; outside its window it
 * returns null and the renderer moves on to the next slot.
 */
export class HolidayRotationApplet extends Applet {
  public id = "thanksgiving-rotation";
  public isDone = true;
  public isActive = false;

  private config: HolidayRotationSchema;
  private cursor = -1;

  constructor(canvas: HTMLCanvasElement, config: HolidayRotationSchema) {
    super(canvas);
    if (config.applets.length === 0)
      throw new Error("HolidayRotationApplet needs at least one applet.");
    this.config = config;
  }

  async setup() {
    this.isActive = isSeasonActive(this.config);
  }

  draw() {
    this.isDone = true;
  }

  private next(): Applet {
    this.cursor = (this.cursor + 1) % this.config.applets.length;
    const applet = this.config.applets[this.cursor];
    this.id = `thanksgiving-rotation:${applet.id}`;
    return applet;
  }

  async encodeAsGif(): Promise<Buffer | null> {
    await this.setup();
    if (!this.isActive) return null;
    // Skip children that opt out (e.g. week-only applets outside their window)
    for (let i = 0; i < this.config.applets.length; i++) {
      const buf = await this.next().encodeAsGif();
      if (buf) return buf;
    }
    return null;
  }

  async encodeAsWebP(): Promise<Buffer | null> {
    await this.setup();
    if (!this.isActive) return null;
    for (let i = 0; i < this.config.applets.length; i++) {
      const buf = await this.next().encodeAsWebP();
      if (buf) return buf;
    }
    return null;
  }
}

export default HolidayRotationApplet;
