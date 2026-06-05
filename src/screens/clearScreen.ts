import { setScreen } from './menu';
import { formatTime } from './timer';

/** 公開URL（シェア文に使う）。 */
const SITE_URL = 'https://tun1124.github.io/sealed-room/';

export interface ClearScreenOptions {
  chapterTitle: string;
  chapterNo: string;
  elapsedMs: number;
  /** これまでのベストタイム(ms)。 */
  bestMs: number;
  /** 今回が自己ベスト更新か。 */
  isNewRecord: boolean;
  /** 次に遊べるチャプターのタイトル（無ければ null）。 */
  nextLabel: string | null;
  onReplay: () => void;
  onNext: () => void;
  onChapters: () => void;
}

export function renderClearScreen(opts: ClearScreenOptions): void {
  const root = document.getElementById('clear')!;
  const time = formatTime(opts.elapsedMs);
  const recordTag = opts.isNewRecord
    ? `<span class="cl-record">★ 自己ベスト更新！</span>`
    : `<span class="cl-best">BEST ${formatTime(opts.bestMs)}</span>`;

  root.innerHTML = `
    <div class="cl-grain"></div>
    <div class="cl-glow"></div>
    <div class="cl-inner">
      <p class="cl-eyebrow">CHAPTER ${opts.chapterNo} CLEARED</p>
      <h1 class="cl-title">脱出成功</h1>
      <p class="cl-sub">${opts.chapterTitle}</p>

      <div class="cl-time">
        <span class="cl-time__label">CLEAR TIME</span>
        <span class="cl-time__value">${time}</span>
        ${recordTag}
      </div>

      <div class="cl-actions">
        <button class="cl-btn cl-btn--primary" data-act="share">
          結果をシェア
        </button>
        ${
          opts.nextLabel
            ? `<button class="cl-btn cl-btn--next" data-act="next">次のチャプターへ ―<br><small>${opts.nextLabel}</small></button>`
            : ''
        }
        <div class="cl-row">
          <button class="cl-btn cl-btn--ghost" data-act="replay">もう一度</button>
          <button class="cl-btn cl-btn--ghost" data-act="chapters">チャプター選択</button>
        </div>
      </div>

      <p class="cl-share-note" hidden>結果をコピーしました。</p>
    </div>
  `;

  const note = root.querySelector<HTMLElement>('.cl-share-note')!;

  root.querySelector('[data-act="share"]')?.addEventListener('click', () =>
    shareResult(opts, time, note),
  );
  root.querySelector('[data-act="next"]')?.addEventListener('click', opts.onNext);
  root.querySelector('[data-act="replay"]')?.addEventListener('click', opts.onReplay);
  root.querySelector('[data-act="chapters"]')?.addEventListener('click', opts.onChapters);

  setScreen('clear');
}

function shareResult(opts: ClearScreenOptions, time: string, note: HTMLElement): void {
  const text = `「密室 / SEALED ROOM」CHAPTER ${opts.chapterNo}「${opts.chapterTitle}」を ⏱${time} で脱出！ あなたは何分で出られる？ #密室 #SealedRoom`;

  // モバイルはネイティブ共有シート
  if (navigator.share) {
    navigator.share({ title: '密室 / SEALED ROOM', text, url: SITE_URL }).catch(() => {});
    return;
  }
  // PC等は X(Twitter) の投稿画面を開く。失敗時はクリップボードへ。
  const intent =
    'https://twitter.com/intent/tweet?text=' +
    encodeURIComponent(text) +
    '&url=' +
    encodeURIComponent(SITE_URL);
  const win = window.open(intent, '_blank', 'noopener');
  if (!win) {
    navigator.clipboard?.writeText(`${text} ${SITE_URL}`).then(() => {
      note.hidden = false;
      setTimeout(() => (note.hidden = true), 2400);
    });
  }
}
