import type { GameState } from "../../widgets/game-engine/state";
import placeholderData from "./event-placeholder.json";

const EVENT_PLACEHOLDER = placeholderData.event;

export function createEventPlaceholder(): GameState["event"] {
  return structuredClone(EVENT_PLACEHOLDER) as GameState["event"];
}
