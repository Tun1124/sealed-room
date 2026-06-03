import { describe, it, expect } from 'vitest';
import { createInitialState, applyAction } from '../../src/engine/gameEngine';
import type { SceneData } from '../../src/engine/types';

export const scene: SceneData = {
  id: 'ch1',
  title: 'テスト部屋',
  startNodeId: 'room',
  winFlag: 'escaped',
  items: {
    key: { id: 'key', name: '鍵', icon: '', description: '小さな鍵' },
    noteA: { id: 'noteA', name: 'メモ(左)', icon: '', description: '破れたメモの左半分' },
    noteB: { id: 'noteB', name: 'メモ(右)', icon: '', description: '破れたメモの右半分' },
    fullNote: { id: 'fullNote', name: '復元したメモ', icon: '', description: '4桁の数字: 7391' },
  },
  puzzles: {
    drawerLock: {
      id: 'drawerLock', type: 'code', solution: '1234',
      onSolve: { setFlags: ['drawerOpen'], giveItems: ['key'], message: '引き出しが開いた。' },
    },
    exitDoor: {
      id: 'exitDoor', type: 'code', solution: '7391',
      onSolve: { setFlags: ['escaped'], message: '扉が開く。脱出成功！' },
    },
  },
  combinations: [
    { inputs: ['noteA', 'noteB'], output: 'fullNote', message: 'メモがつながった。' },
  ],
  nodes: {
    room: { id: 'room', image: 'room.jpg', hotspots: [] },
    door: { id: 'door', image: 'door.jpg', hotspots: [] },
  },
};

describe('createInitialState', () => {
  it('開始ノード・空インベントリで初期化する', () => {
    const s = createInitialState(scene);
    expect(s.currentNodeId).toBe('room');
    expect(s.inventory).toEqual([]);
    expect(s.flags).toEqual({});
    expect(s.solvedPuzzles).toEqual([]);
  });
});

describe('navigate', () => {
  it('既存ノードへ移動できる', () => {
    const s0 = createInitialState(scene);
    const { state, effects } = applyAction(scene, s0, { type: 'navigate', targetNodeId: 'door' });
    expect(state.currentNodeId).toBe('door');
    expect(effects).toEqual([]);
  });

  it('未知ノードはエラーを返し状態は不変', () => {
    const s0 = createInitialState(scene);
    const { state, effects } = applyAction(scene, s0, { type: 'navigate', targetNodeId: 'xxx' });
    expect(state.currentNodeId).toBe('room');
    expect(effects[0].type).toBe('error');
  });

  it('元の状態を破壊しない（イミュータブル）', () => {
    const s0 = createInitialState(scene);
    applyAction(scene, s0, { type: 'navigate', targetNodeId: 'door' });
    expect(s0.currentNodeId).toBe('room');
  });
});

describe('pickup', () => {
  it('アイテムを取得しインベントリに加える', () => {
    const s0 = createInitialState(scene);
    const { state, effects } = applyAction(scene, s0, { type: 'pickup', itemId: 'key' });
    expect(state.inventory).toContain('key');
    expect(effects).toContainEqual({ type: 'itemAdded', itemId: 'key' });
  });

  it('同じアイテムを二重取得しない（冪等）', () => {
    const s0 = createInitialState(scene);
    const r1 = applyAction(scene, s0, { type: 'pickup', itemId: 'key' });
    const r2 = applyAction(scene, r1.state, { type: 'pickup', itemId: 'key' });
    expect(r2.state.inventory.filter((i) => i === 'key')).toHaveLength(1);
  });

  it('未知アイテムはエラー', () => {
    const s0 = createInitialState(scene);
    const { effects } = applyAction(scene, s0, { type: 'pickup', itemId: 'zzz' });
    expect(effects[0].type).toBe('error');
  });
});

