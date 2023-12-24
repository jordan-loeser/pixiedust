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
const pixiedust_1 = require("pixiedust");
const TrainSignRow_1 = __importDefault(require("./TrainSignRow"));
class TrainSign extends pixiedust_1.Widget {
    constructor(model) {
        if (process.env.NODE_ENV == "development")
            console.debug("Building TrainSign...", JSON.stringify({ top: model.topTrain, bottom: model.bottomTrain }, null, "\t"));
        super(model.ctx, model);
        this.setupHasBeenCalled = false;
        this._isDone = false;
        this.topTrain = model.topTrain;
        this.bottomTrain = model.bottomTrain;
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.topTrain) {
                this.topRow = new TrainSignRow_1.default(this.ctx, Object.assign(Object.assign({}, this.topTrain), { y: 1 }));
                yield this.topRow.setup();
            }
            if (this.bottomTrain) {
                this.bottomRow = new TrainSignRow_1.default(this.ctx, Object.assign(Object.assign({}, this.bottomTrain), { y: 17 }));
                yield this.bottomRow.setup();
            }
            // Mark setup as complete
            this.setupHasBeenCalled = true;
        });
    }
    draw() {
        var _a, _b;
        if (!this.setupHasBeenCalled)
            throw new Error("Must call .setup() before drawing.");
        // Save the context
        this.ctx.save();
        // Clear the previous frame
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        // Draw the rows
        (_a = this.topRow) === null || _a === void 0 ? void 0 : _a.draw();
        (_b = this.bottomRow) === null || _b === void 0 ? void 0 : _b.draw();
        // Restore the context
        this.ctx.restore();
        // Mark the app as done when the topMarquee is done
        const rowIsDone = (row) => row === undefined || row.isDone;
        this._isDone = rowIsDone(this.topRow) && rowIsDone(this.bottomRow);
    }
    get isDone() {
        return this._isDone;
    }
}
exports.default = TrainSign;
