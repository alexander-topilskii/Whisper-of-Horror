import { describe, expect, it, vi } from "vitest";
import { applyEventChoiceEffects } from "./event-choice-effects";
import type { CharacterStatState, EventChoiceEffect, GameState, TrackState } from "../state";

function createState(): GameState {
  return {
    turn: { number: 1, actions: { remaining: 3, total: 3 } },
    decks: {
      player: { draw: 5, discard: 0, drawPile: [], discardPile: [] },
      event: { draw: 5, discard: 0, next: null, drawPile: [], discardPile: [] },
    },
    hand: [],
    phase: { icon: "", name: "", subtitle: "" },
    worldTracks: [
      { id: "doom", label: "Doom", value: 2, max: 10, type: "doom" },
      { id: "victory", label: "Victory", value: 5, max: 10, type: "victory" },
      { id: "cold", label: "Холод", value: 0, max: 3, type: "generic" },
      { id: "fear", label: "Страх", value: 0, max: 4, type: "generic" },
    ],
    characterStats: [{ id: "will", label: "Will", value: 1, max: 6 }],
    statuses: [],
    npcs: [],
    event: { id: "test-event", title: "", flavor: "", effect: "", choices: [] },
    scenario: {
      actId: "test",
      title: "Test Scenario",
      intro: { title: "", type: "narration", flavor: [] },
      firstTask: {
        id: "task",
        label: "Тестовый акт",
        summary: "",
        goal: "",
        technicalGoal: { label: "Улики", resource: "clue", requiredAmount: 3, currentAmount: 0 },
        flavor: "",
        failCondition: "",
        technicalFailCondition: { label: "Ужас", resource: "sanity", requiredAmount: 5, currentAmount: 0 },
      },
    },
    log: [],
    journalScript: { entries: [], nextIndex: 0, completed: true },
    loopStage: "player",
    eventResolutionPending: false,
    gameOutcome: null,
    autoScrollLog: true,
    soundEnabled: true,
  };
}

describe("applyEventChoiceEffects", () => {
  it("applies default handlers for stats, tracks, actions and clues", () => {
    const state = createState();
    const logDescriptor = applyEventChoiceEffects(state, {
      statDeltas: [
        { statId: "will", delta: 2 },
        { statId: "missing", delta: 3 },
      ],
      doomDelta: 2,
      victoryDelta: -1,
      actionsDelta: -1,
      cluesGained: 2,
    });

    expect(logDescriptor).toEqual({ type: "[Событие]" });
    expect(state.characterStats.find((stat: CharacterStatState) => stat.id === "will")?.value).toBe(3);
    expect(state.worldTracks.find((track: TrackState) => track.id === "doom")?.value).toBe(4);
    expect(state.worldTracks.find((track: TrackState) => track.id === "victory")?.value).toBe(6);
    expect(state.turn.actions.remaining).toBe(2);
    expect(state.log).toHaveLength(1);
    expect(state.log[0]).toMatchObject({ type: "[Улика]", body: "Получено улик: 2." });
  });

  it("escalates doom and logs alarm when noise is applied", () => {
    const state = createState();
    const logDescriptor = applyEventChoiceEffects(state, { noise: 2 });

    expect(logDescriptor).toEqual({ type: "[Событие]" });
    expect(state.worldTracks.find((track: TrackState) => track.id === "doom")?.value).toBe(4);
    expect(state.log).toHaveLength(1);
    expect(state.log[0]).toMatchObject({
      type: "[Тревога]",
      body: "Шум привлекает внимание. Уровень ужаса растёт на 2.",
    });
  });

  it("intensifies cold exposure when coldDelta is applied", () => {
    const state = createState();
    const logDescriptor = applyEventChoiceEffects(state, { coldDelta: 2 });

    expect(logDescriptor).toEqual({ type: "[Событие]" });
    expect(state.worldTracks.find((track: TrackState) => track.id === "cold")?.value).toBe(2);
    expect(state.log).toHaveLength(1);
    expect(state.log[0]).toMatchObject({
      type: "[Холод]",
      body: "Холод усиливается. Изменение: +2.",
    });
  });

  it("records dread when fearDelta is applied", () => {
    const state = createState();
    const logDescriptor = applyEventChoiceEffects(state, { fearDelta: 1 });

    expect(logDescriptor).toEqual({ type: "[Событие]" });
    expect(state.worldTracks.find((track: TrackState) => track.id === "fear")?.value).toBe(1);
    expect(state.log).toHaveLength(1);
    expect(state.log[0]).toMatchObject({
      type: "[Страх]",
      body: "Страх нарастает. Изменение: +1.",
    });
  });

  it("allows overriding handlers via the handler map", () => {
    const state = createState();
    const effects: EventChoiceEffect = { cluesGained: 3 };
    const handler = vi.fn();

    const logDescriptor = applyEventChoiceEffects(state, effects, {
      cluesGained: handler,
    });

    expect(logDescriptor).toEqual({ type: "[Событие]" });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(state, 3, effects);
    expect(state.log).toHaveLength(0);
  });

  it("returns the provided log type when supplied", () => {
    const state = createState();
    const logDescriptor = applyEventChoiceEffects(state, {
      logType: "[Тест]",
      logVariant: "effect",
    });

    expect(logDescriptor).toEqual({ type: "[Тест]", variant: "effect" });
    expect(state.log).toHaveLength(0);
  });
});
