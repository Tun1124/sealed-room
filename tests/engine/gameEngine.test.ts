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
