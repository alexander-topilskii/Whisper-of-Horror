import type { GameState } from "../../game-engine/state";
import { expectElement, type TooltipDelegate } from "../dom-utils";

type CardSnapshot = {
  cardId: string;
  rect: DOMRect;
};

type LastCardPlay = NonNullable<GameState['lastCardPlay']>;

const DEFAULT_SUCCESS_TEXT = 'Эффект карты срабатывает и приносит заявленное преимущество.';
const DEFAULT_FAIL_TEXT = 'Провал оставляет вас без прогресса и усиливает давление.';

function formatSuccessChance(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  const clamped = Math.max(0, Math.min(1, value));
  return `${Math.round(clamped * 100)}%`;
}

export class InteractionView {
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
  private readonly storyIllustrationFrame: HTMLElement;
  private readonly storyIllustration: HTMLImageElement;
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
    this.storyIllustrationFrame = expectElement(host, '[data-role="story-illustration"]');
    this.storyIllustration = expectElement(host, '[data-role="story-illustration-img"]');
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
    if (!hand.length) {
      const placeholder = document.createElement('div');
      placeholder.className = 'woh-hand-empty';
      placeholder.textContent = 'Колода пуста. Событие завершится автоматически.';
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

      const flavorText = card.flavor?.trim();
      const flavor = document.createElement('p');
      if (flavorText) {
        flavor.className = 'woh-card-flavor';
        flavor.textContent = flavorText;
      }

      const costs = document.createElement('div');
      costs.className = 'woh-card-costs';
      card.costs.forEach((cost) => {
        const costChip = document.createElement('span');
        costChip.textContent = cost;
        costs.append(costChip);
      });

      const outcomes = this.createCardOutcomes(card);

      cardElement.append(title, description);
      if (flavorText) {
        cardElement.append(flavor);
      }
      cardElement.append(outcomes, costs);
      fragment.append(cardElement);
    });

    this.handList.append(fragment);
  }

  private createCardOutcomes(card: GameState['hand'][number]): HTMLElement {
    const outcomes = document.createElement('div');
    outcomes.className = 'woh-card-outcomes';

    const chance = document.createElement('div');
    chance.className = 'woh-card-chance';
    chance.textContent = `Шанс успеха: ${formatSuccessChance(card.chance)}`;
    outcomes.append(chance);

    outcomes.append(
      this.createOutcomeLine('success', card.successText ?? undefined),
      this.createOutcomeLine('fail', card.failText ?? undefined),
    );

    return outcomes;
  }

  private createOutcomeLine(variant: 'success' | 'fail', text?: string): HTMLElement {
    const line = document.createElement('div');
    line.className = `woh-card-outcome-line is-${variant}`;

    const label = document.createElement('span');
    label.className = 'woh-card-outcome-label';
    label.textContent = variant === 'success' ? 'При успехе:' : 'При провале:';

    const body = document.createElement('span');
    body.className = 'woh-card-outcome-text';
    const fallback = variant === 'success' ? DEFAULT_SUCCESS_TEXT : DEFAULT_FAIL_TEXT;
    const trimmed = text?.trim();
    body.textContent = trimmed?.length ? trimmed : fallback;

    line.append(label, body);
    return line;
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
    const referenceCard = snapshot ? null : this.handList.querySelector<HTMLElement>('.woh-hand-card');
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
      this.updateStoryIllustration(entry.illustration, entry.type);
    } else if (active && !entry) {
      this.storyTitle.textContent = 'Пролог завершён';
      this.storyBody.textContent = 'Приготовьтесь к своему первому ходу.';
      this.updateStoryIllustration(undefined);
    } else if (!active) {
      this.storyTitle.textContent = '';
      this.storyBody.textContent = '';
      this.updateStoryIllustration(undefined);
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

  private updateStoryIllustration(src?: string, label?: string): void {
    if (src) {
      this.storyIllustration.src = src;
      this.storyIllustration.alt = label ?? 'Иллюстрация сцены';
      this.storyIllustrationFrame.classList.remove('is-hidden');
      return;
    }

    this.storyIllustration.removeAttribute('src');
    this.storyIllustration.alt = '';
    this.storyIllustrationFrame.classList.add('is-hidden');
  }
}
