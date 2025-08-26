import type { League, Matchup, NFLState, Players, Roster, User } from '../types/sleeper';

const BASE = 'https://api.sleeper.app/v1';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sleeper fetch failed: ${res.status}`);
  return (await res.json()) as T;
}

export const SleeperApi = {
  state(): Promise<NFLState> {
    return fetchJson<NFLState>(`${BASE}/state/nfl`);
  },
  league(leagueId: string): Promise<League> {
    return fetchJson<League>(`${BASE}/league/${leagueId}`);
  },
  users(leagueId: string): Promise<User[]> {
    return fetchJson<User[]>(`${BASE}/league/${leagueId}/users`);
  },
  rosters(leagueId: string): Promise<Roster[]> {
    return fetchJson<Roster[]>(`${BASE}/league/${leagueId}/rosters`);
  },
  matchups(leagueId: string, week: number): Promise<Matchup[]> {
    return fetchJson<Matchup[]>(`${BASE}/league/${leagueId}/matchups/${week}`);
  },
  players(): Promise<Players> {
    return fetchJson<Players>(`${BASE}/players/nfl`);
  },
};
