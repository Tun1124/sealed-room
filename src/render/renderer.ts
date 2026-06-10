import type { SceneData, GameState, GameAction, GameEffect, Hotspot } from '../engine/types';
import { isHotspotActive } from '../engine/gameEngine';
import { openKeypad } from './keypad';
import { openPatternLock } from './patternLock';
import { openColorLock } from './colorLock';

export interface RendererCallbacks {
  onAction: (action: GameAction) => GameEffect[];
  onExamine?: (hotspotId: string, text: string) => void;
}

export class Renderer {
  private selectedItem: string | null = null;
  private state!: GameState;
  private readonly base = import.meta.env.BASE_URL;

  /** デコード済みシーン画像のキャッシュ（遷移時の暗転防止） */
  private readonly preloaded = new Map<string, HTMLImageElement>();

  constructor(private scene: SceneData, private cb: RendererCallbacks) {
    this.preloadScenes();
  }

  /** 全ノードの背景画像を先読みして、移動時に下地の暗色が見えるのを防ぐ。 */
  private preloadScenes(): void {
    for (const id of Object.keys(this.scene.nodes)) {
      const url = `${this.base}${this.scene.nodes[id].image}`;
      const img = new Image();
      img.src = url;
      void img.decode?.().catch(() => {});
      this.preloaded.set(url, img);
    }
  }

  render(state: GameState): void {
    this.state = state;
    this.renderStage(state);
    this.renderInventory(state);
    this.showItemClue(this.selectedItem);
  }

  /** 持ち物の手がかりを再表示するポップオーバー（間接謎の救済）。 */
  private showItemClue(id: string | null): void {
    const el = document.getElementById('itemclue');
    if (!el) return;
    if (!id) {
      el.classList.remove('show');
      el.innerHTML = '';
      return;
    }
    const item = this.scene.items[id];
    el.innerHTML =
      `<span class="ic-icon">${item.icon || ''}</span>` +
      `<span class="ic-name">${item.name}</span>` +
      `<span class="ic-desc">${item.description}</span>`;
    el.classList.add('show');
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
    el.dataset.id = h.id;
    el.style.left = `${h.area.x}%`;
    el.style.top = `${h.area.y}%`;
    el.style.width = `${h.area.width}%`;
    el.style.height = `${h.area.height}%`;
    el.addEventListener('click', () => this.onHotspot(h));
    return el;
  }

  private onHotspot(h: Hotspot): void {
    // 「アイテムを選択して使う」ゲート: 指定アイテムが選択中でなければ実行不可
    if (h.useItem) {
      if (this.selectedItem !== h.useItem) {
        const item = this.scene.items[h.useItem];
        this.toast(`持ち物の${item ? item.name : 'アイテム'}を選んでから使おう。`);
        return;
      }
      // 使用したら選択を解除（鍵自体は消費せず持ち物に残す）
      this.selectedItem = null;
      this.renderInventory(this.state);
    }

    switch (h.action.type) {
      case 'navigate':
        this.cb.onAction({ type: 'navigate', targetNodeId: h.action.targetNodeId });
        break;
      case 'examine':
        this.toast(h.action.text);
        this.cb.onExamine?.(h.id, h.action.text);
        break;
      case 'pickup':
        this.cb.onAction({ type: 'pickup', itemId: h.action.itemId });
        break;
      case 'openPuzzle':
        this.openPuzzle(h.action.puzzleId);
        break;
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

  private onItemClick(id: string): void {
    if (this.selectedItem && this.selectedItem !== id) {
      const first = this.selectedItem;
      this.selectedItem = null;
      this.showItemClue(null);
      this.cb.onAction({ type: 'combine', itemA: first, itemB: id });
    } else {
      this.selectedItem = this.selectedItem === id ? null : id;
      this.renderInventory(this.state);
      this.showItemClue(this.selectedItem);
    }
  }

  private openPuzzle(puzzleId: string): void {
    const puzzle = this.scene.puzzles[puzzleId];
    if (!puzzle) return;
    const onSubmit = (value: string): boolean => {
      const effects = this.cb.onAction({ type: 'solvePuzzle', puzzleId, answer: value });
      return !effects.some((e) => e.type === 'error');
    };
    if (puzzle.type === 'pattern') {
      openPatternLock({ gridSize: puzzle.gridSize ?? 3, title: puzzle.title, onSubmit });
    } else if (puzzle.type === 'colors') {
      openColorLock({ options: puzzle.options ?? [], length: puzzle.solution.length, title: puzzle.title, onSubmit });
    } else {
      openKeypad({ digits: puzzle.solution.length, title: puzzle.title, onSubmit });
    }
  }

  handleEffects(effects: GameEffect[]): void {
    for (const e of effects) {
      if (e.type === 'message' || e.type === 'error') this.toast(e.text);
      if (e.type === 'won') this.toast('🎉 脱出成功！クリア！', true);
    }
  }

  private toast(text: string, win = false): void {
    const t = document.getElementById('toast')!;
    t.textContent = text;
    t.className = win ? 'show win' : 'show';
    setTimeout(() => t.classList.remove('show'), win ? 3200 : 2200);
  }
}
