import type {
  SceneData, GameState, GameAction, ActionResult, Hotspot,
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

