export interface ActionPoolState {
  remaining: number;
  total: number;
}

export interface TurnState {
  number: number;
  actions: ActionPoolState;
}

export interface PlayerDeckState {
  draw: number;
  discard: number;
}

export interface EventDeckState {
  draw: number;
  discard: number;
  next: string | null;
}

export interface DeckCollectionState {
  player: PlayerDeckState;
  event: EventDeckState;
}

export interface CardDefinition {
  id: string;
  name: string;
  description: string;
  costs: string[];
  actionCost?: number;
  tooltip?: string;
  playable: boolean;
}

export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  tone: "positive" | "negative" | "neutral";
}

export interface NpcTimerState {
  current: number;
  max: number;
}

export interface NpcDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  tooltip: string;
  timer: NpcTimerState;
}

export interface TrackState {
  id: string;
  label: string;
  value: number;
  max: number;
  type: "victory" | "doom" | "generic";
  criticalThreshold?: number;
}

export interface CharacterStatState {
  id: string;
  label: string;
  value: number;
  max: number;
  criticalThreshold?: number;
}

export interface StatDelta {
  statId: string;
  delta: number;
}

export interface EventChoiceEffect {
  logType?: string;
  doomDelta?: number;
  victoryDelta?: number;
  statDeltas?: StatDelta[];
  actionsDelta?: number;
  cluesGained?: number;
}

export interface EventChoiceState {
  id: string;
  label: string;
  result: string;
  resolved?: boolean;
  effects?: EventChoiceEffect;
}

export interface EventCardState {
  title: string;
  flavor: string;
  effect: string;
  choices: EventChoiceState[];
}

export interface LogEntry {
  id: string;
  type: string;
  body: string;
}

export interface GameState {
  turn: TurnState;
  decks: DeckCollectionState;
  hand: CardDefinition[];
  phase: {
    icon: string;
    name: string;
    subtitle: string;
  };
  worldTracks: TrackState[];
  characterStats: CharacterStatState[];
  statuses: StatusEffect[];
  npcs: NpcDefinition[];
  event: EventCardState;
  log: LogEntry[];
  autoScrollLog: boolean;
  soundEnabled: boolean;
}

export interface GameCommand {
  readonly type: string;
  readonly description?: string;
  execute(state: GameState): GameState;
}

export type GameStateListener = (state: GameState) => void;

const LOG_LIMIT = 20;

function cloneState<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function generateLogId(): string {
  return `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function pushLogEntry(state: GameState, type: string, body: string) {
  const entry: LogEntry = {
    id: generateLogId(),
    type,
    body,
  };

  state.log = [entry, ...state.log].slice(0, LOG_LIMIT);
}

function applyStatDeltas(state: GameState, deltas: StatDelta[] | undefined) {
  if (!deltas?.length) {
    return;
  }

  deltas.forEach((delta) => {
    const stat = state.characterStats.find((item) => item.id === delta.statId);
    if (!stat) {
      return;
    }

    stat.value = clamp(stat.value + delta.delta, 0, stat.max);
  });
}

function adjustTrack(state: GameState, trackId: string, delta: number) {
  const track = state.worldTracks.find((item) => item.id === trackId);
  if (!track) {
    return;
  }

  track.value = clamp(track.value + delta, 0, track.max);
}

function adjustActions(state: GameState, delta: number) {
  const pool = state.turn.actions;
  pool.remaining = clamp(pool.remaining + delta, 0, pool.total);
}

export class GameEngine {
  private readonly initialState: GameState;
  private state: GameState;
  private readonly listeners = new Set<GameStateListener>();
  private readonly history: GameCommand[] = [];

  constructor(initialState: GameState) {
    this.initialState = cloneState(initialState);
    this.state = cloneState(initialState);
  }

  public getState(): GameState {
    return cloneState(this.state);
  }

  public getInitialStateSnapshot(): GameState {
    return cloneState(this.initialState);
  }

  public subscribe(listener: GameStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public dispatch(command: GameCommand): void {
    const workingState = cloneState(this.state);
    const nextState = command.execute(workingState);
    this.state = nextState;
    this.history.push(command);
    this.emit();
  }

  private emit() {
    const snapshot = cloneState(this.state);
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export class StartNewGameCommand implements GameCommand {
  public readonly type = "start-new-game";
  public readonly description = "Сброс состояния к начальному снимку";

  constructor(private readonly snapshot: GameState) {}

  execute(_: GameState): GameState {
    const nextState = cloneState(this.snapshot);
    nextState.turn.number = 1;
    nextState.turn.actions.remaining = nextState.turn.actions.total;
    pushLogEntry(nextState, "[Система]", "Начата новая партия. Следопыты делают первый вдох.");
    return nextState;
  }
}

export class PlayCardCommand implements GameCommand {
  public readonly type = "play-card";

  constructor(private readonly cardId: string) {}

  execute(state: GameState): GameState {
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

    if (state.decks.player.draw > 0) {
      state.decks.player.draw = clamp(state.decks.player.draw - 1, 0, Number.MAX_SAFE_INTEGER);
    }
    state.decks.player.discard += 1;

    pushLogEntry(state, "[Действие]", `Сыграна карта «${card.name}». ${card.description}`);
    return state;
  }
}

export class ResolveEventChoiceCommand implements GameCommand {
  public readonly type = "resolve-event-choice";

  constructor(private readonly choiceId: string) {}

  execute(state: GameState): GameState {
    const choice = state.event.choices.find((item) => item.id === this.choiceId);
    if (!choice) {
      pushLogEntry(state, "[Система]", "Выбор события не найден.");
      return state;
    }

    if (choice.resolved) {
      pushLogEntry(state, choice.effects?.logType ?? "[Событие]", "Эта развилка уже завершена.");
      return state;
    }

    choice.resolved = true;

    const logType = choice.effects?.logType ?? "[Событие]";
    applyStatDeltas(state, choice.effects?.statDeltas);

    if (choice.effects?.doomDelta) {
      adjustTrack(state, "doom", choice.effects.doomDelta);
    }

    if (choice.effects?.victoryDelta) {
      adjustTrack(state, "victory", choice.effects.victoryDelta);
    }

    if (choice.effects?.actionsDelta) {
      adjustActions(state, choice.effects.actionsDelta);
    }

    if (choice.effects?.cluesGained) {
      pushLogEntry(state, "[Улика]", `Получено улик: ${choice.effects.cluesGained}.`);
    }

    pushLogEntry(state, logType, choice.result);
    return state;
  }
}

export class ToggleSoundCommand implements GameCommand {
  public readonly type = "toggle-sound";

  execute(state: GameState): GameState {
    state.soundEnabled = !state.soundEnabled;
    pushLogEntry(state, "[Система]", state.soundEnabled ? "Звук включён." : "Звук отключён.");
    return state;
  }
}

export class AppendLogEntryCommand implements GameCommand {
  public readonly type = "append-log";

  constructor(private readonly entryType: string, private readonly body: string) {}

  execute(state: GameState): GameState {
    pushLogEntry(state, this.entryType, this.body);
    return state;
  }
}