describe('combine', () => {
  function withItems(...ids: string[]) {
    return { ...createInitialState(scene), inventory: ids };
  }

  it('正しい組み合わせで output を生成し入力を消費する', () => {
    const s0 = withItems('noteA', 'noteB');
    const { state, effects } = applyAction(scene, s0, { type: 'combine', itemA: 'noteA', itemB: 'noteB' });
    expect(state.inventory).toContain('fullNote');
    expect(state.inventory).not.toContain('noteA');
    expect(state.inventory).not.toContain('noteB');
    expect(effects).toContainEqual({ type: 'itemAdded', itemId: 'fullNote' });
  });

  it('順序が逆でも成立する', () => {
    const s0 = withItems('noteA', 'noteB');
    const { state } = applyAction(scene, s0, { type: 'combine', itemA: 'noteB', itemB: 'noteA' });
    expect(state.inventory).toContain('fullNote');
  });

  it('片方しか持っていなければエラー', () => {
    const s0 = withItems('noteA');
    const { state, effects } = applyAction(scene, s0, { type: 'combine', itemA: 'noteA', itemB: 'noteB' });
    expect(effects[0].type).toBe('error');
    expect(state.inventory).toEqual(['noteA']);
  });

  it('定義のない組み合わせはエラー', () => {
    const s0 = withItems('key', 'noteA');
    const { effects } = applyAction(scene, s0, { type: 'combine', itemA: 'key', itemB: 'noteA' });
    expect(effects[0].type).toBe('error');
  });
});

describe('solvePuzzle', () => {
  it('正解で setFlags / giveItems / message を反映', () => {
    const s0 = createInitialState(scene);
    const { state, effects } = applyAction(scene, s0, { type: 'solvePuzzle', puzzleId: 'drawerLock', answer: '1234' });
    expect(state.flags.drawerOpen).toBe(true);
    expect(state.inventory).toContain('key');
    expect(state.solvedPuzzles).toContain('drawerLock');
    expect(effects).toContainEqual({ type: 'message', text: '引き出しが開いた。' });
    expect(effects).toContainEqual({ type: 'itemAdded', itemId: 'key' });
  });

  it('前後の空白を無視して照合する', () => {
    const s0 = createInitialState(scene);
    const { state } = applyAction(scene, s0, { type: 'solvePuzzle', puzzleId: 'drawerLock', answer: '  1234 ' });
    expect(state.solvedPuzzles).toContain('drawerLock');
  });

  it('不正解はエラーで状態不変', () => {
    const s0 = createInitialState(scene);
    const { state, effects } = applyAction(scene, s0, { type: 'solvePuzzle', puzzleId: 'drawerLock', answer: '0000' });
    expect(effects[0].type).toBe('error');
    expect(state.flags.drawerOpen).toBeUndefined();
  });

  it('winFlag を立てるパズルは won エフェクトを出す', () => {
    const s0 = createInitialState(scene);
    const { state, effects } = applyAction(scene, s0, { type: 'solvePuzzle', puzzleId: 'exitDoor', answer: '7391' });
    expect(state.flags.escaped).toBe(true);
    expect(effects).toContainEqual({ type: 'won' });
  });

  it('未知パズルはエラー', () => {
    const s0 = createInitialState(scene);
    const { effects } = applyAction(scene, s0, { type: 'solvePuzzle', puzzleId: 'nope', answer: 'x' });
    expect(effects[0].type).toBe('error');
  });
});

describe('エッジケース（レビュー指摘）', () => {
  it('同じパズルを二度解いても solvedPuzzles とアイテムは重複しない', () => {
    const s0 = createInitialState(scene);
    const r1 = applyAction(scene, s0, { type: 'solvePuzzle', puzzleId: 'drawerLock', answer: '1234' });
    const r2 = applyAction(scene, r1.state, { type: 'solvePuzzle', puzzleId: 'drawerLock', answer: '1234' });
    expect(r2.state.solvedPuzzles.filter((p) => p === 'drawerLock')).toHaveLength(1);
    expect(r2.state.inventory.filter((i) => i === 'key')).toHaveLength(1);
  });

  it('既に勝利済みなら won を再発火しない', () => {
    const s0 = { ...createInitialState(scene), flags: { escaped: true } };
    const { effects } = applyAction(scene, s0, { type: 'solvePuzzle', puzzleId: 'exitDoor', answer: '7391' });
    expect(effects).not.toContainEqual({ type: 'won' });
  });

  it('combine の output を既に所持していれば itemAdded を発火しない', () => {
    const s0 = { ...createInitialState(scene), inventory: ['noteA', 'noteB', 'fullNote'] };
    const { state, effects } = applyAction(scene, s0, { type: 'combine', itemA: 'noteA', itemB: 'noteB' });
    expect(effects).not.toContainEqual({ type: 'itemAdded', itemId: 'fullNote' });
    expect(state.inventory.filter((i) => i === 'fullNote')).toHaveLength(1);
  });
});
