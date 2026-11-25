import { Image } from "canvas";
import { Applet, Font, PixelColors, Text } from "pixiedust";
import {
  fetchMatch,
  findNearbyMatchEvent,
  isMatchShowable,
  loadCrest,
  sizedLogoUrl,
} from "./api/fetchMatch";
import { Match, MatchTeam } from "./api/types";
import { CUSTOM_CRESTS, PixelArt } from "./crests";

// Configuration Defaults
const DEFAULT_TEAM_ID = "359"; // Arsenal, per ESPN
const DEFAULT_DURATION_S = 15;
const DEFAULT_FRAME_RATE = 10;
const DEFAULT_PRE_MATCH_MINUTES = 30;
const DEFAULT_POST_MATCH_MINUTES = 90;
const DEFAULT_TIME_ZONE = "America/New_York";

// Layout (128x32): [home crest] [score / status] [away crest]
const CREST_SIZE = 28;
const CREST_INSET = 2;
const SCORE_Y = 3;
const STATUS_Y = 19;
const LIVE_DOT_SIZE = 2;

// Colors are pre-gamma-correction; keep them bright.
const WHITE = "#ffffff";
const GREEN = "#bfff50";
const ORANGE = "#ffaa00";
const RED = "#ff2020";

const isHalfTime = (match: Match) =>
  match.statusName === "STATUS_HALFTIME" || match.statusDetail === "HT";

const pixelColors = (color: string): PixelColors => ({
  "0": null, // background
  "1": color, // foreground
  "2": null, // glow
});

/**
 * Gamma correction crushes dark team colors to black, so pick the first
 * team color bright enough to read, falling back to white.
 */
const legibleTeamColor = (team: MatchTeam): string => {
  const isBright = (hex: string | null) => {
    if (!hex) return false;
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.35;
  };
  return [team.color, team.alternateColor].find(isBright) ?? WHITE;
};

type SoccerScoresAppletSchema = {
  /** ESPN team id. Defaults to Arsenal. */
  teamId?: string;
  /** Seconds to show the applet. */
  duration?: number;
  /** Start showing this many minutes before kickoff. */
  preMatchMinutes?: number;
  /** Keep showing the result this many minutes after the estimated final whistle. */
  postMatchMinutes?: number;
  /** IANA time zone for kickoff times. */
  timeZone?: string;
  /**
   * Pin a specific match (requires `league`), ignoring the schedule window.
   * Intended for previews and testing.
   */
  eventId?: string;
  /** ESPN league slug for `eventId`, e.g. "eng.1" or "uefa.champions". */
  league?: string;
};

type Crest = {
  x: number;
  image: Image | null;
  /** Hand-drawn crest, preferred over `image` */
  art?: PixelArt;
  /** Team abbreviation, used when there's no art or image */
  fallback?: Text;
};

class SoccerScoresApplet extends Applet {
  // Abstract
  public id = "soccer-scores";
  public isActive = false;
  public isDone = false;

  // Config Options
  private teamId: string;
  private duration: number;
  private preMatchMs: number;
  private postMatchMs: number;
  private timeZone: string;
  private pinned?: { id: string; league: string };

  // Per-render state
  private frame = 0;
  private match?: Match;
  private crests: Crest[] = [];
  private scoreText?: Text;
  private statusText?: Text;
  private isLive = false;

  constructor(canvas: HTMLCanvasElement, config: SoccerScoresAppletSchema = {}) {
    super(canvas, DEFAULT_FRAME_RATE);
    this.teamId = config.teamId ?? DEFAULT_TEAM_ID;
    this.duration = config.duration ?? DEFAULT_DURATION_S;
    this.preMatchMs =
      (config.preMatchMinutes ?? DEFAULT_PRE_MATCH_MINUTES) * 60 * 1000;
    this.postMatchMs =
      (config.postMatchMinutes ?? DEFAULT_POST_MATCH_MINUTES) * 60 * 1000;
    this.timeZone = config.timeZone ?? DEFAULT_TIME_ZONE;

    if (config.eventId) {
      if (!config.league) throw new Error("`eventId` requires `league`.");
      this.pinned = { id: config.eventId, league: config.league };
    }
  }

  async setup(): Promise<void> {
    // The renderer reuses this instance, so reset everything.
    this.frame = 0;
    this.isDone = false;
    this.isActive = false;
    this.isLive = false;
    this.match = undefined;
    this.crests = [];
    this.scoreText = undefined;
    this.statusText = undefined;

    try {
      const match = await this.findMatch();
      if (!match) return;

      this.match = match;
      this.isLive = match.state === "in" && !isHalfTime(match);

      const [scoreLabel, statusLabel, statusColor] = this.labels(match);
      this.scoreText = await this.centeredText(
        scoreLabel,
        Font.ARRIVAL_TIME,
        WHITE,
        SCORE_Y
      );
      this.statusText = await this.centeredText(
        statusLabel,
        Font.DINA,
        statusColor,
        STATUS_Y
      );

      this.crests = await Promise.all([
        this.buildCrest(match.home, CREST_INSET),
        this.buildCrest(
          match.away,
          this.canvas.width - CREST_INSET - CREST_SIZE
        ),
      ]);

      this.isActive = true;
    } catch (e) {
      console.error("soccer-scores setup error:", (e as Error).message);
      this.isActive = false;
    }
  }

