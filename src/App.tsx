import React from 'react';

/**
 * The root application component. This simple scaffold provides
 * a starting point for building your fantasy football analytics
 * dashboard. At runtime this component will be rendered by
 * React in the main entry point (src/main.tsx).
 */
export default function App(): JSX.Element {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        GridIron IQ
      </h1>
      <p>
        Welcome! This repository has been set up with a basic React + Vite
        configuration. You can start adding your fantasy football analytics
        components here. Use Sleeper for league data and add additional
        providers as needed for projections, injuries, and other metrics.
      </p>
    </div>
  );
}
