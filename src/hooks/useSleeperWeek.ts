import { useEffect, useState } from 'react';
import { SleeperApi } from '../api/sleeper';

export function useSleeperWeek() {
  const [week, setWeek] = useState<number | null>(null);
  useEffect(() => {
    SleeperApi.state()
      .then((s) => {
        const w = s.display_week ?? s.week ?? s.leg;
        setWeek(w);
      })
      .catch(() => setWeek(null));
  }, []);
  return week;
}
