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
