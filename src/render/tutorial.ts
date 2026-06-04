import type { GameState } from '../engine/types';

export interface TutorialEvent {
  kind: 'examine' | 'action';
  state: GameState;
}

interface Step {
  text: string;
  /** milestone reached? steps are monotonic so we show the first incomplete one */
  complete: (s: GameState, examined: boolean) => boolean;
}

const steps: Step[] = [
  {
    text: '停電だ…。画面の光っている場所をタップして、手がかりを調べよう。',
    complete: (s, examined) =>
      examined || s.inventory.length > 0 || s.solvedPuzzles.length > 0 || s.currentNodeId !== 'desk',
  },
  {
    text: 'メモに番号があった。引き出しのキーパッドをタップして番号を入力しよう。',
    complete: (s) => s.solvedPuzzles.includes('drawerLock') || s.inventory.includes('key'),
  },
  {
    text: '鍵を手に入れた！右側のロッカーへ移動し、鍵で開けよう。',
    complete: (s) =>
      s.currentNodeId === 'cabinetOpen' ||
      s.inventory.includes('noteA') || s.inventory.includes('noteB') ||
      s.inventory.includes('fullNote') || Boolean(s.flags.escaped),
  },
  {
    text: '紙片が2枚ある。両方とも拾っておこう。',
    complete: (s) =>
      (s.inventory.includes('noteA') && s.inventory.includes('noteB')) ||
      s.inventory.includes('fullNote') || Boolean(s.flags.escaped),
  },
  {
    text: '持ち物の紙片を1枚タップ → もう1枚タップで、つなぎ合わせよう。',
    complete: (s) => s.inventory.includes('fullNote') || Boolean(s.flags.escaped),
  },
  {
    text: '復元したメモの番号を、左の扉のキーパッドに入力して脱出しよう！',
    complete: (s) => Boolean(s.flags.escaped),
  },
];

/** Step-by-step coach. State-driven, so it resumes correctly after reload. */
export class Tutorial {
  private examined = false;
  private skipped = false;
  private readonly el: HTMLElement;
  private readonly textEl: HTMLElement;

  constructor() {
    this.el = document.getElementById('coach')!;
    this.textEl = this.el.querySelector('.coach-text')!;
    const skip = this.el.querySelector<HTMLButtonElement>('.coach-skip')!;
    skip.onclick = () => { this.skipped = true; this.hide(); };
  }

  notify(event: TutorialEvent): void {
    if (event.kind === 'examine') this.examined = true;
    this.refresh(event.state);
  }

  refresh(state: GameState): void {
    if (this.skipped) return;
    const idx = steps.findIndex((st) => !st.complete(state, this.examined));
    if (idx === -1) { this.hide(); return; }
    this.textEl.textContent = steps[idx].text;
    this.el.classList.add('show');
  }

  private hide(): void {
    this.el.classList.remove('show');
  }
}
