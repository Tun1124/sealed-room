import type { GameState, Requirement } from './types';

export function meetsRequirement(state: GameState, req?: Requirement): boolean {
  if (!req) return true;
  if (req.hasItems) {
    for (const item of req.hasItems) {
      if (!state.inventory.includes(item)) return false;
    }
  }
  if (req.flags) {
    for (const flag of req.flags) {
      if (!state.flags[flag]) return false;
    }
  }
  return true;
}
