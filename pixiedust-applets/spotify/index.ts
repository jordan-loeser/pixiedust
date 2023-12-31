import { Image } from "canvas";
import { Applet, Font, TextMarquee } from "pixiedust";

// Configuration Defaults
const DEFAULT_DURATION_S = 10;

// Styling
const PADDING = 1;

// Test Data
const ALBUM_COVER_IMAGE_URL =
  "https://i.scdn.co/image/ab67616d0000485101855acd3dd4019f7e367df8";
const SONG_NAME = "A Song Name";

type SpotifyAppletSchema = {
  duration?: number; // seconds
};

class SpotifyApplet extends Applet {
  private frame: number = 0;
  protected setupHasBeenCalled = false;

  // Config Options
  private duration: number;

  // Components
  private albumCover: Image;
  private songName?: TextMarquee;

  constructor(canvas: HTMLCanvasElement, config: SpotifyAppletSchema = {}) {
    super(canvas);
    this.duration = config.duration ?? DEFAULT_DURATION_S;
    this.albumCover = new Image();
  }

  async setup(): Promise<void> {
    this.songName = new TextMarquee(SONG_NAME, this.ctx, {
      font: Font.ARRIVAL_TIME,
      x: this.canvas.height,
      y: PADDING,
      width: this.canvas.width - this.canvas.height,
      pixelColors: {
        "0": null, // background
        "1": "#bfff50", // foreground
        "2": "null", // glow
      },
    });
    await this.songName.setup();

    // Load album cover image
    this.albumCover.src = ALBUM_COVER_IMAGE_URL;
    return new Promise((resolve) => {
      this.albumCover.onload = () => {
        this.setupHasBeenCalled = true;
        resolve();
      };
    });
  }

  draw() {
    if (!this.setupHasBeenCalled)
      throw new Error("Must call .setup() before drawing.");

    this.ctx.drawImage(
      this.albumCover as any,
      PADDING,
      PADDING,
      this.canvas.height - 2 * PADDING,
      this.canvas.height - 2 * PADDING
    );

    this.songName?.scrollAndDraw(this.songName.isDone ? 0 : 1); // this.marquee.isDone || this.frame <= 20 ? 0 : 1);

    // Stop animation after duration
    this.frame += 1;
    this.isDone = this.frame / this.frameRate > this.duration;
  }
}

export default SpotifyApplet;
