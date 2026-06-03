# ノードエンジン (Phase 0 / Phase 1) 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スマホWeb向け1人称ノードベース謎解きゲームの中核エンジン（場面遷移・調べる・アイテム取得・組み合わせ・コード錠パズル・セーブ）を、JSONデータ駆動・DOM非依存の純TypeScriptで実装し、チャプター1（1部屋群・3パズル）を実機ブラウザで遊べる状態にする。

**Architecture:** 「エンジン核（純TS・完全ユニットテスト）」と「描画層（DOM・手動検証）」を分離する。エンジンは `SceneData`（静的コンテンツ）と `GameState`（実行時状態）を受け取り、`GameAction` を適用して新しい `GameState` と `GameEffect[]`（UIフィードバック）を**イミュータブルに**返す純関数群。描画層はエンジン状態を読んでDOMを描き、ユーザー操作を `GameAction` に変換する。チャプターは `SceneData` のデータ追加だけで拡張でき、将来のIAP追加チャプター販売に直結する。

**Tech Stack:** Vite + TypeScript + Vitest。レンダリングはVanilla DOM（背景画像＋パーセンテージ指定のホットスポット）。保存は `localStorage`（`StorageAdapter` 経由で差し替え可能）。静的ホスティング（Cloudflare Pages 等の無料枠）にデプロイ可能な構成。

---

## File Structure

```
謎解きゲーム/
├── package.json
├── tsconfig.json
├── vite.config.ts            # Vite + Vitest 設定
├── index.html                # エントリ HTML（スマホ向け viewport）
├── public/
│   └── scenes/chapter1/       # チャプター1のシーン画像（プレースホルダで開始）
├── src/
│   ├── engine/
│   │   ├── types.ts           # 全データ型・状態型・アクション型・エフェクト型
│   │   ├── requirements.ts    # ホットスポット出現条件の判定
│   │   ├── gameEngine.ts      # 核: createInitialState / applyAction / isHotspotActive
│   │   └── save.ts            # シリアライズ + localStorage アダプタ
│   ├── data/
│   │   └── chapter1.ts        # チャプター1の SceneData（コンテンツ）
│   ├── render/
│   │   └── renderer.ts        # DOM 描画層（背景・ホットスポット・インベントリ・モーダル）
│   └── main.ts                # ブートストラップ: データ読込→エンジン→描画接続
└── tests/
    └── engine/
        ├── requirements.test.ts
        ├── gameEngine.test.ts
        └── save.test.ts
```

**責務の境界:**
- `types.ts` … 単一の真実。全モジュールがここの型を参照する。
- `requirements.ts` … 純関数 `meetsRequirement(state, req)` のみ。
- `gameEngine.ts` … 状態遷移ロジック。DOM・localStorage を一切 import しない。
- `save.ts` … 直列化と保存。`StorageAdapter` インターフェースで `localStorage` を抽象化しテスト可能に。
- `data/chapter1.ts` … コンテンツ。ロジックを持たない純データ。
- `render/renderer.ts` / `main.ts` … 唯一 DOM に触れる層。ユニットテストせず実機で手動検証。

---

## Task 1: プロジェクト雛形（Vite + TS + Vitest）

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`

- [ ] **Step 1: 雛形を生成して依存を入れる**

Run:
```bash
cd "C:/Users/恒川侑紀/.claude/projects/謎解きゲーム"
npm create vite@latest . -- --template vanilla-ts
npm install
npm install -D vitest
git init
```
（`npm create` が「ディレクトリが空でない」と尋ねたら、既存の `docs/` を残す形で続行する。）

- [ ] **Step 2: `vite.config.ts` に Vitest 設定を追加**

`vite.config.ts`:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: `package.json` に test スクリプトを追加**

`package.json` の `"scripts"` に追記:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: スモークテストで配線を確認**

Create `tests/engine/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: PASS（1 passed）

- [ ] **Step 5: コミット**

```bash
echo "node_modules/\ndist/" > .gitignore
git add -A
git commit -m "chore: scaffold Vite + TS + Vitest project"
```

---

## Task 2: 型定義 (`types.ts`)

**Files:**
- Create: `src/engine/types.ts`

- [ ] **Step 1: 全型を定義**

