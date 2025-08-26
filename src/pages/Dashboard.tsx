import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Trophy, Timer } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Brush,
  BarChart,
  Bar,
} from "recharts";

/**
 * Fantasy Matchups – Scoreboard + Stock‑style Time Series (Top Section)
 * --------------------------------------------------------------------
 * Update per feedback:
 * - Smooth **monotone** lines
 * - Explicit **two different colors** for the teams
 * - X‑axis shows **hour labels including 12p** (12p → 10p) with dotted 10‑min grid
 */

// ---------- Types ----------
export type Matchup = {
  week: number;
  team1: string;
  points1: number;
  team2: string;
  points2: number;
  status?: "LIVE" | "FINAL";
};

// ---------- Theme colors for lines ----------
const TEAM_COLORS = ["#2563eb", "#dc2626"]; // blue-600, red-600

// ---------- Utility helpers ----------
function pct(a: number, b: number) {
  const total = a + b;
  if (total <= 0) return 0.5;
  return a / total;
}
function winner(m: Matchup) {
  if (m.points1 === m.points2) return "Tied";
  return m.points1 > m.points2 ? m.team1 : m.team2;
}
function margin(m: Matchup) {
  return Math.abs(m.points1 - m.points2);
}
function total(m: Matchup) {
  return m.points1 + m.points2;
}

// ---------- Time axis (12:00 PM ET → 10:00 PM ET, inclusive) ----------
const TICKS_PER_HOUR = 6; // 10‑minute increments
const START_HOUR_ET = 12; // 12p
const END_HOUR_ET = 22; // 10p
const TOTAL_TICKS = (END_HOUR_ET - START_HOUR_ET) * TICKS_PER_HOUR + 1; // 61 points (inclusive)

const allTickIndices = Array.from({ length: TOTAL_TICKS }, (_, i) => i); // 0..60
// Show **hour labels including 12p** → 12p,1p,...,10p
const hourLabelIndices = Array.from({ length: 11 }, (_, i) => i * TICKS_PER_HOUR); // 0,6,12,...,60

function fmtHourLabel(idx: number) {
  const minutes = idx * 10;
  const hour24 = START_HOUR_ET + Math.floor(minutes / 60);
  const hour12 = ((hour24 + 11) % 12) + 1;
  const ampm = hour24 >= 12 ? "p" : "a";
  return `${hour12}${ampm}`; // e.g., 12p, 1p, 2p ... 10p
}

