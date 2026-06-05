import type { SceneData } from '../engine/types';

/**
 * チャプター2「祖父の書斎 ― 遺言」
 * 依存グラフ（循環なし・全て到達可能）:
 *   写真(0409) → 引き出し → ライター+便箋, diary解放
 *   diary → 振り子時計(0418) → 真鍮の鍵
 *   ライター+便箋 → 炙り出し(7294)
 *   真鍮の鍵 → 屋根裏 → トランク(7294) → クランク+手紙A
 *   クランク → 本棚回転 → 隠し部屋 → 手紙B
 *   手紙A+手紙B → 復元手紙(1962)
 *   隠し部屋の金庫(1962) → 遺言状(玄関番号 3725)
 *   玄関扉(3725) → 脱出(escaped)
 */
export const chapter2: SceneData = {
  id: 'chapter2',
  title: '祖父の書斎',
  startNodeId: 'study',
  winFlag: 'escaped',
  items: {
    lighter: { id: 'lighter', name: 'ライター', icon: '🔥', description: '古いオイルライター。何かを炙れそうだ。' },
    blankLetter: { id: 'blankLetter', name: '古い便箋', icon: '📃', description: '一見、何も書かれていない。' },
    revealedLetter: { id: 'revealedLetter', name: '炙り出した便箋', icon: '🧾', description: '焦げ跡で「Z」の図形が浮かんだ。' },
    brassKey: { id: 'brassKey', name: '真鍮の鍵', icon: '🗝️', description: '屋根裏のハッチに合いそうだ。' },
    crank: { id: 'crank', name: '鉄のクランク', icon: '🔧', description: '何かの軸を回す道具。本棚に使えそうだ。' },
    letterA: { id: 'letterA', name: '手紙の上半分', icon: '📄', description: '「結ばれた…」' },
    letterB: { id: 'letterB', name: '手紙の下半分', icon: '📄', description: '「…年に立ち返れ」' },
    fullLetter: { id: 'fullLetter', name: '復元した手紙', icon: '📝', description: '金庫の色は 青→赤→黄→緑 の順。' },
    will: { id: 'will', name: '遺言状', icon: '📜', description: '玄関の番号: 3725' },
  },
  puzzles: {
    drawerLock: {
      id: 'drawerLock', type: 'code', solution: '0409',
      onSolve: { setFlags: ['drawerOpen'], giveItems: ['lighter', 'blankLetter'],
        message: '引き出しが開いた。ライターと古い便箋を手に入れた。' },
    },
    clockLock: {
      id: 'clockLock', type: 'code', solution: '0418',
      onSolve: { giveItems: ['brassKey'], message: '時計の文字盤が外れ、真鍮の鍵が出てきた。' },
    },
    // パターン錠（Android解除風）。Z の形＝0-1-2-4-6-7-8
    trunkLock: {
      id: 'trunkLock', type: 'pattern', gridSize: 3, solution: '0124678', title: 'TRUNK — パターン',
      onSolve: { giveItems: ['crank', 'letterA'], message: 'トランクが開いた。クランクと手紙の上半分を手に入れた。' },
    },
    // カラー順序錠。青→赤→黄→緑 ＝ options[1,0,2,3]
    safeLock: {
      id: 'safeLock', type: 'colors', solution: '1023', title: 'SAFE — 色の順',
      options: [
        { color: '#d6453c' }, // 0 赤
        { color: '#3a73d6' }, // 1 青
        { color: '#e8c33a' }, // 2 黄
        { color: '#46b97a' }, // 3 緑
        { color: '#8a5fbf' }, // 4 紫
      ],
      onSolve: { setFlags: ['safeOpen'], giveItems: ['will'],
        message: '金庫が開いた。遺言状が出てきた ― 玄関の番号は「3725」。' },
    },
    exitDoor: {
      id: 'exitDoor', type: 'code', solution: '3725',
      onSolve: { setFlags: ['escaped'], message: '玄関のロックが解けた。脱出成功！' },
    },
  },
  combinations: [
    { inputs: ['lighter', 'blankLetter'], output: 'revealedLetter', message: '便箋を炙ると焦げ跡が浮かんだ ― 点を「Z」の形になぞれ！' },
    { inputs: ['letterA', 'letterB'], output: 'fullLetter', message: '手紙がつながった ― 金庫の色は「青→赤→黄→緑」の順。' },
  ],
  nodes: {
    study: {
      id: 'study', image: 'scenes/chapter2/study.svg',
      hotspots: [
        // 振り子時計（暗証4桁）
        { id: 'clock', area: { x: 43, y: 13, width: 14, height: 14 },
          action: { type: 'openPuzzle', puzzleId: 'clockLock' } },
        // 机に寄る
        { id: 'to-desk', area: { x: 34, y: 56, width: 32, height: 22 },
          action: { type: 'navigate', targetNodeId: 'deskCloseup' } },
        // 本棚 → クランクを選んで回すと隠し部屋へ
        { id: 'to-hidden', area: { x: 4, y: 30, width: 22, height: 46 },
          requires: { hasItems: ['crank'] }, useItem: 'crank',
          action: { type: 'navigate', targetNodeId: 'hiddenRoom' } },
        // 屋根裏ハッチ → 真鍮の鍵を選んで開ける
        { id: 'to-attic', area: { x: 38, y: 1, width: 24, height: 9 },
          requires: { hasItems: ['brassKey'] }, useItem: 'brassKey',
          action: { type: 'navigate', targetNodeId: 'attic' } },
        // 玄関扉
        { id: 'to-exit', area: { x: 74, y: 28, width: 22, height: 50 },
          action: { type: 'navigate', targetNodeId: 'exitDoor' } },
      ],
    },
    deskCloseup: {
      id: 'deskCloseup', image: 'scenes/chapter2/desk-closeup.svg',
      hotspots: [
        { id: 'photo', area: { x: 16, y: 30, width: 20, height: 18 },
          action: { type: 'examine', text: '写真立ての裏に走り書き ―「1962.04.09 ふたりの始まり」' } },
        { id: 'drawer', area: { x: 39, y: 60, width: 13, height: 11 },
          action: { type: 'openPuzzle', puzzleId: 'drawerLock' } },
        { id: 'diary', area: { x: 62, y: 40, width: 22, height: 16 },
          requires: { flags: ['drawerOpen'] },
          action: { type: 'examine', text: '日記：「針は終焉を指す ― 4時18分」「過去はすべて屋根裏に」「本棚は腕力では動かぬ。軸を回せ」' } },
        { id: 'desk-back', area: { x: 3, y: 44, width: 12, height: 16 },
          action: { type: 'navigate', targetNodeId: 'study' } },
      ],
    },
    attic: {
      id: 'attic', image: 'scenes/chapter2/attic.svg',
      hotspots: [
        { id: 'trunk', area: { x: 30, y: 48, width: 40, height: 28 },
          action: { type: 'openPuzzle', puzzleId: 'trunkLock' } },
        { id: 'attic-back', area: { x: 3, y: 44, width: 12, height: 16 },
          action: { type: 'navigate', targetNodeId: 'study' } },
      ],
    },
    hiddenRoom: {
      id: 'hiddenRoom', image: 'scenes/chapter2/hidden-room.svg',
      hotspots: [
        { id: 'safe', area: { x: 37, y: 33, width: 26, height: 24 },
          action: { type: 'openPuzzle', puzzleId: 'safeLock' } },
        { id: 'pick-letterB', area: { x: 66, y: 50, width: 16, height: 16 },
          action: { type: 'pickup', itemId: 'letterB' } },
        { id: 'hidden-back', area: { x: 3, y: 44, width: 12, height: 16 },
          action: { type: 'navigate', targetNodeId: 'study' } },
      ],
    },
    exitDoor: {
      id: 'exitDoor', image: 'scenes/chapter2/exit-door.svg',
      hotspots: [
        { id: 'door-lock', area: { x: 55, y: 48, width: 14, height: 13 },
          action: { type: 'openPuzzle', puzzleId: 'exitDoor' } },
        { id: 'exit-back', area: { x: 80, y: 42, width: 14, height: 16 },
          action: { type: 'navigate', targetNodeId: 'study' } },
      ],
    },
  },
};
