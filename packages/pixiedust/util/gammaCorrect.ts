const DEFAULT_GAMMA = 2.8; // Correction factor
const MAX_IN = 255; // Top end of INPUT range
const MAX_OUT = 255; // Top end of OUTPUT range

export const gammaCorrect = (
  imageData: ImageData,
  gamma = DEFAULT_GAMMA
): ImageData["data"] =>
  imageData.data.map((d) => Math.pow(d / MAX_IN, gamma) * MAX_OUT + 0.5);
