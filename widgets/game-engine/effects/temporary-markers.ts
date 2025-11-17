import type { GameState, TemporaryMarkerState } from "../state";
import { clamp, pushLogEntry } from "../state";

interface AdjustMarkerOptions {
  affectActionPool?: boolean;
}

function findMarker(state: GameState, markerId: string): TemporaryMarkerState | undefined {
  return state.temporaryMarkers.find((marker) => marker.id === markerId);
}

export function adjustTemporaryMarker(
  state: GameState,
  markerId: string,
  delta: number,
  options: AdjustMarkerOptions = {},
): { marker: TemporaryMarkerState; appliedDelta: number } | null {
  if (!delta) {
    return null;
  }

  const marker = findMarker(state, markerId);
  if (!marker) {
    return null;
  }

  const previousValue = marker.value;
  const maxValue = typeof marker.max === "number" ? marker.max : Number.POSITIVE_INFINITY;
  const nextValue = clamp(previousValue + delta, 0, maxValue);
  marker.value = nextValue;
  const appliedDelta = nextValue - previousValue;
  if (appliedDelta === 0) {
    return { marker, appliedDelta };
  }

  const shouldAffectActions = options.affectActionPool ?? true;
  if (shouldAffectActions && state.loopStage === "player") {
    const penaltyPerStack = marker.actionPenaltyPerStack ?? 0;
    if (penaltyPerStack !== 0) {
      const penaltyDelta = appliedDelta * penaltyPerStack;
      if (penaltyDelta !== 0) {
        state.turn.actions.remaining = clamp(
          state.turn.actions.remaining - penaltyDelta,
          0,
          state.turn.actions.total,
        );
      }
    }
  }

  return { marker, appliedDelta };
}

export function applyActionPenaltiesFromMarkers(state: GameState): void {
  if (!state.temporaryMarkers?.length) {
    return;
  }

  const totalPenalty = state.temporaryMarkers.reduce((sum, marker) => {
    const perStack = marker.actionPenaltyPerStack ?? 0;
    if (perStack <= 0 || marker.value <= 0) {
      return sum;
    }
    return sum + marker.value * perStack;
  }, 0);

  if (totalPenalty <= 0) {
    return;
  }

  state.turn.actions.remaining = clamp(
    state.turn.actions.remaining - totalPenalty,
    0,
    state.turn.actions.total,
  );
}

export function decayTemporaryMarkers(state: GameState): void {
  state.temporaryMarkers.forEach((marker) => {
    if (marker.value <= 0) {
      return;
    }

    const result = adjustTemporaryMarker(state, marker.id, -1, { affectActionPool: false });
    if (!result || result.appliedDelta === 0) {
      return;
    }

    pushLogEntry(
      state,
      `[${marker.label}]`,
      `${marker.label} ослабевает. Осталось: ${marker.value}.`,
      "effect",
    );
  });
}
