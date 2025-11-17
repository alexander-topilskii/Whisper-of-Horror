import type { GameCommand, GameState, LogEntryVariant } from "../state";
import { pushLogEntry } from "../state";

export class AppendLogEntryCommand implements GameCommand {
  public readonly type = "append-log";

  constructor(
    private readonly entryType: string,
    private readonly body: string,
    private readonly variant: LogEntryVariant = "story",
  ) {}

  execute(state: GameState): GameState {
    pushLogEntry(state, this.entryType, this.body, this.variant);
    return state;
  }
}
