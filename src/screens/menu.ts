import type { StorageAdapter } from '../engine/save';
import { getLastChapter, loadChapter, isChapterCleared } from '../engine/save';
import { chapters, getChapter } from '../data/chapters';
import type { ChapterMeta } from '../data/chapters';

export type ScreenName = 'home' | 'chapters' | 'game' | 'clear';

export interface MenuCallbacks {
  /** チャプターを開始（セーブがあれば自動で続きから）。 */
  onPlay: (id: string) => void;
}

/** チャプターがクリア済みか（恒久記録。やり直しても残る）。 */
function isCleared(ch: ChapterMeta, storage: StorageAdapter): boolean {
  return isChapterCleared(ch.id, storage);
}

/** チャプターに途中セーブがあるか。 */
function hasProgress(ch: ChapterMeta, storage: StorageAdapter): boolean {
  return loadChapter(ch.id, storage) !== null;
}

export function setScreen(name: ScreenName): void {
  document.body.dataset.screen = name;
  window.scrollTo(0, 0);
}

export class Menu {
  constructor(
    private storage: StorageAdapter,
    private cb: MenuCallbacks,
  ) {}

  /** 初期表示。セーブの有無で「つづきから」を出し分ける。 */
  mount(): void {
    this.renderHome();
    this.renderChapters();
    setScreen('home');
  }

  /** ゲームから戻ったときに進捗バッジを更新。 */
  refresh(): void {
    this.renderHome();
    this.renderChapters();
  }

  private renderHome(): void {
    const root = document.getElementById('home')!;
    const last = getLastChapter(this.storage);
    const lastCh = last ? getChapter(last) : undefined;
    const canContinue = !!lastCh && hasProgress(lastCh, this.storage);

    root.innerHTML = `
      <div class="hm-grain"></div>
      <div class="hm-beam"></div>
      <div class="hm-vignette"></div>

      <div class="hm-inner">
        <header class="hm-brand">
          <p class="hm-eyebrow">A FIRST-PERSON ESCAPE</p>
          <h1 class="hm-logo" aria-label="密室 SEALED ROOM">
            <span class="hm-kanji">密室</span>
          </h1>
          <p class="hm-romaji">SEALED&nbsp;ROOM</p>
          <p class="hm-tagline">その部屋から、出られるか。</p>
        </header>

        <nav class="hm-menu">
          ${
            canContinue
              ? `<button class="hm-btn hm-btn--primary" data-act="continue">
                   <span class="hm-btn__key">つづきから</span>
                   <span class="hm-btn__sub">${lastCh!.no} ${lastCh!.title}</span>
                 </button>
                 <button class="hm-btn" data-act="chapters">
                   <span class="hm-btn__key">チャプター選択</span>
                 </button>`
              : `<button class="hm-btn hm-btn--primary" data-act="chapters">
                   <span class="hm-btn__key">ゲームをはじめる</span>
                   <span class="hm-btn__sub">CHAPTER 00 — TUTORIAL</span>
                 </button>`
          }
        </nav>

        <footer class="hm-foot">
          <span class="hm-foot__dot"></span> NO DOWNLOAD · PLAY IN BROWSER
        </footer>
      </div>
    `;

    root.querySelector('[data-act="chapters"]')?.addEventListener('click', () =>
      setScreen('chapters'),
    );
    root.querySelector('[data-act="continue"]')?.addEventListener('click', () => {
      if (last) this.cb.onPlay(last);
    });
  }

  private renderChapters(): void {
    const root = document.getElementById('chapters')!;
    const cards = chapters
      .map((ch) => this.cardHtml(ch))
      .join('');

    root.innerHTML = `
      <div class="cs-grain"></div>
      <header class="cs-head">
        <button class="cs-back" data-act="home" aria-label="戻る">‹</button>
        <div class="cs-head__titles">
          <p class="cs-head__eyebrow">SELECT CHAPTER</p>
          <h2 class="cs-head__title">チャプター</h2>
        </div>
      </header>
      <div class="cs-list">${cards}</div>
    `;

    root.querySelector('[data-act="home"]')?.addEventListener('click', () =>
      setScreen('home'),
    );
    root.querySelectorAll<HTMLElement>('[data-play]').forEach((el) => {
      el.addEventListener('click', () => this.cb.onPlay(el.dataset.play!));
    });
  }

  private cardHtml(ch: ChapterMeta): string {
    const playable = !!ch.scene && !ch.locked;
    const cleared = playable && isCleared(ch, this.storage);
    const inProgress = playable && !cleared && hasProgress(ch, this.storage);

    const tag =
      ch.kind === 'tutorial'
        ? `<span class="cs-card__tag cs-card__tag--tut">TUTORIAL</span>`
        : `<span class="cs-card__tag">CHAPTER</span>`;

    let status = '';
    if (ch.locked) status = `<span class="cs-card__status cs-card__status--lock">🔒 LOCKED</span>`;
    else if (cleared) status = `<span class="cs-card__status cs-card__status--clear">✓ CLEAR</span>`;
    else if (inProgress) status = `<span class="cs-card__status cs-card__status--go">つづき ›</span>`;
    else status = `<span class="cs-card__status cs-card__status--go">▶ PLAY</span>`;

    const attr = playable ? `data-play="${ch.id}" role="button" tabindex="0"` : 'aria-disabled="true"';
    const cls =
      'cs-card' +
      (ch.locked ? ' cs-card--locked' : '') +
      (ch.kind === 'tutorial' ? ' cs-card--tut' : '');

    return `
      <article class="${cls}" ${attr}>
        <div class="cs-card__no">${ch.no}</div>
        <div class="cs-card__body">
          <div class="cs-card__topline">${tag}<span class="cs-card__dur">${ch.duration}</span></div>
          <h3 class="cs-card__title">${ch.title}</h3>
          <p class="cs-card__sub">${ch.subtitle}</p>
        </div>
        <div class="cs-card__action">${status}</div>
      </article>
    `;
  }
}
