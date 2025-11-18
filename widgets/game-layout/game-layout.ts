import { GameEngine } from "../game-engine/engine";
import type { GameState } from "../game-engine/state";
import {
  AppendLogEntryCommand,
  AdvanceJournalCommand,
  CompleteEventPhaseCommand,
  EndTurnCommand,
  PlayCardCommand,
  ResolveEventChoiceCommand,
  StartNewGameCommand,
  ToggleSoundCommand,
} from "../game-engine/commands";
import { buildGameLayoutDOM } from "./template";
import { injectGameLayoutStyles, statMeterPresets } from "./styles";

type StatChangeVariant = "heal" | "damage";
type TooltipDelegate = (element: HTMLElement, tooltip?: string) => void;

type CardSnapshot = {
  cardId: string;
  rect: DOMRect;
};

type LastCardPlay = NonNullable<GameState['lastCardPlay']>;

function expectElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`GameLayout expected element ${selector}`);
  }
  return element;
}

class LogPanelView {
  private readonly logEntries: HTMLDivElement;
  private lastRenderedLogSize = 0;

  constructor(host: HTMLElement) {
    this.logEntries = expectElement<HTMLDivElement>(host, '[data-role="log-entries"]');
  }

  public render(log: GameState['log'], autoScroll: boolean): void {
    this.logEntries.innerHTML = '';

    if (!log.length) {
      const empty = document.createElement('p');
      empty.className = 'woh-log-empty';
      empty.textContent = 'Журнал пуст';
      this.logEntries.append(empty);
      this.lastRenderedLogSize = 0;
      return;
    }

    const fragment = document.createDocumentFragment();
    log.forEach((entry) => {
      const item = document.createElement('article');
      item.className = 'woh-log-entry';
      item.dataset.logId = entry.id;
      item.dataset.variant = entry.variant ?? 'story';

      const type = document.createElement('span');
      type.className = 'woh-log-entry-type';
      type.textContent = entry.type;

      const body = document.createElement('p');
      body.className = 'woh-log-entry-body';
      body.textContent = entry.body;

      item.append(type, body);
      fragment.append(item);
    });

    this.logEntries.append(fragment);

    if (autoScroll && log.length !== this.lastRenderedLogSize) {
      if (this.lastRenderedLogSize) {
        this.logEntries.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.logEntries.scrollTop = 0;
      }
    }

    this.lastRenderedLogSize = log.length;
  }
}

class StatusSidebarView {
  private readonly statusEffects: HTMLElement;
  private readonly npcList: HTMLElement;
  private readonly worldTracks: HTMLElement;
  private readonly scenarioTitle: HTMLElement;
  private readonly characterStats: HTMLElement;
  private readonly phaseIcon: HTMLElement;
  private readonly phaseTitle: HTMLElement;
  private readonly phaseSubtitle: HTMLElement;
  private statSnapshot = new Map<string, number>();

  constructor(host: HTMLElement, private readonly applyTooltip: TooltipDelegate) {
    this.statusEffects = expectElement(host, '[data-role="status-effects"]');
    this.npcList = expectElement(host, '[data-role="npc-list"]');
    this.worldTracks = expectElement(host, '[data-role="world-tracks"]');
    this.scenarioTitle = expectElement(host, '[data-role="scenario-title"]');
    this.characterStats = expectElement(host, '[data-role="character-stats"]');
    this.phaseIcon = expectElement(host, '[data-role="phase-icon"]');
    this.phaseTitle = expectElement(host, '[data-role="phase-title"]');
    this.phaseSubtitle = expectElement(host, '[data-role="phase-subtitle"]');
  }

  public renderPhase(phase: GameState['phase']): void {
    this.phaseIcon.textContent = phase.icon;
    this.phaseTitle.textContent = phase.name;
    this.phaseSubtitle.textContent = phase.subtitle;
  }

  public renderScenario(scenario: GameState['scenario']): void {
    this.scenarioTitle.textContent = scenario?.title ?? 'Сценарий';
  }

