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
exports.loadFont = exports.Font = void 0;
const bdfparser_1 = require("bdfparser");
const readlineiter_1 = __importDefault(require("readlineiter"));
const path_1 = __importDefault(require("path"));
const FONT_DIRECTORY = path_1.default.join(__dirname, "../fonts");
var Font;
(function (Font) {
    Font["BITOCRA"] = "bitocra";
    Font["CHERRY"] = "cherry";
    Font["MONO"] = "mono";
    Font["ARRIVAL_TIME"] = "arrival-time";
})(Font || (exports.Font = Font = {}));
const fontPaths = {
    [Font.BITOCRA]: "bitocra/bitocra.bdf",
    [Font.CHERRY]: "cherry/cherry-11-r.bdf",
    [Font.MONO]: "CG-pixel-3x5-mono.bdf",
    [Font.ARRIVAL_TIME]: "custom/arrival-time/arrival-time-13.bdf",
};
const loadFont = (font) => __awaiter(void 0, void 0, void 0, function* () {
    const fontPath = path_1.default.join(FONT_DIRECTORY, fontPaths[font]);
    if (process.env.NODE_ENV == "development")
        console.debug("Loading font:", fontPath);
    return (0, bdfparser_1.$Font)((0, readlineiter_1.default)(fontPath)); // TODO: Is there some way to like.. cache this?
});
exports.loadFont = loadFont;
