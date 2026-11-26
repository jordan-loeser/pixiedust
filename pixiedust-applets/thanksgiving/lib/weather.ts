/**
 * Current conditions from Open-Meteo (free, no API key), formatted for the
 * 3×5 mono font. That font's W reads as H, so every word here avoids W.
 */
export type WeatherConfig = {
  latitude: number;
  longitude: number;
  /** Short place label shown before the temperature, e.g. "NYC". */
  label?: string;
  timeZone?: string;
};

export const NYC: WeatherConfig = {
  latitude: 40.7397,
  longitude: -73.9962,
  label: "NYC",
  timeZone: "America/New_York",
};

const TIMEOUT_MS = 2500;
const CACHE_MS = 10 * 60 * 1000;

/** WMO weather codes → W-free words. */
function describe(code: number): string {
  if (code === 0) return "CLEAR";
  if (code <= 2) return "PARTLY CLOUDY";
  if (code === 3) return "OVERCAST";
  if (code === 45 || code === 48) return "FOG";
  if (code >= 51 && code <= 57) return "DRIZZLE";
  if (code >= 61 && code <= 67) return "RAIN";
  if (code >= 71 && code <= 77) return "FLURRIES";
  if (code >= 80 && code <= 82) return "RAIN";
  if (code === 85 || code === 86) return "FLURRIES";
  if (code >= 95) return "STORMS";
  return "";
}

let cache: { key: string; at: number; text: string } | null = null;

/**
 * e.g. "NYC 41F  PARTLY CLOUDY  *  HI 45  LO 34". Resolves to null on any
 * failure or timeout so callers can fall back without blocking a render.
 */
export async function weatherLine(config: WeatherConfig = NYC): Promise<string | null> {
  const key = `${config.latitude},${config.longitude}`;
  if (cache && cache.key === key && Date.now() - cache.at < CACHE_MS) return cache.text;

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${config.latitude}&longitude=${config.longitude}` +
    "&current=temperature_2m,weather_code" +
    "&daily=temperature_2m_max,temperature_2m_min&forecast_days=1" +
    "&temperature_unit=fahrenheit" +
    `&timezone=${encodeURIComponent(config.timeZone ?? "America/New_York")}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return cache?.text ?? null;
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };
    const t = json.current?.temperature_2m;
    if (typeof t !== "number") return cache?.text ?? null;
    const parts = [`${config.label ? config.label + " " : ""}${Math.round(t)}F`];
    const words = describe(json.current?.weather_code ?? -1);
    if (words) parts.push(words);
    const hi = json.daily?.temperature_2m_max?.[0];
    const lo = json.daily?.temperature_2m_min?.[0];
    let text = parts.join("  ");
    if (typeof hi === "number" && typeof lo === "number")
      text += `  *  HI ${Math.round(hi)}  LO ${Math.round(lo)}`;
    cache = { key, at: Date.now(), text };
    return text;
  } catch {
    return cache?.text ?? null;
  }
}