  public renderWorldTracks(tracks: GameState['worldTracks']): void {
    this.worldTracks.innerHTML = '';
    const fragment = document.createDocumentFragment();

    tracks.forEach((track) => {
      const wrapper = document.createElement('div');
      wrapper.className = `woh-track woh-track--${track.type}`;

      const label = document.createElement('div');
      label.className = 'woh-track-label';
      const labelName = document.createElement('span');
      labelName.textContent = track.label;
      const labelValue = document.createElement('span');
      labelValue.textContent = `${track.value} / ${track.max}`;
      label.append(labelName, labelValue);

      const bar = document.createElement('div');
      bar.className = 'woh-track-bar';

      const progress = document.createElement('div');
      progress.className = 'woh-track-progress';
      const ratio = track.max > 0 ? track.value / track.max : 0;
      const progressWidth = Math.max(0, Math.min(100, ratio * 100));
      progress.style.width = `${progressWidth}%`;
      bar.append(progress);

      const marks = document.createElement('div');
      marks.className = 'woh-track-marks';
      for (let index = 1; index < track.max; index += 1) {
        const mark = document.createElement('span');
        mark.className = 'woh-track-mark';
        if (track.criticalThreshold && index === track.criticalThreshold) {
          mark.classList.add('is-critical');
        }
        marks.append(mark);
      }
      bar.append(marks);

      wrapper.append(label, bar);
      fragment.append(wrapper);
    });

    this.worldTracks.append(fragment);
  }

  public renderStatuses(
    statuses: GameState['statuses'],
    markers: GameState['temporaryMarkers'],
  ): void {
    this.statusEffects.innerHTML = '';
    const fragment = document.createDocumentFragment();

    statuses.forEach((status) => {
      const button = document.createElement('button');
      button.className = 'woh-effect-chip';
      button.type = 'button';
      button.textContent = status.name;
      button.dataset.tone = status.tone;
      this.applyTooltip(button, status.description);
      fragment.append(button);
    });

    markers
      .filter((marker) => marker.value > 0)
      .forEach((marker) => {
        const button = document.createElement('button');
        button.className = 'woh-effect-chip';
        button.type = 'button';
        button.textContent = `${marker.label} ×${marker.value}`;
        button.dataset.tone = marker.tone;
        button.dataset.marker = marker.id;
        this.applyTooltip(button, marker.description);
        fragment.append(button);
      });

    this.statusEffects.append(fragment);
  }

  public renderNpcs(npcs: GameState['npcs']): void {
    this.npcList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    npcs.forEach((npc) => {
      const card = document.createElement('div');
      card.className = 'woh-npc-card';
      card.tabIndex = 0;
      this.applyTooltip(card, npc.tooltip);

      const header = document.createElement('div');
      header.className = 'woh-npc-header';

      const avatar = document.createElement('div');
      avatar.className = 'woh-npc-avatar';
      avatar.textContent = npc.icon;

      const info = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'woh-npc-name';
      name.textContent = npc.name;
      const timer = document.createElement('div');
      timer.className = 'woh-npc-timer';
      timer.textContent = `Ходов: ${npc.timer.current} / ${npc.timer.max}`;
      info.append(name, timer);

      header.append(avatar, info);

      const body = document.createElement('div');
      body.className = 'woh-npc-body';
      body.textContent = npc.description;

      card.append(header, body);
      fragment.append(card);
    });

    this.npcList.append(fragment);
  }

