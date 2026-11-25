<h1 align="center">
  <br>
  ✨🧚‍♀️
  <br>
  pixiedust
  <br>
</h1>

<h4 align="center">A web-based approach to creating graphics for pixel-based displays, such as LED matrices.</h4>

<p align="center">
    <img alt="Turborepo" src="https://img.shields.io/badge/Turborepo-%230F0813.svg?logo=Turborepo&style=flat">
    <a href="https://github.com/jordan-loeser/pixiedust/blob/main/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/jordan-loeser/pixiedust?style=flat"></a>
    <a href="https://github.com/jordan-loeser/pixiedust/pulls"><img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/jordan-loeser/pixiedust?style=flat"></a>
    <a href="https://github.com/jordan-loeser/pixiedust/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/jordan-loeser/pixiedust?style=flat"></a>
    <img alt="Commitizen Friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat">
</p>
<img src="./pixiedust-applets/nyctrainsign/docs/preview.gif" width="100%"/>

## Project Structure

This repository is a turbo-enabled monorepo with the following workspaces

| Workspace                                 | Description                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [Pixiedust Library](./pixiedust)          | A typescript library for rendering graphics.                                                                          |
| [Pixiedust Applets](./pixiedust-applets/) | Contains applets that use pixiedust to render a specific graphic.                                                     |
| [Renderer](./apps/renderer)               | An Express server to render applets into animated `.webp` or `.gif` images.                                           |
| [Preview Tool](./apps/preview-tool)       | A helper tool to preview rendered pixiedust applets.                                                                  |
| [Firmware](./firmware)                    | A PlatformIO project to display animated images on an [Adafruit MatrixPortal](https://www.adafruit.com/product/5778). |

## Getting Started

To run all workspaces:

```
$ yarn install
$ yarn dev
```

## Deploying

The renderer runs on Cloud Run (service `pixiedust-express`, region `us-central1`, GCP project `smart-led-matrix`). Cloud Build builds the root `Dockerfile` with [`cloudbuild.yaml`](./cloudbuild.yaml), pushes the image to Artifact Registry, and rolls out a new revision.

1. Work on a branch (`applet/<name>` by convention), open a PR, and merge it into `main`.
2. Run the deploy trigger by hand. The `build-on-push-to-main` trigger is meant to fire on every push to `main`, but GitHub pushes stopped reaching Cloud Build (last automatic build: February 2025), so for now it has to be run manually:

   ```
   $ gcloud builds triggers run build-on-push-to-main --project smart-led-matrix --branch=main
   ```

3. Confirm the build succeeded and the new revision is serving:

   ```
   $ gcloud builds list --project smart-led-matrix --limit 1
   $ gcloud run services describe pixiedust-express --project smart-led-matrix --region us-central1 \
       --format="value(status.latestReadyRevisionName,spec.template.spec.containers[0].image)"
   ```

   The image tag should be the merge commit's SHA. A build takes about 4–6 minutes.

To restore automatic deploys, reconnect the GitHub repository under **Cloud Build → Repositories** in the `smart-led-matrix` project, then drop step 2.

## Press

[Adafruit](https://blog.adafruit.com/2024/01/23/pixiedust-a-web-based-approach-to-creating-graphics-for-pixel-based-displays-such-as-led-matrices/) - January 23, 2024


## Acknowledgements

The pixiedust approach to rendering is heavily inspired by [pixlet](https://github.com/tidbyt/pixlet), created by the team doing great work at [Tidbyt](https://tidbyt.com/). Check them out!
