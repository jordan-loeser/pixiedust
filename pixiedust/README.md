# Pixiedust Library ✨🧚‍♀️

This is where the magic happens.

## Applet Class

The `Applet` class serves as an abstract foundation for creating animated applets on an HTML canvas. It enforces the implementation of `setup()` and `draw()` methods in derived classes for initializing the applet and drawing each frame, respectively. The class offers functions to play the applet natively on canvas or encode it as an animated GIF or WebP image.

The constructor initializes the canvas and frame rate, providing a flexible framework for developers to adapt to multiple screen sizes.

Example usage:

```ts
import { Applet } from "pixiedust";

type CountingAppletConfig = {
  frameRate?: number;
  max: number;
};

class CountingApplet extends Applet {
  private max: number;
  private current: number = 0;

  constructor(canvas: HTMLCanvasElement, config: CountingAppletConfig) {
    // Initialize any priate variables, optionally passed through a config
    super(canvas, config.frameRate);
    this.max = config.max;
  }

  async setup() {
    // Any async setup required, such as pulling data or resetting private variables
    this.current = 0;
  }

  draw() {
    // Whatever you need to do draw on the HTML canvas!
    someFunctionToDrawTheCurrentValue(this.current);
    this.current += 1;
  }
}

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const myApplet = new CountingApplet(canvas, { max: 7 });
myApplet.play(); // Play the animated applet
```