`src/engine/types.ts`:
```typescript
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

export interface PuzzleData {
  id: string;
  type: 'code';
  solution: string;
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
```

- [ ] **Step 2: 型がコンパイルできるか確認**

Run: `npx tsc --noEmit`
Expected: エラーなし（exit 0）

- [ ] **Step 3: コミット**

```bash
git add src/engine/types.ts
git commit -m "feat: define engine data, state, action and effect types"
```

---

## Task 3: 出現条件判定 (`requirements.ts`)

**Files:**
- Create: `src/engine/requirements.ts`
- Test: `tests/engine/requirements.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/engine/requirements.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { meetsRequirement } from '../../src/engine/requirements';
import type { GameState } from '../../src/engine/types';

const base: GameState = {
  currentNodeId: 'n1',
  inventory: ['key'],
  flags: { drawerOpen: true },
  solvedPuzzles: [],
};

describe('meetsRequirement', () => {
  it('requires undefined → 常に true', () => {
    expect(meetsRequirement(base, undefined)).toBe(true);
  });

  it('必要アイテムを持っていれば true', () => {
    expect(meetsRequirement(base, { hasItems: ['key'] })).toBe(true);
  });

  it('必要アイテムが欠けていれば false', () => {
    expect(meetsRequirement(base, { hasItems: ['key', 'card'] })).toBe(false);
  });

  it('必要フラグが立っていれば true', () => {
    expect(meetsRequirement(base, { flags: ['drawerOpen'] })).toBe(true);
  });

  it('必要フラグが未設定なら false', () => {
    expect(meetsRequirement(base, { flags: ['safeOpen'] })).toBe(false);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- requirements`
Expected: FAIL（`meetsRequirement` が見つからない）

- [ ] **Step 3: 最小実装**

`src/engine/requirements.ts`:
```typescript
import type { GameState, Requirement } from './types';

export function meetsRequirement(state: GameState, req?: Requirement): boolean {
  if (!req) return true;
  if (req.hasItems) {
    for (const item of req.hasItems) {
      if (!state.inventory.includes(item)) return false;
    }
  }
  if (req.flags) {
    for (const flag of req.flags) {
      if (!state.flags[flag]) return false;
    }
  }
  return true;
}
```

- [ ] **Step 4: テスト合格を確認**

Run: `npm test -- requirements`
Expected: PASS（5 passed）

- [ ] **Step 5: コミット**

```bash
git add src/engine/requirements.ts tests/engine/requirements.test.ts
git commit -m "feat: add requirement checking for hotspot gating"
```

---

## Task 4: エンジン核 — 初期状態と navigate

**Files:**
- Create: `src/engine/gameEngine.ts`
- Test: `tests/engine/gameEngine.test.ts`

- [ ] **Step 1: 失敗するテストを書く（共有フィクスチャ込み）**

`tests/engine/gameEngine.test.ts`:
```typescript
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
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- gameEngine`
Expected: FAIL（`createInitialState` / `applyAction` が見つからない）

- [ ] **Step 3: 最小実装**

`src/engine/gameEngine.ts`:
```typescript
import type {
  SceneData, GameState, GameAction, ActionResult, GameEffect, Hotspot, SolveEffect,
} from './types';
import { meetsRequirement } from './requirements';

export function createInitialState(scene: SceneData): GameState {
  return {
    currentNodeId: scene.startNodeId,
    inventory: [],
    flags: {},
    solvedPuzzles: [],
  };
}

export function isHotspotActive(state: GameState, hotspot: Hotspot): boolean {
  return meetsRequirement(state, hotspot.requires);
}

export function applyAction(
  scene: SceneData,
  state: GameState,
  action: GameAction,
): ActionResult {
  switch (action.type) {
    case 'navigate':
      return navigate(scene, state, action.targetNodeId);
    default:
      return { state, effects: [{ type: 'error', text: `未対応のアクション: ${action.type}` }] };
  }
}

function navigate(scene: SceneData, state: GameState, targetNodeId: string): ActionResult {
  if (!scene.nodes[targetNodeId]) {
    return { state, effects: [{ type: 'error', text: `未知のノード: ${targetNodeId}` }] };
  }
  return { state: { ...state, currentNodeId: targetNodeId }, effects: [] };
}
```

