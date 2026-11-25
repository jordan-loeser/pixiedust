# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Node 18.17.0 (`.nvmrc`), Yarn classic workspaces + Turborepo.

```bash
yarn install
yarn dev              # dotenv-merges every .env.local in the tree, then `turbo run dev`
yarn build            # turbo run build (respects ^build dependency order)
yarn build --filter=renderer   # single workspace
yarn generate:applet  # turbo gen applet — scaffolds pixiedust-applets/<name>
yarn commit           # commitizen prompt (conventional commits)
yarn docker:build && yarn docker:run   # renderer image, serves on :3000
```

**There is no test suite.** `turbo.json`'s pipeline defines only `build` and `dev`, so `yarn test` fails outright with `Could not find the following tasks in project: test`. Every workspace's `test` script is a placeholder `exit 1`. Don't invent a test command; if verification is needed, run the renderer and hit `/render`.

**Linting** exists only in `apps/preview-tool`: `yarn workspace preview-tool lint` (eslint, `--max-warnings 0`). No root lint script.

**Commit messages are enforced** — a husky `commit-msg` hook runs commitlint with `@commitlint/config-conventional`. Non-conforming messages are rejected.

**Firmware doesn't build through turbo.** `firmware/` is a yarn workspace whose `package.json` has no scripts — it's a PlatformIO project (`adafruit_matrixportal_esp32s3`) built and uploaded through PlatformIO, so `--filter=firmware` does nothing. Its README documents hardware pinout, `secrets.h` setup, upload procedure, and a list of known bugs — read it before touching `firmware/src/main.cpp`.

## Architecture

Applets (TypeScript) → Renderer (Express, encodes GIF/WebP) → HTTP `GET /render` → Firmware (ESP32-S3) → 128×32 HUB75 LED matrix.

### The Applet contract (`pixiedust/classes/Applet.ts`)

This is the central abstraction and its rules are only visible across several files:

- `encodeAsGif()` / `encodeAsWebP()` call `reset()` (clears canvas → `await setup()`), then loop `draw()` **until `isDone` is true**. A `draw()` that never sets `isDone = true` hangs the encoder forever.
- `setup()` must reset all per-render state (frame counters, `isDone`, positions). The renderer constructs applets once at boot and reuses those instances across every request, so state leaks between renders otherwise.
- **`isActive` is the "skip me" signal.** If `isActive` is false, `encodeAs*` returns `null`; the renderer's `/render` handler then loops to the next applet in the scheduler. Applets that depend on external data (e.g. Spotify) set `isActive` inside `setup()` based on whether there's anything to show. Subclasses must declare `id`, `isDone`, and `isActive`.
- **Gamma correction (2.8) is applied at encode time**, not in `draw()`. Colors picked in `draw()` are pre-correction and render dimmer on the matrix than on screen.

### Renderer (`apps/renderer/index.ts`)

Creates **one** JSDOM 128×32 canvas and passes it to every applet; `reset()` clearing that shared canvas is what keeps applets from bleeding into each other. The schedule is hard-coded: applets are instantiated and `scheduler.register(...)`-ed in order, and `Scheduler.getApplet()` hands them out round-robin (registering the same instance twice inserts it twice in the rotation). Also owns the Spotify OAuth flow (`/authenticate/spotify`, `/callback/spotify`) with an in-memory token.

Server-side canvas comes from `jsdom` + `node-canvas`, which is why the Dockerfile installs `libcairo2-dev`, `libpango1.0-dev`, `libjpeg-dev`, `libgif-dev`. Deployed to Cloud Run via `cloudbuild.yaml` (see Deploying).

## Deploying

The live renderer is the Cloud Run service `pixiedust-express` (region `us-central1`, GCP project `smart-led-matrix`), and the physical sign fetches from it. Cloud Build trigger `build-on-push-to-main` builds the root `Dockerfile`, which copies the whole repo, runs `yarn install`, and runs `yarn build --filter=renderer`. It then pushes to Artifact Registry and deploys a revision whose image is tagged with the commit SHA.

**Deploying is only half automatic.** The trigger is enabled, but GitHub pushes no longer reach Cloud Build. As of 2026-11-25, merging to `main` starts nothing, and the last automatic build was 2025-02-19. After a merge, run the trigger yourself:

```bash
gcloud builds triggers run build-on-push-to-main --project smart-led-matrix --branch=main
gcloud builds describe <build-id> --project smart-led-matrix --format="value(status)"   # ~4–6 min
gcloud run services describe pixiedust-express --project smart-led-matrix --region us-central1 \
  --format="value(status.latestReadyRevisionName,spec.template.spec.containers[0].image)"
```

- **Always pass `--project smart-led-matrix`.** The local gcloud default config points at an unrelated project.
- **Workflow:** branch `applet/<name>` → PR → merge with a merge commit, which is the existing history style → run the trigger. Deploying means merging to `main`, so only do it when the user asks.
- **Verify a deploy without `GET /render`.** The live scheduler is shared with the sign, so every request advances its rotation. Check the revision and image SHA, then `GET /health`.
- **Check the build before deploying.** Run `yarn install && yarn build --filter=renderer` from a clean checkout of exactly what you're merging, the way the Dockerfile does. A workspace that's missing from `apps/renderer/package.json` breaks the Cloud Build.
- **Fixing auto-deploy:** reconnect the GitHub repo under Cloud Build → Repositories in `smart-led-matrix`. Once pushes trigger builds again, delete the manual step above.

### Widgets and fonts

`Widget` (`pixiedust/classes/Widget.ts`) is a thin ctx + x/y base. Text rendering is **bitmap-font based**: `Text`/`TextMarquee` have an async `setup()` that loads `.bdf` files through `pixiedust/util/fonts.ts` (`Font` enum → path). Applet-specific widgets live under `pixiedust-applets/<name>/widgets/`.

**Fonts come from a git submodule.** `pixiedust`'s build runs `git submodule update --init --recursive`, then `cp -r ./fonts ./dist`. A husky `post-checkout` hook also inits submodules. An uninitialized submodule means font loading fails at runtime, not build time.

## Adding an applet

1. `yarn generate:applet` (kebab-case name).
2. **The generator template is stale** — `turbo/generators/templates/index.ts.hbs` emits only `isDone` + `setup`/`draw`. `Applet` also declares `id` and `isActive` abstract, so generated code won't compile until you add them.
3. Add `"@applets/<name>": "*"` to `apps/renderer/package.json`.
4. Import and `scheduler.register(...)` in `apps/renderer/index.ts`.
5. `yarn install` to link the new workspace.

`pixiedust-applets/dvd-logo/index.ts` is the simplest complete reference (self-contained, frame-counted); `spotify/index.ts` shows the async-data + `isActive` pattern.

## Notes

- `yarn dev` merges *all* `.env.local` files found anywhere in the tree into one env (renderer's `SPOTIFY_*`, nyctrainsign's `MTAPI_URL`). See the `.env.template` / `.env.example` files for expected keys.
- `pixiedust-applets/README.md` points at a stale path; the Applet base class is at `pixiedust/classes/Applet.ts`.
- `pixiedust-applets/example-applet` and `maze-generator` contain only leftover `dist`/`node_modules` — no source, not part of the build.
