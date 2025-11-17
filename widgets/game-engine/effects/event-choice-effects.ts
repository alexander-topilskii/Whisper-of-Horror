import type { EventChoiceEffect, GameState, LogEntryVariant, StatDelta } from "../state";
import { clamp, pushLogEntry } from "../state";
import { adjustTemporaryMarker } from "./temporary-markers";

export interface LogDescriptor {
  type: string;
  variant?: LogEntryVariant;
}

type EventChoiceEffectHandler<TKey extends keyof EventChoiceEffect> = (
  state: GameState,
  value: NonNullable<EventChoiceEffect[TKey]>,
  effects: EventChoiceEffect,
) => void;

export type EventChoiceEffectHandlerMap = Partial<{
  [K in keyof EventChoiceEffect]: EventChoiceEffectHandler<K>;
}>;

export function applyStatDeltas(state: GameState, deltas: StatDelta[] | undefined) {
  if (!deltas?.length) {
    return;
  }

  deltas.forEach((delta) => {
    const stat = state.characterStats.find((item) => item.id === delta.statId);
    if (!stat) {
      return;
    }

    let deltaValue = delta.delta;
    if (stat.id === "sanity") {
      deltaValue = applySanityMitigation(state, deltaValue);
    }

    stat.value = clamp(stat.value + deltaValue, 0, stat.max);
  });
}

function applySanityMitigation(state: GameState, delta: number): number {
  if (delta >= 0) {
    return delta;
  }

  const reduction = (state.modifiers ?? []).reduce(
    (total, modifier) => total + (modifier.reduceSanityLoss ?? 0),
    0,
  );

  if (reduction <= 0) {
    return delta;
  }

  const mitigated = Math.min(0, delta + reduction);
  if (mitigated !== delta) {
    const prevented = Math.abs(delta) - Math.abs(mitigated);
    pushLogEntry(state, "[Рассудок]", `Воля смягчает урон рассудку на ${prevented}.`, "effect");
  }

  return mitigated;
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

    adjustTrack(state, "victory", clues);
    pushLogEntry(state, "[Улика]", `Получено улик: ${clues}.`, "effect");
  },
  noise: (state, value) => {
    if (!value) {
      return;
    }

    adjustTrack(state, "doom", value);
    pushLogEntry(
      state,
      "[Тревога]",
      `Шум привлекает внимание. Уровень ужаса растёт на ${value}.`,
      "effect",
    );
  },
  coldDelta: (state, delta) => {
    if (!delta) {
      return;
    }

    const result = adjustTemporaryMarker(state, "cold", delta);
    if (!result || result.appliedDelta === 0) {
      return;
    }

    const label = result.marker.label ?? "Холод";
    const direction = result.appliedDelta > 0 ? "усиливается" : "ослабевает";
    const amount = Math.abs(result.appliedDelta);
    const prefix = result.appliedDelta > 0 ? "+" : "-";
    pushLogEntry(
      state,
      "[Холод]",
      `${label} ${direction}. Изменение: ${prefix}${amount}.`,
      "effect",
    );
  },
  fearDelta: (state, delta) => {
    if (!delta) {
      return;
    }

    const result = adjustTemporaryMarker(state, "fear", delta);
    if (!result || result.appliedDelta === 0) {
      return;
    }

    const label = result.marker.label ?? "Страх";
    const direction = result.appliedDelta > 0 ? "нарастает" : "рассеивается";
    const amount = Math.abs(result.appliedDelta);
    const prefix = result.appliedDelta > 0 ? "+" : "-";
    pushLogEntry(
      state,
      "[Страх]",
      `${label} ${direction}. Изменение: ${prefix}${amount}.`,
      "effect",
    );
  },
};

export function applyEventChoiceEffects(
  state: GameState,
  effects: EventChoiceEffect | undefined,
  handlers: EventChoiceEffectHandlerMap = defaultEventChoiceEffectHandlers,
): LogDescriptor {
  if (!effects) {
    return { type: "[Событие]" };
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

  return {
    type: effects.logType ?? "[Событие]",
    variant: effects.logVariant,
  };
}
