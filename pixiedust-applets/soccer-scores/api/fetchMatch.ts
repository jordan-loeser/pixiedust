import { Image, loadImage } from "canvas";
import {
  ESPNCompetition,
  ESPNCompetitor,
  ESPNScheduleEvent,
  ESPNScheduleResponse,
  ESPNScore,
  ESPNSummaryResponse,
  Match,
  MatchTeam,
} from "./types";

const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer";

const FETCH_TIMEOUT_MS = 5_000;

/** Schedules change rarely; the applet runs setup() on every rotation. */
const SCHEDULE_TTL_MS = 10 * 60 * 1000;

/** Live score and clock. */
const SUMMARY_TTL_MS = 20 * 1000;

const MINUTE_MS = 60 * 1000;

/** Rough kickoff-to-final-whistle time for a 90 minute match. */
export const ESTIMATED_MATCH_LENGTH_MS = 115 * MINUTE_MS;

/**
 * How long after kickoff a match can still be in progress (extra time,
 * penalties, delays). Bounds the search for candidate matches.
 */
const MAX_MATCH_LENGTH_MS = 4 * 60 * MINUTE_MS;

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const jsonCache = new Map<string, { expires: number; value: unknown }>();

const fetchJson = async <T>(url: string, ttlMs: number): Promise<T> => {
  const now = Date.now();
  const hit = jsonCache.get(url);
  if (hit && hit.expires > now) return hit.value as T;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`ESPN request failed (${res.status}): ${url}`);
  }
  const value = await res.json();

  // Drop expired entries so the cache can't grow without bound
  jsonCache.forEach((entry, key) => {
    if (entry.expires <= now) jsonCache.delete(key);
  });
  jsonCache.set(url, { expires: now + ttlMs, value });

  return value as T;
};

const crestCache = new Map<string, Image>();

/**
 * Loads a crest image. Resolves to null on any failure so a missing crest
 * can never hang or break a render.
 */
export const loadCrest = async (url: string): Promise<Image | null> => {
  const cached = crestCache.get(url);
  if (cached) return cached;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const image = await loadImage(Buffer.from(await res.arrayBuffer()));
    crestCache.set(url, image);
    return image;
  } catch (e) {
    console.error("soccer-scores crest error:", (e as Error).message);
    return null;
  }
};

/**
 * ESPN serves 500px crests; its image combiner can resize them server-side,
 * which looks far better on the matrix than downscaling locally.
 */
export const sizedLogoUrl = (href: string, size: number): string => {
  try {
    const url = new URL(href);
    if (url.hostname !== "a.espncdn.com") return href;
    return (
      `https://a.espncdn.com/combiner/i?img=${encodeURIComponent(
        url.pathname
      )}` + `&w=${size}&h=${size}`
    );
  } catch {
    return href;
  }
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const parseScore = (score: ESPNScore): string | null => {
  if (score === undefined || score === null) return null;
  if (typeof score === "string") return score;
  if (score.displayValue !== undefined) return score.displayValue;
  if (score.value !== undefined) return String(score.value);
  return null;
};

const parseColor = (color?: string): string | null =>
  color && /^[0-9a-f]{6}$/i.test(color) ? `#${color}` : null;

const parseTeam = (competitor: ESPNCompetitor): MatchTeam => {
  const { team } = competitor;
  return {
    id: team.id,
    abbreviation: team.abbreviation,
    name: team.displayName,
    homeAway: competitor.homeAway,
    score: parseScore(competitor.score),
    shootoutScore: competitor.shootoutScore ?? null,
    color: parseColor(team.color),
    alternateColor: parseColor(team.alternateColor),
    logoUrl: team.logos?.[0]?.href ?? team.logo ?? null,
  };
};

export const parseCompetition = (
  id: string,
  league: string,
  competition: ESPNCompetition
): Match => {
  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) throw new Error(`Match ${id} is missing a team`);

  const { type } = competition.status;
  return {
    id,
    league,
    kickoff: new Date(competition.date),
    state: type.state,
    completed: type.completed,
    statusName: type.name,
    statusDetail: type.shortDetail,
    home: parseTeam(home),
    away: parseTeam(away),
  };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches live data for a single match. The summary endpoint updates in real
 * time, unlike the team schedule endpoints.
 */
export const fetchMatch = async (
  league: string,
  eventId: string
): Promise<Match> => {
  const summary = await fetchJson<ESPNSummaryResponse>(
    `${BASE_URL}/${league}/summary?event=${encodeURIComponent(eventId)}`,
    SUMMARY_TTL_MS
  );
  const competition = summary.header?.competitions?.[0];
  if (!competition) throw new Error(`No competition data for match ${eventId}`);
  return parseCompetition(eventId, league, competition);
};

/**
 * Finds the team's match closest to `now` among all competitions (league,
 * cups, Europe, friendlies), or null if none is near.
 *
 * An in-progress match appears in the fixtures list, a finished one in the
 * results list, so both are searched.
 */
export const findNearbyMatchEvent = async (
  teamId: string,
  now: number,
  preMatchMs: number,
  postMatchMs: number
): Promise<{ id: string; league: string } | null> => {
  const scheduleUrl = `${BASE_URL}/all/teams/${encodeURIComponent(
    teamId
  )}/schedule`;

  const [results, fixtures] = await Promise.all([
    fetchJson<ESPNScheduleResponse>(scheduleUrl, SCHEDULE_TTL_MS),
    fetchJson<ESPNScheduleResponse>(
      `${scheduleUrl}?fixture=true`,
      SCHEDULE_TTL_MS
    ),
  ]);

  const events = new Map<string, ESPNScheduleEvent>();
  [...(results.events ?? []), ...(fixtures.events ?? [])].forEach((e) =>
    events.set(e.id, e)
  );

  const candidates = Array.from(events.values())
    .map((event) => ({ event, kickoff: Date.parse(event.date) }))
    .filter(
      ({ event, kickoff }) =>
        event.league?.slug &&
        now >= kickoff - preMatchMs &&
        now <= kickoff + MAX_MATCH_LENGTH_MS + postMatchMs
    )
    .sort((a, b) => b.kickoff - a.kickoff); // most recent kickoff first

  if (candidates.length === 0) return null;

  const { event } = candidates[0];
  return { id: event.id, league: event.league!.slug };
};

/**
 * Whether a match should be on screen: live, about to kick off, or recently
 * finished. Postponed and cancelled matches are never shown.
 */
export const isMatchShowable = (
  match: Match,
  now: number,
  preMatchMs: number,
  postMatchMs: number
): boolean => {
  const kickoff = match.kickoff.getTime();
  switch (match.state) {
    case "in":
      return true;
    case "pre":
      // Upper bound stops a delayed match that ESPN never updates from
      // lingering forever.
      return now >= kickoff - preMatchMs && now <= kickoff + MAX_MATCH_LENGTH_MS;
    case "post":
      return (
        match.completed &&
        now <= kickoff + ESTIMATED_MATCH_LENGTH_MS + postMatchMs
      );
    default:
      return false;
  }
};
