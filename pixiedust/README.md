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
  public isDone: number = false;

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

    // Indicate that the applet is done rendering
    if (this.current > this.max) {
      this.isDone = true;
    }
  }
}

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const myApplet = new CountingApplet(canvas, { max: 7 });
myApplet.play(); // Play the animated applet
```

## Scheduler

The `Scheduler` class facilitates the scheduling of multiple instances of the `Applet` class, allowing for organized and sequential execution of applets. Applets are registered using the `register` method, which adds them to the internal array. The `getApplet` method retrieves the next applet in a round-robin fashion, continuously cycling through registered applets. This can be useful in implementing a rendering server.

Example usage:

```ts
import { Scheduler } from "pixiedust";
import { CountingApplet } fom "@pixiedust-applets/counting-applet";

// Create a Scheduler instance
const scheduler = new Scheduler();

// Register the applets with the scheduler
scheduler.register(new CountingApplet(canvas, { max: 7 }));
scheduler.register(new CountingApplet(canvas, { max: 2 }));

// Use the scheduler to retrieve and play applets in a sequence
const numberOfAppletsToPlay = 5;
for (let i = 0; i < numberOfAppletsToPlay; i++) {
  const currentApplet = scheduler.getApplet();
  console.log(`Playing applet: ${currentApplet.constructor.name}`);
  currentApplet.play();
}
```

## Util

Contains helper functions that may be useful in your applets,
