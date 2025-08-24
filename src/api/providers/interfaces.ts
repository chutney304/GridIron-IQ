export interface ProviderBase {
  readonly source: string;
  readonly ttlMs: number;
  readonly isEnabled: boolean;
}

export interface ProjectionProvider extends ProviderBase {
  fetchWeekly(playerIds: string[], week: number): Promise<Record<string, number>>;
}

export interface InjuryProvider extends ProviderBase {
  fetchInjuries(playerIds: string[]): Promise<Record<string, string>>;
}

export interface WeatherProvider extends ProviderBase {
  fetchWeather(gameIds: string[]): Promise<Record<string, string>>;
}

export interface OddsProvider extends ProviderBase {
  fetchOdds(gameIds: string[]): Promise<Record<string, { spread: number; total: number }>>;
}

export interface NewsProvider extends ProviderBase {
  fetchNews(playerIds: string[]): Promise<Record<string, string>>;
}

export interface StatsProvider extends ProviderBase {
  fetchStats(playerIds: string[], week: number): Promise<Record<string, unknown>>;
}
