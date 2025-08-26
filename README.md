# GridIron IQ
GridIron IQ is a fantasy football analytics dashboard built with React and Vite.
It syncs league data from the [Sleeper](https://api.sleeper.app) API and exposes a
pluggable provider system for optional analytics such as projections, injuries and weather.

Current tabs include:

- **Matchups** – synthetic time-series chart and scoreboard for the selected week.
- **League** – roster cards with cached player dictionary lookup.
- **Player Analytics** – placeholder for projections, injuries and news providers.
- **Team Analytics** – placeholder for pace and red-zone trends.
- **Fun Metrics** – placeholder for experimental stats like Hype Volatility.

## Getting Started

```bash
npm install
npm run dev
```

Open <http://localhost:5173> in your browser.
API keys should be provided as additional env variables when enabling a provider.
