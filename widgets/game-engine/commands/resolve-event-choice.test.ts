import { describe, expect, it, vi } from "vitest";
import { ResolveEventChoiceCommand } from "./resolve-event-choice";
import type { GameState } from "../state";

function createEventState(): GameState {
  return {
    turn: { number: 1, actions: { remaining: 0, total: 3 } },
    decks: {
      player: {
        draw: 3,
        discard: 0,
        drawPile: [
          { id: "a", name: "A", description: "", costs: [], playable: true },
          { id: "b", name: "B", description: "", costs: [], playable: true },
          { id: "c", name: "C", description: "", costs: [], playable: true },
        ],
        discardPile: [],
      },
      event: { draw: 0, discard: 0, next: null, drawPile: [], discardPile: [] },
    },
    hand: [],
    phase: { icon: "", name: "", subtitle: "" },
    worldTracks: [
      { id: "doom", label: "Ужас", value: 0, max: 6, type: "doom" },
      { id: "victory", label: "Улики", value: 0, max: 3, type: "victory" },
    ],
    characterStats: [{ id: "sanity", label: "Рассудок", value: 3, max: 5 }],
    statuses: [],
    npcs: [],
    event: {
      id: "test", title: "Test", flavor: "", effect: "",
      choices: [
        {
          id: "choice",
          label: "Проверка",
          chance: 0.5,
          successText: "Успех",
          failText: "Провал",
          successEffects: { statDeltas: [{ statId: "sanity", delta: 1 }] },
          failEffects: { doomDelta: 1 },
        },
      ],
    },
    scenario: {
      actId: "act", title: "", intro: { title: "", type: "narration", flavor: [] },
      firstTask: {
        id: "task",
        label: "",
        summary: "",
        goal: "",
        technicalGoal: { label: "", resource: "clue", requiredAmount: 3, currentAmount: 0 },
        flavor: "",
        failCondition: "",
        technicalFailCondition: { label: "", resource: "sanity", requiredAmount: 5, currentAmount: 0 },
      },
    },
    log: [],
    journalScript: { entries: [], nextIndex: 0, completed: true },
    loopStage: "event",
    eventResolutionPending: true,
    gameOutcome: null,
    autoScrollLog: true,
    soundEnabled: true,
  };
}

describe("ResolveEventChoiceCommand", () => {
  it("applies success branch when roll is below chance", () => {
    const state = createEventState();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.25);
    const command = new ResolveEventChoiceCommand("choice");

    command.execute(state);
    randomSpy.mockRestore();

    const resolvedEvent = state.decks.event.discardPile[0];
    const choice = resolvedEvent?.choices?.[0];
    expect(choice?.resolved).toBe(true);
    expect(choice?.outcome).toBe("success");
    expect(state.characterStats[0].value).toBe(4);
    const eventLog = state.log.find((entry) => entry.type === "[Событие]");
    expect(eventLog?.body).toContain("Шанс 50%");
  });

  it("applies fail branch when roll is above chance", () => {
    const state = createEventState();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.75);
    const command = new ResolveEventChoiceCommand("choice");

    command.execute(state);
    randomSpy.mockRestore();

    const resolvedEvent = state.decks.event.discardPile[0];
    const choice = resolvedEvent?.choices?.[0];
    expect(choice?.resolved).toBe(true);
    expect(choice?.outcome).toBe("fail");
    expect(state.worldTracks[0].value).toBe(1);
    const eventLog = state.log.find((entry) => entry.type === "[Событие]");
    expect(eventLog?.body).toContain("результат: провал");
  });

  it("completes the event phase and returns control to the player", () => {
    const state = createEventState();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);
    const command = new ResolveEventChoiceCommand("choice");

    command.execute(state);
    randomSpy.mockRestore();

    expect(state.loopStage).toBe("player");
    expect(state.turn.number).toBe(2);
    expect(state.turn.actions.remaining).toBe(state.turn.actions.total);
    expect(state.event.id).toBe("no-event");
    expect(state.decks.event.discardPile).toHaveLength(1);
    expect(state.hand).toHaveLength(3);
  });
});
