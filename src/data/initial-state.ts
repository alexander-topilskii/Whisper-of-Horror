import characterSettings from "./character-settings.json";
import eventCard from "./event-card.json";
import handCards from "./hand-cards.json";
import scenario from "./scenario.json";
import worldSettings from "./world-settings.json";
import type { GameState } from "../../widgets/game-engine/state";
import { pushLogEntry } from "../../widgets/game-engine/state";

const initialState = {
  ...worldSettings,
  ...characterSettings,
  ...handCards,
  ...eventCard,
  ...scenario,
} as GameState;

const firstTask = initialState.scenario?.firstTask;
const goal = firstTask?.technicalGoal;
const fail = firstTask?.technicalFailCondition;

function appendScenarioMessagesToLog(state: GameState) {
  const scenario = state.scenario;
  if (!scenario) {
    return;
  }

  const intro = scenario.intro;
  if (intro?.flavor?.length) {
    const introType = `[Пролог] ${intro.title ?? scenario.title ?? "Сценарий"}`;
    const introBody = intro.flavor.join("\n\n");
    pushLogEntry(state, introType, introBody);
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
    pushLogEntry(state, taskType, summaryParts.filter(Boolean).join("\n"));
  }
}

appendScenarioMessagesToLog(initialState);

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