- [ ] **Step 4: テスト合格を確認**

Run: `npm test -- gameEngine`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/engine/gameEngine.ts tests/engine/gameEngine.test.ts
git commit -m "feat: engine init state and navigate action"
```

---

## Task 5: pickup（アイテム取得）

**Files:**
- Modify: `src/engine/gameEngine.ts`
- Test: `tests/engine/gameEngine.test.ts`（追記）

- [ ] **Step 1: 失敗するテストを追記**

`tests/engine/gameEngine.test.ts` に追記:
```typescript
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
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- gameEngine`
Expected: FAIL（pickup が error を返す）

- [ ] **Step 3: 実装を追加**

`src/engine/gameEngine.ts` の `switch` に `case 'pickup'` を追加し、関数を追記:
```typescript
    case 'pickup':
      return pickup(scene, state, action.itemId);
```
```typescript
function pickup(scene: SceneData, state: GameState, itemId: string): ActionResult {
  if (!scene.items[itemId]) {
    return { state, effects: [{ type: 'error', text: `未知のアイテム: ${itemId}` }] };
  }
  if (state.inventory.includes(itemId)) {
    return { state, effects: [] };
  }
  const newState = { ...state, inventory: [...state.inventory, itemId] };
  return { state: newState, effects: [{ type: 'itemAdded', itemId }] };
}
```

- [ ] **Step 4: テスト合格を確認**

Run: `npm test -- gameEngine`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/engine/gameEngine.ts tests/engine/gameEngine.test.ts
git commit -m "feat: pickup action with idempotent inventory add"
```

---

## Task 6: combine（アイテム組み合わせ）

**Files:**
- Modify: `src/engine/gameEngine.ts`
- Test: `tests/engine/gameEngine.test.ts`（追記）

- [ ] **Step 1: 失敗するテストを追記**

```typescript
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
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- gameEngine`
Expected: FAIL

- [ ] **Step 3: 実装を追加**

`switch` に追加:
```typescript
    case 'combine':
      return combine(scene, state, action.itemA, action.itemB);
```
```typescript
function combine(scene: SceneData, state: GameState, itemA: string, itemB: string): ActionResult {
  const combo = scene.combinations.find(
    (c) =>
      (c.inputs[0] === itemA && c.inputs[1] === itemB) ||
      (c.inputs[0] === itemB && c.inputs[1] === itemA),
  );
  if (!combo) {
    return { state, effects: [{ type: 'error', text: 'うまくいきそうにない。' }] };
  }
  if (!state.inventory.includes(itemA) || !state.inventory.includes(itemB)) {
    return { state, effects: [{ type: 'error', text: 'アイテムが足りない。' }] };
  }
  const inventory = state.inventory.filter((id) => id !== itemA && id !== itemB);
  if (!inventory.includes(combo.output)) inventory.push(combo.output);
  const effects: GameEffect[] = [{ type: 'itemAdded', itemId: combo.output }];
  if (combo.message) effects.unshift({ type: 'message', text: combo.message });
  return { state: { ...state, inventory }, effects };
}
```

- [ ] **Step 4: テスト合格を確認**

Run: `npm test -- gameEngine`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/engine/gameEngine.ts tests/engine/gameEngine.test.ts
git commit -m "feat: combine action consuming inputs and producing output item"
```

---

## Task 7: solvePuzzle（コード錠）＋ 勝利判定

**Files:**
- Modify: `src/engine/gameEngine.ts`
- Test: `tests/engine/gameEngine.test.ts`（追記）

- [ ] **Step 1: 失敗するテストを追記**

```typescript
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
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- gameEngine`
Expected: FAIL

- [ ] **Step 3: 実装を追加**

`switch` に追加:
```typescript
    case 'solvePuzzle':
      return solvePuzzle(scene, state, action.puzzleId, action.answer);
```
```typescript
function applySolveEffect(state: GameState, effect: SolveEffect): GameState {
  const flags = { ...state.flags };
  (effect.setFlags ?? []).forEach((f) => { flags[f] = true; });
  const inventory = [...state.inventory];
  (effect.giveItems ?? []).forEach((id) => { if (!inventory.includes(id)) inventory.push(id); });
  return { ...state, flags, inventory };
}

