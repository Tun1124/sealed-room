import type { GameState } from './types';

const SAVE_KEY = 'escape-pv:save';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string): GameState {
  const parsed = JSON.parse(json);
  return {
    currentNodeId: parsed.currentNodeId,
    inventory: parsed.inventory ?? [],
    flags: parsed.flags ?? {},
    solvedPuzzles: parsed.solvedPuzzles ?? [],
  };
}

export function saveGame(state: GameState, storage: StorageAdapter): void {
  storage.setItem(SAVE_KEY, serialize(state));
}

export function loadGame(storage: StorageAdapter): GameState | null {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function clearSave(storage: StorageAdapter): void {
  storage.removeItem(SAVE_KEY);
}
