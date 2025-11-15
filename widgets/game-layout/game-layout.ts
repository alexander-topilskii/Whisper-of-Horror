const STYLE_TOKEN = "woh-game-layout-styles";

function ensureStyles() {
  if (document.head.querySelector(`style[data-token="${STYLE_TOKEN}"]`)) {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-token", STYLE_TOKEN);
  style.textContent = `
    :root {
      color-scheme: dark;
    }

    body {
      margin: 0;
      font-family: "JetBrains Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(120% 120% at 50% 20%, rgba(16, 37, 32, 0.6) 0%, rgba(5, 10, 10, 1) 55%, rgba(0, 0, 0, 1) 100%);
      color: rgba(220, 235, 229, 0.92);
    }

    .woh-game-layout {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100vh;
      background: rgba(5, 12, 11, 0.82);
      backdrop-filter: blur(4px);
    }

    .woh-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 32px;
      border-bottom: 1px solid rgba(102, 152, 141, 0.2);
      background: linear-gradient(90deg, rgba(8, 24, 20, 0.85) 0%, rgba(8, 17, 21, 0.85) 100%);
    }

    .woh-logo-mark {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: "JetBrains Mono", monospace;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 0.82rem;
      color: rgba(168, 226, 214, 0.9);
    }

    .woh-logo-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, rgba(102, 182, 163, 0.45), rgba(8, 32, 23, 0.9));
      border: 1px solid rgba(102, 182, 163, 0.35);
      display: grid;
      place-items: center;
      font-size: 0.65rem;
      font-weight: 700;
    }

    .woh-header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .woh-button {
      position: relative;
      appearance: none;
      border: 1px solid rgba(123, 181, 166, 0.45);
      background: rgba(14, 38, 33, 0.8);
      color: rgba(209, 234, 226, 0.9);
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    }

    .woh-button:hover,
    .woh-button:focus-visible {
      border-color: rgba(128, 214, 197, 0.8);
      box-shadow: 0 0 12px rgba(102, 182, 163, 0.45);
      outline: none;
    }

    .woh-button:active {
      transform: translateY(1px);
    }

    .woh-sound-toggle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.9rem;
    }

    .woh-main {
      display: grid;
      grid-template-columns: 1fr 1.35fr 1fr;
      gap: 24px;
      padding: 24px 32px;
      overflow: hidden;
    }

    .woh-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .woh-panel {
      background: linear-gradient(180deg, rgba(8, 22, 19, 0.85) 0%, rgba(6, 14, 12, 0.9) 100%);
      border: 1px solid rgba(102, 152, 141, 0.18);
      border-radius: 16px;
      padding: 16px;
      box-shadow: inset 0 0 0 1px rgba(12, 38, 32, 0.2);
    }

    .woh-panel-title {
      font-family: "IM Fell English", "Times New Roman", serif;
      font-size: 0.98rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 12px;
      color: rgba(183, 222, 216, 0.82);
    }

    .woh-turn-resources {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .woh-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .woh-action-dots {
      display: flex;
      gap: 6px;
    }

    .woh-action-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid rgba(120, 176, 156, 0.5);
      background: rgba(23, 52, 42, 0.5);
      transition: background 0.2s ease;
    }

    .woh-action-dot.is-active {
      background: radial-gradient(circle at 50% 40%, rgba(150, 222, 199, 0.95), rgba(63, 121, 105, 0.7));
    }

    .woh-actions-label {
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(181, 217, 209, 0.7);
    }

    .woh-deck-status {
      display: flex;
      gap: 16px;
      font-size: 0.72rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(159, 193, 186, 0.65);
    }

    .woh-deck-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .woh-deck-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: 1px solid rgba(128, 188, 176, 0.35);
      display: grid;
      place-items: center;
      background: rgba(12, 32, 27, 0.7);
      font-size: 0.65rem;
    }

    .woh-hand {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: thin;
    }

    .woh-hand-card {
      position: relative;
      flex: 0 0 140px;
      background: linear-gradient(180deg, rgba(22, 48, 41, 0.95) 0%, rgba(8, 18, 16, 0.95) 100%);
      border: 1px solid rgba(135, 195, 180, 0.28);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .woh-hand-card:hover,
    .woh-hand-card:focus-visible,
    .woh-hand-card[data-expanded="true"] {
      transform: translateY(-4px) scale(1.02);
      border-color: rgba(168, 226, 214, 0.75);
      outline: none;
    }

    .woh-hand-card[data-playable="false"] {
      filter: grayscale(0.4) brightness(0.75);
    }

    .woh-card-title {
      font-family: "IM Fell English", "Times New Roman", serif;
      font-size: 0.92rem;
      letter-spacing: 0.05em;
    }

    .woh-card-description {
      font-size: 0.75rem;
      line-height: 1.3;
      color: rgba(189, 215, 209, 0.75);
    }

    .woh-card-costs {
      display: flex;
      gap: 6px;
      font-size: 0.7rem;
      color: rgba(168, 206, 198, 0.6);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .woh-tooltip {
      position: relative;
    }

    .woh-tooltip::after {
      content: attr(data-tooltip);
      position: absolute;
      inset: auto 50% calc(100% + 8px) auto;
      transform: translateX(-50%) scale(var(--tooltip-scale, 0.9));
      transform-origin: bottom center;
      background: rgba(10, 26, 23, 0.95);
      border: 1px solid rgba(104, 175, 160, 0.45);
      border-radius: 10px;
      padding: 12px;
      max-width: 240px;
      font-size: 0.72rem;
      line-height: 1.35;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.18s ease, transform 0.18s ease;
      z-index: 10;
      white-space: normal;
    }

    .woh-tooltip:hover::after,
    .woh-tooltip:focus-visible::after,
    .woh-tooltip[data-expanded="true"]::after {
      opacity: 1;
      --tooltip-scale: 1;
    }

    .woh-world-tracks {
      display: grid;
      gap: 16px;
    }

    .woh-track {
      display: grid;
      gap: 8px;
    }

    .woh-track-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(177, 217, 211, 0.75);
    }

    .woh-track-bar {
      position: relative;
      height: 14px;
      border-radius: 999px;
      background: rgba(24, 46, 40, 0.65);
      overflow: hidden;
    }

    .woh-track-progress {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      border-radius: inherit;
    }

    .woh-track--victory .woh-track-progress {
      width: 58%;
      background: linear-gradient(90deg, rgba(62, 152, 135, 0.7) 0%, rgba(150, 222, 199, 0.95) 100%);
      box-shadow: 0 0 12px rgba(150, 222, 199, 0.35);
    }

    .woh-track--doom .woh-track-progress {
      width: 36%;
      background: linear-gradient(90deg, rgba(120, 42, 42, 0.6) 0%, rgba(182, 94, 78, 0.9) 100%);
      box-shadow: 0 0 16px rgba(140, 51, 48, 0.45);
    }

    .woh-track-marks {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 8px;
    }

    .woh-track-mark {
      width: 4px;
      height: 6px;
      border-radius: 1px;
      background: rgba(173, 217, 209, 0.4);
    }

    .woh-track-mark.is-critical {
      height: 12px;
      background: rgba(255, 172, 120, 0.6);
    }

    .woh-character-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .woh-stat-card {
      background: rgba(16, 34, 30, 0.6);
      border: 1px solid rgba(118, 166, 152, 0.32);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      overflow: hidden;
    }

    .woh-stat-card::after {
      content: "";
      position: absolute;
      inset: -20% -30% auto auto;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(145, 210, 195, 0.35), rgba(32, 70, 59, 0));
      transform: translate(40%, -40%);
      pointer-events: none;
    }

    .woh-stat-title {
      font-size: 0.78rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(181, 223, 214, 0.75);
    }

    .woh-stat-value {
      font-family: "JetBrains Mono", monospace;
      font-size: 1.4rem;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .woh-stat-value span {
      font-size: 0.7rem;
      color: rgba(186, 222, 214, 0.55);
      letter-spacing: 0.08em;
    }

    .woh-stat-card.is-critical {
      animation: woh-pulse 1.6s infinite;
      border-color: rgba(214, 120, 104, 0.6);
    }

    @keyframes woh-pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(214, 120, 104, 0.2);
      }
      50% {
        box-shadow: 0 0 12px 6px rgba(214, 120, 104, 0.15);
      }
    }

    .woh-phase {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 12px;
      background: rgba(12, 30, 29, 0.65);
      border: 1px solid rgba(94, 148, 137, 0.28);
    }

    .woh-phase-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 1.2rem;
      background: radial-gradient(circle at 40% 30%, rgba(238, 212, 132, 0.85), rgba(112, 84, 41, 0.5));
    }

    .woh-phase-labels {
      display: flex;
      flex-direction: column;
      text-align: right;
      gap: 4px;
    }

    .woh-phase-title {
      font-size: 0.75rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(190, 226, 214, 0.75);
    }

    .woh-phase-subtitle {
      font-size: 0.68rem;
      color: rgba(183, 210, 203, 0.6);
    }

    .woh-effects {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .woh-effect-chip {
      position: relative;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(26, 60, 54, 0.7);
      border: 1px solid rgba(104, 175, 160, 0.42);
      font-size: 0.68rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(192, 227, 219, 0.8);
      cursor: pointer;
    }

    .woh-npc-row {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: thin;
    }

    .woh-npc-card {
      flex: 0 0 160px;
      background: linear-gradient(180deg, rgba(16, 38, 35, 0.95) 0%, rgba(8, 16, 15, 0.95) 100%);
      border: 1px solid rgba(102, 156, 148, 0.32);
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .woh-npc-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .woh-npc-avatar {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: radial-gradient(circle, rgba(84, 116, 112, 0.4), rgba(24, 52, 46, 0.95));
      border: 1px solid rgba(102, 156, 148, 0.4);
      display: grid;
      place-items: center;
      font-size: 0.8rem;
    }

    .woh-npc-name {
      font-size: 0.85rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .woh-npc-timer {
      font-family: "JetBrains Mono", monospace;
      font-size: 0.68rem;
      color: rgba(183, 215, 208, 0.6);
    }

    .woh-npc-body {
      font-size: 0.72rem;
      line-height: 1.4;
      color: rgba(178, 206, 200, 0.65);
    }

    .woh-event-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .woh-event-main {
      position: relative;
      background: linear-gradient(180deg, rgba(30, 44, 51, 0.92) 0%, rgba(12, 22, 27, 0.95) 100%);
      border: 1px solid rgba(120, 172, 182, 0.32);
      border-radius: 18px;
      padding: 20px;
      box-shadow: inset 0 0 0 1px rgba(28, 54, 60, 0.3);
    }

    .woh-event-title {
      font-family: "IM Fell English", "Times New Roman", serif;
      font-size: 1.2rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .woh-event-flavor {
      font-size: 0.82rem;
      line-height: 1.5;
      color: rgba(201, 219, 217, 0.75);
      font-style: italic;
    }

    .woh-event-effect {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px dashed rgba(134, 187, 196, 0.35);
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: rgba(180, 222, 224, 0.82);
    }

    .woh-event-choices {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .woh-choice-button {
      border-radius: 12px;
      background: rgba(22, 38, 44, 0.8);
      border: 1px solid rgba(122, 178, 190, 0.4);
      padding: 10px 14px;
      text-align: left;
      font-size: 0.78rem;
      letter-spacing: 0.06em;
      color: rgba(186, 222, 224, 0.85);
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .woh-choice-button:hover,
    .woh-choice-button:focus-visible {
      border-color: rgba(160, 214, 224, 0.8);
      background: rgba(42, 62, 69, 0.85);
      outline: none;
    }

    .woh-event-deck {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 16px;
      border-radius: 14px;
      background: rgba(18, 34, 40, 0.6);
      border: 1px solid rgba(118, 168, 176, 0.28);
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(166, 206, 210, 0.7);
    }

    .woh-log {
      border-top: 1px solid rgba(96, 140, 130, 0.18);
      background: rgba(8, 18, 16, 0.92);
      padding: 16px 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 25vh;
    }

    .woh-log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(180, 222, 214, 0.75);
    }

    .woh-log-entries {
      overflow-y: auto;
      display: grid;
      gap: 10px;
      padding-right: 8px;
      font-size: 0.78rem;
      line-height: 1.4;
      color: rgba(184, 210, 203, 0.78);
    }

    .woh-log-entry {
      display: grid;
      gap: 6px;
      padding: 10px 14px;
      border-radius: 12px;
      background: rgba(18, 36, 32, 0.6);
      border: 1px solid rgba(94, 146, 134, 0.22);
    }

    .woh-log-entry-type {
      font-size: 0.68rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(160, 198, 189, 0.6);
    }

    .woh-log-entry-body {
      font-size: 0.8rem;
    }

    @media (max-width: 1100px) {
      .woh-main {
        grid-template-columns: 0.95fr 1.2fr 0.95fr;
      }
    }

    @media (max-width: 900px) {
      .woh-main {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
      }

      .woh-column {
        order: initial;
      }

      .woh-column--center {
        order: 1;
      }

      .woh-column--right {
        order: 2;
      }

      .woh-column--left {
        order: 3;
      }

      .woh-log {
        max-height: none;
      }
    }

    @media (max-width: 720px) {
      .woh-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .woh-header-actions {
        justify-content: space-between;
      }

      .woh-turn-resources {
        flex-direction: column;
        align-items: stretch;
      }

      .woh-deck-status {
        justify-content: space-between;
      }
    }
  `;

  document.head.appendChild(style);
}

const TEMPLATE = `
  <div class="woh-game-layout">
    <header class="woh-header">
      <div class="woh-logo-mark">
        <span class="woh-logo-icon">WH</span>
        <span>Whisper of Horror</span>
      </div>
      <div class="woh-header-actions">
        <button class="woh-button" type="button">Новая партия</button>
        <button class="woh-button" type="button">Настройки</button>
        <button class="woh-button woh-sound-toggle" type="button" aria-label="Переключить звук">🔊</button>
      </div>
    </header>
    <div class="woh-main">
      <section class="woh-column woh-column--left">
        <article class="woh-panel">
          <h2 class="woh-panel-title">Ресурсы Хода</h2>
          <div class="woh-turn-resources">
            <div class="woh-actions">
              <div class="woh-action-dots" role="group" aria-label="Очки действия">
                <span class="woh-action-dot is-active"></span>
                <span class="woh-action-dot is-active"></span>
                <span class="woh-action-dot is-active"></span>
              </div>
              <span class="woh-actions-label">Действия: 3/3</span>
            </div>
            <div class="woh-deck-status">
              <div class="woh-deck-indicator">
                <span class="woh-deck-icon">🂠</span>
                <span>Колода: 23</span>
              </div>
              <div class="woh-deck-indicator">
                <span class="woh-deck-icon">♻︎</span>
                <span>Сброс: 6</span>
              </div>
            </div>
          </div>
        </article>
        <article class="woh-panel">
          <h2 class="woh-panel-title">Рука</h2>
          <div class="woh-hand" role="list">
            <div class="woh-hand-card woh-tooltip" role="listitem" tabindex="0" data-tooltip="Раскройте карту местности и откройте тайный проход." data-expanded="false">
              <div class="woh-card-title">Фонарик Сыщика</div>
              <div class="woh-card-description">Сделайте проверку наблюдательности. При успехе откройте дополнительную улику.</div>
              <div class="woh-card-costs">
                <span>Стоимость: 1 ⌛</span>
                <span>+1 🔍</span>
              </div>
            </div>
            <div class="woh-hand-card woh-tooltip" role="listitem" tabindex="0" data-tooltip="Примите обезболивающее. Снимите 2 урона, получите 1 токен сонливости." data-expanded="false">
              <div class="woh-card-title">Морфий</div>
              <div class="woh-card-description">Снимите до 2 единиц урона. Получите состояние "Сонный".</div>
              <div class="woh-card-costs">
                <span>Стоимость: 1 💉</span>
              </div>
            </div>
            <div class="woh-hand-card woh-tooltip" role="listitem" tabindex="0" data-tooltip="Сработает только в туманной локации." data-expanded="false" data-playable="false">
              <div class="woh-card-title">Колокольчик Зова</div>
              <div class="woh-card-description">Призовите дух проводника. Он отвечает на один вопрос о случившемся.</div>
              <div class="woh-card-costs">
                <span>Стоимость: 2 ✨</span>
              </div>
            </div>
            <div class="woh-hand-card woh-tooltip" role="listitem" tabindex="0" data-tooltip="Используйте чтобы снять эффект паники." data-expanded="false">
              <div class="woh-card-title">Глубокий Вдох</div>
              <div class="woh-card-description">Потратьте действие, чтобы сбросить состояние "Паника" и восстановить 1 рассудок.</div>
              <div class="woh-card-costs">
                <span>Стоимость: 1 ⌛</span>
              </div>
            </div>
            <div class="woh-hand-card woh-tooltip" role="listitem" tabindex="0" data-tooltip="Карты позволяют подготовить сюжетный рывок." data-expanded="false">
              <div class="woh-card-title">Записки Сектанта</div>
              <div class="woh-card-description">Получите улику. Если у вас есть "Шифровальная Решётка", вместо этого продвиньтесь на 1 по треку Расследования.</div>
              <div class="woh-card-costs">
                <span>Стоимость: 2 🧠</span>
              </div>
            </div>
          </div>
        </article>
      </section>
      <section class="woh-column woh-column--center">
        <article class="woh-panel">
          <h2 class="woh-panel-title">Состояние Истории</h2>
          <div class="woh-world-tracks">
            <div class="woh-track woh-track--victory">
              <div class="woh-track-label">
                <span>Расследование</span>
                <span>5 / 8</span>
              </div>
              <div class="woh-track-bar">
                <div class="woh-track-progress"></div>
                <div class="woh-track-marks">
                  <span class="woh-track-mark"></span>
                  <span class="woh-track-mark"></span>
                  <span class="woh-track-mark is-critical"></span>
                  <span class="woh-track-mark"></span>
                  <span class="woh-track-mark"></span>
                </div>
              </div>
            </div>
            <div class="woh-track woh-track--doom">
              <div class="woh-track-label">
                <span>Разрушение</span>
                <span>3 / 10</span>
              </div>
              <div class="woh-track-bar">
                <div class="woh-track-progress"></div>
                <div class="woh-track-marks">
                  <span class="woh-track-mark"></span>
                  <span class="woh-track-mark"></span>
                  <span class="woh-track-mark is-critical"></span>
                  <span class="woh-track-mark"></span>
                  <span class="woh-track-mark"></span>
                </div>
              </div>
            </div>
          </div>
        </article>
        <article class="woh-panel">
          <h2 class="woh-panel-title">Параметры Персонажа</h2>
          <div class="woh-character-stats">
            <div class="woh-stat-card">
              <span class="woh-stat-title">Здоровье</span>
              <div class="woh-stat-value">6<span>/ 8</span></div>
            </div>
            <div class="woh-stat-card is-critical">
              <span class="woh-stat-title">Рассудок</span>
              <div class="woh-stat-value">3<span>/ 7</span></div>
            </div>
          </div>
        </article>
        <article class="woh-panel">
          <h2 class="woh-panel-title">Фаза Мира</h2>
          <div class="woh-phase">
            <div class="woh-phase-icon" aria-hidden="true">🌙</div>
            <div class="woh-phase-labels">
              <span class="woh-phase-title">Ночь</span>
              <span class="woh-phase-subtitle">Фаза сновидений</span>
            </div>
          </div>
        </article>
        <article class="woh-panel">
          <h2 class="woh-panel-title">Состояния</h2>
          <div class="woh-effects">
            <button class="woh-effect-chip woh-tooltip" type="button" data-tooltip="Снижает успехи проверки наблюдательности на 1." data-expanded="false">Наблюдают</button>
            <button class="woh-effect-chip woh-tooltip" type="button" data-tooltip="Получите 1 дополнительный урон при следующей атаке." data-expanded="false">Ранен</button>
            <button class="woh-effect-chip woh-tooltip" type="button" data-tooltip="Вы можете игнорировать один эффект страха в ход." data-expanded="false">Под защитой</button>
            <button class="woh-effect-chip woh-tooltip" type="button" data-tooltip="Если вы тянете карту ужасов, получите 1 рассудок." data-expanded="false">Паника</button>
          </div>
        </article>
        <article class="woh-panel">
          <h2 class="woh-panel-title">Активные NPC</h2>
          <div class="woh-npc-row">
            <div class="woh-npc-card woh-tooltip" tabindex="0" data-tooltip="При встрече спросите о детях проповедника. Откроет скрытую локацию." data-expanded="false">
              <div class="woh-npc-header">
                <div class="woh-npc-avatar">⟁</div>
                <div>
                  <div class="woh-npc-name">Смотритель Часов</div>
                  <div class="woh-npc-timer">Ходов: 2 / 3</div>
                </div>
              </div>
              <div class="woh-npc-body">Следит за циферблатом, который отображает несуществующее время.</div>
            </div>
            <div class="woh-npc-card woh-tooltip" tabindex="0" data-tooltip="Каждый ход усиливает трек Разрушения на 1, если ее не отвлечь." data-expanded="false">
              <div class="woh-npc-header">
                <div class="woh-npc-avatar">☽</div>
                <div>
                  <div class="woh-npc-name">Лунная Провидица</div>
                  <div class="woh-npc-timer">Ходов: 1 / 2</div>
                </div>
              </div>
              <div class="woh-npc-body">Шепчет чужие имена. Требует жертву, чтобы замедлить ритуал.</div>
            </div>
            <div class="woh-npc-card woh-tooltip" tabindex="0" data-tooltip="Если проигнорировать три хода, лог заполняется кошмарами." data-expanded="false">
              <div class="woh-npc-header">
                <div class="woh-npc-avatar">✦</div>
                <div>
                  <div class="woh-npc-name">Эхо Витражей</div>
                  <div class="woh-npc-timer">Ходов: 3 / 3</div>
                </div>
              </div>
              <div class="woh-npc-body">Аномалия, отражающая забытые решения. Поглощает воспоминания.</div>
            </div>
          </div>
        </article>
      </section>
      <section class="woh-column woh-column--right">
        <article class="woh-panel woh-event-card">
          <h2 class="woh-panel-title">Текущее Событие</h2>
          <div class="woh-event-main">
            <div class="woh-event-title">Шёпот из Трещины</div>
            <div class="woh-event-flavor">Тонкая линия в полу шепчет голоса тех, кого давно не слышали. Они знают, где ключ от последней двери.</div>
            <div class="woh-event-effect">Эффект: каждый следователь должен потратить 1 рассудок или поместить жетон разрушения на ближайшую локацию.</div>
            <div class="woh-event-choices">
              <button class="woh-choice-button" type="button">Вариант A — Склониться над трещиной</button>
              <button class="woh-choice-button" type="button">Вариант B — Запечатать мелом</button>
            </div>
          </div>
          <div class="woh-event-deck">
            <span>Колода событий: 12</span>
            <span>Сброс: 3</span>
            <span>Следующее: скрыто</span>
          </div>
        </article>
      </section>
    </div>
    <footer class="woh-log">
      <div class="woh-log-header">
        <span>Журнал Хода</span>
        <span>Автопрокрутка: Вкл.</span>
      </div>
      <div class="woh-log-entries" aria-live="polite">
        <div class="woh-log-entry">
          <span class="woh-log-entry-type">[ХОД 5 · Событие]</span>
          <span class="woh-log-entry-body">Шёпот из трещины проникает в сознание. Веки тяжелые, но карта складывается в голове.</span>
        </div>
        <div class="woh-log-entry">
          <span class="woh-log-entry-type">[Действие]</span>
          <span class="woh-log-entry-body">Ты задержался у разбитого фонаря — тень на стене шевельнулась первой.</span>
        </div>
        <div class="woh-log-entry">
          <span class="woh-log-entry-type">[NPC]</span>
          <span class="woh-log-entry-body">Смотритель Часов перевернул стрелки назад, даруя еще один вдох.</span>
        </div>
        <div class="woh-log-entry">
          <span class="woh-log-entry-type">[Подготовка]</span>
          <span class="woh-log-entry-body">Рука пополняется из колоды: три новые карты кладутся веером, одна из них пахнет солью.</span>
        </div>
      </div>
    </footer>
  </div>
`;

export class GameLayout {
  private readonly root: HTMLElement;

  constructor(root: HTMLElement) {
    if (!root) {
      throw new Error("GameLayout requires a valid root element");
    }

    ensureStyles();
    this.root = root;
    this.root.innerHTML = TEMPLATE;
    this.enableTooltipToggles();
  }

  private enableTooltipToggles() {
    const toggleableSelectors = [
      ".woh-tooltip",
      ".woh-hand-card",
      ".woh-effect-chip",
      ".woh-npc-card"
    ];

    const elements = this.root.querySelectorAll<HTMLElement>(toggleableSelectors.join(","));

    elements.forEach((element) => {
      element.addEventListener("click", () => {
        const isExpanded = element.getAttribute("data-expanded") === "true";
        elements.forEach((el) => el.setAttribute("data-expanded", "false"));
        element.setAttribute("data-expanded", (!isExpanded).toString());
      });

      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          element.click();
        }
      });
    });
  }
}
