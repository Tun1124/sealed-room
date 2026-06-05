import { chapters, getChapter } from './data/chapters';
import type { ChapterMeta } from './data/chapters';
import { createInitialState, applyAction } from './engine/gameEngine';
import { loadChapter, saveChapter, clearChapter, markCleared } from './engine/save';
import { Renderer } from './render/renderer';
import { Tutorial } from './render/tutorial';
import { Menu, setScreen } from './screens/menu';
import { PlayTimer, formatTime } from './screens/timer';
import { renderClearScreen } from './screens/clearScreen';
import type { GameState, GameAction, GameEffect } from './engine/types';

const storage = window.localStorage;
const menu = new Menu(storage, { onPlay: startChapter });

// 現在プレイ中のチャプターの計測タイマー
let timer: PlayTimer | null = null;
let timerHud: ReturnType<typeof setInterval> | null = null;

/** 次に遊べるチャプター（未ロック・シーンあり）を返す。 */
function nextPlayable(currentId: string): ChapterMeta | null {
  const idx = chapters.findIndex((c) => c.id === currentId);
  for (let i = idx + 1; i < chapters.length; i++) {
    if (chapters[i].scene && !chapters[i].locked) return chapters[i];
  }
  return null;
}

function stopTimers(): void {
  timer?.stop();
  if (timerHud != null) {
    clearInterval(timerHud);
    timerHud = null;
  }
}

/** 1チャプターを起動する。セーブがあれば続きから、なければ最初から。 */
function startChapter(chapterId: string): void {
  const chapter = getChapter(chapterId);
  if (!chapter?.scene) return;
  const scene = chapter.scene;

  stopTimers();

  const saved = loadChapter(chapterId, storage);
  const resuming = !!(saved && scene.nodes[saved.currentNodeId] && !saved.flags[scene.winFlag]);
  let state: GameState = resuming ? saved! : createInitialState(scene);
  if (!resuming) clearChapter(chapterId, storage); // クリア済みの再挑戦も最初から

  // 計測タイマー（最初からなら 0 にリセット）
  timer = new PlayTimer(chapterId, storage);
  if (!resuming) timer.reset();
  timer.start();
  startTimerHud();

  const tutorial = chapter.kind === 'tutorial' ? new Tutorial() : null;

  const renderer = new Renderer(scene, {
    onAction: (action: GameAction): GameEffect[] => {
      const result = applyAction(scene, state, action);
      state = result.state;
      saveChapter(chapterId, state, storage);
      renderer.handleEffects(result.effects);
      renderer.render(state);
      tutorial?.notify({ kind: 'action', state });

      if (result.effects.some((e) => e.type === 'won')) {
        stopTimers();
        const elapsedMs = timer?.elapsedMs ?? 0;
        const { best, isNewRecord } = markCleared(chapterId, elapsedMs, storage);
        // 勝利トーストを少し見せてからクリア画面へ
        window.setTimeout(() => showClear(chapter, elapsedMs, best, isNewRecord), 850);
      }
      return result.effects;
    },
    onExamine: () => {
      tutorial?.notify({ kind: 'examine', state });
    },
  });

  renderer.render(state);
  tutorial?.refresh(state);
  updateTimerHud();
  setScreen('game');
}

function showClear(
  chapter: ChapterMeta,
  elapsedMs: number,
  bestMs: number,
  isNewRecord: boolean,
): void {
  const next = nextPlayable(chapter.id);
  renderClearScreen({
    chapterTitle: chapter.title,
    chapterNo: chapter.no,
    elapsedMs,
    bestMs,
    isNewRecord,
    nextLabel: next ? `${next.no} ${next.title}` : null,
    onReplay: () => startChapter(chapter.id),
    onNext: () => next && startChapter(next.id),
    onChapters: () => {
      menu.refresh();
      setScreen('chapters');
    },
  });
}

/* ---- ゲーム中の経過時間 HUD ---- */
function startTimerHud(): void {
  if (timerHud == null) timerHud = setInterval(updateTimerHud, 1000);
}
function updateTimerHud(): void {
  const el = document.getElementById('timer');
  if (el && timer) el.textContent = formatTime(timer.elapsedMs);
}

/** ゲーム中のホームボタン → チャプター選択へ戻る。 */
document.getElementById('game-home')?.addEventListener('click', () => {
  stopTimers();
  document.getElementById('coach')?.classList.remove('show');
  menu.refresh();
  setScreen('chapters');
});

menu.mount();
