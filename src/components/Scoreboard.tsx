import React from 'react';
import type { Matchup, Roster, User } from '../types/sleeper';

interface Props {
  matchups: Matchup[];
  rosters: Roster[];
  users: User[];
}

export function Scoreboard({ matchups, rosters, users }: Props) {
  const rosterById = Object.fromEntries(rosters.map((r) => [r.roster_id, r]));
  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const grouped: Record<number, Matchup[]> = {};
  matchups.forEach((m) => {
    grouped[m.matchup_id] = grouped[m.matchup_id] || [];
    grouped[m.matchup_id].push(m);
  });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {Object.values(grouped).map(([a, b]) => {
        const rosterA = rosterById[a.roster_id];
        const rosterB = rosterById[b.roster_id];
        const nameA = rosterA?.metadata.team_name || userById[rosterA?.owner_id ?? '']?.display_name || `Roster ${a.roster_id}`;
        const nameB = rosterB?.metadata.team_name || userById[rosterB?.owner_id ?? '']?.display_name || `Roster ${b.roster_id}`;
        return (
          <div key={a.matchup_id} className="border rounded p-2 flex justify-between">
            <div>
              <div>{nameA}</div>
              <div className="text-xl font-bold">{a.points.toFixed(1)}</div>
            </div>
            <div className="text-center flex flex-col justify-center">vs</div>
            <div className="text-right">
              <div>{nameB}</div>
              <div className="text-xl font-bold">{b.points.toFixed(1)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
