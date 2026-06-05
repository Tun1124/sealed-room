import type { GameState } from './types';

const SAVE_KEY = 'escape-pv:save';
const LAST_KEY = 'escape-pv:last-chapter';
const chapterKey = (chapterId: string): string => `escape-pv:save:${chapterId}`;

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

/* ---- チャプター単位のセーブ（複数チャプター対応） ---- */

export function saveChapter(
  chapterId: string,
  state: GameState,
  storage: StorageAdapter,
): void {
  storage.setItem(chapterKey(chapterId), serialize(state));
  storage.setItem(LAST_KEY, chapterId);
}

export function loadChapter(
  chapterId: string,
  storage: StorageAdapter,
): GameState | null {
  const raw = storage.getItem(chapterKey(chapterId));
  if (!raw) return null;
  try {
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function clearChapter(chapterId: string, storage: StorageAdapter): void {
  storage.removeItem(chapterKey(chapterId));
}

/** 直近にプレイしたチャプターID（「つづきから」用）。 */
export function getLastChapter(storage: StorageAdapter): string | null {
  return storage.getItem(LAST_KEY);
}
