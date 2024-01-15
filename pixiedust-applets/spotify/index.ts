import { Image } from "canvas";
import { Applet, Font, TextMarquee } from "pixiedust";

// Configuration Defaults
const HOLD_DURATION_S = 2;
const DEFAULT_DURATION_S = 10;

// Styling
const PADDING = 2;

// Test Data // TODO: pull during setup
const ALBUM_COVER_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/en/2/25/Evanescence_-_Fallen.png";
const SONG_NAME = "Bring Me to Life";
const ARTIST_NAME = "Evanescence";
const PERCENT_PLAYED = 0.5;

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

  constructor(canvas: HTMLCanvasElement, config: SpotifyAppletSchema = {}) {
    super(canvas);
    this.duration = config.duration ?? DEFAULT_DURATION_S;
    this.albumCover = new Image();
    this.ctx.imageSmoothingEnabled = false;
  }

  async setup(): Promise<void> {
    this.frame = 0;

    // Initialize marquees
    this.songName = new TextMarquee(SONG_NAME, this.ctx, {
      font: Font.ARRIVAL_TIME,
      x: this.canvas.height + 1,
      y: PADDING + 2,
      width: this.canvas.width - this.canvas.height - PADDING - 1,
      pixelColors: {
        "0": null, // background
        "1": "#bfff50", // foreground
        "2": "null", // glow
      },
    });
    await this.songName.setup();

    this.artistName = new TextMarquee(ARTIST_NAME, this.ctx, {
      font: Font.DINA,
      x: this.canvas.height + 1,
      y: PADDING + this.songName.height! + 2,
      width: this.canvas.width - this.canvas.height - PADDING - 1,
      pixelColors: {
        "0": null, // background
        "1": "#FFF", // foreground
        "2": "null", // glow
      },
    });
    await this.artistName.setup();

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

    if (this.frame === 0) {
      // Draw the image on the first frame
      this.ctx.drawImage(
        this.albumCover as any,
        PADDING,
        PADDING,
        this.canvas.height - 2 * PADDING,
        this.canvas.height - 2 * PADDING
      );
    }

    // Clear the text on the previous frame, leave the image to prevent flickering
    this.ctx.clearRect(
      this.canvas.height,
      0,
      this.canvas.width - this.canvas.height,
      this.canvas.height
    );

    // Hold the text for 20 frames then scroll
    const isHolding = this.frame <= this.durationToFrames(HOLD_DURATION_S);
    this.songName?.scrollAndDraw(isHolding || this.songName.isDone ? 0 : 1);
    this.artistName?.scrollAndDraw(isHolding || this.artistName.isDone ? 0 : 1);

    // Draw the progress indicator
    this.ctx.save();
    const progressBarWidth = this.canvas.width - this.canvas.height - PADDING; // full width minus padding and image
    // Background bar
    this.ctx.fillStyle = "#aaaaaa";
    this.ctx.fillRect(
      this.canvas.height,
      this.canvas.height - PADDING - 1,
      progressBarWidth,
      1
    );
    // Foreground bar
    this.ctx.fillStyle = "#bfff50";
    this.ctx.fillRect(
      this.canvas.height,
      this.canvas.height - PADDING - 1,
      progressBarWidth * PERCENT_PLAYED,
      1
    );

    this.ctx.restore();

    // Stop animation after duration
    this.frame += 1;
    this.isDone = this.frame / this.frameRate > this.duration;
  }

  durationToFrames(duration: number): number {
    return duration * this.frameRate;
  }
}

export default SpotifyApplet;
