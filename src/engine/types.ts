// ===== 静的シーン定義（オーサリングするコンテンツ） =====
export interface SceneData {
  id: string;
  title: string;
  startNodeId: string;
  nodes: Record<string, NodeData>;
  items: Record<string, ItemData>;
  puzzles: Record<string, PuzzleData>;
  combinations: CombinationData[];
  /** flags[winFlag] が true になったらチャプタークリア */
  winFlag: string;
}

export interface NodeData {
  id: string;
  image: string;
  hotspots: Hotspot[];
}

export interface Hotspot {
  id: string;
  /** 背景画像に対する割合(0-100)。レスポンシブ対応のため px ではなく % */
  area: Rect;
  action: HotspotAction;
  /** 満たさない間はホットスポットを非表示/無効化 */
  requires?: Requirement;
  /**
   * 設定すると、このアイテムを「持ち物で選択中」でなければアクションを実行できない。
   * （例: 鍵を選んでからロッカーをタップして開ける）。選択はUIの一時状態なので
   * エンジンの状態には持たせず、描画層でのみ判定する。
   */
  useItem?: string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HotspotAction =
  | { type: 'navigate'; targetNodeId: string }
  | { type: 'examine'; text: string }
  | { type: 'pickup'; itemId: string }
  | { type: 'openPuzzle'; puzzleId: string };

export interface Requirement {
  hasItems?: string[];
  flags?: string[];
}

export interface ItemData {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface PuzzleOption {
  /** 表示色（必須）。 */
  color: string;
  /** 任意の見出し（例: 数字や記号）。 */
  label?: string;
}

export interface PuzzleData {
  id: string;
  /**
   * code   = 数字キーパッド（solution は数字列）
   * pattern= 3x3 などの点をなぞるパターン錠（solution は通過点インデックス列, 例 "0124678"）
   * colors = 色を順に押す錠（solution は options へのインデックス列, 例 "2031"）
   */
  type: 'code' | 'pattern' | 'colors';
  solution: string;
  /** colors 用：押せる色の一覧（表示順）。solution はこの並びのインデックス。 */
  options?: PuzzleOption[];
  /** pattern 用：グリッドの一辺（既定 3）。 */
  gridSize?: number;
  /** 入力UIの見出し。 */
  title?: string;
  onSolve: SolveEffect;
}

export interface SolveEffect {
  setFlags?: string[];
  giveItems?: string[];
  message?: string;
}

export interface CombinationData {
  inputs: [string, string];
  output: string;
  message?: string;
}

// ===== 実行時状態 =====
export interface GameState {
  currentNodeId: string;
  inventory: string[];
  flags: Record<string, boolean>;
  solvedPuzzles: string[];
}

// ===== アクション（描画層→エンジン） =====
export type GameAction =
  | { type: 'navigate'; targetNodeId: string }
  | { type: 'pickup'; itemId: string }
  | { type: 'solvePuzzle'; puzzleId: string; answer: string }
  | { type: 'combine'; itemA: string; itemB: string };

// ===== エフェクト（エンジン→描画層への通知） =====
export type GameEffect =
  | { type: 'message'; text: string }
  | { type: 'error'; text: string }
  | { type: 'itemAdded'; itemId: string }
  | { type: 'won' };

export interface ActionResult {
  state: GameState;
  effects: GameEffect[];
}
