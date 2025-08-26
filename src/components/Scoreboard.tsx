import React from 'react';
import type { Matchup, Roster, User } from '../types/sleeper';

interface Props {
  matchups?: Matchup[] | null;
  rosters?: Roster[] | null;
  users?: User[] | null;
}

export function Scoreboard({ matchups, rosters, users }: Props) {
  const safeMatchups = matchups ?? [];
  const rosterById = Object.fromEntries((rosters ?? []).map((r) => [r.roster_id, r]));
  const userById = Object.fromEntries((users ?? []).map((u) => [u.user_id, u]));
  const grouped: Record<number, Matchup[]> = {};
  safeMatchups.forEach((m) => {
    grouped[m.matchup_id] = grouped[m.matchup_id] || [];
    grouped[m.matchup_id].push(m);
  });

  const sets = Object.values(grouped);
  if (sets.length === 0) {
    return <div className="text-center text-gray-500">No matchups</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sets.map(([a, b]) => {
        if (!a || !b) return null;
        const rosterA = rosterById[a.roster_id];
        const rosterB = rosterById[b.roster_id];
        const nameA =
          rosterA?.metadata.team_name ||
          userById[rosterA?.owner_id ?? '']?.display_name ||
          `Roster ${a.roster_id}`;
        const nameB =
          rosterB?.metadata.team_name ||
          userById[rosterB?.owner_id ?? '']?.display_name ||
          `Roster ${b.roster_id}`;
        return (
          <div
            key={a.matchup_id}
            className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800"
          >
            <div>
              <div className="font-medium">{nameA}</div>
              <div className="text-xl font-bold">{a.points.toFixed(1)}</div>
            </div>
            <div className="text-center text-sm text-gray-500">vs</div>
            <div className="text-right">
              <div className="font-medium">{nameB}</div>
              <div className="text-xl font-bold">{b.points.toFixed(1)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
