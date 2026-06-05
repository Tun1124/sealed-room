import type { StorageAdapter } from '../engine/save';

/**
 * チャプターごとのプレイ時間（アクティブな時間のみ）を計測する。
 * タブが非表示のときや、ゲーム画面以外のときは加算しない＝放置で水増しされない。
 * 計測値は localStorage に蓄積し、リロード/中断しても引き継ぐ。
 */
export class PlayTimer {
  private readonly key: string;
  private ms: number;
  private last = 0;
  private handle: ReturnType<typeof setInterval> | null = null;

  constructor(chapterId: string, private storage: StorageAdapter) {
    this.key = `escape-pv:time:${chapterId}`;
    this.ms = Number(this.storage.getItem(this.key)) || 0;
  }

  /** 計測開始（ゲーム画面に入ったとき）。 */
  start(): void {
    this.last = Date.now();
    if (this.handle == null) this.handle = setInterval(() => this.tick(), 1000);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** 計測停止＆確定保存（クリア時やゲームを離れたとき）。 */
  stop(): void {
    this.flush();
    if (this.handle != null) {
      clearInterval(this.handle);
      this.handle = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /** 最初からやり直すときに 0 に戻す。 */
  reset(): void {
    this.ms = 0;
    this.last = Date.now();
    this.storage.setItem(this.key, '0');
  }

  get elapsedMs(): number {
    return this.ms;
  }

  private tick(): void {
    if (document.hidden) return;
    this.flush();
  }

  private flush(): void {
    const now = Date.now();
    this.ms += now - this.last;
    this.last = now;
    this.storage.setItem(this.key, String(this.ms));
  }

  private onVisibility = (): void => {
    if (document.hidden) this.flush();
    else this.last = Date.now();
  };
}

/** ミリ秒を mm:ss（1時間以上は h:mm:ss）にする。 */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
