import type { EventChoiceEffect, GameState, LogEntry, StatDelta } from "../game-engine";

type EventChoiceEffectHandler<TKey extends keyof EventChoiceEffect> = (
  state: GameState,
  value: NonNullable<EventChoiceEffect[TKey]>,
  effects: EventChoiceEffect,
) => void;

export type EventChoiceEffectHandlerMap = Partial<{
  [K in keyof EventChoiceEffect]: EventChoiceEffectHandler<K>;
}>;

const LOG_LIMIT = 20;

function generateLogId(): string {
  return `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pushLogEntry(state: GameState, type: string, body: string) {
  const entry: LogEntry = {
    id: generateLogId(),
    type,
    body,
  };

  state.log = [entry, ...state.log].slice(0, LOG_LIMIT);
}

export function applyStatDeltas(state: GameState, deltas: StatDelta[] | undefined) {
  if (!deltas?.length) {
    return;
  }

  deltas.forEach((delta) => {
    const stat = state.characterStats.find((item) => item.id === delta.statId);
    if (!stat) {
      return;
    }

    stat.value = clamp(stat.value + delta.delta, 0, stat.max);
  });
}

export function adjustTrack(state: GameState, trackId: string, delta: number) {
  const track = state.worldTracks.find((item) => item.id === trackId);
  if (!track) {
    return;
  }

  track.value = clamp(track.value + delta, 0, track.max);
}

export function adjustActions(state: GameState, delta: number) {
  const pool = state.turn.actions;
  pool.remaining = clamp(pool.remaining + delta, 0, pool.total);
}

const defaultEventChoiceEffectHandlers: EventChoiceEffectHandlerMap = {
  statDeltas: (state, deltas) => applyStatDeltas(state, deltas),
  doomDelta: (state, delta) => {
    if (!delta) {
      return;
    }

    adjustTrack(state, "doom", delta);
  },
  victoryDelta: (state, delta) => {
    if (!delta) {
      return;
    }

    adjustTrack(state, "victory", delta);
  },
  actionsDelta: (state, delta) => {
    if (!delta) {
      return;
    }

    adjustActions(state, delta);
  },
  cluesGained: (state, clues) => {
    if (!clues) {
      return;
    }

    pushLogEntry(state, "[Улика]", `Получено улик: ${clues}.`);
  },
};

export function applyEventChoiceEffects(
  state: GameState,
  effects: EventChoiceEffect | undefined,
  handlers: EventChoiceEffectHandlerMap = defaultEventChoiceEffectHandlers,
): string {
  if (!effects) {
    return "[Событие]";
  }

  (Object.keys(handlers) as (keyof EventChoiceEffect)[]).forEach((key) => {
    const handler = handlers[key];
    if (!handler) {
      return;
    }

    const value = effects[key];
    if (value === undefined || value === null) {
      return;
    }

    handler(state, value as never, effects);
  });

  return effects.logType ?? "[Событие]";
}
