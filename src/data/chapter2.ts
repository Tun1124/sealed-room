import type { SceneData } from '../engine/types';

/**
 * チャプター2「祖父の書斎 ― 遺言」（歯ごたえ版・約20〜30分）
 *
 * 依存グラフ（循環なし・全て到達可能）:
 *   ラグ → 机の小鍵
 *   写真 → 「1962.04.09 結ばれた日」      引き出し=結ばれた"年"=1962
 *   絵(遺影) → ローマ数字 IV:XVIII         時計=0418
 *   本棚(shelf) → 背の色＋発行年, 手紙B    金庫=古い順の色=青緑赤黄
 *   引き出し(1962) → ライター+便箋
 *   小箱(小鍵) → 虫眼鏡
 *   ライター+便箋 → 炙り跡(小さすぎ)
 *   虫眼鏡+炙り跡 → 拡大図『Z』            トランク=パターンZ
 *   時計(0418) → 真鍮の鍵 → 屋根裏 → トランク(Z) → クランク+手紙A
 *   クランク → 本棚回転 → 隠し部屋 → 金庫(色) → 遺言状(命日 1987.3.25)
 *   手紙A+手紙B → 復元手紙(玄関は命日を 日→月 の順)
 *   玄関(2503 = 日25・月03) → 脱出
 */
