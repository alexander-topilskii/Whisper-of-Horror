import type { EventCardState, GameState } from "../state";
import { pushLogEntry } from "../state";
import { applyEventChoiceEffects } from "./event-choice-effects";
import { applyActionPenaltiesFromMarkers } from "./temporary-markers";
import { createEventPlaceholder } from "../../../src/data/event-placeholder";

function shuffleInPlace<T>(items: T[]): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function reshufflePlayerDiscardIntoDraw(state: GameState): boolean {
  const discard = state.decks.player.discardPile;
  if (!discard.length) {
    pushLogEntry(
      state,
      "[Колода]",
      "Карты закончились, а сброс пуст. Отдохните перед следующим ходом.",
      "system",
    );
    return false;
  }

  shuffleInPlace(discard);
  state.decks.player.drawPile = discard.splice(0);
  pushLogEntry(state, "[Колода]", "Сброс перетасован и возвращён в колоду.", "system");
  syncPlayerDeckCounters(state);
  return true;
}

function reshuffleEventDiscardIntoDraw(state: GameState): boolean {
  const discard = state.decks.event.discardPile;
  if (!discard.length) {
    pushLogEntry(state, "[Событие]", "Колода событий пуста, туман затихает.", "system");
    return false;
  }

  shuffleInPlace(discard);
  state.decks.event.drawPile = discard.splice(0);
  pushLogEntry(state, "[Событие]", "Сброс событий перетасован.", "system");
  syncEventDeckCounters(state);
  return true;
}

function drawEventCard(state: GameState): EventCardState | null {
  if (!state.decks.event.drawPile.length && !reshuffleEventDiscardIntoDraw(state)) {
    return null;
  }

  const card = state.decks.event.drawPile.shift() ?? null;
  syncEventDeckCounters(state);
  return card;
}

export function syncPlayerDeckCounters(state: GameState): void {
  state.decks.player.draw = state.decks.player.drawPile.length;
  state.decks.player.discard = state.decks.player.discardPile.length;
}

export function syncEventDeckCounters(state: GameState): void {
  state.decks.event.draw = state.decks.event.drawPile.length;
  state.decks.event.discard = state.decks.event.discardPile.length;
  state.decks.event.next = state.decks.event.drawPile[0]?.title ?? null;
}

export function drawPlayerCards(state: GameState, amount: number): number {
  let drawn = 0;

  for (let index = 0; index < amount; index += 1) {
    if (!state.decks.player.drawPile.length) {
      const reshuffled = reshufflePlayerDiscardIntoDraw(state);
      if (!reshuffled) {
        break;
      }
    }

    const card = state.decks.player.drawPile.shift();
    if (!card) {
      break;
    }

    state.hand.push(card);
    drawn += 1;
  }

  syncPlayerDeckCounters(state);
  return drawn;
}

export function startPlayerTurn(state: GameState): void {
  if (state.gameOutcome) {
    return;
  }

  decayCardModifiers(state);
  state.loopStage = "player";
  state.eventResolutionPending = false;
  state.turn.number += 1;
  state.turn.actions.remaining = state.turn.actions.total;
  applyActionPenaltiesFromMarkers(state);
  state.phase.icon = "🂠";
  state.phase.name = `Ход ${state.turn.number}`;
  state.phase.subtitle = "Сыграйте карты и подготовьтесь";
  const drawn = drawPlayerCards(state, 3);
  pushLogEntry(state, "[Ход]", `Начинается ход ${state.turn.number}. Вы взяли ${drawn} карт(ы).`, "system");
}

function decayCardModifiers(state: GameState): void {
  if (!state.modifiers?.length) {
    return;
  }

  const expired = state.modifiers.filter((modifier) => {
    modifier.remainingTurns -= 1;
    return modifier.remainingTurns <= 0;
  });

  if (expired.length) {
    expired.forEach((modifier) => {
      pushLogEntry(state, "[Эффект]", `Эффект «${modifier.label}» рассеивается.`, "effect");
    });
    state.modifiers = state.modifiers.filter((modifier) => modifier.remainingTurns > 0);
  }
}

export function beginEventPhase(state: GameState): EventCardState | null {
  if (state.gameOutcome) {
    return null;
  }

  const nextEvent = drawEventCard(state);
  if (!nextEvent) {
    return null;
  }

  state.event = nextEvent;
  state.loopStage = "event";
  state.eventResolutionPending = Boolean(nextEvent.choices?.length);
  state.turn.actions.remaining = 0;
  state.phase.icon = "☄️";
  state.phase.name = "Фаза событий";
  state.phase.subtitle = nextEvent.title;
  pushLogEntry(state, "[Событие]", `Открыто событие «${nextEvent.title}».`, "story");
  return nextEvent;
}

function evaluateOutcome(state: GameState): "victory" | "defeat" | null {
  if (state.gameOutcome) {
    return state.gameOutcome;
  }

  const victoryTrack = state.worldTracks.find((track) => track.type === "victory");
  if (victoryTrack && victoryTrack.max > 0 && victoryTrack.value >= victoryTrack.max) {
    state.gameOutcome = "victory";
    state.loopStage = "finished";
    state.phase.icon = "🏆";
    state.phase.name = "Победа";
    state.phase.subtitle = "Следопыты раскрыли тайну";
    pushLogEntry(state, "[Финал]", "Вы собрали достаточно улик, чтобы остановить туман.", "story");
    return "victory";
  }

  const doomTrack = state.worldTracks.find((track) => track.type === "doom");
  if (doomTrack && doomTrack.max > 0 && doomTrack.value >= doomTrack.max) {
    state.gameOutcome = "defeat";
    state.loopStage = "finished";
    state.phase.icon = "☠️";
    state.phase.name = "Поражение";
    state.phase.subtitle = "Туман поглотил Старый район";
    pushLogEntry(state, "[Финал]", "Разрушение достигает критической отметки. Вам не уйти.", "story");
    return "defeat";
  }

  return null;
}

export function completeEventPhase(state: GameState): void {
  const resolvedEvent = state.event;
  state.decks.event.discardPile.push(resolvedEvent);
  syncEventDeckCounters(state);
  state.eventResolutionPending = false;

  const outcome = evaluateOutcome(state);
  if (outcome) {
    state.turn.actions.remaining = 0;
    state.event = createEventPlaceholder();
    return;
  }

  state.event = createEventPlaceholder();
  startPlayerTurn(state);
}

export function resolveImmediateEvent(state: GameState, event: EventCardState): void {
  const { type: logType, variant: logVariant } = applyEventChoiceEffects(state, event.immediateEffects);
  pushLogEntry(state, logType, event.effect, logVariant ?? "story");
  completeEventPhase(state);
}
