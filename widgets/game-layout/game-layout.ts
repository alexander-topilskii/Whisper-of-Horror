import { GameEngine } from "../game-engine/engine";
import type { GameState } from "../game-engine/state";
import {
  AppendLogEntryCommand,
  AdvanceJournalCommand,
  CompleteEventPhaseCommand,
  EndTurnCommand,
  StartNewGameCommand,
  ToggleSoundCommand,
} from "../game-engine/commands";
import { buildGameLayoutDOM } from "./template";
import { injectGameLayoutStyles } from "./styles";
import { LogPanelView } from "./log-panel/view";
import { StatusSidebarView } from "./status-sidebar/view";
import { InteractionView } from "./interaction-panel/view";
import { expectElement, type TooltipDelegate } from "./dom-utils";
import type { GameWidget } from "./widgets/game-widget";
import { HandWidget } from "./widgets/hand-widget";
import { EventChoicesWidget } from "./widgets/event-choices-widget";

export class GameLayout {
  private readonly root: HTMLElement;
  private engine: GameEngine | null = null;
  private readonly logView: LogPanelView;
  private readonly interactionView: InteractionView;
  private readonly statusSidebar: StatusSidebarView;
  private readonly soundToggle: HTMLButtonElement;
  private readonly newGameButton: HTMLButtonElement;
  private readonly settingsButton: HTMLButtonElement;

  private readonly widgets: GameWidget[];

  private readonly handleNewGameClick = () => {
    if (!this.engine) {
      return;
    }

    this.engine.dispatch(new StartNewGameCommand(this.engine.getInitialStateSnapshot()));
  };

  private readonly handleSettingsClick = () => {
    if (!this.engine) {
      return;
    }

    this.engine.dispatch(
      new AppendLogEntryCommand('[Система]', 'Меню настроек пока недоступно.', 'system'),
    );
  };

  private readonly handleSoundToggleClick = () => {
    if (!this.engine) {
      return;
    }

    this.engine.dispatch(new ToggleSoundCommand());
  };

  private readonly handleAdvanceLogClick = () => {
    if (!this.engine) {
      return;
    }

    this.engine.dispatch(new AdvanceJournalCommand());
  };

  private readonly handleEndTurnClick = () => {
    if (!this.engine) {
      return;
    }

    this.engine.dispatch(new EndTurnCommand());
  };

  private readonly handleCompleteEventClick = () => {
    if (!this.engine) {
      return;
    }

    this.engine.dispatch(new CompleteEventPhaseCommand());
  };

  constructor(root: HTMLElement) {
    if (!root) {
      throw new Error('GameLayout requires a valid root element');
    }

    injectGameLayoutStyles();
    this.root = root;
    const dom = buildGameLayoutDOM();
    this.root.replaceChildren(dom);

    const tooltipDelegate: TooltipDelegate = this.applyTooltip.bind(this);
    this.logView = new LogPanelView(this.root);
    this.statusSidebar = new StatusSidebarView(this.root, tooltipDelegate);
    this.interactionView = new InteractionView(this.root, tooltipDelegate);
    this.soundToggle = expectElement(this.root, '[data-action="toggle-sound"]');
    this.newGameButton = expectElement(this.root, '[data-action="new-game"]');
    this.settingsButton = expectElement(this.root, '[data-action="settings"]');

    this.enableTooltipToggles();
    this.enableTooltipPositioning();
    this.newGameButton.addEventListener('click', this.handleNewGameClick);
    this.settingsButton.addEventListener('click', this.handleSettingsClick);
    this.soundToggle.addEventListener('click', this.handleSoundToggleClick);
    this.interactionView.logAdvanceButton.addEventListener('click', this.handleAdvanceLogClick);
    this.interactionView.endTurnButton.addEventListener('click', this.handleEndTurnClick);
    this.interactionView.eventContinueButton.addEventListener('click', this.handleCompleteEventClick);
    this.interactionView.endingRestartButton.addEventListener('click', this.handleNewGameClick);

    this.widgets = [
      new HandWidget(() => this.engine, this.interactionView),
      new EventChoicesWidget(() => this.engine),
    ];
    this.widgets.forEach((widget) => widget.mount(this.root));
  }

  public bind(engine: GameEngine): void {
    if (this.engine) {
      throw new Error('GameLayout is already bound to an engine');
    }

    this.engine = engine;
  }

