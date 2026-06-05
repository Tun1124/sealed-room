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

/* ---- クリア実績＆ベストタイム（やり直しても残る恒久記録） ---- */

const CLEARED_KEY = 'escape-pv:cleared';

function readCleared(storage: StorageAdapter): Record<string, number> {
  try {
    return JSON.parse(storage.getItem(CLEARED_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

/** クリアを記録し、ベストタイムを更新する。新記録だったかを返す。 */
export function markCleared(
  chapterId: string,
  elapsedMs: number,
  storage: StorageAdapter,
): { best: number; isNewRecord: boolean } {
  const map = readCleared(storage);
  const prev = map[chapterId];
  const isNewRecord = prev == null || elapsedMs < prev;
  const best = isNewRecord ? elapsedMs : prev;
  map[chapterId] = best;
  storage.setItem(CLEARED_KEY, JSON.stringify(map));
  return { best, isNewRecord };
}

export function isChapterCleared(chapterId: string, storage: StorageAdapter): boolean {
  return readCleared(storage)[chapterId] != null;
}

export function getBestTime(chapterId: string, storage: StorageAdapter): number | null {
  const v = readCleared(storage)[chapterId];
  return v == null ? null : v;
}
