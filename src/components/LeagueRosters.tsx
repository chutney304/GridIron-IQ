import React, { useState } from 'react';
import type { Players, Roster, User } from '../types/sleeper';
import { SleeperApi } from '../api/sleeper';

interface Props {
  rosters: Roster[];
  users: User[];
}

function fmtPlayer(id: string, players?: Players): string {
  if (!players) return id;
  if (/^[A-Z]{2,3}$/.test(id)) return `${id} D/ST`;
  const p = players[id];
  if (!p) return id;
  const pos = p.position || p.fantasy_positions?.[0] || '';
  const team = p.team ? ` (${p.team})` : '';
  return `${p.full_name}${team} ${pos}`.trim();
}

export function LeagueRosters({ rosters, users }: Props) {
  const [players, setPlayers] = useState<Players | null>(null);
  const loadPlayers = async () => {
    const p = await SleeperApi.players();
    setPlayers(p);
    localStorage.setItem('players_nfl', JSON.stringify({ t: Date.now(), p }));
  };
  const stored = localStorage.getItem('players_nfl');
  if (!players && stored) {
    try {
      const obj = JSON.parse(stored);
      if (Date.now() - obj.t < 24 * 60 * 60 * 1000) setPlayers(obj.p);
    } catch {
      /* ignore */
    }
  }
  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  return (
    <div>
      {!players && (
        <button onClick={loadPlayers} className="mb-4 border px-2 py-1">
          Load player names (~5MB)
        </button>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {rosters.map((r) => {
          const owner = userById[r.owner_id];
          const title =
            r.metadata.team_name || owner?.display_name || `Roster #${r.roster_id}`;
          return (
            <div key={r.roster_id} className="border rounded p-2">
              <div className="font-bold mb-2">{title}</div>
              <div className="flex gap-4">
                <div>
                  <div className="font-semibold">Starters</div>
                  <ul>
                    {r.starters.map((id) => (
                      <li key={id}>{fmtPlayer(id, players ?? undefined)}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">Bench</div>
                  <ul>
                    {r.bench.map((id) => (
                      <li key={id}>{fmtPlayer(id, players ?? undefined)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
