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
  drawPile: CardDefinition[];
  discardPile: CardDefinition[];
}

export interface EventDeckState {
  draw: number;
  discard: number;
  next: string | null;
  drawPile: EventCardState[];
  discardPile: EventCardState[];
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
  effects?: EventChoiceEffect;
  type?: string;
  effect?: number;
  chance?: number;
  successCount?: number;
  failCount?: number;
  flavor?: string;
  successText?: string;
  failText?: string;
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
  logVariant?: LogEntryVariant;
  doomDelta?: number;
  victoryDelta?: number;
  statDeltas?: StatDelta[];
  actionsDelta?: number;
  cluesGained?: number;
  noise?: number;
}

export interface EventChoiceState {
  id: string;
  label: string;
  result?: string;
  resolved?: boolean;
  effects?: EventChoiceEffect;
  chance?: number;
  successText?: string;
  failText?: string;
  successEffects?: EventChoiceEffect;
  failEffects?: EventChoiceEffect;
  outcome?: "success" | "fail";
}

export interface EventCardState {
  id: string;
  title: string;
  flavor: string;
  effect: string;
  type?: string;
  choices?: EventChoiceState[];
  immediateEffects?: EventChoiceEffect;
}

export type LogEntryVariant = "story" | "system" | "effect" | "player";

export interface LogEntry {
  id: string;
  type: string;
  body: string;
  variant?: LogEntryVariant;
}

export interface ScenarioIntroState {
  title: string;
  type: string;
  flavor: string[];
}

export interface ScenarioTaskConditionState {
  label: string;
  resource: string;
  requiredAmount: number;
  currentAmount?: number;
}

export interface ScenarioTaskState {
  id: string;
  label: string;
  summary: string;
  goal: string;
  technicalGoal: ScenarioTaskConditionState;
  flavor: string;
  failCondition: string;
  technicalFailCondition: ScenarioTaskConditionState;
}

export interface ScenarioState {
  actId: string;
  title: string;
  intro: ScenarioIntroState;
  firstTask: ScenarioTaskState;
}

export interface JournalScriptEntry {
  id: string;
  type: string;
  body: string;
  variant?: LogEntryVariant;
}

export interface JournalScriptState {
  entries: JournalScriptEntry[];
  nextIndex: number;
  completed: boolean;
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
  scenario: ScenarioState;
  log: LogEntry[];
  journalScript: JournalScriptState;
  loopStage: "story" | "player" | "event" | "finished";
  eventResolutionPending: boolean;
  gameOutcome: "victory" | "defeat" | null;
  autoScrollLog: boolean;
  soundEnabled: boolean;
}

export interface GameCommand {
  readonly type: string;
  readonly description?: string;
  execute(state: GameState): GameState;
}

export type GameStateListener = (state: GameState) => void;

export function cloneState<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

const LOG_LIMIT = 20;

function generateLogId(): string {
  return `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pushLogEntry(
  state: GameState,
  type: string,
  body: string,
  variant: LogEntryVariant = "story",
) {
  const entry: LogEntry = {
    id: generateLogId(),
    type,
    body,
    variant,
  };

  state.log = [entry, ...state.log].slice(0, LOG_LIMIT);
}
