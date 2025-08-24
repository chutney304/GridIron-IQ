import { describe, expect, it } from 'vitest';
import { generateSeries, maskFuture } from '../utils/series';

describe('series', () => {
  it('deterministic and sums to final', () => {
    const s1 = generateSeries('a', 50.5);
    const s2 = generateSeries('a', 50.5);
    expect(s1).toEqual(s2);
    expect(s1.length).toBe(61);
    expect(s1[0]).toBe(0);
    for (let i = 1; i < s1.length; i++) expect(s1[i] >= s1[i - 1]).toBe(true);
    const final = s1[s1.length - 1];
    expect(final).toBeCloseTo(50.5, 9);
  });

  it('maskFuture masks items', () => {
    const arr = maskFuture([0, 1, 2], 1);
    expect(arr[2]).toBeNull();
  });
});
