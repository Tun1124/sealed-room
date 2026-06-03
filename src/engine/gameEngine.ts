import type {
  SceneData, GameState, GameAction, ActionResult, Hotspot, GameEffect, SolveEffect,
} from './types';
import { meetsRequirement } from './requirements';

export function createInitialState(scene: SceneData): GameState {
  return {
    currentNodeId: scene.startNodeId,
    inventory: [],
    flags: {},
    solvedPuzzles: [],
  };
}

export function isHotspotActive(state: GameState, hotspot: Hotspot): boolean {
  return meetsRequirement(state, hotspot.requires);
}

export function applyAction(
  scene: SceneData,
  state: GameState,
  action: GameAction,
): ActionResult {
  switch (action.type) {
    case 'navigate':
      return navigate(scene, state, action.targetNodeId);
    case 'pickup':
      return pickup(scene, state, action.itemId);
    case 'combine':
      return combine(scene, state, action.itemA, action.itemB);
    case 'solvePuzzle':
      return solvePuzzle(scene, state, action.puzzleId, action.answer);
    default:
      return { state, effects: [{ type: 'error', text: `未対応のアクション: ${(action as GameAction).type}` }] };
  }
}

function navigate(scene: SceneData, state: GameState, targetNodeId: string): ActionResult {
  if (!scene.nodes[targetNodeId]) {
    return { state, effects: [{ type: 'error', text: `未知のノード: ${targetNodeId}` }] };
  }
  return { state: { ...state, currentNodeId: targetNodeId }, effects: [] };
}

function pickup(scene: SceneData, state: GameState, itemId: string): ActionResult {
  if (!scene.items[itemId]) {
    return { state, effects: [{ type: 'error', text: `未知のアイテム: ${itemId}` }] };
  }
  if (state.inventory.includes(itemId)) {
    return { state, effects: [] };
  }
  const newState = { ...state, inventory: [...state.inventory, itemId] };
  return { state: newState, effects: [{ type: 'itemAdded', itemId }] };
}

function applySolveEffect(state: GameState, effect: SolveEffect): GameState {
  const flags = { ...state.flags };
  (effect.setFlags ?? []).forEach((f) => { flags[f] = true; });
  const inventory = [...state.inventory];
  (effect.giveItems ?? []).forEach((id) => { if (!inventory.includes(id)) inventory.push(id); });
  return { ...state, flags, inventory };
}

function solvePuzzle(
  scene: SceneData, state: GameState, puzzleId: string, answer: string,
): ActionResult {
  const puzzle = scene.puzzles[puzzleId];
  if (!puzzle) {
    return { state, effects: [{ type: 'error', text: `未知のパズル: ${puzzleId}` }] };
  }
  if (answer.trim() !== puzzle.solution) {
    return { state, effects: [{ type: 'error', text: '違う…もう一度。' }] };
  }
  let newState = applySolveEffect(state, puzzle.onSolve);
  if (!newState.solvedPuzzles.includes(puzzleId)) {
    newState = { ...newState, solvedPuzzles: [...newState.solvedPuzzles, puzzleId] };
  }
  const effects: GameEffect[] = [];
  if (puzzle.onSolve.message) effects.push({ type: 'message', text: puzzle.onSolve.message });
  (puzzle.onSolve.giveItems ?? []).forEach((id) => {
    if (!state.inventory.includes(id)) effects.push({ type: 'itemAdded', itemId: id });
  });

  const wasWon = state.flags[scene.winFlag] === true;
  const isWon = newState.flags[scene.winFlag] === true;
  if (!wasWon && isWon) effects.push({ type: 'won' });

  return { state: newState, effects };
}

function combine(scene: SceneData, state: GameState, itemA: string, itemB: string): ActionResult {
  const combo = scene.combinations.find(
    (c) =>
      (c.inputs[0] === itemA && c.inputs[1] === itemB) ||
      (c.inputs[0] === itemB && c.inputs[1] === itemA),
  );
  if (!combo) {
    return { state, effects: [{ type: 'error', text: 'うまくいきそうにない。' }] };
  }
  if (!state.inventory.includes(itemA) || !state.inventory.includes(itemB)) {
    return { state, effects: [{ type: 'error', text: 'アイテムが足りない。' }] };
  }
  const inventory = state.inventory.filter((id) => id !== itemA && id !== itemB);
  const effects: GameEffect[] = [];
  if (combo.message) effects.push({ type: 'message', text: combo.message });
  if (!inventory.includes(combo.output)) {
    inventory.push(combo.output);
    effects.push({ type: 'itemAdded', itemId: combo.output });
  }
  return { state: { ...state, inventory }, effects };
}

