# ✨🧚‍♀️ pixiedust

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white) [![Turborepo](https://img.shields.io/badge/Turborepo-%230F0813.svg?style=flat&logo=Turborepo)](https://turbo.build/) ![Google Cloud](https://img.shields.io/badge/GoogleCloud-%234285F4.svg?style=flat&logo=google-cloud&logoColor=white) ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat)](http://commitizen.github.io/cz-cli/)

Pixiedust makes it easy to use HTML canvas to generate graphics for pixel-based displays, such as LED matrices. For firmware to display webp images on an [Adafruit MatrixPortal](https://www.adafruit.com/product/5778), see [✨🧚‍♂️ pixiedust-hdk]().

| Workspace                                 | Description                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| [Pixiedust Library](./pixiedust)          | Contains helper classes for rendering graphics.                             |
| [Pixiedust Applets](./pixiedust-applets/) | Contains applets that use pixiedust to render a specific graphic.           |
| [Renderer](./apps/renderer)               | An Express server to render applets into animated `.webp` or `.gif` images. |
| [Preview Tool](./apps/preview-tool)       | A helper tool to preview pixiedust applets.                                 |

### Getting Started

Pixiedust is a turbo-enabled monorepo. To run all packages:

```
$ yarn install
$ yarn dev
```

### Acknowledgements

The pixiedust approach to rendering is heavily inspired by [pixlet](https://github.com/tidbyt/pixlet), created by the team doing great work at [Tidbyt](https://tidbyt.com/). Check them out!
