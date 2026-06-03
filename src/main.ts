import { chapter1 } from './data/chapter1';
import { createInitialState, applyAction } from './engine/gameEngine';
import { loadGame, saveGame } from './engine/save';
import { Renderer } from './render/renderer';
import type { GameState, GameAction, GameEffect } from './engine/types';

const scene = chapter1;
const loaded = loadGame(window.localStorage);
let state: GameState =
  loaded && scene.nodes[loaded.currentNodeId] ? loaded : createInitialState(scene);

const renderer = new Renderer(scene, {
  onAction: (action: GameAction): GameEffect[] => {
    const result = applyAction(scene, state, action);
    state = result.state;
    saveGame(state, window.localStorage);
    renderer.handleEffects(result.effects);
    renderer.render(state);
    return result.effects;
  },
});

renderer.render(state);
