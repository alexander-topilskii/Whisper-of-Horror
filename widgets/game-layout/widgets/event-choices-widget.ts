import { ResolveEventChoiceCommand } from "../../game-engine/commands";
import type { GameEngine } from "../../game-engine/engine";
import type { GameState } from "../../game-engine/state";
import { expectElement } from "../dom-utils";
import type { GameWidget } from "./game-widget";

const COMMAND_ID = "resolve-choice";

type EventChoicePayload = {
  choiceId: string;
};

export class EventChoicesWidget implements GameWidget {
  private host: HTMLElement | null = null;

  constructor(private readonly getEngine: () => GameEngine | null) {}

  public mount(root: HTMLElement): void {
    this.host = expectElement<HTMLElement>(root, '[data-role="event-choices"]');
    this.host.addEventListener("click", this.handleClick);
  }

  public render(_: GameState): void {
    // Event choices rely on the current engine state instead of a cached snapshot.
  }

  public handleCommand(commandId: string, payload?: unknown): void {
    if (commandId !== COMMAND_ID) {
      return;
    }

    const typedPayload = payload as EventChoicePayload | undefined;
    if (!typedPayload?.choiceId) {
      return;
    }

    const engine = this.getEngine();
    if (!engine) {
      return;
    }

    engine.dispatch(new ResolveEventChoiceCommand(typedPayload.choiceId));
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

    const choiceId = target.dataset.choiceId;
    if (!choiceId) {
      return;
    }

    this.handleCommand(COMMAND_ID, { choiceId });
  };
}
