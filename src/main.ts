import { chapter1 } from './data/chapter1';
import { createInitialState, applyAction } from './engine/gameEngine';
import { loadGame, saveGame } from './engine/save';
import { Renderer } from './render/renderer';
import type { GameState, GameAction } from './engine/types';

const scene = chapter1;
let state: GameState = loadGame(window.localStorage) ?? createInitialState(scene);

const renderer = new Renderer(scene, {
  onAction: (action: GameAction) => {
    const result = applyAction(scene, state, action);
    state = result.state;
    saveGame(state, window.localStorage);
    renderer.handleEffects(result.effects);
    renderer.render(state);
  },
});

renderer.render(state);
