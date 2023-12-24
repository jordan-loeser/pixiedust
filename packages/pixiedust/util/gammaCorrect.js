"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gammaCorrect = void 0;
const DEFAULT_GAMMA = 2.8; // Correction factor
const MAX_IN = 255; // Top end of INPUT range
const MAX_OUT = 255; // Top end of OUTPUT range
const gammaCorrect = (imageData, gamma = DEFAULT_GAMMA) => imageData.data.map((d) => Math.pow(d / MAX_IN, gamma) * MAX_OUT + 0.5);
exports.gammaCorrect = gammaCorrect;
