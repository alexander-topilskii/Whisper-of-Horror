import { PlayCardCommand } from "../../game-engine/commands";
import type { GameEngine } from "../../game-engine/engine";
import type { GameState } from "../../game-engine/state";
import { expectElement } from "../dom-utils";
import { InteractionView } from "../interaction-panel/view";
import type { GameWidget } from "./game-widget";

const COMMAND_ID = "play-card";

type HandCommandPayload = {
  cardId: string;
  target?: HTMLElement;
};

export class HandWidget implements GameWidget {
  private host: HTMLElement | null = null;
  private state: GameState | null = null;

  constructor(
    private readonly getEngine: () => GameEngine | null,
    private readonly interactionView: InteractionView,
  ) {}

  public mount(root: HTMLElement): void {
    this.host = expectElement<HTMLElement>(root, '[data-role="hand"]');
    this.host.addEventListener("click", this.handleClick);
  }

  public render(state: GameState): void {
    this.state = state;
  }

  public handleCommand(commandId: string, payload?: unknown): void {
    if (commandId !== COMMAND_ID) {
      return;
    }

    const typedPayload = payload as HandCommandPayload | undefined;
    if (!typedPayload?.cardId) {
      return;
    }

    const engine = this.getEngine();
    if (!engine) {
      return;
    }

    const state = this.state ?? engine.getState();
    const card = state.hand.find((handCard) => handCard.id === typedPayload.cardId);
    if (!card) {
      return;
    }

    const actionCost = card.actionCost ?? 1;
    const hasActions = state.turn.actions.remaining >= actionCost;
    if (typedPayload.target && card.playable && hasActions) {
      this.interactionView.captureCardSnapshot(card.id, typedPayload.target);
    } else if (typedPayload.target && !hasActions) {
      this.interactionView.indicateInsufficientActions(typedPayload.target);
    }

    engine.dispatch(new PlayCardCommand(card.id));
  }

  public destroy(): void {
    this.host?.removeEventListener("click", this.handleClick);
  }

  private readonly handleClick = (event: MouseEvent) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      `[data-command="${COMMAND_ID}"]`,
    );
    if (!target || !this.host?.contains(target)) {
      return;
    }

    const cardId = target.dataset.cardId;
    if (!cardId) {
      return;
    }

    this.handleCommand(COMMAND_ID, { cardId, target });
  };
}
