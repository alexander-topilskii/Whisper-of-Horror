import type { GameCommand, GameState } from "../state";
import { pushLogEntry } from "../state";
import {
  beginEventPhase,
  resolveImmediateEvent,
  startPlayerTurn,
  syncPlayerDeckCounters,
} from "../effects/turn-cycle";

function discardRemainingHand(state: GameState): void {
  if (!state.hand.length) {
    return;
  }

  const discarded = state.hand.splice(0);
  state.decks.player.discardPile.push(...discarded);
  syncPlayerDeckCounters(state);
  pushLogEntry(state, "[Колода]", `Вы сбрасываете ${discarded.length} карт(ы).`);
}

export class EndTurnCommand implements GameCommand {
  public readonly type = "end-turn";

  execute(state: GameState): GameState {
    if (!state.journalScript.completed) {
      pushLogEntry(state, "[Система]", "Сначала дослушайте пролог.");
      return state;
    }

    if (state.gameOutcome) {
      pushLogEntry(state, "[Система]", "Партия уже завершена.");
      return state;
    }

    if (state.loopStage !== "player") {
      pushLogEntry(state, "[Система]", "Нельзя завершить ход прямо сейчас.");
      return state;
    }

    discardRemainingHand(state);
    const event = beginEventPhase(state);
    if (!event) {
      pushLogEntry(state, "[Событие]", "Событий не осталось. Вы пережидаете туман.");
      startPlayerTurn(state);
      return state;
    }

    if (!event.choices?.length) {
      resolveImmediateEvent(state, event);
    }

    return state;
  }
}