function solvePuzzle(
  scene: SceneData, state: GameState, puzzleId: string, answer: string,
): ActionResult {
  const puzzle = scene.puzzles[puzzleId];
  if (!puzzle) {
    return { state, effects: [{ type: 'error', text: `未知のパズル: ${puzzleId}` }] };
  }
  if (answer.trim() !== puzzle.solution) {
    return { state, effects: [{ type: 'error', text: '違う…もう一度。' }] };
  }
  let newState = applySolveEffect(state, puzzle.onSolve);
  if (!newState.solvedPuzzles.includes(puzzleId)) {
    newState = { ...newState, solvedPuzzles: [...newState.solvedPuzzles, puzzleId] };
  }
  const effects: GameEffect[] = [];
  if (puzzle.onSolve.message) effects.push({ type: 'message', text: puzzle.onSolve.message });
  (puzzle.onSolve.giveItems ?? []).forEach((id) => effects.push({ type: 'itemAdded', itemId: id }));

  const wasWon = state.flags[scene.winFlag] === true;
  const isWon = newState.flags[scene.winFlag] === true;
  if (!wasWon && isWon) effects.push({ type: 'won' });

  return { state: newState, effects };
}
```

- [ ] **Step 4: テスト合格を確認**

Run: `npm test`
Expected: 全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add src/engine/gameEngine.ts tests/engine/gameEngine.test.ts
git commit -m "feat: solvePuzzle (code lock) with win detection"
```

---

## Task 8: セーブ／ロード (`save.ts`)

**Files:**
- Create: `src/engine/save.ts`
- Test: `tests/engine/save.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/engine/save.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { saveGame, loadGame, clearSave, type StorageAdapter } from '../../src/engine/save';
import type { GameState } from '../../src/engine/types';

function memoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
  };
}

const state: GameState = {
  currentNodeId: 'door',
  inventory: ['key', 'fullNote'],
  flags: { drawerOpen: true },
  solvedPuzzles: ['drawerLock'],
};

describe('save/load', () => {
  it('保存した状態を完全に復元できる', () => {
    const storage = memoryStorage();
    saveGame(state, storage);
    expect(loadGame(storage)).toEqual(state);
  });

  it('保存がなければ null', () => {
    expect(loadGame(memoryStorage())).toBeNull();
  });

  it('壊れたJSONなら null（クラッシュしない）', () => {
    const storage = memoryStorage();
    storage.setItem('escape-pv:save', '{not json');
    expect(loadGame(storage)).toBeNull();
  });

  it('clearSave 後はロードできない', () => {
    const storage = memoryStorage();
    saveGame(state, storage);
    clearSave(storage);
    expect(loadGame(storage)).toBeNull();
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- save`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: 最小実装**

`src/engine/save.ts`:
```typescript
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
```

- [ ] **Step 4: テスト合格を確認**

Run: `npm test -- save`
Expected: PASS（4 passed）

- [ ] **Step 5: コミット**

```bash
git add src/engine/save.ts tests/engine/save.test.ts
git commit -m "feat: save/load with pluggable StorageAdapter"
```

---

## Task 9: チャプター1のコンテンツ (`data/chapter1.ts`)

**Files:**
- Create: `src/data/chapter1.ts`
- Test: `tests/engine/gameEngine.test.ts`（クリア導線の統合テストを追記）

設計（プレイ導線・3パズル）:
1. **机のメモを調べる**（examine）→ 「引き出しの暗証番号は 1234」。**引き出しのコード錠を解く**（パズル1）→ 鍵 `key` 入手 + `drawerOpen`。
2. **棚を鍵で開ける**（`requires.hasItems:['key']` のホットスポット navigate）→ 棚ノードで `noteA` と `noteB` を pickup。
3. **`noteA`＋`noteB` を組み合わせ**（combination）→ `fullNote`（「7391」）。**扉のコード錠を解く**（パズル2＝`exitDoor`, winFlag `escaped`）→ クリア。

- [ ] **Step 1: シーンデータを作成**

