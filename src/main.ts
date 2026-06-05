import { getChapter } from './data/chapters';
import { createInitialState, applyAction } from './engine/gameEngine';
import { loadChapter, saveChapter } from './engine/save';
import { Renderer } from './render/renderer';
import { Tutorial } from './render/tutorial';
import { Menu, setScreen } from './screens/menu';
import type { GameState, GameAction, GameEffect } from './engine/types';

const storage = window.localStorage;

const menu = new Menu(storage, { onPlay: startChapter });

/** 1チャプターを起動する。セーブがあれば続きから、なければ最初から。 */
function startChapter(chapterId: string): void {
  const chapter = getChapter(chapterId);
  if (!chapter?.scene) return;
  const scene = chapter.scene;

  const saved = loadChapter(chapterId, storage);
  let state: GameState =
    saved && scene.nodes[saved.currentNodeId] ? saved : createInitialState(scene);

  const tutorial = chapter.kind === 'tutorial' ? new Tutorial() : null;

  const renderer = new Renderer(scene, {
    onAction: (action: GameAction): GameEffect[] => {
      const result = applyAction(scene, state, action);
      state = result.state;
      saveChapter(chapterId, state, storage);
      renderer.handleEffects(result.effects);
      renderer.render(state);
      tutorial?.notify({ kind: 'action', state });
      return result.effects;
    },
    onExamine: () => {
      tutorial?.notify({ kind: 'examine', state });
    },
  });

  renderer.render(state);
  tutorial?.refresh(state);
  setScreen('game');
}

/** ゲーム中のホームボタン → チャプター選択へ戻る。 */
document.getElementById('game-home')?.addEventListener('click', () => {
  // 進行中のコーチ吹き出しを隠す
  document.getElementById('coach')?.classList.remove('show');
  menu.refresh();
  setScreen('chapters');
});

menu.mount();
