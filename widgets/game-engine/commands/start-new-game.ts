import type { GameCommand, GameState } from "../state";
import { cloneState, pushLogEntry } from "../state";

export class StartNewGameCommand implements GameCommand {
  public readonly type = "start-new-game";
  public readonly description = "Сброс состояния к начальному снимку";

  constructor(private readonly snapshot: GameState) {}

  execute(_: GameState): GameState {
    const nextState = cloneState(this.snapshot);
    pushLogEntry(
      nextState,
      "[Система]",
      "Партия сброшена. Вернитесь к прологу и нажимайте «Далее».",
    );
    return nextState;
  }
}
