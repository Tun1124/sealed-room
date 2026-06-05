export interface PatternLockOptions {
  /** グリッドの一辺（既定 3 → 9点）。 */
  gridSize?: number;
  title?: string;
  /** 通過点インデックス列（例 "0124678"）を受け取り、正解なら true。 */
  onSubmit: (sequence: string) => boolean;
}

/**
 * Android のパターン解除風の錠。点をタップして順に繋ぎ、✓で判定。
 * タップ式なので touch / click どちらでも確実に動く。
 */
export function openPatternLock(opts: PatternLockOptions): void {
  const n = opts.gridSize ?? 3;
  const SIZE = 264;
  const margin = SIZE * 0.16;
  const span = n > 1 ? (SIZE - margin * 2) / (n - 1) : 0;
  const pos = (i: number) => ({
    x: margin + (i % n) * span,
    y: margin + Math.floor(i / n) * span,
  });
  const centers = Array.from({ length: n * n }, (_, i) => pos(i));

  const overlay = document.createElement('div');
  overlay.className = 'kp-overlay';
  const panel = document.createElement('div');
  panel.className = 'kp-panel pl-panel';
  overlay.appendChild(panel);

  const title = document.createElement('div');
  title.className = 'kp-title';
  title.textContent = opts.title ?? 'PATTERN';
  panel.appendChild(title);

  const pad2 = document.createElement('div');
  pad2.className = 'pl-pad';
  pad2.style.width = `${SIZE}px`;
  pad2.style.height = `${SIZE}px`;
  panel.appendChild(pad2);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'pl-lines');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  const poly = document.createElementNS(svgNS, 'polyline');
  poly.setAttribute('class', 'pl-line');
  svg.appendChild(poly);
  pad2.appendChild(svg);

  let seq: number[] = [];
  const dots: HTMLElement[] = [];

  const redraw = () => {
    poly.setAttribute('points', seq.map((i) => `${centers[i].x},${centers[i].y}`).join(' '));
    dots.forEach((d, i) => d.classList.toggle('on', seq.includes(i)));
  };

  for (let i = 0; i < n * n; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'pl-dot';
    dot.dataset.index = String(i);
    dot.style.left = `${centers[i].x}px`;
    dot.style.top = `${centers[i].y}px`;
    dot.onclick = () => {
      if (seq.includes(i)) return;
      seq.push(i);
      redraw();
    };
    pad2.appendChild(dot);
    dots.push(dot);
  }

  const close = () => overlay.remove();
  const reset = () => { seq = []; redraw(); };

  const submit = () => {
    if (seq.length < 2) return;
    if (opts.onSubmit(seq.join(''))) {
      close();
    } else {
      panel.classList.add('shake');
      setTimeout(() => panel.classList.remove('shake'), 450);
      reset();
    }
  };

  const row = document.createElement('div');
  row.className = 'pl-row';
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'pl-btn';
  resetBtn.textContent = 'やり直す';
  resetBtn.onclick = reset;
  const okBtn = document.createElement('button');
  okBtn.type = 'button';
  okBtn.className = 'pl-btn pl-btn--ok';
  okBtn.textContent = '✓ 決定';
  okBtn.onclick = submit;
  row.append(resetBtn, okBtn);
  panel.appendChild(row);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'kp-close';
  closeBtn.textContent = '閉じる';
  closeBtn.onclick = close;
  panel.appendChild(closeBtn);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.body.appendChild(overlay);
  redraw();
}
