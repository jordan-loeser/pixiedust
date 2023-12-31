import { Image } from "canvas";
import { Applet, Font, TextMarquee } from "pixiedust";

const HOLD_DURATION_S = 2;

// Configuration Defaults
const DEFAULT_DURATION_S = 10;

// Styling
const PADDING = 1;

// Test Data
const ALBUM_COVER_IMAGE_URL =
  "https://i.scdn.co/image/ab67616d0000485101855acd3dd4019f7e367df8";
const SONG_NAME = "A Song Name that is really really long";
const ARTIST_NAME = "iyEvanescence";
const ALBUM_NAME = "iySome album name that is really really long";

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
  private artistName?: TextMarquee;
  private albumName?: TextMarquee;

  constructor(canvas: HTMLCanvasElement, config: SpotifyAppletSchema = {}) {
    super(canvas);
    this.duration = config.duration ?? DEFAULT_DURATION_S;
    this.albumCover = new Image();
    this.ctx.imageSmoothingEnabled = false;
  }

  async setup(): Promise<void> {
    // Initialize marquees
    this.songName = new TextMarquee(SONG_NAME, this.ctx, {
      font: Font.CHERRY,
      x: this.canvas.height,
      y: PADDING,
      width: this.canvas.width - this.canvas.height - PADDING,
      pixelColors: {
        "0": null, // background
        "1": "#bfff50", // foreground
        "2": "null", // glow
      },
    });
    await this.songName.setup();

    this.artistName = new TextMarquee(ARTIST_NAME, this.ctx, {
      font: Font.CHERRY,
      x: this.canvas.height,
      y: PADDING + this.songName.height!,
      width: this.canvas.width - this.canvas.height - PADDING,
      pixelColors: {
        "0": null, // background
        "1": "#FFF", // foreground
        "2": "null", // glow
      },
    });
    await this.artistName.setup();

    this.albumName = new TextMarquee(ALBUM_NAME, this.ctx, {
      font: Font.CHERRY,
      x: this.canvas.height,
      y: PADDING + this.songName.height! + this.artistName.height!,
      width: this.canvas.width - this.canvas.height - PADDING,
      pixelColors: {
        "0": null, // background
        "1": "#fff", // foreground
        "2": "null", // glow
      },
    });
    await this.albumName.setup();

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

    // Clear the text on the previous frame
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // // Draw the image on the first frame
    // this.ctx.drawImage(
    //   this.albumCover as any,
    //   PADDING,
    //   PADDING,
    //   this.canvas.height - 2 * PADDING,
    //   this.canvas.height - 2 * PADDING
    // );

    const isHolding = this.frame <= this.durationToFrames(HOLD_DURATION_S);

    // Hold the text for 20 frames then scroll
    this.songName?.scrollAndDraw(isHolding || this.songName.isDone ? 0 : 1);
    this.artistName?.scrollAndDraw(isHolding || this.artistName.isDone ? 0 : 1);
    this.albumName?.scrollAndDraw(isHolding || this.albumName.isDone ? 0 : 1);

    // Stop animation after duration
    this.frame += 1;
    this.isDone = this.frame / this.frameRate > this.duration;

    console.log(">>DRAW FRAMEs", this.isDone);
  }

  durationToFrames(duration: number): number {
    return duration * this.frameRate;
  }
}

export default SpotifyApplet;
