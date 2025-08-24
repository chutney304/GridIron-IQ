# GridIron IQ

GridIron IQ is an analytics‑focused fantasy football dashboard. This repository
contains a minimal React + Vite scaffold that you can build on to create
interactive matchup visualizations, roster views, and advanced metrics for your
league.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173` to view the app. Edit files
   under `src/` and the page will reload automatically.

## Architecture

This app uses the following core technologies:

- **React** for building the UI components.
- **Vite** for bundling and development server.
- **TypeScript** for static typing.
- **recharts** for plotting charts.
- **framer-motion** and **lucide-react** for animations and icons.

The entry point is [`src/main.tsx`](src/main.tsx) which mounts the root
component defined in [`src/App.tsx`](src/App.tsx).

## Next Steps

This scaffold only contains a basic starter page. To build out your fantasy
football analytics dashboard:

1. Add components under `src/components` for charts, roster cards, matchup
   scoreboards, etc.
2. Implement data fetching from the Sleeper API in a separate module (e.g.
   `src/api/sleeper.ts`). Use `/state/nfl` to detect the current week and
   `/league/{league_id}` and related endpoints to pull league, roster and
   matchup data.
3. Generate synthetic time series for matchup point progressions if desired.
4. Optionally integrate additional providers (projections, injuries, weather,
   odds, news) behind clearly defined interfaces.

Happy coding!