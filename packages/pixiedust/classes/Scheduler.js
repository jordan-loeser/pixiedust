"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduler = void 0;
class Scheduler {
    constructor() {
        this.i = -1;
        this.applets = [];
    }
    register(applet) {
        this.applets.push(applet);
    }
    getApplet() {
        if (this.applets.length <= 0)
            throw new Error("No applets registered.");
        this.i = (this.i + 1) % this.applets.length;
        return this.applets[this.i];
    }
}
exports.Scheduler = Scheduler;
