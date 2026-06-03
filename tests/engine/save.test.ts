import { describe, it, expect } from 'vitest';
import { saveGame, loadGame, clearSave, type StorageAdapter } from '../../src/engine/save';
import type { GameState } from '../../src/engine/types';

function memoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
  };
}

const state: GameState = {
  currentNodeId: 'door',
  inventory: ['key', 'fullNote'],
  flags: { drawerOpen: true },
  solvedPuzzles: ['drawerLock'],
};

describe('save/load', () => {
  it('保存した状態を完全に復元できる', () => {
    const storage = memoryStorage();
    saveGame(state, storage);
    expect(loadGame(storage)).toEqual(state);
  });

  it('保存がなければ null', () => {
    expect(loadGame(memoryStorage())).toBeNull();
  });

  it('壊れたJSONなら null（クラッシュしない）', () => {
    const storage = memoryStorage();
    storage.setItem('escape-pv:save', '{not json');
    expect(loadGame(storage)).toBeNull();
  });

  it('clearSave 後はロードできない', () => {
    const storage = memoryStorage();
    saveGame(state, storage);
    clearSave(storage);
    expect(loadGame(storage)).toBeNull();
  });
});
