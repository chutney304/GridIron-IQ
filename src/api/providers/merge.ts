import type { ProjectionProvider } from './interfaces';

export async function mergeProjections<T extends { player_id: string }>(
  players: T[],
  provider: ProjectionProvider,
  week: number,
): Promise<(T & { projection?: number; source?: string })[]> {
  if (!provider.isEnabled) return players;
  try {
    const ids = players.map((p) => p.player_id);
    const proj = await provider.fetchWeekly(ids, week);
    return players.map((p) => ({
      ...p,
      projection: proj[p.player_id],
      source: provider.source,
    }));
  } catch {
    return players;
  }
}