  public renderCharacterStats(stats: GameState['characterStats']): void {
    this.characterStats.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const nextSnapshot = new Map<string, number>();
    const pendingEffects: Array<{ card: HTMLElement; delta: number }> = [];

    stats.forEach((stat) => {
      const card = document.createElement('div');
      card.className = 'woh-stat-card';
      if (typeof stat.criticalThreshold === 'number' && stat.value <= stat.criticalThreshold) {
        card.classList.add('is-critical');
      }

      const title = document.createElement('span');
      title.className = 'woh-stat-title';
      title.textContent = stat.label;

      const value = document.createElement('div');
      value.className = 'woh-stat-value';
      value.textContent = String(stat.value);
      const max = document.createElement('span');
      max.textContent = `/ ${stat.max}`;
      value.append(max);

      const meter = document.createElement('div');
      meter.className = 'woh-stat-meter';
      const meterFill = document.createElement('div');
      meterFill.className = 'woh-stat-meter-progress';
      const ratio = stat.max > 0 ? stat.value / stat.max : 0;
      const meterWidth = Math.max(0, Math.min(100, ratio * 100));
      meterFill.style.width = `${meterWidth}%`;

      const preset = statMeterPresets[stat.id] ?? statMeterPresets.default ?? null;
      if (preset?.fill) {
        meter.style.setProperty('--woh-stat-meter-fill', preset.fill);
      }
      if (preset?.glow) {
        meter.style.setProperty('--woh-stat-meter-glow', preset.glow);
      }

      meter.append(meterFill);

      card.append(title, value, meter);
      fragment.append(card);

      const previousValue = this.statSnapshot.get(stat.id);
      if (typeof previousValue === 'number') {
        const delta = stat.value - previousValue;
        if (delta !== 0) {
          pendingEffects.push({ card, delta });
        }
      }
      nextSnapshot.set(stat.id, stat.value);
    });

    this.characterStats.append(fragment);
    this.statSnapshot = nextSnapshot;
    pendingEffects.forEach(({ card, delta }) => this.animateStatCardChange(card, delta));
  }

  private animateStatCardChange(card: HTMLElement, delta: number): void {
    const variant: StatChangeVariant = delta > 0 ? 'heal' : 'damage';
    this.animateStatShake(card, variant);
    this.spawnStatFlash(card, variant);
    this.spawnStatFloatLabel(card, delta);
    const particleCount = Math.min(8, Math.max(3, Math.abs(delta)));
    this.spawnStatParticles(card, variant, particleCount);
  }

  private animateStatShake(card: HTMLElement, variant: StatChangeVariant): void {
    const frames: Keyframe[] =
      variant === 'damage'
        ? [
            { transform: 'translate3d(0, 0, 0) rotate(0)' },
            { transform: 'translate3d(-4px, -2px, 0) rotate(-0.8deg)' },
            { transform: 'translate3d(5px, 2px, 0) rotate(0.8deg)' },
            { transform: 'translate3d(-3px, 1px, 0) rotate(-0.4deg)' },
            { transform: 'translate3d(2px, -1px, 0) rotate(0.2deg)' },
            { transform: 'translate3d(0, 0, 0) rotate(0)' },
          ]
        : [
            { transform: 'translate3d(0, 0, 0)' },
            { transform: 'translate3d(1px, -2px, 0)' },
            { transform: 'translate3d(-1px, 1px, 0)' },
            { transform: 'translate3d(2px, -1px, 0)' },
            { transform: 'translate3d(-1px, 0, 0)' },
            { transform: 'translate3d(0, 0, 0)' },
          ];

    card.animate(frames, {
      duration: variant === 'damage' ? 520 : 650,
      easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)',
    });
  }

  private spawnStatFlash(card: HTMLElement, variant: StatChangeVariant): void {
    const flash = document.createElement('span');
    flash.className = `woh-stat-flash woh-stat-flash--${variant}`;
    card.append(flash);
    window.setTimeout(() => flash.remove(), 1000);
  }

  private spawnStatFloatLabel(card: HTMLElement, delta: number): void {
    const variant: StatChangeVariant = delta > 0 ? 'heal' : 'damage';
    const label = document.createElement('span');
    label.className = `woh-stat-float-label woh-stat-float-label--${variant}`;
    label.textContent = `${variant === 'heal' ? '+' : '-'}${Math.abs(delta)}`;
    const drift = (Math.random() * 20 - 10).toFixed(2);
    const travel = (Math.random() * 24 + 32).toFixed(2);
    label.style.setProperty('--drift-x', `${drift}px`);
    label.style.setProperty('--travel-y', variant === 'heal' ? `-${travel}px` : `${travel}px`);
    card.append(label);
    window.setTimeout(() => label.remove(), 1100);
  }

  private spawnStatParticles(card: HTMLElement, variant: StatChangeVariant, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('span');
      particle.className = `woh-stat-particle woh-stat-particle--${variant}`;
      const offsetX = (Math.random() * 36 - 18).toFixed(2);
      const spread = (Math.random() * 26 + 18).toFixed(2);
      particle.style.setProperty('--particle-x', `${offsetX}px`);
      particle.style.setProperty('--particle-y', variant === 'heal' ? `-${spread}px` : `${spread}px`);
      particle.style.setProperty('--particle-scale', (Math.random() * 0.6 + 0.4).toFixed(2));
      card.append(particle);
      window.setTimeout(() => particle.remove(), 900);
    }
  }
}