// ---------- Seeded RNG so a matchup renders the same series every time ----------
function toSeed(str: string) {
  let h = 2166136261 >>> 0; // FNV‑1a
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Dummy series generator (sums to final & stable per matchup) ----------
function genCumulativeSeries(finalPts: number, seedKey: string, ticks: number = TOTAL_TICKS) {
  const rng = mulberry32(toSeed(seedKey));
  // Build non‑negative increments with many zeros, then scale so sum == finalPts.
  const incs = Array(ticks).fill(0);
  for (let i = 1; i < ticks; i++) {
    // ~55% chance of no scoring at a 10‑min slice, else a small burst
    incs[i] = rng() < 0.55 ? 0 : 0.4 + rng() * 3.2; // 0.4–3.6 pre‑scale
  }
  // a few spikes to create visible swings
  for (let k = 0; k < 5; k++) {
    const j = 1 + Math.floor(rng() * (ticks - 1));
    incs[j] += 2 + rng() * 6;
  }
  const weightSum = incs.reduce((a, b) => a + b, 0);
  if (weightSum === 0) {
    incs[ticks - 1] = finalPts;
  } else {
    const scale = finalPts / weightSum;
    for (let i = 1; i < ticks; i++) incs[i] = +(incs[i] * scale).toFixed(3);
  }
  // cumulative with 0.1 rounding & exact final fix
  const series: number[] = Array(ticks).fill(0);
  let cum = 0;
  for (let i = 1; i < ticks; i++) {
    cum += incs[i];
    series[i] = +cum.toFixed(1);
  }
  const delta = +(finalPts - series[ticks - 1]).toFixed(1);
  if (Math.abs(delta) > 0) series[ticks - 1] = +(series[ticks - 1] + delta).toFixed(1);
  for (let i = 1; i < ticks; i++) if (series[i] < series[i - 1]) series[i] = series[i - 1];
  return series;
}

function maskFuture(series: (number | null)[], upToIdx: number) {
  return series.map((v, i) => (i <= upToIdx ? v : null));
}

// ---------- Simple in-app test helpers ----------
// Existing tests kept; additional tests appended below.
type TestResult = { name: string; ok: boolean; details?: string };
function runTestsForMatchup(m: Matchup): TestResult[] {
  const s1 = genCumulativeSeries(m.points1, `${m.team1}-${m.team2}-t1`);
  const s2 = genCumulativeSeries(m.points2, `${m.team1}-${m.team2}-t2`);
  const tests: TestResult[] = [];
  // Original tests (unchanged)
  tests.push({
    name: `${m.team1} final equals ${m.points1}`,
    ok: Math.abs(s1[s1.length - 1] - m.points1) < 1e-9,
    details: `got ${s1[s1.length - 1]}`,
  });
  tests.push({
    name: `${m.team2} final equals ${m.points2}`,
    ok: Math.abs(s2[s2.length - 1] - m.points2) < 1e-9,
    details: `got ${s2[s2.length - 1]}`,
  });
  tests.push({ name: `${m.team1} non-decreasing`, ok: s1.every((v, i) => i === 0 || v >= s1[i - 1]) });
  tests.push({ name: `${m.team2} non-decreasing`, ok: s2.every((v, i) => i === 0 || v >= s2[i - 1]) });
  // New tests
  tests.push({ name: `${m.team1} has 61 points`, ok: s1.length === TOTAL_TICKS });
  tests.push({ name: `${m.team2} has 61 points`, ok: s2.length === TOTAL_TICKS });
  tests.push({ name: `${m.team1} starts at 0`, ok: s1[0] === 0 });
  tests.push({ name: `${m.team2} starts at 0`, ok: s2[0] === 0 });
  return tests;
}

function runGlobalTests(): TestResult[] {
  const t: TestResult[] = [];
  t.push({ name: "Hour labels count is 11", ok: hourLabelIndices.length === 11, details: String(hourLabelIndices.length) });
  t.push({ name: "First label index is 0 (12p)", ok: hourLabelIndices[0] === 0, details: String(hourLabelIndices[0]) });
  t.push({ name: "Last label index is 60 (10p)", ok: hourLabelIndices[hourLabelIndices.length - 1] === 60, details: String(hourLabelIndices[hourLabelIndices.length - 1]) });
  t.push({ name: "fmtHourLabel(0) is 12p", ok: fmtHourLabel(0) === "12p", details: fmtHourLabel(0) });
  t.push({ name: "fmtHourLabel(60) is 10p", ok: fmtHourLabel(60) === "10p", details: fmtHourLabel(60) });
  const masked = maskFuture([0, 1, 2] as unknown as (number | null)[], 1);
  t.push({ name: "maskFuture nulls future", ok: masked[2] === null, details: JSON.stringify(masked) });
  // New: fmtPos behavior
  const mockDict: PlayersDict = {
    X1: { player_id: 'X1', full_name: 'Tester One', position: 'WR', team: 'BUF' },
    X2: { player_id: 'X2', full_name: 'Tester Two', fantasy_positions: ['RB'], team: 'SF' },
  };
  t.push({ name: 'fmtPos prefers position', ok: fmtPos('X1', mockDict) === 'WR', details: fmtPos('X1', mockDict) });
  t.push({ name: 'fmtPos falls back to fantasy_positions[0]', ok: fmtPos('X2', mockDict) === 'RB', details: fmtPos('X2', mockDict) });
  return t;
}

// ---------- Sleeper sync helpers ----------
const SLEEPER_API = "https://api.sleeper.app/v1";

// Docs used: /state/nfl, /league, /users, /rosters, /matchups/{week}, /players/nfl

type SleeperUser = { user_id: string; display_name: string; username?: string; avatar?: string; metadata?: Record<string, any> };
type SleeperRoster = { roster_id: number; owner_id: string; starters?: string[]; players?: string[]; reserve?: string[]; metadata?: Record<string, any> };
type SleeperMatchup = { matchup_id: number; roster_id: number; points: number; starters?: string[]; players?: string[] };
type SleeperLeague = { league_id: string; name: string; season: string; season_type: string; total_rosters: number; scoring_settings?: Record<string, any>; roster_positions?: string[] };

type NFLState = { display_week?: number; week?: number; leg?: number };

type SleeperPlayer = { player_id: string; full_name?: string; first_name?: string; last_name?: string; team?: string; position?: string; fantasy_positions?: string[] };
type PlayersDict = Record<string, SleeperPlayer>;

async function fetchJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function getSleeperWeekAuto(): Promise<number> {
  const s = await fetchJSON<NFLState>(`${SLEEPER_API}/state/nfl`);
  return (s.display_week ?? s.week ?? s.leg ?? 1) as number;
}

function rosterDisplayName(r: SleeperRoster | undefined, usersById: Map<string, SleeperUser>): string {
  const metaName = (r?.metadata?.team_name || r?.metadata?.name || r?.metadata?.nickname) as string | undefined;
  const ownerName = r?.owner_id ? usersById.get(r.owner_id)?.display_name : undefined;
  return (metaName && metaName.trim()) || ownerName || (r ? `Roster ${r.roster_id}` : "Unknown");
}

function buildPairs(week: number, users: SleeperUser[], rosters: SleeperRoster[], matchups: SleeperMatchup[]): Matchup[] {
  const usersById = new Map(users.map((u) => [u.user_id, u] as const));
  const rostersById = new Map(rosters.map((r) => [r.roster_id, r] as const));
  const byMatchup = new Map<number, SleeperMatchup[]>();
  for (const m of matchups) {
    if (!byMatchup.has(m.matchup_id)) byMatchup.set(m.matchup_id, []);
    byMatchup.get(m.matchup_id)!.push(m);
  }
  const fix = (x: number) => Math.round(((x ?? 0) as number) * 10) / 10;
  const pairs: Matchup[] = [];
  for (const [, arr] of byMatchup.entries()) {
    if (arr.length >= 2) {
      const a = arr[0];
      const b = arr[1];
      const ra = rostersById.get(a.roster_id);
      const rb = rostersById.get(b.roster_id);
      pairs.push({
        week,
        team1: rosterDisplayName(ra, usersById),
        points1: fix(a.points),
        team2: rosterDisplayName(rb, usersById),
        points2: fix(b.points),
        status: "LIVE",
      });
    }
  }
  pairs.sort((m1, m2) => (m1.team1 + m1.team2).localeCompare(m2.team1 + m2.team2));
  return pairs;
}

async function fetchPlayersDict(force = false): Promise<PlayersDict> {
  const KEY = "sleeper_players_nfl_v1";
  const TSKEY = "sleeper_players_nfl_v1_ts";
  try {
    if (!force) {
      const cached = localStorage.getItem(KEY);
      const ts = localStorage.getItem(TSKEY);
      if (cached && ts) {
        const ageHrs = (Date.now() - parseInt(ts)) / 36e5;
        if (ageHrs < 24) return JSON.parse(cached);
      }
    }
  } catch {}
  const dict = await fetchJSON<PlayersDict>(`${SLEEPER_API}/players/nfl`);
  try {
    localStorage.setItem(KEY, JSON.stringify(dict));
    localStorage.setItem(TSKEY, String(Date.now()));
  } catch {}
  return dict;
}

async function fetchLeagueBundle(leagueId: string, week: number) {
  const [league, users, rosters, matchups] = await Promise.all([
    fetchJSON<SleeperLeague>(`${SLEEPER_API}/league/${leagueId}`),
    fetchJSON<SleeperUser[]>(`${SLEEPER_API}/league/${leagueId}/users`),
    fetchJSON<SleeperRoster[]>(`${SLEEPER_API}/league/${leagueId}/rosters`),
    fetchJSON<SleeperMatchup[]>(`${SLEEPER_API}/league/${leagueId}/matchups/${week}`),
  ]);
  return { league, users, rosters, matchups };
}

export default function FantasyMatchups() {
  const [leagueId, setLeagueId] = useState<string>("1236033733312651264");
  const [week, setWeek] = useState<number>(1);
  const [sortBy, setSortBy] = useState<"margin" | "total">("margin");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Matchup[]>([]);
  const [leagueMeta, setLeagueMeta] = useState<SleeperLeague | null>(null);
  const [leagueUsers, setLeagueUsers] = useState<SleeperUser[]>([]);
  const [leagueRosters, setLeagueRosters] = useState<SleeperRoster[]>([]);
  const [playersDict, setPlayersDict] = useState<PlayersDict | null>(null);
  const [playersStatus, setPlayersStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // Top time‑series state
  const [selectedMatchupIdx, setSelectedMatchupIdx] = useState<number>(0);
  const [curIdx, setCurIdx] = useState<number>(0);
  const [series1, setSeries1] = useState<number[]>(Array(TOTAL_TICKS).fill(0));
  const [series2, setSeries2] = useState<number[]>(Array(TOTAL_TICKS).fill(0));
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Self-test state & runner (Tools tab)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const runAllTests = () => {
    const results = [
      ...data.flatMap(runTestsForMatchup),
      ...runGlobalTests(),
    ];
    setTestResults(results);
    const summary = results.map((r) => `${r.ok ? "✔" : "✘"} ${r.name}${r.details ? ` (${r.details})` : ""}`).join("\n");
    console.log("[Self-tests]", "\n" + summary);
  };

  // Rebuild series when matchup changes
  useEffect(() => {
    const m = data[selectedMatchupIdx];
    if (!m) return;
    setSeries1(genCumulativeSeries(m.points1, `${m.team1}-${m.team2}-t1`));
    setSeries2(genCumulativeSeries(m.points2, `${m.team1}-${m.team2}-t2`));
    setCurIdx(TOTAL_TICKS - 1);
  }, [selectedMatchupIdx, data]);

  // Auto-detect current display week from Sleeper state on mount
  useEffect(() => {
    (async () => {
      try {
        const auto = await getSleeperWeekAuto();
        if (Number.isFinite(auto)) setWeek(auto);
      } catch (e) {
        console.warn('Auto-week failed', e);
      }
    })();
  }, []);

  // Auto‑advance every 10 minutes (simulated)
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => stepForward(), 600000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  function stepForward() {
    setCurIdx((prev) => Math.min(prev + 1, TOTAL_TICKS - 1));
  }
  function resetDay() {
    const m = data[selectedMatchupIdx] ?? data[0];
    if (!m) return;
    setSeries1(genCumulativeSeries(m.points1, `${m.team1}-${m.team2}-t1`));
    setSeries2(genCumulativeSeries(m.points2, `${m.team1}-${m.team2}-t2`));
    setCurIdx(0);
  }

  // Visible (masked) line data
  const selectedMatchup = data[selectedMatchupIdx] ?? { week, team1: "Team 1", points1: 0, team2: "Team 2", points2: 0, status: "LIVE" as const };
  const masked1 = useMemo(() => (curIdx >= TOTAL_TICKS - 1 ? series1 : maskFuture(series1, curIdx)), [series1, curIdx]);
  const masked2 = useMemo(() => (curIdx >= TOTAL_TICKS - 1 ? series2 : maskFuture(series2, curIdx)), [series2, curIdx]);

  const lineRows = useMemo(() => {
    return allTickIndices.map((i) => ({ idx: i, [selectedMatchup.team1]: masked1[i], [selectedMatchup.team2]: masked2[i] }));
  }, [masked1, masked2, selectedMatchup]);

  // Scoreboard grid + margin chart
  const sorted = useMemo(() => {
    const copy = [...data];
    if (sortBy === "margin") copy.sort((a, b) => margin(b) - margin(a));
    else copy.sort((a, b) => total(b) - total(a));
    return copy;
  }, [data, sortBy]);

  const marginChartData = useMemo(
    () =>
      sorted.map((m, i) => ({ id: i + 1, matchup: `${m.team1} vs ${m.team2}`, margin: margin(m) })),
    [sorted]
  );

  async function handleRefresh() {
    setLoading(true);
    try {
      // Determine active week via /state/nfl (display_week preferred)
      let activeWeek = week;
      try {
        const auto = await getSleeperWeekAuto();
        if (Number.isFinite(auto)) { activeWeek = auto; setWeek(auto); }
      } catch (e) { console.warn('state/nfl failed; using selected week', e); }

      if (leagueId && leagueId.trim()) {
        const { league, users, rosters, matchups } = await fetchLeagueBundle(leagueId.trim(), activeWeek);
        setLeagueMeta(league);
        setLeagueUsers(users);
        setLeagueRosters(rosters);
        const pairs = buildPairs(activeWeek, users, rosters, matchups);
        if (pairs.length > 0) {
          setData(pairs);
          setSelectedMatchupIdx(0);
          const m = pairs[0];
          setSeries1(genCumulativeSeries(m.points1, `${m.team1}-${m.team2}-t1`));
          setSeries2(genCumulativeSeries(m.points2, `${m.team1}-${m.team2}-t2`));
          setCurIdx(TOTAL_TICKS - 1);
        } else {
          setData([]);
        }
      } else {
        setData([]);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Sleeper sync failed: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayers(force = false) {
    try {
      setPlayersStatus('loading');
      const dict = await fetchPlayersDict(force);
      setPlayersDict(dict);
      setPlayersStatus('ready');
    } catch (e) {
      console.error(e);
      setPlayersStatus('error');
    }
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Global Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gridiron IQ</h1>
            <p className="text-sm text-muted-foreground">Analytics-first fantasy dashboard • Week {week}</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Sleeper League ID"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              className="w-56"
            />
            <Select value={String(week)} onValueChange={(v) => setWeek(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Week" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 18 }).map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Week {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} disabled={loading} className="gap-2">
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing" : "Sync Sleeper"}
            </Button>
          </div>
        </div>

        {/* Primary navigation tabs */}
        <Tabs defaultValue="matchups" className="w-full">
          <TabsList className="grid grid-cols-6 gap-2">
            <TabsTrigger value="matchups">Matchups</TabsTrigger>
            <TabsTrigger value="players">Player Analytics</TabsTrigger>
            <TabsTrigger value="teams">Team Analytics</TabsTrigger>
            <TabsTrigger value="fun">Fun Metrics</TabsTrigger>
            <TabsTrigger value="league">League</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          {/* MATCHUPS TAB */}
          <TabsContent value="matchups" className="space-y-6">
            {/* TOP: Stock‑style time series */}
            <Card className="rounded-2xl border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performance Over Time (12:00 PM – 10:00 PM ET)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Matchup</span>
                    <Select value={String(selectedMatchupIdx)} onValueChange={(v) => setSelectedMatchupIdx(parseInt(v))}>
                      <SelectTrigger className="w-[260px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {data.map((m, i) => (
                          <SelectItem key={`${m.team1}-${m.team2}-${i}`} value={String(i)}>
                            {m.team1} vs {m.team2}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh((v) => !v)}>
                      {autoRefresh ? "Auto‑refresh: ON" : "Auto‑refresh: OFF"}
                    </Button>
                    <Button variant="outline" onClick={stepForward}>Simulate next 10‑min</Button>
                    <Button variant="ghost" onClick={resetDay}>Reset day</Button>
                  </div>
                </div>

                <div className="w-full h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineRows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                      {/* full 10‑min grid lines */}
                      <CartesianGrid vertical strokeDasharray="3 3" />
                      {/* hidden axis driving grid every 10 min */}
                      <XAxis xAxisId="grid" dataKey="idx" ticks={allTickIndices} hide />
                      {/* visible hourly labels including 12p */}
                      <XAxis
                        xAxisId="labels"
                        dataKey="idx"
                        ticks={hourLabelIndices}
                        tickFormatter={fmtHourLabel}
                        tick={{ fontSize: 12 }}
                        interval={0}
                        height={28}
                      />
                      <YAxis domain={[0, 'auto']} tick={{ fontSize: 12 }} label={{ value: "Pts", angle: -90, position: "insideLeft" }} allowDecimals />
                      <Tooltip
                        formatter={(v: number) => [Number(v).toFixed(1), "Pts"]}
                        labelFormatter={(i) => {
                          const minutes = (i as number) * 10;
                          const hour24 = START_HOUR_ET + Math.floor(minutes / 60);
                          const mins = minutes % 60;
                          const h12 = ((hour24 + 11) % 12) + 1;
                          const mm = mins.toString().padStart(2, "0");
                          const ampm = hour24 >= 12 ? "PM" : "AM";
                          return `${h12}:${mm} ${ampm} ET`;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />

                      {/* Smooth lines with explicit colors */}
                      <Line type="monotone" dataKey={selectedMatchup.team1} dot={{ r: 3, stroke: TEAM_COLORS[0], fill: TEAM_COLORS[0] }} activeDot={{ r: 5 }} strokeWidth={2} stroke={TEAM_COLORS[0]} />
                      <Line type="monotone" dataKey={selectedMatchup.team2} dot={{ r: 3, stroke: TEAM_COLORS[1], fill: TEAM_COLORS[1] }} activeDot={{ r: 5 }} strokeWidth={2} stroke={TEAM_COLORS[1]} />

                      <Brush dataKey="idx" height={24} travellerWidth={8} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-xs text-muted-foreground">
                  Each point represents the cumulative score at a 10‑minute pull. The last point (10:00 PM ET) equals the final score for each team.
                </p>
              </CardContent>
            </Card>

            {/* Scoreboard grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((m, idx) => {
                const w = winner(m);
                return (
                  <motion.div
                    key={`${m.team1}-${m.team2}-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                  >
                    <Card className="rounded-2xl shadow-sm border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="truncate mr-2">{m.team1} <span className="text-muted-foreground">vs</span> {m.team2}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={m.status === "FINAL" ? "secondary" : "default"} className="gap-1">
                              {m.status === "FINAL" ? <Trophy className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                              {m.status}
                            </Badge>
                            {m.status === "FINAL" && winner(m) !== "Tied" && (
                              <Badge className="gap-1" variant="outline">
                                <Trophy className="w-3 h-3" /> {winner(m)}
                              </Badge>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Mini lead bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="truncate pr-2">{m.team1} • {m.points1.toFixed(1)}</span>
                            <span className="truncate pl-2 text-right">{m.points2.toFixed(1)} • {m.team2}</span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full ${m.points1 >= m.points2 ? "bg-primary" : "bg-primary/40"}`} style={{ width: `${pct(m.points1, m.points2) * 100}%` }} />
                            <div className={`h-full -mt-3 ${m.points2 > m.points1 ? "bg-primary" : "bg-primary/40"}`} style={{ width: `${(1 - pct(m.points1, m.points2)) * 100}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Total: {(m.points1 + m.points2).toFixed(1)}</span>
                            <span>Margin: {Math.abs(m.points1 - m.points2).toFixed(1)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* PLAYER ANALYTICS */}
          <TabsContent value="players" className="space-y-4">
            <Card className="rounded-2xl border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Player Analytics (prototype)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Consistency vs Ceiling */}
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{n:'WR A',c:14,ce:28},{n:'WR B',c:9,ce:22},{n:'WR C',c:12,ce:18},{n:'WR D',c:8,ce:30}]}>                    
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="n" />
                      <YAxis label={{ value: 'Pts', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="c" name="Median (Consistency)" />
                      <Bar dataKey="ce" name="90th (Ceiling)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Usage/role trend (dummy) */}
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{w:1,rr:70,ts:18},{w:2,rr:74,ts:20},{w:3,rr:80,ts:24},{w:4,rr:76,ts:23},{w:5,rr:82,ts:27}] }>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="w" label={{ value: 'Week', position: 'insideBottom', dy: 8 }} />
                      <YAxis yAxisId="left" label={{ value: 'Routes %', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Target %', angle: -90, position: 'insideRight' }} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="rr" name="Routes Run %" />
                      <Line yAxisId="right" type="monotone" dataKey="ts" name="Target Share %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEAM ANALYTICS */}
          <TabsContent value="teams" className="space-y-4">
            <Card className="rounded-2xl border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Team Analytics (prototype)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{t:'Team A',rz:6,pace:63},{t:'Team B',rz:3,pace:58},{t:'Team C',rz:8,pace:67},{t:'Team D',rz:5,pace:60}] }>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rz" name="Red Zone Trips" />
                      <Bar dataKey="pace" name="Plays/Game" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{w:1,wp:42},{w:2,wp:55},{w:3,wp:48},{w:4,wp:61},{w:5,wp:58}] }>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="w" label={{ value: 'Week', position: 'insideBottom', dy: 8 }} />
                      <YAxis label={{ value: 'Win % (elo model)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="wp" name="Win Probability" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FUN METRICS */}
          <TabsContent value="fun" className="space-y-4">
            <Card className="rounded-2xl border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fun / Novel Metrics (preview)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground">Hype Volatility Index</div>
                  Std‑dev of last 4 weeks' fantasy points, adjusted for snap share & opponent.
                </div>
                <div>
                  <div className="font-medium text-foreground">Clutch Meter</div>
                  Points scored in 4th quarter / overtime vs team average.
                </div>
                <div>
                  <div className="font-medium text-foreground">Red‑Zone Gravity</div>
                  Share of team targets/carries inside the 10.
                </div>
                <div>
                  <div className="font-medium text-foreground">Game Script Sensitivity</div>
                  Usage delta when trailing by 7+ vs leading by 7+.
                </div>
                <div>
                  <div className="font-medium text-foreground">Route Win Rate+</div>
                  Targets per route vs league‑avg at same aDOT band.
                </div>
                <div>
                  <div className="font-medium text-foreground">Luck Index</div>
                  Actual points vs xPoints based on expected TDs & opponent allowances.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LEAGUE TAB: Teams & Rosters */}
          <TabsContent value="league" className="space-y-4">
            <Card className="rounded-2xl border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">League Directory & Rosters</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {leagueMeta ? `${leagueMeta.name} • ${leagueMeta.season} • ${leagueMeta.total_rosters} teams` : 'Sync to load league meta'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadPlayers(false)} disabled={playersStatus==='loading'}>
                    {playersStatus==='loading' ? 'Loading players…' : (playersStatus==='ready' ? 'Refresh players (cache)' : 'Load player names (~5MB)')}
                  </Button>
                  {playersStatus==='ready' && (<Badge variant="secondary">Players cached</Badge>)}
                </div>

                {/* Team cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {leagueRosters.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rosters yet. Click Sync Sleeper above.</p>
                  ) : (
                    leagueRosters.map((r) => {
                      const owner = leagueUsers.find(u => u.user_id === r.owner_id);
                      const teamLabel = rosterDisplayName(r, new Map(leagueUsers.map(u=>[u.user_id,u] as const)));
                      return (
                        <Card key={r.roster_id} className="border rounded-xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <span className="truncate">{teamLabel}</span>
                              <Badge variant="outline">Roster #{r.roster_id}</Badge>
                            </CardTitle>
                            {owner?.display_name && (<p className="text-xs text-muted-foreground">Manager: {owner.display_name}</p>)}
                          </CardHeader>
                          <CardContent>
                            {/* Starters & Bench */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="font-medium mb-1">Starters</div>
                                <ul className="space-y-1">
                                  {(r.starters ?? []).map(pid => (
                                    <li key={pid} className="flex items-center justify-between">
                                      <span className="truncate pr-2">{fmtPlayer(pid, playersDict)}</span>
                                      <span className="text-muted-foreground">{fmtPos(pid, playersDict)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <div className="font-medium mb-1">Bench</div>
                                <ul className="space-y-1">
                                  {computeBench(r).map(pid => (
                                    <li key={pid} className="flex items-center justify-between">
                                      <span className="truncate pr-2">{fmtPlayer(pid, playersDict)}</span>
                                      <span className="text-muted-foreground">{fmtPos(pid, playersDict)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TOOLS */}
          <TabsContent value="tools" className="space-y-4">
            <Card className="rounded-2xl border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tools (roadmap)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-4">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Lineup Optimizer w/ projections & constraints</li>
                  <li>Trade Analyzer w/ rest‑of‑season EV</li>
                  <li>Schedule Strength Explorer & Playoff Planner</li>
                  <li>Alerts: role changes (routes, carries), injuries, weather</li>
                </ul>

                {/* Self-tests */}
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Self‑tests</div>
                    <Button size="sm" variant="outline" onClick={runAllTests}>Run</Button>
                  </div>
                  {testResults ? (
                    <ul className="text-xs grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                      {testResults.map((t, i) => (
                        <li key={i} className={t.ok ? "text-green-600" : "text-red-600"}>
                          {t.ok ? "✔" : "✘"} {t.name}{t.details ? ` — ${t.details}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No tests run yet. Click Run to verify series sum and monotonicity for every matchup.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center">
          Wire Sleeper + projections when ready. Tabs show the structure we can iterate on fast.
        </p>
      </div>
    </div>
  );
}

// ---- Helper functions used only by League tab rendering ----
function computeBench(r: SleeperRoster): string[] {
  const starters = new Set(r.starters ?? []);
  const players = r.players ?? [];
  return players.filter((p) => !starters.has(p));
}

function fmtPlayer(pid: string, dict: PlayersDict | null): string {
  if (!pid) return '—';
  const p = dict ? dict[pid] : undefined;
  if (p) {
    const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ');
    const team = p.team || '';
    return team ? `${name} (${team})` : name || pid;
  }
  if (pid.length <= 3 && pid.toUpperCase() === pid) return `${pid} D/ST`;
  return pid;
}

function fmtPos(pid: string, dict: PlayersDict | null): string {
  const p = dict ? dict[pid] : undefined;
  if (!p) return '';
  // Avoid optional chaining with indexed access to keep older Babel/TS configs happy
  const fp = Array.isArray(p.fantasy_positions) ? p.fantasy_positions : [];
  const first = fp.length > 0 ? fp[0] : '';
  return p.position || first || '';
}
