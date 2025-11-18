import palette from "../../src/data/color-palette.json";

const STYLE_TOKEN = "woh-game-layout-styles";
const colors = palette.gameLayout;

export type StatMeterPreset = { fill?: string; glow?: string };

export const statMeterPresets: Record<string, StatMeterPreset> =
  (colors.statMeterPresets as Record<string, StatMeterPreset> | undefined) ?? {};

const STYLES = `
    :root {
      color-scheme: dark;
      --woh-panel-surface: ${colors.panelSurface};
      --woh-panel-surface-alt: ${colors.panelSurfaceAlt};
      --woh-panel-surface-deep: ${colors.panelSurfaceDeep};
      --woh-panel-border: ${colors.panelBorder};
      --woh-panel-border-strong: ${colors.panelBorderStrong};
      --woh-panel-highlight: ${colors.panelHighlight};
      --woh-stat-damage-flash: ${colors.statDamageFlash};
      --woh-stat-heal-flash: ${colors.statHealFlash};
      --woh-stat-damage-text: ${colors.statDamageText};
      --woh-stat-heal-text: ${colors.statHealText};
      --woh-stat-damage-particle: ${colors.statDamageParticle};
      --woh-stat-heal-particle: ${colors.statHealParticle};
      --woh-stat-float-shadow: ${colors.statFloatShadow};
    }

    html {
      width: 100%;
    }

    body {
      margin: 0;
      font-family: "JetBrains Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: ${colors.bodyBackground};
      color: ${colors.bodyText};
      min-height: 100vh;
      overflow-x: hidden;
    }

    .is-hidden {
      display: none !important;
    }

    .woh-game-layout {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100vh;
      background: ${colors.layoutBackground};
      backdrop-filter: blur(4px);
    }

    .woh-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 32px;
      border-bottom: 1px solid ${colors.headerBorder};
      background: ${colors.headerBackground};
    }

    .woh-logo-mark {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: "JetBrains Mono", monospace;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 0.82rem;
      color: ${colors.logoText};
    }

    .woh-logo-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${colors.logoIconBackground};
      border: 1px solid ${colors.logoIconBorder};
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
      border: 1px solid ${colors.buttonBorder};
      background: ${colors.buttonBackground};
      color: ${colors.buttonText};
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    }

    .woh-button--ghost {
      padding: 6px 12px;
      font-size: 0.7rem;
      background: transparent;
      border-color: ${colors.buttonBorder};
    }

    .woh-button:hover,
    .woh-button:focus-visible {
      border-color: ${colors.buttonBorderHover};
      box-shadow: 0 0 12px ${colors.buttonShadowHover};
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
      grid-template-columns: 0.85fr 1.1fr 1.2fr;
      gap: 24px;
      padding: 24px 32px;
      overflow: hidden;
      align-items: start;
    }

    .woh-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 0;
    }

    .woh-column--log .woh-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 100%;
    }

    .woh-panel {
      background: linear-gradient(180deg, var(--woh-panel-surface) 0%, ${colors.panelGradientEnd} 100%);
      border: 1px solid var(--woh-panel-border);
      border-radius: 16px;
      padding: 16px;
      box-shadow: inset 0 0 0 1px ${colors.panelInsetShadow};
      position: relative;
      z-index: 0;
    }

    .woh-panel--glass {
      position: relative;
      background: linear-gradient(145deg, var(--woh-panel-surface-alt), ${colors.panelGlassBackgroundEnd});
      border: 1px solid var(--woh-panel-border-strong);
      box-shadow:
        0 18px 45px ${colors.panelGlassDropShadow},
        inset 0 0 0 1px ${colors.panelGlassInnerHighlight};
      overflow: hidden;
      isolation: isolate;
    }

    .woh-panel--glass::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--woh-panel-accent, ${colors.panelAccentDefault});
      pointer-events: none;
      z-index: 0;
    }

    .woh-panel--glass > * {
      position: relative;
      z-index: 1;
    }

    .woh-panel--pulse-journal,
    .woh-panel--pulse-hand,
    .woh-panel--pulse-event {
      position: relative;
      z-index: 0;
    }

    .woh-panel--pulse-journal::after,
    .woh-panel--pulse-hand::after,
    .woh-panel--pulse-event::after {
      content: "";
      position: absolute;
      inset: -6px;
      border-radius: inherit;
      pointer-events: none;
      opacity: 0;
      z-index: -1;
    }

    .woh-panel--pulse-journal::after {
      animation: woh-panel-journal-pulse 4.6s ease-in-out infinite;
    }

    .woh-panel--pulse-hand::after {
      animation: woh-panel-hand-pulse 4.2s ease-in-out infinite;
    }

    .woh-panel--pulse-event::after {
      animation: woh-panel-event-pulse 4.2s ease-in-out infinite;
    }

    .woh-panel--interaction {
      --woh-panel-accent: ${colors.panelAccentDefault};
    }

    .woh-panel--interaction[data-stage='player'] {
      --woh-panel-accent: ${colors.panelAccentHand};
    }

    .woh-panel--interaction[data-stage='event'] {
      --woh-panel-accent: ${colors.panelAccentEvents};
    }

    .woh-panel--interaction[data-stage='event'][data-event-tone='defeat'] {
      --woh-panel-accent: ${colors.panelAccentDefeat};
    }

    .woh-panel--interaction[data-stage='ending'] {
      --woh-panel-accent: ${colors.panelAccentDefeat};
    }

    .woh-panel-title {
      font-family: "IM Fell English", "Times New Roman", serif;
      font-size: 0.98rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 12px;
      color: ${colors.panelTitle};
    }

    .woh-panel-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .woh-panel-header .woh-panel-title {
      margin-bottom: 0;
    }

    .woh-interaction-stage {
      display: flex;
      flex-direction: column;
      gap: 0;
      min-height: 0;
    }

    .woh-interaction-view {
      display: none;
      flex-direction: column;
      gap: 16px;
      min-height: 0;
    }

    .woh-interaction-view.is-active {
      display: flex;
    }

    .woh-story-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .woh-ending-card {
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .woh-ending-title {
      font-size: 1.05rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${colors.panelTitle};
    }

    .woh-ending-text {
      font-size: 0.96rem;
      line-height: 1.7;
      color: ${colors.logEntriesText};
      white-space: pre-line;
    }

    .woh-story-type {
      font-size: 0.82rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${colors.logHeaderText};
    }

    .woh-story-text {
      font-size: 0.95rem;
      line-height: 1.6;
      color: ${colors.logEntriesText};
      white-space: pre-line;
    }

    .woh-turn-card {
      padding: 0;
      overflow: hidden;
    }

    .woh-turn-main {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
    }

    .woh-turn-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .woh-turn-header .woh-panel-header {
      margin-bottom: 0;
    }

    .woh-turn-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .woh-action-dots {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .woh-action-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid ${colors.actionDotBorder};
      background: ${colors.actionDotBackground};
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .woh-action-dot.is-active {
      border-color: ${colors.actionDotActiveBorder};
      background: ${colors.actionDotActiveBackground};
    }

    .woh-turn-summary {
      margin-top: auto;
      padding: 14px 20px;
      border-top: 1px solid ${colors.eventDeckBorder};
      background: ${colors.eventDeckBackground};
      box-shadow: inset 0 1px 0 ${colors.eventDeckInset};
      display: flex;
      flex-wrap: wrap;
      gap: 12px 20px;
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${colors.eventDeckText};
    }

    .woh-turn-summary-items {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 20px;
    }

    .woh-turn-summary-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .woh-actions-label {
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: ${colors.actionsLabel};
    }

    .woh-hand {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: thin;
      scroll-snap-type: x proximity;
      -webkit-overflow-scrolling: touch;
      position: relative;
    }

    .woh-hand-play-summary {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid ${colors.panelBorder};
      background: linear-gradient(160deg, var(--woh-panel-surface-deep), ${colors.panelSurfaceAlt});
      box-shadow: inset 0 0 0 1px ${colors.panelInsetShadow};
      color: ${colors.cardDescription};
      font-size: 0.85rem;
      line-height: 1.45;
    }

    .woh-hand-play-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }

    .woh-hand-play-title {
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: ${colors.cardCosts};
    }

    .woh-hand-play-outcome {
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .woh-hand-play-outcome[data-result='success'] {
      color: ${colors.statHealText};
    }

    .woh-hand-play-outcome[data-result='fail'] {
      color: ${colors.statDamageText};
    }

    .woh-hand-play-text {
      margin: 0;
      color: ${colors.cardDescription};
    }

    .woh-hand-card {
      position: relative;
      flex: 0 0 140px;
      background: ${colors.handCardBackground};
      border: 1px solid ${colors.handCardBorder};
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      scroll-snap-align: start;
      box-shadow: 0 12px 24px ${colors.handCardShadow};
    }

    .woh-hand-card:hover,
    .woh-hand-card:focus-visible,
    .woh-hand-card[data-expanded="true"] {
      transform: translateY(-4px) scale(1.02);
      border-color: ${colors.handCardHoverBorder};
      box-shadow: 0 14px 32px ${colors.handCardHoverShadow};
      outline: none;
    }

    .woh-hand-card[data-playable="false"] {
      filter: grayscale(0.4) brightness(0.75);
    }

    .woh-hand-card--shake {
      animation: woh-hand-card-shake 0.45s ease;
      box-shadow: 0 0 18px ${colors.statDamageParticle};
    }

    .woh-hand-card-ghost {
      position: fixed;
      top: 0;
      left: 0;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0.95;
      z-index: 50;
      animation-duration: 1s;
      animation-fill-mode: forwards;
      background: ${colors.handCardBackground};
      border: 1px solid ${colors.handCardHoverBorder};
      box-shadow: 0 12px 24px ${colors.handCardShadow};
    }

    .woh-hand-card-ghost[data-result='success'] {
      box-shadow: 0 0 20px ${colors.statHealParticle}, 0 0 50px ${colors.statHealParticle};
      border-color: ${colors.statHealText};
      animation-name: woh-hand-card-success;
    }

    .woh-hand-card-ghost[data-result='fail'] {
      box-shadow: 0 0 20px ${colors.statDamageParticle}, 0 0 50px ${colors.statDamageParticle};
      border-color: ${colors.statDamageText};
      animation-name: woh-hand-card-fail;
    }

    .woh-card-title {
      font-family: "IM Fell English", "Times New Roman", serif;
      font-size: 0.92rem;
      letter-spacing: 0.05em;
    }

    .woh-card-description {
      font-size: 0.75rem;
      line-height: 1.3;
      color: ${colors.cardDescription};
    }

    .woh-card-costs {
      display: flex;
      gap: 6px;
      font-size: 0.7rem;
      color: ${colors.cardCosts};
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .woh-tooltip {
      position: relative;
    }

    .woh-tooltip-bubble {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(calc(-50% + var(--tooltip-shift, 0px))) scale(var(--tooltip-scale, 0.9));
      transform-origin: bottom center;
      background: ${colors.tooltipBackground};
      border: 1px solid ${colors.tooltipBorder};
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

    .woh-tooltip[data-tooltip-placement="bottom"] .woh-tooltip-bubble {
      bottom: auto;
      top: calc(100% + 8px);
      transform-origin: top center;
    }

    .woh-tooltip:hover .woh-tooltip-bubble,
    .woh-tooltip:focus-visible .woh-tooltip-bubble,
    .woh-tooltip[data-expanded="true"] .woh-tooltip-bubble {
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
      color: ${colors.trackLabel};
    }

    .woh-track-bar {
      position: relative;
      height: 14px;
      border-radius: 999px;
      background: ${colors.trackBarBackground};
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
      background: ${colors.trackVictoryGradient};
      box-shadow: 0 0 12px ${colors.trackVictoryShadow};
    }

    .woh-track--doom .woh-track-progress {
      width: 36%;
      background: ${colors.trackDoomGradient};
      box-shadow: 0 0 16px ${colors.trackDoomShadow};
    }

    .woh-track--generic .woh-track-progress {
      background: ${colors.trackColdGradient};
      box-shadow: 0 0 12px ${colors.trackColdShadow};
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
      background: ${colors.trackMark};
    }

    .woh-track-mark.is-critical {
      height: 12px;
      background: ${colors.trackMarkCritical};
    }

    .woh-character-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .woh-panel-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid ${colors.panelSectionBorder};
    }

    .woh-subpanel-title {
      font-family: "IM Fell English", "Times New Roman", serif;
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 10px;
      color: ${colors.subpanelTitle};
    }

    .woh-stat-card {
      background: ${colors.statCardBackground};
      border: 1px solid ${colors.statCardBorder};
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
      overflow: visible;
      isolation: isolate;
    }

    .woh-stat-title {
      font-size: 0.78rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${colors.statTitle};
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
      color: ${colors.statValueLabel};
      letter-spacing: 0.08em;
    }

    .woh-stat-meter {
      position: relative;
      height: 10px;
      border-radius: 999px;
      background: ${colors.statMeterBackground};
      border: 1px solid ${colors.statMeterBorder};
      box-shadow: inset 0 0 0 1px ${colors.statMeterInner};
      overflow: hidden;
    }

    .woh-stat-meter-progress {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--woh-stat-meter-fill, ${colors.statMeterDefaultFill});
      box-shadow: 0 0 16px var(--woh-stat-meter-glow, ${colors.statMeterDefaultGlow});
      transition: width 0.25s ease;
    }

    .woh-stat-card.is-critical {
      animation: woh-pulse 1.6s infinite;
      border-color: ${colors.statCriticalBorder};
    }

    @keyframes woh-pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 ${colors.statCriticalPulseOuter};
      }
      50% {
        box-shadow: 0 0 12px 6px ${colors.statCriticalPulseInner};
      }
    }

    @keyframes woh-hand-card-shake {
      0% {
        transform: translateX(0);
      }

      25% {
        transform: translateX(-6px);
      }

      50% {
        transform: translateX(6px);
      }

      75% {
        transform: translateX(-4px);
      }

      100% {
        transform: translateX(0);
      }
    }

    @keyframes woh-hand-card-success {
      0% {
        opacity: 0.95;
        transform: translate(-50%, -50%) scale(1);
      }

      40% {
        transform: translate(-50%, -70%) scale(1.05);
      }

      100% {
        opacity: 0;
        transform: translate(-50%, -115%) scale(0.92);
      }
    }

    @keyframes woh-hand-card-fail {
      0% {
        opacity: 0.95;
        transform: translate(-50%, -50%) rotate(0deg);
      }

      30% {
        transform: translate(calc(-50% - 6px), calc(-50% + 8px)) rotate(-3deg);
      }

      60% {
        transform: translate(calc(-50% + 6px), calc(-50% + 12px)) rotate(3deg);
      }

      100% {
        opacity: 0;
        transform: translate(-50%, -15%) rotate(6deg);
      }
    }

    .woh-stat-flash {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      opacity: 0;
      mix-blend-mode: screen;
    }

    .woh-stat-flash--damage {
      background: var(--woh-stat-damage-flash);
      animation: woh-stat-flash 0.95s ease-out forwards;
    }

    .woh-stat-flash--heal {
      background: var(--woh-stat-heal-flash);
      animation: woh-stat-flash 1s ease-out forwards;
    }

    .woh-stat-float-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      font-family: "JetBrains Mono", monospace;
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: 0.02em;
      filter: drop-shadow(0 0 8px var(--woh-stat-float-shadow));
      opacity: 0;
      --drift-x: 0px;
      --travel-y: -30px;
      animation: woh-stat-float 1.05s ease-out forwards;
      z-index: 2;
    }

    .woh-stat-float-label--damage {
      color: var(--woh-stat-damage-text);
    }

    .woh-stat-float-label--heal {
      color: var(--woh-stat-heal-text);
    }

    .woh-stat-particle {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0.9;
      transform: translate(-50%, -50%);
      --particle-x: 0px;
      --particle-y: -20px;
      --particle-scale: 1;
      animation: woh-stat-particle 0.9s ease-out forwards;
      z-index: 1;
    }

    .woh-stat-particle--damage {
      background: var(--woh-stat-damage-particle);
    }

    .woh-stat-particle--heal {
      background: var(--woh-stat-heal-particle);
    }

    @keyframes woh-stat-flash {
      0% {
        opacity: 0.75;
        transform: scale(1);
      }
      60% {
        opacity: 0.25;
      }
      100% {
        opacity: 0;
        transform: scale(1.08);
      }
    }

    @keyframes woh-stat-float {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%);
      }
      10% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(calc(-50% + var(--drift-x)), calc(-50% + var(--travel-y)));
      }
    }

    @keyframes woh-stat-particle {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(var(--particle-scale));
      }
      100% {
        opacity: 0;
        transform: translate(calc(-50% + var(--particle-x)), calc(-50% + var(--particle-y))) scale(0.35);
      }
    }

    @keyframes woh-panel-journal-pulse {
      0%,
      100% {
        opacity: 0;
        box-shadow: 0 0 0 0 ${colors.panelPulseJournalInner}, 0 0 0 0 ${colors.panelPulseJournalOuter};
      }
      50% {
        opacity: 1;
        box-shadow: 0 0 12px 3px ${colors.panelPulseJournalInner}, 0 0 52px 12px ${colors.panelPulseJournalOuter};
      }
    }

    @keyframes woh-panel-hand-pulse {
      0%,
      100% {
        opacity: 0;
        box-shadow: 0 0 0 0 ${colors.panelPulseHandInner}, 0 0 0 0 ${colors.panelPulseHandOuter};
      }
      50% {
        opacity: 1;
        box-shadow: 0 0 10px 2px ${colors.panelPulseHandInner}, 0 0 40px 10px ${colors.panelPulseHandOuter};
      }
    }

    @keyframes woh-panel-event-pulse {
      0%,
      100% {
        opacity: 0;
        box-shadow: 0 0 0 0 ${colors.panelPulseEventInner}, 0 0 0 0 ${colors.panelPulseEventOuter};
      }
      50% {
        opacity: 1;
        box-shadow: 0 0 10px 2px ${colors.panelPulseEventInner}, 0 0 42px 10px ${colors.panelPulseEventOuter};
      }
    }

    .woh-phase {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 12px;
      background: ${colors.phaseBackground};
      border: 1px solid ${colors.phaseBorder};
      box-shadow: inset 0 0 0 1px ${colors.phaseInnerShadow};
    }

    .woh-phase--compact {
      padding: 10px 12px;
      gap: 12px;
    }

    .woh-phase-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 1.2rem;
      background: ${colors.phaseIconBackground};
    }

    .woh-phase--compact .woh-phase-icon {
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }

    .woh-phase-labels {
      display: flex;
      flex-direction: column;
      text-align: right;
      gap: 4px;
    }

    .woh-panel-header .woh-phase-labels {
      text-align: right;
    }

    .woh-phase-title {
      font-size: 0.75rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${colors.phaseTitle};
    }

    .woh-phase-subtitle {
      font-size: 0.68rem;
      color: ${colors.phaseSubtitle};
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
      background: ${colors.effectChipBackground};
      border: 1px solid ${colors.effectChipBorder};
      font-size: 0.68rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${colors.effectChipText};
      cursor: pointer;
    }

    .woh-npc-row {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: thin;
      scroll-snap-type: x proximity;
      -webkit-overflow-scrolling: touch;
    }

    .woh-npc-card {
      flex: 0 0 160px;
      background: ${colors.npcCardBackground};
      border: 1px solid ${colors.npcCardBorder};
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-snap-align: start;
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
      background: ${colors.npcAvatarBackground};
      border: 1px solid ${colors.npcAvatarBorder};
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
      color: ${colors.npcTimer};
    }

    .woh-npc-body {
      font-size: 0.72rem;
      line-height: 1.4;
      color: ${colors.npcBody};
    }

    .woh-event-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .woh-event-main {
      position: relative;
      background: ${colors.eventCardBackground};
      border: 1px solid ${colors.eventCardBorder};
      border-radius: 18px;
      padding: 20px;
      box-shadow: inset 0 0 0 1px ${colors.eventCardInset};
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
      color: ${colors.eventFlavor};
      font-style: italic;
    }

    .woh-event-effect {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px dashed ${colors.eventEffectBorder};
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: ${colors.eventEffectText};
    }

    .woh-event-choices {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .woh-event-result {
      border-top: 1px dashed ${colors.eventEffectBorder};
      padding: 14px 0 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: ${colors.eventEffectText};
    }

    .woh-event-result-title {
      font-size: 0.78rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${colors.logEntryTypeText};
    }

    .woh-event-result-body {
      font-size: 0.9rem;
      line-height: 1.5;
      white-space: pre-line;
    }

    .woh-button--full {
      width: 100%;
      justify-content: center;
    }

    .woh-event-empty {
      margin: 0;
      font-size: 0.78rem;
      color: ${colors.eventFlavor};
      font-style: italic;
    }

    .woh-choice-button {
      border-radius: 12px;
      background: ${colors.choiceBackground};
      border: 1px solid ${colors.choiceBorder};
      padding: 10px 14px;
      text-align: left;
      font-size: 0.78rem;
      letter-spacing: 0.06em;
      color: ${colors.choiceText};
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .woh-choice-button:hover,
    .woh-choice-button:focus-visible {
      border-color: ${colors.choiceHoverBorder};
      background: ${colors.choiceHoverBackground};
      outline: none;
    }

    .woh-event-deck {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 16px;
      border-radius: 14px;
      background: ${colors.eventDeckBackground};
      border: 1px solid ${colors.eventDeckBorder};
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${colors.eventDeckText};
      box-shadow: inset 0 0 0 1px ${colors.eventDeckInset};
    }

    .woh-log {
      border: 1px solid ${colors.logBorder};
      border-radius: 16px;
      background: ${colors.logBackground};
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      min-height: 0;
      box-shadow: inset 0 0 0 1px ${colors.panelGlassInnerHighlight};
    }

    .woh-log-entries {
      overflow-y: auto;
      display: grid;
      gap: 10px;
      padding-right: 8px;
      font-size: 0.82rem;
      line-height: 1.4;
      color: ${colors.logEntriesText};
      flex: 1;
      min-height: 0;
    }

    .woh-log-entry {
      display: grid;
      gap: 6px;
      padding: 10px 14px;
      border-radius: 12px;
      background: ${colors.logEntryBackground};
      border: 1px solid ${colors.logEntryBorder};
      box-shadow: inset 0 0 0 1px ${colors.logEntryInset};
    }

    .woh-log-entry[data-variant='story'] {
      background: ${colors.logEntryVariants?.story?.background ?? colors.logEntryBackground};
      border-color: ${colors.logEntryVariants?.story?.border ?? colors.logEntryBorder};
      box-shadow:
        inset 0 0 0 1px ${colors.logEntryInset},
        0 0 14px ${colors.logEntryVariants?.story?.glow ?? colors.panelHighlight};
    }

    .woh-log-entry[data-variant='player'] {
      background: ${colors.logEntryVariants?.player?.background ?? colors.logEntryBackground};
      border-color: ${colors.logEntryVariants?.player?.border ?? colors.logEntryBorder};
      box-shadow:
        inset 0 0 0 1px ${colors.logEntryInset},
        0 0 14px ${colors.logEntryVariants?.player?.glow ?? colors.panelHighlight};
    }

    .woh-log-entry[data-variant='system'] {
      background: ${colors.logEntryVariants?.system?.background ?? colors.logEntryBackground};
      border-color: ${colors.logEntryVariants?.system?.border ?? colors.logEntryBorder};
      box-shadow:
        inset 0 0 0 1px ${colors.logEntryInset},
        0 0 14px ${colors.logEntryVariants?.system?.glow ?? colors.panelHighlight};
    }

    .woh-log-entry[data-variant='effect'] {
      background: ${colors.logEntryVariants?.effect?.background ?? colors.logEntryBackground};
      border-color: ${colors.logEntryVariants?.effect?.border ?? colors.logEntryBorder};
      box-shadow:
        inset 0 0 0 1px ${colors.logEntryInset},
        0 0 14px ${colors.logEntryVariants?.effect?.glow ?? colors.panelHighlight};
    }

    .woh-log-entry-type {
      font-size: 0.74rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${colors.logEntryTypeText};
    }

    .woh-log-entry-body {
      font-size: 0.88rem;
    }

    .woh-log-empty {
      font-size: 0.78rem;
      color: ${colors.logEntriesText};
      opacity: 0.7;
    }

    @media (max-width: 1280px) {
      .woh-main {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .woh-column--log {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 900px) {
      .woh-main {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
      }

      .woh-column--log {
        order: 1;
      }

      .woh-column--interaction {
        order: 2;
      }

      .woh-column--center {
        order: 3;
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

      .woh-turn-summary {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .woh-turn-summary-items {
        width: 100%;
      }
    }

    @media (max-width: 600px) {
      .woh-header {
        padding: 16px;
      }

      .woh-header-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }

      .woh-header-actions .woh-button {
        width: 100%;
      }

      .woh-main {
        padding: 16px;
        gap: 16px;
      }

      .woh-panel {
        padding: 14px;
      }

      .woh-event-main {
        padding: 16px;
      }

      .woh-event-deck {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .woh-event-choices {
        display: grid;
        gap: 8px;
      }

      .woh-log {
        padding: 16px;
      }
    }

    @media (max-width: 480px) {
      .woh-logo-mark {
        flex-direction: column;
        align-items: center;
        text-align: center;
        font-size: 0.75rem;
        gap: 8px;
      }

      .woh-logo-icon {
        width: 28px;
        height: 28px;
        font-size: 0.6rem;
      }

      .woh-main {
        padding: 12px;
      }

      .woh-panel {
        padding: 12px;
      }

      .woh-panel-title {
        font-size: 0.88rem;
        margin-bottom: 10px;
      }

      .woh-turn-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }

      .woh-action-dots {
        justify-content: center;
        width: 100%;
      }

      .woh-turn-summary {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .woh-turn-summary-items {
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }

      .woh-hand {
        gap: 10px;
        padding-bottom: 6px;
      }

      .woh-hand-card {
        flex: 0 0 85%;
        max-width: 320px;
      }

      .woh-card-title {
        font-size: 0.88rem;
      }

      .woh-card-description {
        font-size: 0.72rem;
      }

      .woh-card-costs {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .woh-character-stats {
        grid-template-columns: 1fr;
      }

      .woh-phase {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        text-align: left;
      }

      .woh-phase-labels {
        text-align: left;
        align-items: flex-start;
      }

      .woh-effects {
        flex-direction: column;
        align-items: stretch;
      }

      .woh-effect-chip {
        width: 100%;
        text-align: center;
      }

      .woh-world-tracks {
        gap: 12px;
      }

      .woh-track {
        gap: 6px;
      }

      .woh-track-label {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        font-size: 0.72rem;
      }

      .woh-track-bar {
        height: 12px;
      }

      .woh-track-marks {
        padding: 0 6px;
      }

      .woh-npc-row {
        flex-direction: column;
        overflow-x: visible;
        gap: 10px;
      }

      .woh-npc-card {
        flex: 1 1 auto;
        width: 100%;
      }

      .woh-event-main {
        padding: 14px;
      }

      .woh-event-title {
        font-size: 1rem;
      }

      .woh-event-flavor,
      .woh-event-effect {
        font-size: 0.78rem;
      }

      .woh-choice-button {
        width: 100%;
      }

      .woh-event-deck {
        gap: 6px;
        width: 100%;
      }

      .woh-event-deck span {
        width: 100%;
      }

      .woh-log {
        padding: 14px;
      }

      .woh-log-entry {
        padding: 10px 12px;
      }

      .woh-log-entry-body {
        font-size: 0.76rem;
      }
    }

    @media (max-width: 380px) {
      .woh-header {
        padding: 14px 12px;
      }

      .woh-header-actions {
        gap: 6px;
      }

      .woh-main {
        padding: 10px;
        gap: 12px;
      }

      .woh-panel {
        padding: 10px;
      }

      .woh-turn-actions {
        gap: 8px;
      }

      .woh-action-dots {
        gap: 4px;
      }

      .woh-hand-card {
        flex: 0 0 92%;
      }

      .woh-panel-title {
        font-size: 0.84rem;
      }

      .woh-event-title {
        font-size: 0.95rem;
      }

      .woh-event-flavor,
      .woh-event-effect {
        font-size: 0.75rem;
      }

      .woh-event-main {
        padding: 12px;
      }

      .woh-event-deck {
        padding: 10px;
        gap: 8px;
      }

      .woh-event-deck span {
        font-size: 0.7rem;
      }

      .woh-choice-button {
        padding: 8px 12px;
        font-size: 0.72rem;
      }

      .woh-track-label {
        font-size: 0.68rem;
      }

      .woh-track-marks {
        padding: 0 4px;
      }

      .woh-stat-card {
        padding: 10px;
      }

      .woh-log {
        padding: 12px 10px;
      }

      .woh-log-entry-body {
        font-size: 0.72rem;
      }

    }
  `;

export function injectGameLayoutStyles(): void {
  if (document.head.querySelector(`style[data-token="${STYLE_TOKEN}"]`)) {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-token", STYLE_TOKEN);
  style.textContent = STYLES;
  document.head.appendChild(style);
}
