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
exports.TextMarquee = void 0;
const Text_1 = __importDefault(require("./Text"));
const DEBUG = !true;
const DEFAULT_PIXEL_COLORS = {
    "0": null, // background
    "1": "#fff", // foreground
    "2": "red", // glow
};
class TextMarquee extends Text_1.default {
    constructor(str, ctx, options) {
        super(str, ctx, options);
        // private scrollDirection: ScrollDirection; // TODO
        // private isReversed: boolean; // TODO
        this.offset = -1;
        this.hasExited = false;
        this._isDone = false;
        // this.scrollDirection = options.scrollDirection ?? "horizontal"; // TODO
        // this.isReversed = options.reverse ?? false; // TODO
    }
    setup() {
        const _super = Object.create(null, {
            setup: { get: () => super.setup }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.setup.call(this);
        });
    }
    scrollAndDraw(amount = 1) {
        if (!this.isReady || !this.text || !this.width || !this.height)
            throw new Error("Must call .setup() before calling .scrollAndDraw()!");
        this.ctx.save();
        // Draw bounding box
        if (DEBUG)
            this.drawBoundingBox();
        // Facilitate translation
        this.offset += amount;
        this.ctx.translate(this.x, this.y);
        // Draw translated text within bounding box
        this.text
            .clone()
            .crop(this.width, this.height, this.offset)
            .draw2canvas(this.ctx, this.pixelColors);
        this.ctx.restore();
        // Loop back one time
        // TODO make work for vertical
        if (this.text.width() < this.width) {
            this.offset = -1;
            this._isDone = true;
        }
        else if (!this.hasExited && this.offset >= this.text.width()) {
            this.hasExited = true;
            this.offset = -1 * this.width;
        }
        else if (this.hasExited && this.offset >= -1) {
            this._isDone = true;
        }
    }
    drawBoundingBox() {
        if (!this.isReady || !this.width || !this.height)
            throw new Error("Must call .setup() before calling .drawBoundingBox()!");
        this.ctx.save();
        this.ctx.fillStyle = "#333";
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        this.ctx.restore();
    }
    get isDone() {
        return this._isDone;
    }
}
exports.TextMarquee = TextMarquee;
exports.default = TextMarquee;
