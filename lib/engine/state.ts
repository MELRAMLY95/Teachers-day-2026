export type WorldState = {
  discovered: string[];
  experimentDone: boolean;
  finaleLine: number;
  finalUnlocked: boolean;
};

export function createWorldState(): WorldState {
  return { discovered: [], experimentDone: false, finaleLine: 0, finalUnlocked: false };
}

export function discover(state: WorldState, id: string, needed: number): WorldState {
  const discovered = state.discovered.includes(id) ? state.discovered : [...state.discovered, id];
  return {
    ...state,
    discovered,
    finalUnlocked: state.experimentDone && discovered.length >= needed,
  };
}

export function markExperiment(state: WorldState, done: boolean, needed: number): WorldState {
  if (!done) return state;
  return {
    ...state,
    experimentDone: true,
    finalUnlocked: state.discovered.length >= needed,
  };
}

export function advanceFinale(state: WorldState, length: number): WorldState {
  if (!state.finalUnlocked) return state;
  return { ...state, finaleLine: Math.min(length, state.finaleLine + 1) };
}

export function lightFromDiscoveries(found: number, needed: number) {
  if (needed <= 0) return 0;
  return Math.max(0, Math.min(1, found / needed));
}
