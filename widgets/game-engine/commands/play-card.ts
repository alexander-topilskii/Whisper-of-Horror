import type { GameCommand, GameState } from "../state";
import { pushLogEntry } from "../state";
import { adjustActions, applyEventChoiceEffects } from "../effects/event-choice-effects";
import { syncPlayerDeckCounters } from "../effects/turn-cycle";

export class PlayCardCommand implements GameCommand {
  public readonly type = "play-card";

  constructor(private readonly cardId: string) {}

  execute(state: GameState): GameState {
    if (state.loopStage !== "player" || state.gameOutcome) {
      pushLogEntry(state, "[Система]", "Сейчас нельзя играть карты.");
      return state;
    }

    const cardIndex = state.hand.findIndex((card) => card.id === this.cardId);
    if (cardIndex === -1) {
      pushLogEntry(state, "[Система]", "Карты уже нет на руке.");
      return state;
    }

    const card = state.hand[cardIndex];
    if (!card.playable) {
      pushLogEntry(state, "[Действие]", `Карта «${card.name}» пока заблокирована.`);
      return state;
    }

    const actionCost = card.actionCost ?? 1;
    if (state.turn.actions.remaining < actionCost) {
      pushLogEntry(state, "[Действие]", "Недостаточно очков действия для розыгрыша карты.");
      return state;
    }

    state.hand.splice(cardIndex, 1);
    adjustActions(state, -actionCost);

    state.decks.player.discardPile.push(card);
    syncPlayerDeckCounters(state);

    const logType = card.effects ? applyEventChoiceEffects(state, card.effects) : "[Действие]";
    pushLogEntry(state, logType, `Сыграна карта «${card.name}». ${card.description}`);
    return state;
  }
}
