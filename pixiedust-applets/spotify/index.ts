import { Image } from "canvas";
import { Applet } from "pixiedust";

const PADDING = 1;
const ALBUM_COVER_IMAGE_URL =
  "https://i.scdn.co/image/ab67616d0000485101855acd3dd4019f7e367df8";

type SpotifyAppletSchema = {};

class SpotifyApplet extends Applet {
  protected setupHasBeenCalled = false;

  // Config Options

  // Components
  private albumCover: Image;

  constructor(canvas: HTMLCanvasElement, config: SpotifyAppletSchema = {}) {
    super(canvas);
    this.albumCover = new Image();
  }

  async setup(): Promise<void> {
    this.albumCover.src = ALBUM_COVER_IMAGE_URL;

    return new Promise((resolve) => {
      this.albumCover.onload = () => {
        console.log("!!! PROmiSE");
        this.setupHasBeenCalled = true;
        resolve();
      };
    });
  }

  draw() {
    if (!this.setupHasBeenCalled)
      throw new Error("Must call .setup() before drawing.");

    console.log(this.albumCover);

    this.ctx.drawImage(
      this.albumCover as any,
      PADDING,
      PADDING,
      this.canvas.height - 2 * PADDING,
      this.canvas.height - 2 * PADDING
    );

    this.isDone = true;
  }
}

export default SpotifyApplet;
