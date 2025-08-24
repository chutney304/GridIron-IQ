import { describe, expect, it } from 'vitest';
import { mergeProjections } from '../api/providers/merge';
import type { ProjectionProvider } from '../api/providers/interfaces';

describe('provider merge', () => {
  const players = [{ player_id: '1' }, { player_id: '2' }];
  const provider: ProjectionProvider = {
    source: 'Mock',
    ttlMs: 0,
    isEnabled: true,
    fetchWeekly: async () => ({ '1': 10, '2': 20 }),
  };
  it('enriches when enabled', async () => {
    const res = await mergeProjections(players, provider, 1);
    expect(res[0].projection).toBe(10);
    expect(res[0].source).toBe('Mock');
  });
  it('passes through when disabled', async () => {
    const res = await mergeProjections(players, { ...provider, isEnabled: false }, 1);
    expect(res[0].projection).toBeUndefined();
  });
  it('graceful on failure', async () => {
    const res = await mergeProjections(players, { ...provider, fetchWeekly: async () => { throw new Error(); } }, 1);
    expect(res[0].projection).toBeUndefined();
  });
});