class InteractionView {
  private readonly panel: HTMLElement;
  private readonly storyView: HTMLElement;
  private readonly playerView: HTMLElement;
  private readonly eventView: HTMLElement;
  private readonly endingView: HTMLElement;
  private readonly actionDots: HTMLElement;
  private readonly actionsLabel: HTMLElement;
  private readonly playerDeck: HTMLElement;
  private readonly handList: HTMLElement;
  private readonly cardPlaySummary: HTMLElement;
  private readonly storyTitle: HTMLElement;
  private readonly storyBody: HTMLElement;
  private readonly eventCard: HTMLElement;
  private readonly eventTitle: HTMLElement;
  private readonly eventFlavor: HTMLElement;
  private readonly eventEffect: HTMLElement;
  private readonly eventChoices: HTMLElement;
  private readonly eventDeck: HTMLElement;
  private readonly eventResult: HTMLElement;
  private readonly eventResultTitle: HTMLElement;
  private readonly eventResultBody: HTMLElement;
  private readonly endingTitle: HTMLElement;
  private readonly endingText: HTMLElement;
  private lastRenderedCardPlayId: string | null = null;
  private pendingCardSnapshot: CardSnapshot | null = null;

  public readonly logAdvanceButton: HTMLButtonElement;
  public readonly endTurnButton: HTMLButtonElement;
  public readonly eventContinueButton: HTMLButtonElement;
  public readonly endingRestartButton: HTMLButtonElement;

  constructor(host: HTMLElement, private readonly applyTooltip: TooltipDelegate) {
    this.panel = expectElement(host, '[data-panel="interaction"]');
    this.storyView = expectElement(host, '[data-view="story"]');
    this.playerView = expectElement(host, '[data-view="player"]');
    this.eventView = expectElement(host, '[data-view="event"]');
    this.endingView = expectElement(host, '[data-view="ending"]');
    this.actionDots = expectElement(host, '[data-role="action-dots"]');
    this.actionsLabel = expectElement(host, '[data-role="actions-label"]');
    this.playerDeck = expectElement(host, '[data-role="player-deck"]');
    this.handList = expectElement(host, '[data-role="hand"]');
    this.cardPlaySummary = expectElement(host, '[data-role="card-play-summary"]');
    this.storyTitle = expectElement(host, '[data-role="story-title"]');
    this.storyBody = expectElement(host, '[data-role="story-text"]');
    this.eventCard = expectElement(host, '[data-role="event-card"]');
    this.eventTitle = expectElement(host, '[data-role="event-title"]');
    this.eventFlavor = expectElement(host, '[data-role="event-flavor"]');
    this.eventEffect = expectElement(host, '[data-role="event-effect"]');
    this.eventChoices = expectElement(host, '[data-role="event-choices"]');
    this.eventDeck = expectElement(host, '[data-role="event-deck"]');
    this.eventResult = expectElement(host, '[data-role="event-result"]');
    this.eventResultTitle = expectElement(host, '[data-role="event-result-title"]');
    this.eventResultBody = expectElement(host, '[data-role="event-result-body"]');
    this.endingTitle = expectElement(host, '[data-role="ending-title"]');
    this.endingText = expectElement(host, '[data-role="ending-text"]');
    this.logAdvanceButton = expectElement<HTMLButtonElement>(host, '[data-action="advance-log"]');
    this.endTurnButton = expectElement<HTMLButtonElement>(host, '[data-action="end-turn"]');
    this.eventContinueButton = expectElement<HTMLButtonElement>(host, '[data-action="complete-event"]');
    this.endingRestartButton = expectElement<HTMLButtonElement>(host, '[data-action="restart-game"]');
  }