  draw() {
    if (!this.match || !this.scoreText || !this.statusText) {
      this.isDone = true; // Nothing to show
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Crests
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = true; // Shared ctx; other applets disable it
    this.crests.forEach(({ x, image, art, fallback }) => {
      if (art) {
        this.drawPixelArt(art, x);
      } else if (image) {
        this.ctx.drawImage(
          image as any,
          x,
          CREST_INSET,
          CREST_SIZE,
          CREST_SIZE
        );
      } else {
        fallback?.draw();
      }
    });
    this.ctx.restore();

    // Score and status
    this.scoreText.draw();
    this.statusText.draw();

    // Blinking "live" dot beside the match clock
    const blinkOn = Math.floor(this.frame / (this.frameRate / 2)) % 2 === 0;
    if (this.isLive && blinkOn) {
      this.ctx.save();
      this.ctx.fillStyle = RED;
      this.ctx.fillRect(
        this.statusText.x - LIVE_DOT_SIZE - 3,
        STATUS_Y + 4,
        LIVE_DOT_SIZE,
        LIVE_DOT_SIZE
      );
      this.ctx.restore();
    }

    this.frame += 1;
    this.isDone = this.frame >= this.duration * this.frameRate;
  }

  private async findMatch(): Promise<Match | null> {
    if (this.pinned) {
      return fetchMatch(this.pinned.league, this.pinned.id);
    }

    const now = Date.now();
    const event = await findNearbyMatchEvent(
      this.teamId,
      now,
      this.preMatchMs,
      this.postMatchMs
    );
    if (!event) return null;

    const match = await fetchMatch(event.league, event.id);
    return isMatchShowable(match, now, this.preMatchMs, this.postMatchMs)
      ? match
      : null;
  }

  /** [top line, bottom line, bottom line color] */
  private labels(match: Match): [string, string, string] {
    const { home, away } = match;

    if (match.state === "pre") {
      const time = new Intl.DateTimeFormat("en-US", {
        timeZone: this.timeZone,
        hour: "numeric",
        minute: "2-digit",
      }).format(match.kickoff);
      return [time, this.kickoffDay(match.kickoff), WHITE];
    }

    const score = `${home.score ?? "0"} - ${away.score ?? "0"}`;

    if (match.state === "in") {
      const color = isHalfTime(match) ? ORANGE : GREEN;
      return [score, match.statusDetail, color];
    }

    // Finished
    if (home.shootoutScore !== null && away.shootoutScore !== null) {
      return [score, `PENS ${home.shootoutScore}-${away.shootoutScore}`, WHITE];
    }
    return [score, match.statusDetail, WHITE];
  }

  /** "KICK OFF" if the match is today in the configured zone, else e.g. "SUN". */
  private kickoffDay(kickoff: Date): string {
    const day = (date: Date) =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: this.timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).format(date);

    if (day(kickoff) === day(new Date())) return "KICK OFF";

    return new Intl.DateTimeFormat("en-US", {
      timeZone: this.timeZone,
      weekday: "short",
    })
      .format(kickoff)
      .toUpperCase();
  }

  private async centeredText(
    str: string,
    font: Font,
    color: string,
    y: number,
    centerX = this.canvas.width / 2
  ): Promise<Text> {
    const text = new Text(str, this.ctx, {
      font,
      y,
      pixelColors: pixelColors(color),
    });
    await text.setup();
    text.x = Math.round(centerX - (text.width ?? 0) / 2);
    return text;
  }

  /** Draws pixel art centered in the crest box whose left edge is `x`. */
  private drawPixelArt(art: PixelArt, x: number) {
    const height = art.rows.length;
    const width = Math.max(...art.rows.map((row) => row.length));
    const left = x + Math.floor((CREST_SIZE - width) / 2);
    const top = CREST_INSET + Math.floor((CREST_SIZE - height) / 2);

    art.rows.forEach((row, dy) => {
      // Fill runs of the same color with one rect each
      let start = 0;
      for (let dx = 1; dx <= row.length; dx++) {
        if (dx < row.length && row[dx] === row[start]) continue;
        const color = art.palette[row[start]];
        if (color) {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(left + start, top + dy, dx - start, 1);
        }
        start = dx;
      }
    });
  }

  private async buildCrest(team: MatchTeam, x: number): Promise<Crest> {
    const art = CUSTOM_CRESTS[team.id];
    if (art) return { x, image: null, art };

    const image = team.logoUrl
      ? await loadCrest(sizedLogoUrl(team.logoUrl, CREST_SIZE))
      : null;
    if (image) return { x, image };

    // No crest: show the team abbreviation in its color instead
    const fallback = await this.centeredText(
      team.abbreviation,
      Font.DINA,
      legibleTeamColor(team),
      CREST_INSET + CREST_SIZE / 2 - 5,
      x + CREST_SIZE / 2
    );
    return { x, image: null, fallback };
  }
}

export default SoccerScoresApplet;
