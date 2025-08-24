import { describe, expect, it } from 'vitest';
import { fmtHourLabel, hourLabelIndices } from '../utils/time';

describe('time utils', () => {
  it('hour labels', () => {
    expect(hourLabelIndices.length).toBe(11);
    expect(hourLabelIndices[0]).toBe(0);
    expect(hourLabelIndices[10]).toBe(60);
    expect(fmtHourLabel(0)).toBe('12p');
    expect(fmtHourLabel(60)).toBe('10p');
  });
});
