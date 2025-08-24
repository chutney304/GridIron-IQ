import React, { useEffect, useState } from 'react';
import { SleeperApi } from '../api/sleeper';
import type { League, Matchup, Roster, User } from '../types/sleeper';
import { useSleeperWeek } from '../hooks/useSleeperWeek';
import { Scoreboard } from '../components/Scoreboard';
import { LeagueRosters } from '../components/LeagueRosters';
import { MatchupChart } from '../components/MatchupChart';
import { generateSeries } from '../utils/series';

const DEFAULT_LEAGUE = '1236033733312651264';

export function Dashboard() {
  const autoWeek = useSleeperWeek();
  const [leagueId, setLeagueId] = useState(DEFAULT_LEAGUE);
  const [week, setWeek] = useState<number>(1);
  const [league, setLeague] = useState<League | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'matchups' | 'league'>('matchups');
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (autoWeek && week === 1) setWeek(autoWeek);
  }, [autoWeek, week]);

  async function sync() {
    setLoading(true);
    try {
      const [lg, us, rs, ms] = await Promise.all([
        SleeperApi.league(leagueId),
        SleeperApi.users(leagueId),
        SleeperApi.rosters(leagueId),
        SleeperApi.matchups(leagueId, week),
      ]);
      setLeague(lg);
      setUsers(us);
      setRosters(rs);
      setMatchups(ms);
      setSelected(ms[0]?.matchup_id ?? null);
    } finally {
      setLoading(false);
    }
  }

  const grouped = matchups.filter((m) => m.matchup_id === selected);
  const series = grouped.length === 2
    ? {
        home: generateSeries(`${grouped[0].roster_id}-${grouped[1].roster_id}-t1`, grouped[0].points),
        away: generateSeries(`${grouped[0].roster_id}-${grouped[1].roster_id}-t2`, grouped[1].points),
      }
    : { home: [], away: [] };

  return (
    <div className="p-4 space-y-4">
      <header className="flex gap-2 items-center">
        <input
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
          className="border px-2 py-1"
        />
        <select
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="border px-2 py-1"
        >
          {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
        <button onClick={sync} disabled={loading} className="border px-3 py-1">
          {loading ? 'Syncing...' : 'Sync Sleeper'}
        </button>
        {league && <div className="ml-auto font-bold">{league.name}</div>}
      </header>
      <nav className="flex gap-4">
        <button onClick={() => setTab('matchups')} className={tab === 'matchups' ? 'font-bold' : ''}>
          Matchups
        </button>
        <button onClick={() => setTab('league')} className={tab === 'league' ? 'font-bold' : ''}>
          League
        </button>
      </nav>
      {tab === 'matchups' && matchups.length > 0 && (
        <div className="space-y-4">
          {selected && series.home.length === 61 && <MatchupChart series={series} />}
          <Scoreboard matchups={matchups} rosters={rosters} users={users} />
        </div>
      )}
      {tab === 'league' && (
        <LeagueRosters rosters={rosters} users={users} />
      )}
    </div>
  );
}
