import characterSettings from "./character-settings.json";
import eventCard from "./event-card.json";
import handCards from "./hand-cards.json";
import journalScript from "./journal-script.json";
import scenario from "./scenario.json";
import worldSettings from "./world-settings.json";
import type { GameState, JournalScriptEntry } from "../../widgets/game-engine/state";
import { pushLogEntry } from "../../widgets/game-engine/state";
import { normalizeEventDeck, type RawEventCard } from "./normalize-event-cards";

const placeholderEvent: GameState["event"] = {
  id: "no-event",
  title: "Тишина перед бурей",
  flavor: "Вы ещё только вслушиваетесь в шёпот Старого района.",
  effect: "Дождитесь сигнала и нажмите «Далее», чтобы перейти к действиям.",
  type: "mystery",
  choices: [],
};

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
  event: placeholderEvent,
  journalScript: { entries: [], nextIndex: 0, completed: false },
  loopStage: "story",
  eventResolutionPending: false,
  gameOutcome: null,
} as GameState;

function createShuffledDeck<T>(cards: T[] | undefined): T[] {
  const deck = [...(cards ?? [])];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

const STARTING_HAND_SIZE = 3;
const playerDeckData = handCards.playerDeck ?? { hand: [], drawPile: [], discardPile: [] };
const predefinedHand = playerDeckData.hand ?? [];
const plannedOpeningCards = predefinedHand.slice(0, STARTING_HAND_SIZE);
const overflowHand = predefinedHand.slice(STARTING_HAND_SIZE);
const combinedDrawPile = [...overflowHand, ...(playerDeckData.drawPile ?? [])];
const shuffledDrawPile = createShuffledDeck(combinedDrawPile);

while (plannedOpeningCards.length < STARTING_HAND_SIZE && shuffledDrawPile.length) {
  const nextCard = shuffledDrawPile.shift();
  if (!nextCard) {
    break;
  }
  plannedOpeningCards.push(nextCard);
}

initialState.hand = [];
initialState.decks.player.drawPile = [...plannedOpeningCards, ...shuffledDrawPile];
initialState.decks.player.discardPile = playerDeckData.discardPile ?? [];
initialState.decks.player.draw = initialState.decks.player.drawPile.length;
initialState.decks.player.discard = initialState.decks.player.discardPile.length;

const rawEventDeck: RawEventCard[] = (eventCard.eventDeck as RawEventCard[] | undefined) ?? [];
const eventDeckData = normalizeEventDeck(rawEventDeck);
initialState.decks.event.drawPile = createShuffledDeck(eventDeckData);
initialState.decks.event.discardPile = [];
initialState.decks.event.draw = eventDeckData.length;
initialState.decks.event.discard = 0;
initialState.decks.event.next = eventDeckData[0]?.title ?? null;

const firstTask = initialState.scenario?.firstTask;
const goal = firstTask?.technicalGoal;
const fail = firstTask?.technicalFailCondition;

const tutorialEntries: JournalScriptEntry[] = [];

function appendScenarioMessagesToLog(state: GameState) {
  const scenario = state.scenario;
  if (!scenario) {
    return;
  }

  const intro = scenario.intro;
  if (intro?.flavor?.length) {
    const introType = `[Пролог] ${intro.title ?? scenario.title ?? "Сценарий"}`;
    const introBody = intro.flavor.join("\n\n");
    tutorialEntries.push({ id: "scenario-intro", type: introType, body: introBody });
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
    tutorialEntries.push({ id: task.id ?? "scenario-task", type: taskType, body: summaryParts.filter(Boolean).join("\n") });
  }
}

appendScenarioMessagesToLog(initialState);

const technicalEntries = (journalScript.journalScript as JournalScriptEntry[] | undefined) ?? [];
tutorialEntries.push(...technicalEntries);

const firstEntry = tutorialEntries[0];
if (firstEntry) {
  pushLogEntry(initialState, firstEntry.type, firstEntry.body);
}

initialState.journalScript = {
  entries: tutorialEntries,
  nextIndex: firstEntry ? 1 : 0,
  completed: tutorialEntries.length <= 1,
};

initialState.loopStage = initialState.journalScript.completed ? "player" : "story";
initialState.eventResolutionPending = false;
initialState.gameOutcome = null;

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

export default initialState;
