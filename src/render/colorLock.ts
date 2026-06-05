import type { PuzzleOption } from '../engine/types';

export interface ColorLockOptions {
  /** 選べる色（表示順）。 */
  options: PuzzleOption[];
  /** 解の長さ（このタップ数で自動判定）。 */
  length: number;
  title?: string;
  /** 押した色のインデックス列（例 "2031"）を受け取り、正解なら true。 */
  onSubmit: (sequence: string) => boolean;
}

/**
 * 色を決められた順に押す錠。指定数を押すと自動判定。
 */
export function openColorLock(opts: ColorLockOptions): void {
  const overlay = document.createElement('div');
  overlay.className = 'kp-overlay';
  const panel = document.createElement('div');
  panel.className = 'kp-panel cl-lock';
  overlay.appendChild(panel);

  const title = document.createElement('div');
  title.className = 'kp-title';
  title.textContent = opts.title ?? 'COLOR';
  panel.appendChild(title);

  // 入力済みの並びを表示するスロット
  const display = document.createElement('div');
  display.className = 'kp-display';
  panel.appendChild(display);
  const slots: HTMLElement[] = [];
  for (let i = 0; i < opts.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'cl-slot';
    display.appendChild(slot);
    slots.push(slot);
  }

  let seq: number[] = [];
  const refresh = () => {
    slots.forEach((slot, i) => {
      const idx = seq[i];
      slot.style.background = idx == null ? '' : opts.options[idx].color;
      slot.classList.toggle('filled', idx != null);
    });
  };

  const close = () => overlay.remove();
  const reset = () => { seq = []; refresh(); };

  const submit = () => {
    if (opts.onSubmit(seq.join(''))) {
      close();
    } else {
      panel.classList.add('shake');
      setTimeout(() => panel.classList.remove('shake'), 450);
      reset();
    }
  };

  const grid = document.createElement('div');
  grid.className = 'cl-swatches';
  panel.appendChild(grid);
  opts.options.forEach((opt, idx) => {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'cl-swatch';
    sw.dataset.index = String(idx);
    sw.style.background = opt.color;
    if (opt.label) sw.textContent = opt.label;
    sw.onclick = () => {
      if (seq.length >= opts.length) return;
      seq.push(idx);
      refresh();
      if (seq.length === opts.length) setTimeout(submit, 220);
    };
    grid.appendChild(sw);
  });

  const row = document.createElement('div');
  row.className = 'pl-row';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'pl-btn';
  back.textContent = '⌫ 1つ戻す';
  back.onclick = () => { seq.pop(); refresh(); };
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'pl-btn';
  resetBtn.textContent = 'やり直す';
  resetBtn.onclick = reset;
  row.append(back, resetBtn);
  panel.appendChild(row);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'kp-close';
  closeBtn.textContent = '閉じる';
  closeBtn.onclick = close;
  panel.appendChild(closeBtn);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.body.appendChild(overlay);
  refresh();
}
