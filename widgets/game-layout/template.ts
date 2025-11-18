const TEMPLATE = `
  <div class="woh-game-layout">
    <header class="woh-header">
      <div class="woh-logo-mark">
        <span class="woh-logo-icon">WH</span>
        <span>Whisper of Horror</span>
      </div>
      <div class="woh-header-actions">
        <button class="woh-button" type="button" data-action="new-game">Новая партия</button>
        <button class="woh-button" type="button" data-action="settings">Настройки</button>
        <button
          class="woh-button woh-sound-toggle"
          type="button"
          data-action="toggle-sound"
          aria-label="Переключить звук"
        >
          🔊
        </button>
      </div>
    </header>
    <div class="woh-main">
      <section class="woh-column woh-column--log">
        <article class="woh-panel" data-panel="log">
          <div class="woh-panel-header">
            <h2 class="woh-panel-title">Журнал хода</h2>
          </div>
          <div class="woh-log">
            <div class="woh-log-entries" role="log" aria-live="polite" data-role="log-entries"></div>
          </div>
        </article>
      </section>
      <section class="woh-column woh-column--interaction">
        <article
          class="woh-panel woh-panel--glass woh-panel--interaction"
          data-panel="interaction"
          data-stage="story"
        >
          <div class="woh-interaction-stage">
            <div class="woh-interaction-view woh-interaction-view--story is-active" data-view="story">
              <div class="woh-story-card">
                <h2 class="woh-panel-title">Пролог</h2>
                <div class="woh-story-type" data-role="story-title"></div>
                <p class="woh-story-text" data-role="story-text"></p>
                <button class="woh-button woh-button--full" type="button" data-action="advance-log">Далее</button>
              </div>
            </div>
            <div class="woh-interaction-view woh-interaction-view--player" data-view="player">
              <div class="woh-turn-card">
                <div class="woh-turn-main">
                  <div class="woh-turn-header">
                    <div class="woh-panel-header">
                      <h2 class="woh-panel-title">Ход игрока</h2>
                      <button class="woh-button woh-button--ghost" type="button" data-action="end-turn">
                        Закончить ход
                      </button>
                    </div>
                    <div class="woh-turn-actions">
                      <div class="woh-action-dots" role="group" aria-label="Очки действия" data-role="action-dots"></div>
                    </div>
                  </div>
                  <div class="woh-hand" role="list" data-role="hand"></div>
                  <div
                    class="woh-hand-play-summary is-hidden"
                    data-role="card-play-summary"
                    aria-live="polite"
                  ></div>
                </div>
                <div class="woh-turn-summary">
                  <div class="woh-turn-summary-items" data-role="player-deck"></div>
                  <span class="woh-actions-label" data-role="actions-label"></span>
                </div>
              </div>
            </div>
            <div class="woh-interaction-view woh-interaction-view--event" data-view="event">
              <div class="woh-event-card" data-role="event-card">
                <h2 class="woh-panel-title">События</h2>
                <div class="woh-event-main">
                  <div class="woh-event-title" data-role="event-title"></div>
                  <div class="woh-event-flavor" data-role="event-flavor"></div>
                  <div class="woh-event-effect" data-role="event-effect"></div>
                  <div class="woh-event-choices" data-role="event-choices"></div>
                </div>
                <div class="woh-event-result is-hidden" data-role="event-result">
                  <span class="woh-event-result-title" data-role="event-result-title"></span>
                  <p class="woh-event-result-body" data-role="event-result-body"></p>
                </div>
                <div class="woh-event-deck" data-role="event-deck"></div>
                <button
                  class="woh-button woh-button--full is-hidden"
                  type="button"
                  data-action="complete-event"
                >
                  Продолжить
                </button>
              </div>
            </div>
            <div class="woh-interaction-view woh-interaction-view--ending" data-view="ending">
              <div class="woh-ending-card">
                <div class="woh-ending-title" data-role="ending-title"></div>
                <p class="woh-ending-text" data-role="ending-text"></p>
                <button class="woh-button woh-button--full" type="button" data-action="restart-game">
                  Начать с начала
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>
      <section class="woh-column woh-column--center">
        <article class="woh-panel">
          <div class="woh-panel-header">
            <h2 class="woh-panel-title" data-role="scenario-title"></h2>
            <div class="woh-phase woh-phase--compact">
              <div class="woh-phase-icon" aria-hidden="true" data-role="phase-icon"></div>
              <div class="woh-phase-labels">
                <span class="woh-phase-title" data-role="phase-title"></span>
                <span class="woh-phase-subtitle" data-role="phase-subtitle"></span>
              </div>
            </div>
          </div>
          <div class="woh-world-tracks" data-role="world-tracks"></div>
        </article>
        <article class="woh-panel">
          <h2 class="woh-panel-title">Активные NPC</h2>
          <div class="woh-npc-row" data-role="npc-list"></div>
        </article>
        <article class="woh-panel">
          <h2 class="woh-panel-title">Показатели персонажа</h2>
          <div class="woh-character-stats" data-role="character-stats"></div>
          <div class="woh-panel-section">
            <h3 class="woh-subpanel-title">Состояния</h3>
            <div class="woh-effects" data-role="status-effects"></div>
          </div>
        </article>
      </section>
    </div>
  </div>
`;

export function buildGameLayoutDOM(): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = TEMPLATE;
  return template.content.cloneNode(true) as DocumentFragment;
}
