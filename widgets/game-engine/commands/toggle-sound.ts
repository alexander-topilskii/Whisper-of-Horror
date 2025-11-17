import type { GameCommand, GameState } from "../state";
import { pushLogEntry } from "../state";

export class ToggleSoundCommand implements GameCommand {
  public readonly type = "toggle-sound";

  execute(state: GameState): GameState {
    state.soundEnabled = !state.soundEnabled;
    pushLogEntry(
      state,
      "[Система]",
      state.soundEnabled ? "Звук включён." : "Звук отключён.",
      "system",
    );
    return state;
  }
}