export const chapter2: SceneData = {
  id: 'chapter2',
  title: '祖父の書斎',
  startNodeId: 'wall-desk',
  winFlag: 'escaped',
  items: {
    deskKey: { id: 'deskKey', name: '机の小鍵', icon: '🔑', description: '机の小箱に合いそうな小さな鍵。' },
    lighter: { id: 'lighter', name: 'ライター', icon: '🔥', description: 'オイルライター。何かを炙れる。' },
    blankLetter: { id: 'blankLetter', name: '古い便箋', icon: '📃', description: '白紙の便箋。炙ると何か出るかも。' },
    magnifier: { id: 'magnifier', name: '虫眼鏡', icon: '🔎', description: '細かな跡を拡大して読める。' },
    revealedNote: { id: 'revealedNote', name: '炙り出した便箋', icon: '🧾', description: 'ごく小さな模様が浮かぶが、読むには拡大が要る。' },
    cipherNote: { id: 'cipherNote', name: '拡大した図', icon: '🔬', description: '点を結ぶ「Z」の形。' },
    brassKey: { id: 'brassKey', name: '真鍮の鍵', icon: '🗝️', description: '屋根裏のハッチに合いそうだ。' },
    crank: { id: 'crank', name: '鉄のクランク', icon: '🔧', description: '本棚の軸を回せそう。' },
    letterA: { id: 'letterA', name: '手紙の上半分', icon: '📄', description: '「玄関の番号は…」' },
    letterB: { id: 'letterB', name: '手紙の下半分', icon: '📄', description: '「…命日を 日→月 の順に」' },
    fullLetter: { id: 'fullLetter', name: '復元した手紙', icon: '📝', description: '玄関の番号は、命日を 日→月 の順に（4桁）。' },
    will: { id: 'will', name: '遺言状', icon: '📜', description: '命日 ― 1987年3月25日。' },
  },
  puzzles: {
    drawerLock: {
      id: 'drawerLock', type: 'code', solution: '1962', title: '引き出し ― 結ばれた年',
      onSolve: { setFlags: ['drawerOpen'], giveItems: ['lighter', 'blankLetter'],
        message: '引き出しが開いた。ライターと古い便箋を手に入れた。' },
    },
    clockLock: {
      id: 'clockLock', type: 'code', solution: '0418', title: '振り子時計',
      onSolve: { giveItems: ['brassKey'], message: '文字盤の奥から真鍮の鍵が出てきた。' },
    },
    trunkLock: {
      id: 'trunkLock', type: 'pattern', gridSize: 3, solution: '0124678', title: 'トランク ― パターン',
      onSolve: { giveItems: ['crank', 'letterA'], message: 'トランクが開いた。クランクと手紙の上半分。' },
    },
    safeLock: {
      id: 'safeLock', type: 'colors', solution: '1302', title: '壁金庫 ― 色の順',
      options: [
        { color: '#d6453c' }, // 0 赤
        { color: '#3a73d6' }, // 1 青
        { color: '#e8c33a' }, // 2 黄
        { color: '#46b97a' }, // 3 緑
        { color: '#8a5fbf' }, // 4 紫
      ],
      onSolve: { setFlags: ['safeOpen'], giveItems: ['will'],
        message: '金庫が開いた。遺言状 ― 命日は「1987年3月25日」。' },
    },
    exitDoor: {
      id: 'exitDoor', type: 'code', solution: '2503', title: '玄関 ― 暗証番号',
      onSolve: { setFlags: ['escaped'], message: '玄関のロックが解けた。脱出成功！' },
    },
  },
  combinations: [
    { inputs: ['lighter', 'blankLetter'], output: 'revealedNote', message: '便箋を炙ると、ごく小さな模様が浮かんだ。虫眼鏡が要りそうだ。' },
    { inputs: ['magnifier', 'revealedNote'], output: 'cipherNote', message: '拡大すると、点を結ぶ「Z」の図形が現れた。' },
    { inputs: ['letterA', 'letterB'], output: 'fullLetter', message: '手紙が繋がった ―「玄関の番号は、命日を 日→月 の順に」' },
  ],
  nodes: {
    // ===== 書斎を3つの壁に分割（← → で振り向く） =====
    'wall-desk': {
      id: 'wall-desk', image: 'scenes/chapter2/wall-desk.svg',
      hotspots: [
        { id: 'to-deskCloseup', area: { x: 22, y: 50, width: 56, height: 30 },
          action: { type: 'navigate', targetNodeId: 'deskCloseup' } },
        { id: 'painting', area: { x: 38, y: 14, width: 24, height: 18 },
          action: { type: 'examine', text: '祖父の遺影。額の隅に走り書き ―「IV 時 XVIII 分、時は止まった」' } },
        { id: 'rug', area: { x: 26, y: 82, width: 48, height: 14 },
          action: { type: 'pickup', itemId: 'deskKey' } },
        { id: 'turn-left', area: { x: 1, y: 45, width: 12, height: 14 },
          action: { type: 'navigate', targetNodeId: 'wall-door' } },
        { id: 'turn-right', area: { x: 87, y: 45, width: 12, height: 14 },
          action: { type: 'navigate', targetNodeId: 'wall-shelf' } },
      ],
    },
    'wall-shelf': {
      id: 'wall-shelf', image: 'scenes/chapter2/wall-shelf.svg',
      hotspots: [
        { id: 'to-shelf', area: { x: 24, y: 22, width: 52, height: 54 },
          action: { type: 'navigate', targetNodeId: 'shelf' } },
        { id: 'to-attic', area: { x: 35, y: 2, width: 30, height: 11 },
          requires: { hasItems: ['brassKey'] }, useItem: 'brassKey',
          action: { type: 'navigate', targetNodeId: 'attic' } },
        { id: 'turn-left', area: { x: 1, y: 45, width: 12, height: 14 },
          action: { type: 'navigate', targetNodeId: 'wall-desk' } },
        { id: 'turn-right', area: { x: 87, y: 45, width: 12, height: 14 },
          action: { type: 'navigate', targetNodeId: 'wall-door' } },
      ],
    },
    'wall-door': {
      id: 'wall-door', image: 'scenes/chapter2/wall-door.svg',
      hotspots: [
        { id: 'to-exit', area: { x: 32, y: 16, width: 40, height: 62 },
          action: { type: 'navigate', targetNodeId: 'exitDoor' } },
        { id: 'clock', area: { x: 7, y: 19, width: 19, height: 26 },
          action: { type: 'openPuzzle', puzzleId: 'clockLock' } },
        { id: 'turn-left', area: { x: 1, y: 45, width: 12, height: 14 },
          action: { type: 'navigate', targetNodeId: 'wall-shelf' } },
        { id: 'turn-right', area: { x: 87, y: 45, width: 12, height: 14 },
          action: { type: 'navigate', targetNodeId: 'wall-desk' } },
      ],
    },
    deskCloseup: {
      id: 'deskCloseup', image: 'scenes/chapter2/desk-closeup.svg',
      hotspots: [
        { id: 'photo', area: { x: 16, y: 30, width: 20, height: 18 },
          action: { type: 'examine', text: '古い写真の裏に走り書き ―「1962.04.09 ふたりが結ばれた日」' } },
        { id: 'drawer', area: { x: 39, y: 60, width: 13, height: 11 },
          action: { type: 'openPuzzle', puzzleId: 'drawerLock' } },
        { id: 'desk-box', area: { x: 60, y: 38, width: 22, height: 18 },
          requires: { hasItems: ['deskKey'] }, useItem: 'deskKey',
          action: { type: 'pickup', itemId: 'magnifier' } },
        { id: 'desk-back', area: { x: 3, y: 44, width: 12, height: 16 },
          action: { type: 'navigate', targetNodeId: 'wall-desk' } },
      ],
    },
    shelf: {
      id: 'shelf', image: 'scenes/chapter2/shelf.svg',
      hotspots: [
        { id: 'books', area: { x: 24, y: 22, width: 54, height: 40 },
          action: { type: 'examine', text: '蔵書が四冊。背の色と発行年 ― 赤1928 / 青1903 / 黄1951 / 緑1917。挟まれた紙片に「古き順に色を辿れ」' } },
        { id: 'pick-letterB', area: { x: 60, y: 64, width: 16, height: 16 },
          action: { type: 'pickup', itemId: 'letterB' } },
        { id: 'shelf-rotate', area: { x: 6, y: 40, width: 14, height: 40 },
          requires: { hasItems: ['crank'] }, useItem: 'crank',
          action: { type: 'navigate', targetNodeId: 'hiddenRoom' } },
        { id: 'shelf-back', area: { x: 3, y: 44, width: 12, height: 16 },
          action: { type: 'navigate', targetNodeId: 'wall-shelf' } },
      ],
    },
    attic: {
      id: 'attic', image: 'scenes/chapter2/attic.svg',
      hotspots: [
        { id: 'trunk', area: { x: 30, y: 48, width: 40, height: 28 },
          action: { type: 'openPuzzle', puzzleId: 'trunkLock' } },
        { id: 'attic-back', area: { x: 3, y: 44, width: 12, height: 16 },
          action: { type: 'navigate', targetNodeId: 'wall-shelf' } },
      ],
    },
    hiddenRoom: {
      id: 'hiddenRoom', image: 'scenes/chapter2/hidden-room.svg',
      hotspots: [
        { id: 'safe', area: { x: 37, y: 33, width: 26, height: 24 },
          action: { type: 'openPuzzle', puzzleId: 'safeLock' } },
        { id: 'hidden-back', area: { x: 3, y: 44, width: 12, height: 16 },
          action: { type: 'navigate', targetNodeId: 'shelf' } },
      ],
    },
    exitDoor: {
      id: 'exitDoor', image: 'scenes/chapter2/exit-door.svg',
      hotspots: [
        { id: 'door-lock', area: { x: 55, y: 48, width: 14, height: 13 },
          action: { type: 'openPuzzle', puzzleId: 'exitDoor' } },
        { id: 'exit-back', area: { x: 80, y: 42, width: 14, height: 16 },
          action: { type: 'navigate', targetNodeId: 'wall-door' } },
      ],
    },
  },
};
