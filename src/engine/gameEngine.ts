import type {
  SceneData, GameState, GameAction, ActionResult, Hotspot, GameEffect,
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
  if (!inventory.includes(combo.output)) inventory.push(combo.output);
  const effects: GameEffect[] = [{ type: 'itemAdded', itemId: combo.output }];
  if (combo.message) effects.unshift({ type: 'message', text: combo.message });
  return { state: { ...state, inventory }, effects };
}

