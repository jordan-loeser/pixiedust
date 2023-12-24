"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Widget = void 0;
class Widget {
    constructor(ctx, options = {}) {
        var _a, _b;
        this.ctx = ctx;
        this.x = (_a = options.x) !== null && _a !== void 0 ? _a : 0;
        this.y = (_b = options.y) !== null && _b !== void 0 ? _b : 0;
    }
}
exports.Widget = Widget;
exports.default = Widget;
