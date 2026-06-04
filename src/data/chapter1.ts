import type { SceneData } from '../engine/types';

export const chapter1: SceneData = {
  id: 'chapter1',
  title: '停電したオフィス（チュートリアル）',
  startNodeId: 'desk',
  winFlag: 'escaped',
  items: {
    key: { id: 'key', name: '小さな鍵', icon: '🔑', description: '棚に合いそうだ。' },
    noteA: { id: 'noteA', name: 'メモの左半分', icon: '📄', description: '「73…」' },
    noteB: { id: 'noteB', name: 'メモの右半分', icon: '📄', description: '「…91」' },
    fullNote: { id: 'fullNote', name: '復元したメモ', icon: '📝', description: '扉の番号: 7391' },
  },
  puzzles: {
    drawerLock: {
      id: 'drawerLock', type: 'code', solution: '1234',
      onSolve: { setFlags: ['drawerOpen'], giveItems: ['key'], message: '引き出しが開き、鍵を手に入れた。' },
    },
    exitDoor: {
      id: 'exitDoor', type: 'code', solution: '7391',
      onSolve: { setFlags: ['escaped'], message: '扉のロックが解除された。脱出成功！' },
    },
  },
  combinations: [
    { inputs: ['noteA', 'noteB'], output: 'fullNote', message: '2枚のメモがつながった。' },
  ],
  nodes: {
    desk: {
      id: 'desk', image: 'scenes/chapter1/desk.svg',
      hotspots: [
        { id: 'note-on-desk', area: { x: 40, y: 55, width: 18, height: 12 },
          action: { type: 'examine', text: '走り書き：「引き出しは 1234」' } },
        { id: 'drawer', area: { x: 35, y: 70, width: 30, height: 20 },
          action: { type: 'openPuzzle', puzzleId: 'drawerLock' } },
        { id: 'to-cabinet', area: { x: 80, y: 40, width: 15, height: 30 },
          action: { type: 'navigate', targetNodeId: 'cabinet' } },
        { id: 'to-door', area: { x: 3, y: 40, width: 15, height: 30 },
          action: { type: 'navigate', targetNodeId: 'door' } },
      ],
    },
    cabinet: {
      id: 'cabinet', image: 'scenes/chapter1/cabinet.svg',
      hotspots: [
        { id: 'open-cabinet', area: { x: 30, y: 30, width: 40, height: 40 },
          requires: { hasItems: ['key'] },
          action: { type: 'navigate', targetNodeId: 'cabinetOpen' } },
        { id: 'cabinet-back', area: { x: 3, y: 40, width: 15, height: 30 },
          action: { type: 'navigate', targetNodeId: 'desk' } },
      ],
    },
    cabinetOpen: {
      id: 'cabinetOpen', image: 'scenes/chapter1/cabinet-open.svg',
      hotspots: [
        { id: 'pick-noteA', area: { x: 30, y: 40, width: 15, height: 15 },
          action: { type: 'pickup', itemId: 'noteA' } },
        { id: 'pick-noteB', area: { x: 55, y: 40, width: 15, height: 15 },
          action: { type: 'pickup', itemId: 'noteB' } },
        { id: 'cabinetOpen-back', area: { x: 3, y: 40, width: 15, height: 30 },
          action: { type: 'navigate', targetNodeId: 'desk' } },
      ],
    },
    door: {
      id: 'door', image: 'scenes/chapter1/door.svg',
      hotspots: [
        { id: 'door-lock', area: { x: 40, y: 45, width: 20, height: 15 },
          action: { type: 'openPuzzle', puzzleId: 'exitDoor' } },
        { id: 'door-back', area: { x: 80, y: 40, width: 15, height: 30 },
          action: { type: 'navigate', targetNodeId: 'desk' } },
      ],
    },
  },
};
