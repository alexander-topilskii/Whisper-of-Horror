import type { GameCommand, GameState } from "../state";
import { pushLogEntry } from "../state";
import { startPlayerTurn } from "../effects/turn-cycle";

export class AdvanceJournalCommand implements GameCommand {
  public readonly type = "advance-journal";

  execute(state: GameState): GameState {
    const script = state.journalScript;
    if (!script.entries.length || script.completed) {
      pushLogEntry(state, "[Система]", "Вступление уже завершено.", "system");
      return state;
    }

    const entry = script.entries[script.nextIndex];
    if (!entry) {
      script.completed = true;
      startPlayerTurn(state);
      return state;
    }

    pushLogEntry(state, entry.type, entry.body, entry.variant ?? "story");
    script.nextIndex += 1;

    if (script.nextIndex >= script.entries.length) {
      script.completed = true;
      startPlayerTurn(state);
    }

    return state;
  }
}
