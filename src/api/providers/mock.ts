import type { ProjectionProvider } from './interfaces';

const enabled = Boolean(import.meta.env.VITE_PROJECTIONS_ENABLED);

export const MockProjectionProvider: ProjectionProvider = {
  source: 'Mock',
  ttlMs: 60 * 60 * 1000,
  isEnabled: enabled,
  async fetchWeekly(playerIds: string[], _week: number) {
    const out: Record<string, number> = {};
    playerIds.forEach((id, i) => {
      out[id] = 10 + i;
    });
    return out;
  },
};
