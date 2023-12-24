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
exports.Text = exports.TextAlignment = void 0;
const fonts_1 = require("../util/fonts");
const Widget_1 = __importDefault(require("./Widget"));
const DEBUG = true;
var TextAlignment;
(function (TextAlignment) {
    TextAlignment[TextAlignment["LEFT"] = 0] = "LEFT";
    TextAlignment[TextAlignment["RIGHT"] = 1] = "RIGHT";
    //   CENTER, // TODO
})(TextAlignment || (exports.TextAlignment = TextAlignment = {}));
const DEFAULT_PIXEL_COLORS = {
    "0": null, // background
    "1": "#fff", // foreground
    "2": "red", // glow
};
class Text extends Widget_1.default {
    constructor(str, ctx, options = {}) {
        var _a, _b, _c, _d, _e;
        super(ctx, options);
        this.isReady = false;
        this.str = str;
        // Optional params
        this.width = (_a = options.width) !== null && _a !== void 0 ? _a : undefined;
        this.height = (_b = options.height) !== null && _b !== void 0 ? _b : undefined;
        this.font = (_c = options.font) !== null && _c !== void 0 ? _c : fonts_1.Font.MONO;
        this.pixelColors = (_d = options.pixelColors) !== null && _d !== void 0 ? _d : DEFAULT_PIXEL_COLORS;
        this.alignment = (_e = options.alignment) !== null && _e !== void 0 ? _e : TextAlignment.LEFT;
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bdfFont = yield (0, fonts_1.loadFont)(this.font);
            this.text = this.bdfFont.draw(this.str);
            if (!this.height) {
                this.height = this.text.height();
            }
            if (!this.width) {
                this.width = this.text.width();
            }
            this.isReady = true;
        });
    }
    draw() {
        if (!this.isReady || !this.text || !this.width || !this.height)
            throw new Error("Must call .setup() before calling .draw()!");
        this.ctx.save();
        // Draw bounding box
        if (DEBUG)
            this.drawBoundingBox();
        let cropParams = [this.width, this.height, 0];
        let translation = [this.x, this.y];
        if (this.alignment === TextAlignment.RIGHT) {
            cropParams = [
                this.width,
                this.height,
                -1 * (this.width - this.text.width()),
            ];
            translation = [this.x - this.text.width(), this.y];
        }
        this.ctx.translate(...translation);
        this.text.crop(...cropParams).draw2canvas(this.ctx, this.pixelColors);
        this.ctx.restore();
    }
    drawBoundingBox() {
        if (!this.isReady || !this.width || !this.height || !this.text)
            throw new Error("Must call .setup() before calling .drawBoundingBox()!");
        let xy = [this.x, this.y];
        if (this.alignment === TextAlignment.RIGHT) {
            xy = [this.x - this.text.width(), this.y];
        }
        this.ctx.save();
        this.ctx.fillStyle = "blue";
        this.ctx.restore();
    }
}
exports.Text = Text;
exports.default = Text;
