import type { GameState } from "../../game-engine/state";

export type WidgetCommandPayload = {
  target: HTMLElement;
  dataset: DOMStringMap;
};

export interface GameWidget {
  mount(root: HTMLElement): void;
  render(state: GameState): void;
  handleCommand?(commandId: string, payload?: unknown): void;
  destroy?(): void;
}
