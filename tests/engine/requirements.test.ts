import { describe, it, expect } from 'vitest';
import { meetsRequirement } from '../../src/engine/requirements';
import type { GameState } from '../../src/engine/types';

const base: GameState = {
  currentNodeId: 'n1',
  inventory: ['key'],
  flags: { drawerOpen: true },
  solvedPuzzles: [],
};

describe('meetsRequirement', () => {
  it('requires undefined → 常に true', () => {
    expect(meetsRequirement(base, undefined)).toBe(true);
  });

  it('必要アイテムを持っていれば true', () => {
    expect(meetsRequirement(base, { hasItems: ['key'] })).toBe(true);
  });

  it('必要アイテムが欠けていれば false', () => {
    expect(meetsRequirement(base, { hasItems: ['key', 'card'] })).toBe(false);
  });

  it('必要フラグが立っていれば true', () => {
    expect(meetsRequirement(base, { flags: ['drawerOpen'] })).toBe(true);
  });

  it('必要フラグが未設定なら false', () => {
    expect(meetsRequirement(base, { flags: ['safeOpen'] })).toBe(false);
  });
});
