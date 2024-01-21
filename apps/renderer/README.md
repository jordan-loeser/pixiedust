# Renderer

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat&logo=express&logoColor=%2361DAFB)

An Express server that can render pixiedust applets as animated `.webp` or `.gif` files.

> [!NOTE]  
> The applet scheduler is currently hard-coded to rotate through a select set of NYC subway stations. To deploy your own applet schedule, fork this repository and modify the list of applets registered in index.ts.

### Endpoints

| Endpoint  | Purpose                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/health` | Returns `ping` when the service is running.                                                                                                               |
| `/render` | Returns the renderered image file for the next applet in the scheduler. Accepts a `?format` query param with a value of `webp` or `gif` (defaults to gif) |
