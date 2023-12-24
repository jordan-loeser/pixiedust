"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pixiedust_1 = require("pixiedust");
const routes_1 = require("../data/routes");
const RADIUS = 6.5;
const PADDING_START = 1;
// Pulled from this palette https://lospec.com/palette-list/6-bit-rgb
const GREEN_PIXEL_COLORS = {
    "0": null, // background
    "1": "#bfff50", // foreground
    "2": "null", // glow
};
const ORANGE_PIXEL_COLORS = {
    "0": null, // background
    "1": "#ffaa00", // foreground
    "2": "null", // glow
};
class TrainSignRow extends pixiedust_1.Widget {
    constructor(ctx, options) {
        if (process.env.NODE_ENV == "development")
            console.log("Building TrainSignRow...", options);
        super(ctx, options);
        this.setupHasBeenCalled = false;
        this.frame = 0;
        this.route = options.route;
        const msReminaing = options.arrivalTime.getTime() - new Date(Date.now()).getTime();
        const minutesRemaining = Math.max(Math.floor(msReminaing / 1000 / 60), 0);
        this.routeText = new pixiedust_1.Text(options.route, ctx, {
            font: pixiedust_1.Font.BITOCRA,
            x: 6,
            y: 0,
            pixelColors: {
                "0": null, // background
                "1": "#000", // foreground
                "2": "null", // glow
            },
        });
        this.marquee = new pixiedust_1.TextMarquee(options.terminal, ctx, {
            font: pixiedust_1.Font.ARRIVAL_TIME,
            x: (PADDING_START + RADIUS) * 2,
            y: 1,
            width: 87,
            pixelColors: GREEN_PIXEL_COLORS,
        });
        this.timeText = new pixiedust_1.Text(minutesRemaining.toString(), ctx, {
            font: pixiedust_1.Font.ARRIVAL_TIME,
            alignment: pixiedust_1.TextAlignment.RIGHT,
            x: ctx.canvas.width - 21,
            y: 1,
            pixelColors: ORANGE_PIXEL_COLORS,
        });
        this.minText = new pixiedust_1.Text("min", ctx, {
            font: pixiedust_1.Font.ARRIVAL_TIME,
            alignment: pixiedust_1.TextAlignment.RIGHT,
            x: ctx.canvas.width - 1 + 4,
            y: 1,
            pixelColors: GREEN_PIXEL_COLORS,
        });
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.marquee.setup();
            yield this.timeText.setup();
            yield this.minText.setup();
            yield this.routeText.setup();
            this.setupHasBeenCalled = true;
        });
    }
    draw() {
        if (!this.setupHasBeenCalled)
            throw new Error("Must call .setup() before drawing.");
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        // Draw the circle
        // TODO: convert to bitmap on disk
        // TODO: deduplicate repeated drawing by clearing smaller rects
        // TODO: if route isExpress, draw diamond instead
        this.ctx.beginPath();
        this.ctx.fillStyle = routes_1.ROUTE_METADATA[this.route].color;
        this.ctx.arc(RADIUS + PADDING_START, RADIUS, RADIUS, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();
        // Draw the text marquee
        this.marquee.scrollAndDraw(this.marquee.isDone ? 0 : 1); // this.marquee.isDone || this.frame <= 20 ? 0 : 1);
        // Draw a background on the time text for aesthetics
        this.ctx.fillStyle = "#000";
        const timeWidth = this.timeText.width + 2;
        this.ctx.fillRect(this.ctx.canvas.width - 21 - timeWidth, 1, timeWidth, this.timeText.height);
        // Draw the text
        this.timeText.draw();
        this.minText.draw();
        this.routeText.draw();
        this.ctx.restore();
        this.frame += 1;
    }
    get isDone() {
        return this.marquee.isDone;
    }
}
exports.default = TrainSignRow;
