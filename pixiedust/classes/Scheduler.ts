import Applet from "./Applet";

export class Scheduler {
  private i = -1;
  private applets: Applet[] = [];

  register(applet: Applet) {
    this.applets.push(applet);
  }

  getApplet() {
    if (this.applets.length <= 0) throw new Error("No applets registered.");

    this.i = (this.i + 1) % this.applets.length;
    return this.applets[this.i];
  }
}
