import type { GameCommand, GameState } from "../state";
import { pushLogEntry } from "../state";
import { completeEventPhase } from "../effects/turn-cycle";

export class CompleteEventPhaseCommand implements GameCommand {
  public readonly type = "complete-event-phase";

  execute(state: GameState): GameState {
    if (state.loopStage !== "event") {
      pushLogEntry(state, "[Событие]", "Сейчас не идёт фаза событий.", "system");
      return state;
    }

    if (state.eventResolutionPending) {
      pushLogEntry(state, "[Событие]", "Сначала завершите эффект события.", "system");
      return state;
    }

    completeEventPhase(state);
    return state;
  }
}
