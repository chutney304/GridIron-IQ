// Synthetic series generator with deterministic seeded RNG

function fnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeries(seed: string, total: number): number[] {
  const rand = mulberry32(fnv1a(seed));
  const increments: number[] = new Array(61).fill(0);
  for (let i = 1; i < 61; i++) {
    if (rand() < 0.9) continue;
    increments[i] = rand();
  }
  const sum = increments.reduce((a, b) => a + b, 0) || 1;
  const scale = total / sum;
  const series: number[] = [0];
  for (let i = 1; i < increments.length; i++) {
    const next = series[i - 1] + increments[i] * scale;
    series.push(next);
  }
  const final = Number(total.toFixed(1));
  series[series.length - 1] = final;
  for (let i = series.length - 2; i >= 0; i--) {
    if (series[i] > final) series[i] = final;
  }
  return series.map((v) => Number(v.toFixed(1)));
}

export function maskFuture(series: number[], lastIndex: number): (number | null)[] {
  return series.map((v, i) => (i > lastIndex ? null : v));
}
