import { describe, expect, it } from "vitest";
import { CompleteEventPhaseCommand } from "./complete-event-phase";
import type { GameState } from "../state";

function createResolvedEventState(): GameState {
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
    temporaryMarkers: [],
    npcs: [],
    event: { id: "test", title: "Test", flavor: "", effect: "", choices: [] },
    scenario: {
      actId: "act",
      title: "",
      intro: { title: "", type: "narration", flavor: [] },
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
    eventResolutionPending: false,
    eventResolutionSummary: { title: "[Событие]", body: "Завершено", variant: "story" },
    gameOutcome: null,
    autoScrollLog: true,
    soundEnabled: true,
    modifiers: [],
  };
}

describe("CompleteEventPhaseCommand", () => {
  it("не завершает фазу, пока требуется выбор", () => {
    const state = createResolvedEventState();
    state.eventResolutionPending = true;
    const command = new CompleteEventPhaseCommand();

    command.execute(state);

    expect(state.loopStage).toBe("event");
    expect(state.decks.event.discardPile).toHaveLength(0);
    expect(state.eventResolutionSummary).not.toBeNull();
  });

  it("возвращает ход игроку после подтверждения", () => {
    const state = createResolvedEventState();
    const command = new CompleteEventPhaseCommand();

    command.execute(state);

    expect(state.loopStage).toBe("player");
    expect(state.turn.number).toBe(2);
    expect(state.decks.event.discardPile).toHaveLength(1);
    expect(state.eventResolutionSummary).toBeNull();
    expect(state.hand.length).toBeGreaterThan(0);
  });
});
