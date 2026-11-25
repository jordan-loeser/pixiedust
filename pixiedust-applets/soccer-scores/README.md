# soccer-scores

Live scores for one soccer team's matches, across every competition (league, domestic cups, Europe, friendlies). Defaults to Arsenal.

The applet is only active around match time. Otherwise `isActive` is `false` and the renderer skips it, so it's safe to register several times in the rotation.

| When                                     | Top line           | Bottom line                    |
| ---------------------------------------- | ------------------ | ------------------------------ |
| Within `preMatchMinutes` of kickoff      | Kickoff time       | `KICK OFF` (or weekday)        |
| Live                                     | Score              | Match clock + blinking dot     |
| Half time                                | Score              | `HT` in orange                 |
| Up to `postMatchMinutes` after full time | Final score        | `FT` / `AET` / `PENS 4-3`      |

The home team's crest is on the left and the away team's on the right. If a crest can't be loaded, the team's abbreviation is shown instead.

## Custom crests

ESPN's logos are detailed artwork that turns to mush at 28px, and gamma correction darkens their mid-tones further. Teams listed in [`crests/index.ts`](./crests/index.ts) use hand-drawn pixel art instead. Arsenal is included.

To add a team, create `crests/<team>.ts` exporting a `PixelArt` (a palette plus one string per row, `.` for transparent). Art is centered on the 28×28 crest box; anything up to 32×32 fits, using the full matrix height, then add it to `CUSTOM_CRESTS` under the team's ESPN id. When picking colors, favor saturated, bright values: gamma 2.8 turns gold to orange and navy to near-black.

## Preview

<!-- Generate a preview GIF and store it in ./docs/render.gif -->
<img src="./docs/render.gif" width="512px"/>

## Data

Uses ESPN's public (unofficial, keyless) site API:

- `soccer/all/teams/{teamId}/schedule` (results) and `...?fixture=true` (fixtures, including the in-progress match) find a match near now. Cached for 10 minutes.
- `soccer/{league}/summary?event={id}` supplies the live score and clock. Cached for 20 seconds.
- Crests come from ESPN's image combiner, resized server-side to 28×28.

All requests time out after 5 seconds. Any failure makes the applet inactive for that render.

Full time is estimated as kickoff + 115 minutes when deciding how long to keep showing a result.

## Config Values

| Key                | Type     | Description                                                                                 | Default              |
| ------------------ | -------- | ------------------------------------------------------------------------------------------- | -------------------- |
| `teamId`           | `string` | ESPN team id (find it in the team's espn.com URL, e.g. `/club/_/id/359/arsenal`)           | `"359"` (Arsenal)    |
| `duration`         | `number` | Seconds to show the applet per render                                                       | `15`                 |
| `preMatchMinutes`  | `number` | Start showing this many minutes before kickoff                                              | `30`                 |
| `postMatchMinutes` | `number` | Keep showing the result this many minutes after the estimated final whistle                 | `90`                 |
| `timeZone`         | `string` | IANA time zone for kickoff times (the server runs in UTC)                                    | `"America/New_York"` |
| `eventId`          | `string` | Pin a specific ESPN match and ignore the schedule window. For previews/testing              | n/a                  |
| `league`           | `string` | ESPN league slug for `eventId`, e.g. `"eng.1"`, `"uefa.champions"`. Required with `eventId` | n/a                  |
