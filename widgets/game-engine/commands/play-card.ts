import type { GameCommand, GameState, LogEntryVariant } from "../state";
import { pushLogEntry } from "../state";
import {
  adjustActions,
  applyEventChoiceEffects,
  adjustTrack,
  applyStatDeltas,
} from "../effects/event-choice-effects";
import { syncPlayerDeckCounters } from "../effects/turn-cycle";
import type { CardDefinition } from "../state";

type UseCounterKey = "successCount" | "failCount";

type CardBehavior = {
  onSuccess?: (state: GameState, card: CardDefinition) => string | null;
  onFailure?: (state: GameState, card: CardDefinition) => string | null;
};

function adjustStat(state: GameState, statId: string, delta: number): void {
  applyStatDeltas(state, [{ statId, delta }]);
}

const CARD_BEHAVIORS: Record<string, CardBehavior> = {
  Исследование: {
    onSuccess: (state, card) => {
      if (!card.effect) {
        return null;
      }

      adjustTrack(state, "victory", card.effect);
      return "[Улика]";
    },
  },
  Лечение: {
    onSuccess: (state, card) => {
      adjustStat(state, "health", card.effect ?? 1);
      return "[Здоровье]";
    },
    onFailure: (state) => {
      adjustStat(state, "sanity", -1);
      return "[Рассудок]";
    },
  },
  Терапия: {
    onSuccess: (state, card) => {
      adjustStat(state, "sanity", card.effect ?? 1);
      return "[Рассудок]";
    },
    onFailure: (state) => {
      adjustStat(state, "health", -1);
      return "[Здоровье]";
    },
  },
  Поддержка: {
    onSuccess: (state, card) => {
      const relief = Math.abs(card.effect ?? 1);
      adjustTrack(state, "doom", -relief);
      return "[Поддержка]";
    },
    onFailure: (state) => {
      adjustStat(state, "sanity", -1);
      return "[Рассудок]";
    },
  },
};

export class PlayCardCommand implements GameCommand {
  public readonly type = "play-card";

  constructor(private readonly cardId: string) {}

  execute(state: GameState): GameState {
    if (state.loopStage !== "player" || state.gameOutcome) {
      pushLogEntry(state, "[Система]", "Сейчас нельзя играть карты.", "system");
      return state;
    }

    const cardIndex = state.hand.findIndex((card) => card.id === this.cardId);
    if (cardIndex === -1) {
      pushLogEntry(state, "[Система]", "Карты уже нет на руке.", "system");
      return state;
    }

    const card = state.hand[cardIndex];
    if (!card.playable) {
      pushLogEntry(state, "[Действие]", `Карта «${card.name}» пока заблокирована.`, "player");
      return state;
    }

    const actionCost = card.actionCost ?? 1;
    if (state.turn.actions.remaining < actionCost) {
      pushLogEntry(state, "[Действие]", "Недостаточно очков действия для розыгрыша карты.", "player");
      return state;
    }

    state.hand.splice(cardIndex, 1);
    adjustActions(state, -actionCost);

    const isSuccess = this.rollForCard(card);
    let logType: string = isSuccess ? "[Действие]" : "[Провал]";
    let logVariant: LogEntryVariant = "player";

    const behavior = card.type ? CARD_BEHAVIORS[card.type] : undefined;
    if (isSuccess) {
      const typeLog = behavior?.onSuccess?.(state, card) ?? null;
      if (typeLog) {
        logType = typeLog;
        logVariant = "effect";
      }

      if (card.effects) {
        const { type, variant } = applyEventChoiceEffects(state, card.effects);
        logType = type;
        logVariant = variant ?? "story";
      }
    } else if (behavior?.onFailure) {
      const failureLog = behavior.onFailure(state, card);
      if (failureLog) {
        logType = failureLog;
        logVariant = "effect";
      }
    }

    const narrative = isSuccess
      ? card.successText ?? `Карта «${card.name}» приносит пользу.`
      : card.failText ?? `Карта «${card.name}» не срабатывает.`;
    const emoji = isSuccess ? '✅' : '❌';
    const baseBody = `Карта «${card.name}». ${narrative}`;
    pushLogEntry(state, logType, `${baseBody} ${emoji}`, logVariant);

    const shouldRemove = this.shouldRemoveAfterUse(card, isSuccess ? "successCount" : "failCount");
    if (!shouldRemove) {
      state.decks.player.discardPile.push(card);
    } else {
      pushLogEntry(state, "[Колода]", `Карта «${card.name}» исчезает из вашей колоды.`, "system");
    }

    syncPlayerDeckCounters(state);
    return state;
  }

  private rollForCard(card: CardDefinition): boolean {
    const chance = typeof card.chance === "number" ? Math.max(0, Math.min(1, card.chance)) : 1;
    if (chance >= 1) {
      return true;
    }

    return Math.random() <= chance;
  }

  private shouldRemoveAfterUse(card: CardDefinition, key: UseCounterKey): boolean {
    const currentValue = card[key];
    if (currentValue === undefined || currentValue === null || currentValue === 0) {
      return false;
    }

    const nextValue = currentValue - 1;
    card[key] = nextValue;
    return nextValue <= 0;
  }
}
