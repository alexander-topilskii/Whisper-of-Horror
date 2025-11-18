import characterSettings from "./character-settings.json";
import eventCard from "./event-card.json";
import handCards from "./hand-cards.json";
import journalScript from "./journal-script.json";
import scenario from "./scenario.json";
import worldSettings from "./world-settings.json";
import type { CardDefinition, GameState, JournalScriptEntry } from "../../widgets/game-engine/state";
import { normalizeEventDeck, type RawEventCard } from "./normalize-event-cards";
import { createEventPlaceholder } from "./event-placeholder";

const initialState = {
  ...worldSettings,
  ...characterSettings,
  ...scenario,
  decks: {
    ...worldSettings.decks,
    player: {
      ...worldSettings.decks?.player,
      drawPile: [],
      discardPile: [],
    },
    event: {
      ...worldSettings.decks?.event,
      drawPile: [],
      discardPile: [],
    },
  },
  hand: [],
  event: createEventPlaceholder(),
  journalScript: { entries: [], nextIndex: 0, completed: false },
  loopStage: "story",
  eventResolutionPending: false,
  eventResolutionSummary: null,
  gameOutcome: null,
  ending: null,
  temporaryMarkers: [],
  lastCardPlay: null,
} as GameState;

initialState.modifiers = [];

function createShuffledDeck<T>(cards: T[] | undefined): T[] {
  const deck = [...(cards ?? [])];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

const playerDeckData = handCards.playerDeck ?? { hand: [], drawPile: [], discardPile: [] };
const shuffledPlayerDeck = createShuffledDeck<CardDefinition>([
  ...((playerDeckData.hand ?? []) as CardDefinition[]),
  ...((playerDeckData.drawPile ?? []) as CardDefinition[]),
]);

initialState.hand = [];
initialState.decks.player.drawPile = shuffledPlayerDeck;
initialState.decks.player.discardPile = playerDeckData.discardPile ?? [];
initialState.decks.player.draw = shuffledPlayerDeck.length;
initialState.decks.player.discard = initialState.decks.player.discardPile.length;

const rawEventDeck: RawEventCard[] = (eventCard.eventDeck as RawEventCard[] | undefined) ?? [];
const eventDeckData = normalizeEventDeck(rawEventDeck);
const shuffledEventDeck = createShuffledDeck(eventDeckData);
initialState.decks.event.drawPile = shuffledEventDeck;
initialState.decks.event.discardPile = [];
initialState.decks.event.draw = shuffledEventDeck.length;
initialState.decks.event.discard = 0;
initialState.decks.event.next = shuffledEventDeck[0]?.title ?? null;

const firstTask = initialState.scenario?.firstTask;
const goal = firstTask?.technicalGoal;
const fail = firstTask?.technicalFailCondition;

const tutorialEntries: JournalScriptEntry[] = [];

function normalizeScenarioIllustration(path?: string | null): string | undefined {
  if (!path) {
    return undefined;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('//')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  const normalized = trimmed.replace(/^\.\//, '').replace(/^src\//, '');
  return `/${normalized}`;
}

function appendScenarioMessagesToLog(state: GameState) {
  const scenario = state.scenario;
  if (!scenario) {
    return;
  }

  const intro = scenario.intro;
  if (intro?.flavor?.length) {
    const introType = `[Пролог] ${intro.title ?? scenario.title ?? "Сценарий"}`;
    const introBody = intro.flavor.join("\n\n");
    const introIllustration = normalizeScenarioIllustration(intro.flavor_img);
    tutorialEntries.push({
      id: "scenario-intro",
      type: introType,
      body: introBody,
      variant: "story",
      illustration: introIllustration,
    });
  }

  const task = scenario.firstTask;
  if (task) {
    const taskType = `[Задание] ${task.label}`;
    const summaryParts = [task.summary];
    if (task.goal) {
      summaryParts.push("", `Цель: ${task.goal}`);
    }
    if (task.failCondition) {
      summaryParts.push(`Провал: ${task.failCondition}`);
    }
    const taskIllustration = normalizeScenarioIllustration(task.flavor_img);
    tutorialEntries.push({
      id: task.id ?? "scenario-task",
      type: taskType,
      body: summaryParts.filter(Boolean).join("\n"),
      variant: "story",
      illustration: taskIllustration,
    });
  }
}

appendScenarioMessagesToLog(initialState);

const technicalEntries = (journalScript.journalScript as JournalScriptEntry[] | undefined) ?? [];
tutorialEntries.push(...technicalEntries);

initialState.journalScript = {
  entries: tutorialEntries,
  nextIndex: 0,
  completed: tutorialEntries.length === 0,
};

initialState.loopStage = initialState.journalScript.completed ? "player" : "story";
initialState.eventResolutionPending = false;
initialState.eventResolutionSummary = null;
initialState.gameOutcome = null;
initialState.ending = null;

initialState.worldTracks = [
  {
    id: "victory",
    label: goal?.label ?? "Улики",
    value: goal?.currentAmount ?? 0,
    max: goal?.requiredAmount ?? 0,
    type: "victory",
    criticalThreshold: goal?.requiredAmount ?? undefined,
  },
  {
    id: "doom",
    label: fail?.label ?? "Ужас",
    value: fail?.currentAmount ?? 0,
    max: fail?.requiredAmount ?? 0,
    type: "doom",
    criticalThreshold: fail?.requiredAmount ?? undefined,
  },
];

initialState.temporaryMarkers = [
  {
    id: "cold",
    label: "Холод",
    description: "Каждая единица холода отнимает 1 очко действия до конца хода.",
    tone: "negative",
    value: 0,
    max: 3,
    actionPenaltyPerStack: 1,
  },
  {
    id: "fear",
    label: "Страх",
    description: "Краткосрочный ужас ослабевает на 1 в конце вашего хода.",
    tone: "negative",
    value: 0,
    max: 4,
  },
];

export default initialState;
