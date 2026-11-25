/**
 * Normalized match data, independent of ESPN's response shapes.
 */
export type MatchState = "pre" | "in" | "post";

export type MatchTeam = {
  id: string;
  abbreviation: string;
  name: string;
  homeAway: "home" | "away";
  score: string | null;
  shootoutScore: number | null;
  /** "#rrggbb" or null */
  color: string | null;
  /** "#rrggbb" or null */
  alternateColor: string | null;
  logoUrl: string | null;
};

export type Match = {
  id: string;
  /** ESPN league slug, e.g. "eng.1" or "uefa.champions" */
  league: string;
  kickoff: Date;
  state: MatchState;
  completed: boolean;
  /** e.g. "STATUS_SECOND_HALF", "STATUS_FULL_TIME", "STATUS_POSTPONED" */
  statusName: string;
  /** e.g. "67'", "90'+1'", "HT", "FT", "AET" */
  statusDetail: string;
  home: MatchTeam;
  away: MatchTeam;
};

/**
 * Loose typings for the parts of ESPN's unofficial site API we read.
 * https://site.api.espn.com/apis/site/v2/sports/soccer/...
 */
export type ESPNScore =
  | string
  | { value?: number; displayValue?: string }
  | undefined;

export type ESPNCompetitor = {
  id: string;
  homeAway: "home" | "away";
  score?: ESPNScore;
  shootoutScore?: number;
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    color?: string;
    alternateColor?: string;
    logo?: string;
    logos?: { href: string }[];
  };
};

export type ESPNStatus = {
  displayClock?: string;
  period?: number;
  type: {
    name: string;
    state: MatchState;
    completed: boolean;
    shortDetail: string;
  };
};

export type ESPNCompetition = {
  id: string;
  date: string;
  status: ESPNStatus;
  competitors: ESPNCompetitor[];
};

export type ESPNScheduleEvent = {
  id: string;
  date: string;
  league?: { slug: string };
  competitions: ESPNCompetition[];
};

export type ESPNScheduleResponse = {
  events?: ESPNScheduleEvent[];
};

export type ESPNSummaryResponse = {
  header: {
    id: string;
    league?: { slug: string };
    competitions: ESPNCompetition[];
  };
};