  public renderTurn(
    turn: GameState['turn'],
    decks: GameState['decks'],
    hand: GameState['hand'],
    lastPlay: GameState['lastCardPlay'],
  ): void {
    this.renderActions(turn);
    this.renderPlayerDeck(decks);
    this.renderHand(hand);
    this.renderLastCardPlay(lastPlay);
  }

  public captureCardSnapshot(cardId: string, element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    this.pendingCardSnapshot = { cardId, rect };
  }

  public indicateInsufficientActions(element: HTMLElement): void {
    element.classList.remove('woh-hand-card--shake');
    void element.offsetWidth;
    element.classList.add('woh-hand-card--shake');
    element.addEventListener(
      'animationend',
      () => element.classList.remove('woh-hand-card--shake'),
      { once: true },
    );
  }

  public renderEvent(state: GameState): void {
    const event = state.event;
    const tone = event.type ?? 'mystery';
    const eventActive = state.loopStage === 'event' && !state.gameOutcome;
    if (eventActive) {
      this.panel.setAttribute('data-event-tone', tone);
    } else {
      this.panel.removeAttribute('data-event-tone');
    }
    this.eventCard.setAttribute('data-event-tone', tone);
    this.eventTitle.textContent = event.title;
    this.eventFlavor.textContent = event.flavor;
    this.eventEffect.textContent = event.effect;
    const awaitingChoice = eventActive && state.eventResolutionPending;
    this.eventChoices.classList.toggle('is-hidden', !awaitingChoice);
    this.renderEventChoices(event, awaitingChoice);
    this.renderEventDeck(state.decks.event);
  }

  public renderStage(state: GameState): void {
    const storyActive = state.loopStage === 'story' && this.hasPendingJournalEntry(state.journalScript);
    const eventActive = state.loopStage === 'event' && !state.gameOutcome;
    const endingActive = state.loopStage === 'finished' && Boolean(state.gameOutcome);
    const stage = endingActive ? 'ending' : storyActive ? 'story' : eventActive ? 'event' : 'player';
    this.panel.setAttribute('data-stage', stage);
    this.storyView.classList.toggle('is-active', storyActive);
    this.playerView.classList.toggle('is-active', stage === 'player');
    this.eventView.classList.toggle('is-active', eventActive);
    this.endingView.classList.toggle('is-active', endingActive);
    this.renderStoryPrompt(state.journalScript, storyActive);
    this.renderEventResolution(state, eventActive);
    this.renderEndTurnButton(state, stage === 'player');
    this.renderEndingView(state, endingActive);
  }

  public updateGuidanceHighlights(state: GameState): void {
    const needsJournal = state.loopStage === 'story' && this.hasPendingJournalEntry(state.journalScript);
    this.panel.classList.toggle('woh-panel--pulse-journal', needsJournal);

    const playerPhaseActive = state.loopStage === 'player' && !state.gameOutcome;
    this.panel.classList.toggle('woh-panel--pulse-hand', playerPhaseActive);

    const eventPhaseActive = state.loopStage === 'event' && !state.gameOutcome;
    this.panel.classList.toggle('woh-panel--pulse-event', eventPhaseActive);
  }

