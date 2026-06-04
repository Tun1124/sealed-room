export interface KeypadOptions {
  /** number of digit slots (usually the solution length) */
  digits: number;
  /** title shown above the display */
  title?: string;
  /** called with the entered code; return true if correct (panel closes) */
  onSubmit: (value: string) => boolean;
}

/**
 * Illustrated, tappable numeric keypad. Replaces system text input:
 * the player presses digits directly. Reusable across puzzles/chapters.
 */
export function openKeypad(opts: KeypadOptions): void {
  const overlay = document.createElement('div');
  overlay.className = 'kp-overlay';

  const panel = document.createElement('div');
  panel.className = 'kp-panel';
  overlay.appendChild(panel);

  const title = document.createElement('div');
  title.className = 'kp-title';
  title.textContent = opts.title ?? 'Enter Code';
  panel.appendChild(title);

  const display = document.createElement('div');
  display.className = 'kp-display';
  panel.appendChild(display);

  const slots: HTMLElement[] = [];
  for (let i = 0; i < opts.digits; i++) {
    const slot = document.createElement('div');
    slot.className = 'kp-slot';
    display.appendChild(slot);
    slots.push(slot);
  }

  let value = '';
  const refresh = () => {
    slots.forEach((slot, i) => {
      const ch = value[i];
      slot.textContent = ch ?? '';
      slot.classList.toggle('filled', ch !== undefined);
    });
  };

  const close = () => overlay.remove();

  const submit = () => {
    if (value.length === 0) return;
    if (opts.onSubmit(value)) {
      close();
    } else {
      panel.classList.add('shake');
      setTimeout(() => panel.classList.remove('shake'), 450);
      value = '';
      refresh();
    }
  };

  const press = (digit: string) => {
    if (value.length >= opts.digits) return;
    value += digit;
    refresh();
    if (value.length === opts.digits) setTimeout(submit, 200);
  };

  const grid = document.createElement('div');
  grid.className = 'kp-grid';
  panel.appendChild(grid);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
  for (const key of keys) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kp-key';
    if (key === 'del') {
      btn.classList.add('del');
      btn.textContent = '⌫';
      btn.onclick = () => { value = value.slice(0, -1); refresh(); };
    } else if (key === 'ok') {
      btn.classList.add('ok');
      btn.textContent = '✓';
      btn.onclick = submit;
    } else {
      btn.textContent = key;
      btn.onclick = () => press(key);
    }
    grid.appendChild(btn);
  }

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