  public render(state: GameState): void {
    this.interactionView.renderTurn(state.turn, state.decks, state.hand, state.lastCardPlay);
    this.interactionView.renderEvent(state);
    this.interactionView.renderStage(state);
    this.statusSidebar.renderPhase(state.phase);
    this.statusSidebar.renderScenario(state.scenario);
    this.statusSidebar.renderWorldTracks(state.worldTracks);
    this.statusSidebar.renderNpcs(state.npcs);
    this.statusSidebar.renderCharacterStats(state.characterStats);
    this.statusSidebar.renderStatuses(state.statuses, state.temporaryMarkers);
    this.logView.render(state.log, state.autoScrollLog);
    this.updateSoundToggle(state.soundEnabled);
    this.interactionView.updateGuidanceHighlights(state);
    this.widgets.forEach((widget) => widget.render(state));
  }

  private updateSoundToggle(enabled: boolean): void {
    this.soundToggle.textContent = enabled ? '🔊' : '🔇';
    this.soundToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  private applyTooltip(element: HTMLElement, tooltip?: string): void {
    if (!tooltip) {
      element.classList.remove('woh-tooltip');
      element.removeAttribute('data-tooltip');
      element.removeAttribute('data-expanded');
      element.removeAttribute('data-tooltip-placement');
      element.querySelector('.woh-tooltip-bubble')?.remove();
      return;
    }

    element.classList.add('woh-tooltip');
    element.setAttribute('data-tooltip', tooltip);
    element.setAttribute('data-expanded', 'false');

    let bubble = element.querySelector<HTMLSpanElement>('.woh-tooltip-bubble');
    if (!bubble) {
      bubble = document.createElement('span');
      bubble.className = 'woh-tooltip-bubble';
      bubble.setAttribute('role', 'tooltip');
      bubble.setAttribute('aria-hidden', 'true');
      element.append(bubble);
    }
    bubble.textContent = tooltip;
    this.updateTooltipPosition(element);
  }

  private enableTooltipToggles(): void {
    this.root.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('.woh-tooltip');
      if (!target || !this.root.contains(target)) {
        return;
      }

      const isExpanded = target.getAttribute('data-expanded') === 'true';
      this.root.querySelectorAll<HTMLElement>('.woh-tooltip[data-expanded="true"]').forEach((element) => {
        if (element !== target) {
          element.setAttribute('data-expanded', 'false');
        }
      });
      target.setAttribute('data-expanded', String(!isExpanded));
      if (!isExpanded) {
        this.updateTooltipPosition(target);
      }
    });

    this.root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('.woh-tooltip');
      if (!target || !this.root.contains(target)) {
        return;
      }

      event.preventDefault();
      target.click();
    });
  }

  private enableTooltipPositioning(): void {
    const updateFromEvent = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('.woh-tooltip');
      if (!target || !this.root.contains(target)) {
        return;
      }
      this.updateTooltipPosition(target);
    };

    this.root.addEventListener('pointerenter', updateFromEvent, true);
    this.root.addEventListener('focusin', updateFromEvent);
    window.addEventListener('resize', this.handleTooltipResize);
  }

  private readonly handleTooltipResize = () => {
    this.root.querySelectorAll<HTMLElement>('.woh-tooltip[data-expanded="true"]').forEach((element) => {
      this.updateTooltipPosition(element);
    });
  };

  private updateTooltipPosition(element: HTMLElement): void {
    const bubble = element.querySelector<HTMLElement>('.woh-tooltip-bubble');
    if (!bubble) {
      return;
    }

    const viewportPadding = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const bubbleRect = bubble.getBoundingClientRect();
    const hostRect = element.getBoundingClientRect();

    let horizontalShift = 0;
    if (bubbleRect.left < viewportPadding) {
      horizontalShift = viewportPadding - bubbleRect.left;
    } else if (bubbleRect.right > viewportWidth - viewportPadding) {
      horizontalShift = viewportWidth - viewportPadding - bubbleRect.right;
    }
    bubble.style.setProperty('--tooltip-shift', `${horizontalShift}px`);

    const spaceAbove = hostRect.top;
    const spaceBelow = viewportHeight - hostRect.bottom;
    const bubbleHeight = bubbleRect.height + 16;
    let placement: 'top' | 'bottom' = 'top';

    if (bubbleHeight > spaceAbove && spaceBelow > spaceAbove) {
      placement = 'bottom';
    } else if (bubbleHeight > spaceBelow && spaceAbove > spaceBelow) {
      placement = 'top';
    }

    element.setAttribute('data-tooltip-placement', placement);
  }
}