  private renderActions(turn: GameState['turn']): void {
    this.actionDots.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < turn.actions.total; index += 1) {
      const dot = document.createElement('span');
      dot.className = 'woh-action-dot';
      if (index < turn.actions.remaining) {
        dot.classList.add('is-active');
      }
      fragment.append(dot);
    }
    this.actionDots.append(fragment);
    this.actionsLabel.textContent = `Количество действий: ${turn.actions.remaining}/${turn.actions.total}`;
  }

  private renderPlayerDeck(decks: GameState['decks']): void {
    this.playerDeck.innerHTML = '';

    const deckSummary = document.createElement('span');
    deckSummary.className = 'woh-turn-summary-item';
    deckSummary.textContent = `Колода игрока: ${decks.player.draw}`;

    const discardSummary = document.createElement('span');
    discardSummary.className = 'woh-turn-summary-item';
    discardSummary.textContent = `Сброс: ${decks.player.discard}`;

    this.playerDeck.append(deckSummary, discardSummary);
  }

  private renderHand(hand: GameState['hand']): void {
    this.handList.innerHTML = '';
    this.handList.setAttribute('role', 'list');

    if (hand.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'woh-hand-card';
      placeholder.textContent = 'Рука пуста.';
      this.handList.append(placeholder);
      return;
    }

    const fragment = document.createDocumentFragment();
    hand.forEach((card) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'woh-hand-card';
      cardElement.setAttribute('role', 'listitem');
      cardElement.tabIndex = 0;
      cardElement.dataset.command = 'play-card';
      cardElement.dataset.cardId = card.id;
      cardElement.dataset.playable = String(card.playable);
      this.applyTooltip(cardElement, card.tooltip);

      const title = document.createElement('div');
      title.className = 'woh-card-title';
      title.textContent = card.name;

      const description = document.createElement('div');
      description.className = 'woh-card-description';
      description.textContent = card.description;

      const costs = document.createElement('div');
      costs.className = 'woh-card-costs';
      card.costs.forEach((cost) => {
        const costChip = document.createElement('span');
        costChip.textContent = cost;
        costs.append(costChip);
      });

      cardElement.append(title, description, costs);
      fragment.append(cardElement);
    });

    this.handList.append(fragment);
  }

  private renderLastCardPlay(lastPlay: GameState['lastCardPlay']): void {
    this.cardPlaySummary.innerHTML = '';
    if (!lastPlay) {
      this.cardPlaySummary.classList.add('is-hidden');
      this.animateCardPlayOutcome(null);
      return;
    }

    this.cardPlaySummary.classList.remove('is-hidden');
    const header = document.createElement('div');
    header.className = 'woh-hand-play-header';

    const title = document.createElement('span');
    title.className = 'woh-hand-play-title';
    title.textContent = `Последняя карта: ${lastPlay.name}`;

    const outcome = document.createElement('span');
    outcome.className = 'woh-hand-play-outcome';
    outcome.dataset.result = lastPlay.outcome;
    outcome.textContent = lastPlay.outcome === 'success' ? 'Успех' : 'Провал';

    header.append(title, outcome);

    const body = document.createElement('p');
    body.className = 'woh-hand-play-text';
    body.textContent = lastPlay.description;

    this.cardPlaySummary.append(header, body);
    this.animateCardPlayOutcome(lastPlay);
  }

  private animateCardPlayOutcome(lastPlay: GameState['lastCardPlay'] | null): void {
    if (!lastPlay) {
      this.lastRenderedCardPlayId = null;
      this.pendingCardSnapshot = null;
      return;
    }

    if (this.lastRenderedCardPlayId === lastPlay.id) {
      return;
    }

    this.lastRenderedCardPlayId = lastPlay.id;
    this.spawnCardPlayGhost(lastPlay);
  }

  private spawnCardPlayGhost(lastPlay: LastCardPlay): void {
    const ghost = document.createElement('div');
    ghost.className = 'woh-hand-card woh-hand-card-ghost';
    ghost.dataset.result = lastPlay.outcome;

    const title = document.createElement('div');
    title.className = 'woh-card-title';
    title.textContent = lastPlay.name;
    ghost.append(title);

    if (lastPlay.description) {
      const description = document.createElement('div');
      description.className = 'woh-card-description';
      description.textContent = lastPlay.description;
      ghost.append(description);
    }

    const snapshot = this.consumeSnapshotFor(lastPlay.id);
    const anchorRect = snapshot?.rect ?? this.handList.getBoundingClientRect();
    const referenceCard = snapshot
      ? null
      : this.handList.querySelector<HTMLElement>('.woh-hand-card');
    const fallbackWidth = referenceCard?.getBoundingClientRect().width ?? 140;
    const fallbackHeight = referenceCard?.getBoundingClientRect().height ?? 200;
    const width = snapshot?.rect.width ?? fallbackWidth;
    const height = snapshot?.rect.height ?? fallbackHeight;
    const left = snapshot ? snapshot.rect.left + snapshot.rect.width / 2 : anchorRect.left + anchorRect.width / 2;
    const top = snapshot ? snapshot.rect.top + snapshot.rect.height / 2 : anchorRect.top + anchorRect.height / 2;

    ghost.style.width = `${Math.round(width)}px`;
    ghost.style.height = `${Math.round(height)}px`;
    ghost.style.left = `${left}px`;
    ghost.style.top = `${top}px`;

    document.body.append(ghost);
    ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
  }

  private consumeSnapshotFor(cardId: string): CardSnapshot | null {
    if (this.pendingCardSnapshot?.cardId !== cardId) {
      return null;
    }
    const snapshot = this.pendingCardSnapshot;
    this.pendingCardSnapshot = null;
    return snapshot;
  }

  private renderEventChoices(event: GameState['event'], awaitingChoice: boolean): void {
    this.eventChoices.innerHTML = '';
    if (!awaitingChoice) {
      return;
    }

    const choices = event.choices ?? [];

    if (!choices.length) {
      const placeholder = document.createElement('p');
      placeholder.className = 'woh-event-empty';
      placeholder.textContent = 'Событие разыгрывается автоматически.';
      this.eventChoices.append(placeholder);
      return;
    }

    const fragment = document.createDocumentFragment();

    choices.forEach((choice) => {
      const button = document.createElement('button');
      button.className = 'woh-choice-button';
      button.type = 'button';
      const labelParts = [choice.label];
      if (choice.outcome) {
        labelParts.push(choice.outcome === 'success' ? 'успех' : 'провал');
      }
      button.textContent = labelParts.join(' · ');
      button.dataset.command = 'resolve-choice';
      button.dataset.choiceId = choice.id;
      button.disabled = Boolean(choice.resolved);
      button.setAttribute('aria-pressed', choice.resolved ? 'true' : 'false');
      if (typeof choice.chance === 'number') {
        const chancePercent = Math.round(Math.max(0, Math.min(1, choice.chance)) * 100);
        this.applyTooltip(button, `Шанс успеха: ${chancePercent}%`);
      } else {
        this.applyTooltip(button, undefined);
      }
      fragment.append(button);
    });

    this.eventChoices.append(fragment);
  }

  private renderEventDeck(deck: GameState['decks']['event']): void {
    this.eventDeck.innerHTML = '';

    const draw = document.createElement('span');
    draw.textContent = `Колода событий: ${deck.draw}`;
    const discard = document.createElement('span');
    discard.textContent = `Сброс: ${deck.discard}`;
    const next = document.createElement('span');
    next.textContent = `Следующее: ${deck.next ?? 'скрыто'}`;

    this.eventDeck.append(draw, discard, next);
  }

  private renderStoryPrompt(script: GameState['journalScript'], active: boolean): void {
    const hasNext = this.hasPendingJournalEntry(script);
    const entry = hasNext ? script.entries[script.nextIndex] : null;
    if (active && entry) {
      this.storyTitle.textContent = entry.type;
      this.storyBody.textContent = entry.body;
    } else if (active && !entry) {
      this.storyTitle.textContent = 'Пролог завершён';
      this.storyBody.textContent = 'Приготовьтесь к своему первому ходу.';
    } else if (!active) {
      this.storyTitle.textContent = '';
      this.storyBody.textContent = '';
    }

    const canAdvance = active && Boolean(entry);
    this.logAdvanceButton.disabled = !canAdvance;
    this.logAdvanceButton.classList.toggle('is-hidden', !canAdvance);
  }

  private renderEventResolution(state: GameState, eventActive: boolean): void {
    const summary = state.eventResolutionSummary;
    const showResult = eventActive && !state.eventResolutionPending && Boolean(summary);
    if (showResult && summary) {
      this.eventResultTitle.textContent = summary.title;
      this.eventResultBody.textContent = summary.body;
    } else {
      this.eventResultTitle.textContent = '';
      this.eventResultBody.textContent = '';
    }

    this.eventResult.classList.toggle('is-hidden', !showResult);
    this.eventContinueButton.classList.toggle('is-hidden', !showResult);
    this.eventContinueButton.disabled = !showResult;
  }

  private renderEndingView(state: GameState, active: boolean): void {
    if (!active) {
      this.endingTitle.textContent = '';
      this.endingText.textContent = '';
      this.panel.removeAttribute('data-ending-outcome');
      return;
    }

    const ending = state.ending;
    const outcome = state.gameOutcome;
    const defaultTitle = outcome === 'victory' ? 'Победа' : 'Поражение';
    const defaultText =
      outcome === 'victory'
        ? 'Туман рассеивается. Нажмите «Начать с начала», чтобы переиграть расследование.'
        : 'Расследование сорвалось. Нажмите «Начать с начала», чтобы попытаться снова.';

    this.endingTitle.textContent = ending?.title ?? defaultTitle;
    this.endingText.textContent = ending?.text ?? defaultText;

    if (outcome) {
      this.panel.setAttribute('data-ending-outcome', outcome);
    } else {
      this.panel.removeAttribute('data-ending-outcome');
    }
  }

  private renderEndTurnButton(state: GameState, playerStageActive: boolean): void {
    const visible =
      playerStageActive && state.loopStage === 'player' && state.journalScript.completed && !state.gameOutcome;
    this.endTurnButton.classList.toggle('is-hidden', !visible);
    this.endTurnButton.disabled = !visible;
  }

  private hasPendingJournalEntry(script: GameState['journalScript']): boolean {
    return !script.completed && script.nextIndex < script.entries.length;
  }
}

