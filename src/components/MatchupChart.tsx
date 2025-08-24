import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { fmtHourLabel, hourLabelIndices } from '../utils/time';

export interface MatchupSeries {
  home: number[];
  away: number[];
}

interface Props {
  series: MatchupSeries;
}

const dataFromSeries = (series: MatchupSeries) => {
  return series.home.map((h, i) => ({
    i,
    home: h,
    away: series.away[i],
  }));
};

export function MatchupChart({ series }: Props) {
  const data = dataFromSeries(series);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="i"
          ticks={hourLabelIndices}
          tickFormatter={fmtHourLabel}
        />
        <YAxis allowDecimals domain={[0, 'dataMax']} />
        <Tooltip
          labelFormatter={(v) => {
            const hour = 12 + Math.floor(Number(v) / 6);
            const minute = (Number(v) % 6) * 10;
            const h = hour > 12 ? hour - 12 : hour;
            const suffix = hour >= 12 ? 'PM' : 'AM';
            return `${h}:${minute.toString().padStart(2, '0')} ${suffix} ET`;
          }}
        />
        <Line type="monotone" dataKey="home" stroke="#1d4ed8" dot={false} />
        <Line type="monotone" dataKey="away" stroke="#dc2626" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