`src/data/chapter1.ts`:
```typescript
import type { SceneData } from '../engine/types';

export const chapter1: SceneData = {
  id: 'chapter1',
  title: '停電したオフィス',
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
      id: 'desk', image: 'scenes/chapter1/desk.jpg',
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
      id: 'cabinet', image: 'scenes/chapter1/cabinet.jpg',
      hotspots: [
        // 鍵を持っている時だけ開く棚
        { id: 'open-cabinet', area: { x: 30, y: 30, width: 40, height: 40 },
          requires: { hasItems: ['key'] },
          action: { type: 'navigate', targetNodeId: 'cabinetOpen' } },
        { id: 'cabinet-back', area: { x: 3, y: 40, width: 15, height: 30 },
          action: { type: 'navigate', targetNodeId: 'desk' } },
      ],
    },
    cabinetOpen: {
      id: 'cabinetOpen', image: 'scenes/chapter1/cabinet-open.jpg',
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
      id: 'door', image: 'scenes/chapter1/door.jpg',
      hotspots: [
        { id: 'door-lock', area: { x: 40, y: 45, width: 20, height: 15 },
          action: { type: 'openPuzzle', puzzleId: 'exitDoor' } },
        { id: 'door-back', area: { x: 80, y: 40, width: 15, height: 30 },
          action: { type: 'navigate', targetNodeId: 'desk' } },
      ],
    },
  },
};
```

- [ ] **Step 2: クリア導線の統合テストを追記**

`tests/engine/gameEngine.test.ts` の末尾に追記:
```typescript
import { chapter1 } from '../../src/data/chapter1';

describe('chapter1 クリア導線', () => {
  it('一連の操作で escaped に到達する', () => {
    let s = createInitialState(chapter1);
    s = applyAction(chapter1, s, { type: 'solvePuzzle', puzzleId: 'drawerLock', answer: '1234' }).state;
    expect(s.inventory).toContain('key');
    s = applyAction(chapter1, s, { type: 'pickup', itemId: 'noteA' }).state;
    s = applyAction(chapter1, s, { type: 'pickup', itemId: 'noteB' }).state;
    s = applyAction(chapter1, s, { type: 'combine', itemA: 'noteA', itemB: 'noteB' }).state;
    expect(s.inventory).toContain('fullNote');
    const final = applyAction(chapter1, s, { type: 'solvePuzzle', puzzleId: 'exitDoor', answer: '7391' });
    expect(final.state.flags.escaped).toBe(true);
    expect(final.effects).toContainEqual({ type: 'won' });
  });
});
```

- [ ] **Step 3: テスト実行**

Run: `npm test`
Expected: 全テスト PASS（クリア導線含む）

- [ ] **Step 4: コミット**

```bash
git add src/data/chapter1.ts tests/engine/gameEngine.test.ts
git commit -m "feat: chapter1 scene data with 3-puzzle clear path"
```

---

## Task 10: DOM 描画層 (`render/renderer.ts`)

**Files:**
- Create: `src/render/renderer.ts`
- Modify: `index.html`

DOM に触れる唯一の層。ユニットテストせず Task 11 で実機検証する。背景画像にホットスポットを `%` 配置し、クリックで `GameAction` を発火、エフェクトをトースト/モーダルで表示する。

- [ ] **Step 1: `index.html` を用意**

