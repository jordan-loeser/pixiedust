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

## Acknowledgements

The pixiedust approach to rendering is heavily inspired by [pixlet](https://github.com/tidbyt/pixlet), created by the team doing great work at [Tidbyt](https://tidbyt.com/). Check them out!
