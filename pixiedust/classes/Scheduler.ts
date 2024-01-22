// TODO: move to scheduling app

import Applet from "./Applet";

/**
 * The `Scheduler` class facilitates the scheduling of multiple instances of the `Applet` class,
 * allowing for organized and sequential execution of applets.
 */
export class Scheduler {
  private i = -1;
  private applets: Applet[] = [];

  /**
   * Registers an applet to be included in the scheduling cycle.
   * @param applet - The `Applet` instance to be registered.
   */
  register(applet: Applet): void {
    this.applets.push(applet);
  }

  /**
   * Retrieves the next applet in a round-robin fashion.
   * @throws Will throw an error if no applets are registered.
   * @returns The next `Applet` in the sequence.
   */
  getApplet(): Applet {
    if (this.applets.length <= 0) {
      throw new Error("No applets registered.");
    }

    this.i = (this.i + 1) % this.applets.length;
    return this.applets[this.i];
  }
}
