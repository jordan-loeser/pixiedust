# nyctrainsign

Displays the next two trains arriving at a given MTA station in a given direction.

## Preview

<img src="./docs/render.gif" width="512px"/>

## Config Values

| Key           | Type               | Description                                                | Default |
| ------------- | ------------------ | ---------------------------------------------------------- | ------- |
| `stationId`\* | `string \| number` | The station id according to [stops.csv](./data/stops.csv). | n/a     |
| `direction`\* | `"N" \| "S"`       | The direction to show (aka Uptown or Downtown)             | n/a     |

## Credits

The structure of this applet is inspired by this [Reconstructed version of the NYCTrainSign API](https://github.com/ColdHeat/nycts-api).