export class GameLayout {
  private readonly root: HTMLElement;
  private engine: GameEngine | null = null;
  private readonly logView: LogPanelView;
  private readonly interactionView: InteractionView;
  private readonly statusSidebar: StatusSidebarView;
  private readonly soundToggle: HTMLButtonElement;
  private readonly newGameButton: HTMLButtonElement;
  private readonly settingsButton: HTMLButtonElement;

  private readonly handleRootCommand = (event: MouseEvent) => {
    if (!this.engine) {
      return;
    }

    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-command]');
    if (!target) {
      return;
    }

    const command = target.dataset.command;
    if (command === 'play-card') {
      const cardId = target.dataset.cardId;
      if (cardId) {
        const state = this.engine.getState();
        const card = state.hand.find((handCard) => handCard.id === cardId);
        const actionCost = card?.actionCost ?? 1;
        if (card && card.playable && state.turn.actions.remaining >= actionCost) {
          this.interactionView.captureCardSnapshot(cardId, target);
        } else if (card && state.turn.actions.remaining < actionCost) {
          this.interactionView.indicateInsufficientActions(target);
        }
        this.engine.dispatch(new PlayCardCommand(cardId));
      }
      return;
    }

    if (command === 'resolve-choice') {
      const choiceId = target.dataset.choiceId;
      if (choiceId) {
        this.engine.dispatch(new ResolveEventChoiceCommand(choiceId));
      }
    }
  };

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

    const tooltipDelegate = this.applyTooltip.bind(this);
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
    this.root.addEventListener('click', this.handleRootCommand);
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
