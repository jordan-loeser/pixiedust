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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Applet = void 0;
const gif_encoder_1 = __importDefault(require("gif-encoder"));
const node_webpmux_1 = __importDefault(require("node-webpmux"));
const gammaCorrect_1 = require("../util/gammaCorrect");
const DEFAULT_FRAME_RATE = 20; // fps
class Applet {
    constructor(canvas, frameRate = DEFAULT_FRAME_RATE) {
        this.isDone = false;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        if (this.ctx === null) {
            throw new Error("Could not get canvas context.");
        }
        this.frameRate = frameRate;
        this.frameDuration = 1000 / frameRate;
    }
    // Member functions
    play() {
        const interval = setInterval(() => {
            this.draw();
            if (this.isDone)
                clearInterval(interval);
        }, this.frameDuration);
    }
    encodeAsGif() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setup();
            // Initialize encoder
            const encoder = new gif_encoder_1.default(this.canvas.width, this.canvas.height, {
                highWaterMark: 5 * 1024 * 1024, // 5MB
            });
            encoder.setFrameRate(this.frameRate);
            encoder.setQuality(10);
            encoder.setDispose(3);
            encoder.writeHeader();
            // Generate frames
            this.isDone = false;
            while (!this.isDone) {
                this.draw();
                const pixels = (0, gammaCorrect_1.gammaCorrect)(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
                encoder.addFrame(pixels);
            }
            // Write output
            encoder.finish();
            return encoder.read();
        });
    }
    encodeAsWebP() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setup();
            const frames = [];
            this.isDone = false;
            while (!this.isDone) {
                this.draw();
                frames.push(yield Applet.generateWebPFrameFromCanvas(this.canvas));
            }
            // TODO: make lossy? figure out color quality issues?
            return node_webpmux_1.default.Image.save(null, {
                width: this.canvas.width,
                height: this.canvas.height,
                delay: this.frameDuration,
                dispose: true,
                frames,
            });
        });
    }
    // Static Functions
    static generateWebPFrameFromCanvas(canvas, lossless = 5) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isLibWebPInitialized) {
                yield node_webpmux_1.default.Image.initLib();
                this.isLibWebPInitialized = true;
            }
            const ctx = canvas.getContext("2d");
            const canvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = (0, gammaCorrect_1.gammaCorrect)(canvasImageData);
            const img = yield node_webpmux_1.default.Image.getEmptyImage();
            yield img.setImageData(Buffer.from(pixels), {
                // TODO: use canvasImageData.data.buffer as Buffer?
                width: canvas.width,
                height: canvas.height,
                lossless,
            });
            // Convert the image data into a frame
            const frame = yield node_webpmux_1.default.Image.generateFrame({ img });
            return frame;
        });
    }
}
exports.Applet = Applet;
Applet.isLibWebPInitialized = false;
exports.default = Applet;
