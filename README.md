# GridIron IQ

GridIron IQ is a fantasy football analytics dashboard built with React and Vite.  
It syncs league data from the [Sleeper](https://api.sleeper.app) API and exposes a
pluggable provider system for optional analytics such as projections, injuries and weather.

## Getting Started

```bash
npm install
npm run dev
```

Open <http://localhost:5173> in your browser.

## Tests

```bash
npm test
```

## Environment

Optional providers are controlled via env variables:

- `VITE_PROJECTIONS_ENABLED`
- `VITE_INJURIES_ENABLED`
- `VITE_WEATHER_ENABLED`
- `VITE_ODDS_ENABLED`
- `VITE_NEWS_ENABLED`

API keys should be provided as additional env variables when enabling a provider.
