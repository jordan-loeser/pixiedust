/**
 * Thanksgiving-week gating. The renderer runs on Cloud Run in UTC, so "today"
 * is always computed in an explicit time zone.
 */
export const DEFAULT_TIME_ZONE = "America/New_York";

export type SeasonalConfig = {
  /** Ignore the calendar and always be active (handy for previews). */
  force?: boolean;
  /** "week" (default): Mon–Sun of Thanksgiving week. "day": Thursday only. */
  window?: "week" | "day";
  /** IANA zone the week is computed in. */
  timeZone?: string;
};

type YMD = { year: number; month: number; day: number };

export function todayIn(timeZone: string, now = new Date()): YMD {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Fourth Thursday of November, as a day-of-month. */
export function thanksgivingDay(year: number): number {
  const novFirstWeekday = new Date(Date.UTC(year, 10, 1)).getUTCDay(); // 0 = Sun
  const firstThursday = 1 + ((4 - novFirstWeekday + 7) % 7);
  return firstThursday + 21;
}

/**
 * Thanksgiving week runs Monday through Sunday around the holiday,
 * i.e. three days before through three days after Thursday.
 */
export function isThanksgivingWeek(
  timeZone = DEFAULT_TIME_ZONE,
  now = new Date()
): boolean {
  const { year, month, day } = todayIn(timeZone, now);
  if (month !== 11) return false;
  const t = thanksgivingDay(year);
  return day >= t - 3 && day <= t + 3;
}

export function isThanksgivingDay(
  timeZone = DEFAULT_TIME_ZONE,
  now = new Date()
): boolean {
  const { year, month, day } = todayIn(timeZone, now);
  return month === 11 && day === thanksgivingDay(year);
}

export function isSeasonActive(config: SeasonalConfig = {}): boolean {
  if (config.force === true) return true;
  const zone = config.timeZone ?? DEFAULT_TIME_ZONE;
  return config.window === "day"
    ? isThanksgivingDay(zone)
    : isThanksgivingWeek(zone);
}
