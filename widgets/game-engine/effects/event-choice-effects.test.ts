import { describe, expect, it, vi } from "vitest";
import { applyEventChoiceEffects } from "./event-choice-effects";
import type { EventChoiceEffect, GameState } from "../game-engine";

function createState(): GameState {
  return {
    turn: { number: 1, actions: { remaining: 3, total: 3 } },
    decks: {
      player: { draw: 5, discard: 0 },
      event: { draw: 5, discard: 0, next: null },
    },
    hand: [],
    phase: { icon: "", name: "", subtitle: "" },
    worldTracks: [
      { id: "doom", label: "Doom", value: 2, max: 10, type: "doom" },
      { id: "victory", label: "Victory", value: 5, max: 10, type: "victory" },
    ],
    characterStats: [{ id: "will", label: "Will", value: 1, max: 6 }],
    statuses: [],
    npcs: [],
    event: { title: "", flavor: "", effect: "", choices: [] },
    log: [],
    autoScrollLog: true,
    soundEnabled: true,
  };
}

describe("applyEventChoiceEffects", () => {
  it("applies default handlers for stats, tracks, actions and clues", () => {
    const state = createState();
    const logType = applyEventChoiceEffects(state, {
      statDeltas: [
        { statId: "will", delta: 2 },
        { statId: "missing", delta: 3 },
      ],
      doomDelta: 2,
      victoryDelta: -1,
      actionsDelta: -1,
      cluesGained: 2,
    });

    expect(logType).toBe("[Событие]");
    expect(state.characterStats.find((stat) => stat.id === "will")?.value).toBe(3);
    expect(state.worldTracks.find((track) => track.id === "doom")?.value).toBe(4);
    expect(state.worldTracks.find((track) => track.id === "victory")?.value).toBe(4);
    expect(state.turn.actions.remaining).toBe(2);
    expect(state.log).toHaveLength(1);
    expect(state.log[0]).toMatchObject({ type: "[Улика]", body: "Получено улик: 2." });
  });

  it("allows overriding handlers via the handler map", () => {
    const state = createState();
    const effects: EventChoiceEffect = { cluesGained: 3 };
    const handler = vi.fn();

    const logType = applyEventChoiceEffects(state, effects, {
      cluesGained: handler,
    });

    expect(logType).toBe("[Событие]");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(state, 3, effects);
    expect(state.log).toHaveLength(0);
  });

  it("returns the provided log type when supplied", () => {
    const state = createState();
    const logType = applyEventChoiceEffects(state, {
      logType: "[Тест]",
    });

    expect(logType).toBe("[Тест]");
    expect(state.log).toHaveLength(0);
  });
});
