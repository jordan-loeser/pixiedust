# spotify

Displays the currently playing track on Spotify.

## Preview

<!-- TODO: update preview -->
<img src="./docs/render.gif" width="512px"/>

## Config Values

| Key                | Type                    | Description                                                    | Default |
| ------------------ | ----------------------- | -------------------------------------------------------------- | ------- |
| `getAccessToken`\* | `() => Promise<string>` | A function that returns a valid Spotify access token           | n/a     |
| `holdDuration`     | `number`                | The duration in seconds to freeze the marquee before scrolling | 2       |
| `duration`\        | `number`                | The total duration in seconds to present the applet            | 20      |