`index.html`:
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>ESCAPE PV</title>
    <style>
      * { margin: 0; box-sizing: border-box; }
      body { background:#000; color:#eee; font-family:system-ui,sans-serif; overscroll-behavior:none; }
      #stage { position:relative; width:100vw; max-width:100vh; margin:0 auto; aspect-ratio:9/16; background:#111 center/cover no-repeat; }
      .hotspot { position:absolute; cursor:pointer; }
      .hotspot.debug { outline:1px dashed rgba(255,255,0,.5); }
      #inventory { position:fixed; bottom:0; left:0; right:0; display:flex; gap:8px; padding:8px; background:rgba(0,0,0,.6); }
      .inv-item { font-size:24px; padding:6px; border:1px solid #555; border-radius:8px; cursor:pointer; }
      .inv-item.selected { border-color:#fc0; }
      #toast { position:fixed; top:16px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,.85); padding:10px 16px; border-radius:8px; opacity:0; transition:opacity .2s; pointer-events:none; max-width:90vw; text-align:center; }
      #toast.show { opacity:1; }
      #modal { position:fixed; inset:0; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,.7); }
      #modal.show { display:flex; }
      .modal-box { background:#1a1a1a; padding:24px; border-radius:12px; text-align:center; }
      .modal-box input { font-size:24px; letter-spacing:8px; text-align:center; width:160px; padding:8px; }
      .modal-box button { margin:8px; padding:10px 18px; font-size:16px; }
    </style>
  </head>
  <body>
    <div id="stage"></div>
    <div id="inventory"></div>
    <div id="toast"></div>
    <div id="modal"><div class="modal-box" id="modal-box"></div></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: レンダラを実装**

`src/render/renderer.ts`:
```typescript
import type { SceneData, GameState, GameAction, GameEffect, Hotspot } from '../engine/types';
import { isHotspotActive } from '../engine/gameEngine';

export interface RendererCallbacks {
  onAction: (action: GameAction) => void;
}

export class Renderer {
  private selectedItem: string | null = null;
  private readonly base = import.meta.env.BASE_URL;

  constructor(private scene: SceneData, private cb: RendererCallbacks) {}

  render(state: GameState): void {
    this.renderStage(state);
    this.renderInventory(state);
  }

  private renderStage(state: GameState): void {
    const stage = document.getElementById('stage')!;
    const node = this.scene.nodes[state.currentNodeId];
    stage.style.backgroundImage = `url("${this.base}${node.image}")`;
    stage.innerHTML = '';
    for (const h of node.hotspots) {
      if (!isHotspotActive(state, h)) continue;
      stage.appendChild(this.hotspotEl(h));
    }
  }

  private hotspotEl(h: Hotspot): HTMLElement {
    const el = document.createElement('div');
    el.className = 'hotspot';
    el.style.left = `${h.area.x}%`;
    el.style.top = `${h.area.y}%`;
    el.style.width = `${h.area.width}%`;
    el.style.height = `${h.area.height}%`;
    el.addEventListener('click', () => this.onHotspot(h));
    return el;
  }

  private onHotspot(h: Hotspot): void {
    switch (h.action.type) {
      case 'navigate': this.cb.onAction({ type: 'navigate', targetNodeId: h.action.targetNodeId }); break;
      case 'examine': this.toast(h.action.text); break;
      case 'pickup': this.cb.onAction({ type: 'pickup', itemId: h.action.itemId }); break;
      case 'openPuzzle': this.openPuzzle(h.action.puzzleId); break;
    }
  }

  private renderInventory(state: GameState): void {
    const bar = document.getElementById('inventory')!;
    bar.innerHTML = '';
    for (const id of state.inventory) {
      const item = this.scene.items[id];
      const el = document.createElement('div');
      el.className = 'inv-item' + (this.selectedItem === id ? ' selected' : '');
      el.textContent = item.icon || item.name;
      el.title = item.description;
      el.addEventListener('click', () => this.onItemClick(id));
      bar.appendChild(el);
    }
  }

  // アイテムを2つ続けて選ぶと combine を発火
  private onItemClick(id: string): void {
    if (this.selectedItem && this.selectedItem !== id) {
      this.cb.onAction({ type: 'combine', itemA: this.selectedItem, itemB: id });
      this.selectedItem = null;
    } else if (this.selectedItem === id) {
      this.selectedItem = null;
    } else {
      this.selectedItem = id;
    }
  }

  private openPuzzle(puzzleId: string): void {
    const modal = document.getElementById('modal')!;
    const box = document.getElementById('modal-box')!;
    box.innerHTML = `
      <p>暗証番号を入力</p>
      <input id="code-input" inputmode="numeric" autocomplete="off" />
      <div><button id="code-ok">決定</button><button id="code-cancel">閉じる</button></div>`;
    modal.classList.add('show');
    const close = () => modal.classList.remove('show');
    box.querySelector<HTMLButtonElement>('#code-cancel')!.onclick = close;
    box.querySelector<HTMLButtonElement>('#code-ok')!.onclick = () => {
      const answer = box.querySelector<HTMLInputElement>('#code-input')!.value;
      this.cb.onAction({ type: 'solvePuzzle', puzzleId, answer });
      close();
    };
  }

  handleEffects(effects: GameEffect[]): void {
    for (const e of effects) {
      if (e.type === 'message' || e.type === 'error') this.toast(e.text);
      if (e.type === 'won') this.toast('🎉 脱出成功！クリア！');
    }
  }

  private toast(text: string): void {
    const t = document.getElementById('toast')!;
    t.textContent = text;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }
}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add index.html src/render/renderer.ts
git commit -m "feat: DOM renderer for nodes, hotspots, inventory and puzzle modal"
```

---

## Task 11: ブートストラップと実機検証 (`main.ts`)

**Files:**
- Modify: `src/main.ts`（雛形の中身を置き換え）
- Create: `public/scenes/chapter1/`（プレースホルダ画像 4枚）

- [ ] **Step 1: `main.ts` を実装**

`src/main.ts`:
```typescript
import { chapter1 } from './data/chapter1';
import { createInitialState, applyAction } from './engine/gameEngine';
import { loadGame, saveGame } from './engine/save';
import { Renderer } from './render/renderer';
import type { GameState, GameAction } from './engine/types';

const scene = chapter1;
let state: GameState = loadGame(window.localStorage) ?? createInitialState(scene);

const renderer = new Renderer(scene, {
  onAction: (action: GameAction) => {
    const result = applyAction(scene, state, action);
    state = result.state;
    saveGame(state, window.localStorage);
    renderer.handleEffects(result.effects);
    renderer.render(state);
  },
});

renderer.render(state);
```

- [ ] **Step 2: プレースホルダ画像を置く**

`public/scenes/chapter1/` に `desk.jpg` `cabinet.jpg` `cabinet-open.jpg` `door.jpg` を配置（最初は適当な単色/フリー素材でよい。後でAI生成画像に差し替え）。各画像は縦長 9:16 目安。
（デバッグ中はホットスポット位置確認のため `renderer.ts` の `el.className = 'hotspot'` を一時的に `'hotspot debug'` にして枠を可視化してよい。）

- [ ] **Step 3: 開発サーバで動作確認**

Run: `npm run dev`
ブラウザ（PC）で表示し、DevToolsのモバイルエミュレーションで確認:
- 机ノードが表示される
- メモを調べると暗証番号トーストが出る
- 引き出しタップ→モーダルで `1234`→鍵がインベントリに出る
- 棚へ移動→鍵保持時のみ棚が開く→`noteA`/`noteB` を取得
- インベントリで2枚を続けてタップ→`fullNote` に統合
- 扉へ移動→`7391`→「脱出成功」トースト

- [ ] **Step 4: 実機スマホで検証**

Run: `npm run dev -- --host`
表示されたLAN URL（例 `http://192.168.x.x:5173`）をスマホのブラウザで開き、上記導線を指でタップして通しでクリアできること、リロード後も進行が保存されている（`localStorage`）ことを確認。

- [ ] **Step 5: 全テスト＋型チェック＋ビルド**

Run:
```bash
npm test
npx tsc --noEmit
npm run build
```
Expected: テスト全PASS / 型エラーなし / `dist/` 生成成功

- [ ] **Step 6: コミット**

```bash
git add src/main.ts public/scenes
git commit -m "feat: bootstrap engine+renderer with chapter1, save on each action"
```

---

## 検証（このプラン全体の完了条件）

- `npm test` … エンジン核（requirements / navigate / pickup / combine / solvePuzzle / 勝利判定 / save / chapter1クリア導線）が全PASS。
- `npx tsc --noEmit` … 型エラーなし。
- `npm run build` … 静的ビルドが成功し、`dist/` をそのまま静的ホスティングに置ける。
- 実機スマホブラウザでチャプター1を最初から最後まで指タップでクリアでき、リロードで進行が保持される。

## 次フェーズへの布石（このプランの範囲外）

- 画像をAI生成のシネマティックなものへ差し替え（事業計画 §4）。
- ヒントIAP・シェアボタン・クリアタイム計測（事業計画 §5/§6）。
- `PuzzleData.type` を `'code'` 以外（配線・ダイヤル等）へ拡張（`type` を判別共用体に）。
- チャプター追加は `src/data/chapterN.ts` を増やすだけで対応（IAP追加チャプター販売の土台）。
```