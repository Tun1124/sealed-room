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
