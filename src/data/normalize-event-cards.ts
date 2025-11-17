import type { EventCardState, EventChoiceEffect, EventChoiceState, StatDelta } from "../../widgets/game-engine/state";

export interface RawEventOptionEffect {
  clue?: number;
  sanity?: number;
  omen?: number;
  wound?: number;
  cold?: number;
}

export interface RawEventOption {
  id: string;
  label: string;
  chance?: number;
  success_text?: string;
  fail_text?: string;
  successText?: string;
  failText?: string;
  effect?: {
    onSuccess?: RawEventOptionEffect;
    onFail?: RawEventOptionEffect;
  };
}

export type RawEventCard = EventCardState & {
  options?: RawEventOption[];
};

function normalizeOptionEffect(effect: RawEventOptionEffect | undefined): EventChoiceEffect | undefined {
  if (!effect) {
    return undefined;
  }

  const normalized: EventChoiceEffect = {};
  const statDeltas: StatDelta[] = [];

  if (typeof effect.sanity === "number" && effect.sanity !== 0) {
    statDeltas.push({ statId: "sanity", delta: -effect.sanity });
  }

  if (typeof effect.wound === "number" && effect.wound !== 0) {
    statDeltas.push({ statId: "health", delta: -effect.wound });
  }

  if (statDeltas.length) {
    normalized.statDeltas = statDeltas;
  }

  if (typeof effect.clue === "number" && effect.clue !== 0) {
    normalized.cluesGained = effect.clue;
  }

  if (typeof effect.omen === "number" && effect.omen !== 0) {
    normalized.doomDelta = effect.omen;
  }

  if (typeof effect.cold === "number" && effect.cold !== 0) {
    normalized.coldDelta = effect.cold;
  }

  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeOption(option: RawEventOption): EventChoiceState {
  return {
    id: option.id,
    label: option.label,
    chance: option.chance,
    successText: option.successText ?? option.success_text,
    failText: option.failText ?? option.fail_text,
    successEffects: normalizeOptionEffect(option.effect?.onSuccess),
    failEffects: normalizeOptionEffect(option.effect?.onFail),
  };
}

export function normalizeEventCard(card: RawEventCard): EventCardState {
  if (!card.options?.length) {
    return card;
  }

  const { options, ...rest } = card;
  const choices = options.map((option) => normalizeOption(option));
  return {
    ...rest,
    choices,
  };
}

export function normalizeEventDeck(deck: RawEventCard[]): EventCardState[] {
  return deck.map((card) => normalizeEventCard(card));
}
