export interface NFLState {
  season_type: string;
  week: number;
  display_week?: number;
  league?: number;
}

export interface League {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
}

export interface User {
  user_id: string;
  display_name: string;
}

export interface Roster {
  roster_id: number;
  owner_id: string;
  starters: string[];
  bench: string[];
  metadata: Record<string, string>;
}

export interface Matchup {
  matchup_id: number;
  roster_id: number;
  points: number;
}

export interface Player {
  player_id: string;
  full_name: string;
  team?: string;
  position?: string;
  fantasy_positions?: string[];
}

export type Players = Record<string, Player>;
