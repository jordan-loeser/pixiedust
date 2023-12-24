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
exports.Direction = void 0;
const pixiedust_1 = require("pixiedust");
const TrainSign_1 = __importDefault(require("./widgets/TrainSign"));
const fetchTrainTimes_1 = require("./api/fetchTrainTimes");
const types_1 = require("./api/types");
Object.defineProperty(exports, "Direction", { enumerable: true, get: function () { return types_1.Direction; } });
class NYCTrainApplet extends pixiedust_1.Applet {
    constructor(canvas, config) {
        super(canvas);
        this.frame = 0;
        this.setupHasBeenCalled = false;
        const { stationId, direction } = config;
        this.stationId = stationId;
        this.direction = direction;
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch train times
            this.station = yield (0, fetchTrainTimes_1.fetchStation)(this.stationId);
            const trains = this.direction === types_1.Direction.NORTH
                ? this.station.northbound
                : this.station.southbound;
            if (trains.length > 0) {
                this.sign = new TrainSign_1.default({
                    ctx: this.ctx,
                    topTrain: trains.shift(),
                    bottomTrain: trains.shift(),
                });
                yield this.sign.setup();
            }
            this.setupHasBeenCalled = true;
        });
    }
    // TODO: if total number of frames > 1 minute then print warning
    draw() {
        if (!this.setupHasBeenCalled)
            throw new Error("Must call .setup() before drawing.");
        if (!this.sign)
            return;
        this.sign.draw();
        this.isDone = this.sign.isDone;
    }
}
exports.default = NYCTrainApplet;
