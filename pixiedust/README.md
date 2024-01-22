# Pixiedust Library ✨🧚‍♀️

This is where the magic happens.

## Applet Class

The `Applet` class serves as an abstract foundation for creating animated applets on an HTML canvas. It enforces the implementation of `setup()` and `draw()` methods in derived classes for initializing the applet and drawing each frame, respectively. The class offers functions to play the applet natively on canvas or encode it as an animated GIF or WebP image.

The constructor initializes the canvas and frame rate, providing a flexible framework for developers to adapt to multiple screen sizes.

Example usage:

```ts
import { Applet } from "pixiedust";

class CountingApplet extends Applet {
  private: max;

  constructor(canvas: HTMLCanvasElement, config: MyCustomAppletSchema = {}) {
    // Initialize any priate variables, optionally passed through a config
    super(canvas, config.frameRate);
  }

  async setup() {
    // Custom initialization logic
  }

  draw() {
    // Custom drawing logic for each frame
  }
}

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const myApplet = new MyCustomApplet(canvas);
myApplet.play(); // Play the animated applet
```
