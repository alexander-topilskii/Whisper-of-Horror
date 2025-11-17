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
import palette from "../../src/data/color-palette.json";

const STYLE_TOKEN = "woh-game-layout-styles";
const colors = palette.gameLayout;
type StatMeterPreset = { fill?: string; glow?: string };
const statMeterPresets: Record<string, StatMeterPreset> =
  (colors.statMeterPresets as Record<string, StatMeterPreset> | undefined) ?? {};
type StatChangeVariant = 'heal' | 'damage';

function ensureStyles() {
  if (document.head.querySelector(`style[data-token="${STYLE_TOKEN}"]`)) {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-token", STYLE_TOKEN);
  style.textContent = `
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


export class GameLayout {
  private readonly root: HTMLElement;
  private engine: GameEngine | null = null;
  private readonly actionDots: HTMLElement;
  private readonly actionsLabel: HTMLElement;
  private readonly playerDeck: HTMLElement;
  private readonly handList: HTMLElement;
  private readonly phaseIcon: HTMLElement;
  private readonly phaseTitle: HTMLElement;
  private readonly phaseSubtitle: HTMLElement;
  private readonly statusEffects: HTMLElement;
  private readonly npcList: HTMLElement;
  private readonly worldTracks: HTMLElement;
  private readonly scenarioTitle: HTMLElement;
  private readonly characterStats: HTMLElement;
  private readonly logPanel: HTMLElement;
  private readonly interactionPanel: HTMLElement;
  private readonly storyView: HTMLElement;
  private readonly playerView: HTMLElement;
  private readonly eventView: HTMLElement;
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
  private readonly logEntries: HTMLDivElement;
  private readonly soundToggle: HTMLButtonElement;
  private readonly newGameButton: HTMLButtonElement;
  private readonly settingsButton: HTMLButtonElement;
  private readonly logAdvanceButton: HTMLButtonElement;
  private readonly endTurnButton: HTMLButtonElement;
  private readonly eventContinueButton: HTMLButtonElement;
  private lastRenderedLogSize = 0;
  private statSnapshot = new Map<string, number>();

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

    ensureStyles();
    this.root = root;
    this.root.innerHTML = TEMPLATE;

    this.actionDots = this.requireElement('[data-role="action-dots"]');
    this.actionsLabel = this.requireElement('[data-role="actions-label"]');
    this.playerDeck = this.requireElement('[data-role="player-deck"]');
    this.handList = this.requireElement('[data-role="hand"]');
    this.phaseIcon = this.requireElement('[data-role="phase-icon"]');
    this.phaseTitle = this.requireElement('[data-role="phase-title"]');
    this.phaseSubtitle = this.requireElement('[data-role="phase-subtitle"]');
    this.statusEffects = this.requireElement('[data-role="status-effects"]');
    this.npcList = this.requireElement('[data-role="npc-list"]');
    this.worldTracks = this.requireElement('[data-role="world-tracks"]');
    this.scenarioTitle = this.requireElement('[data-role="scenario-title"]');
    this.characterStats = this.requireElement('[data-role="character-stats"]');
    this.logPanel = this.requireElement('[data-panel="log"]');
    this.interactionPanel = this.requireElement('[data-panel="interaction"]');
    this.storyView = this.requireElement('[data-view="story"]');
    this.playerView = this.requireElement('[data-view="player"]');
    this.eventView = this.requireElement('[data-view="event"]');
    this.storyTitle = this.requireElement('[data-role="story-title"]');
    this.storyBody = this.requireElement('[data-role="story-text"]');
    this.eventCard = this.requireElement('[data-role="event-card"]');
    this.eventTitle = this.requireElement('[data-role="event-title"]');
    this.eventFlavor = this.requireElement('[data-role="event-flavor"]');
    this.eventEffect = this.requireElement('[data-role="event-effect"]');
    this.eventChoices = this.requireElement('[data-role="event-choices"]');
    this.eventDeck = this.requireElement('[data-role="event-deck"]');
    this.eventResult = this.requireElement('[data-role="event-result"]');
    this.eventResultTitle = this.requireElement('[data-role="event-result-title"]');
    this.eventResultBody = this.requireElement('[data-role="event-result-body"]');
    this.logEntries = this.requireElement<HTMLDivElement>('[data-role="log-entries"]');
    this.soundToggle = this.requireElement<HTMLButtonElement>('[data-action="toggle-sound"]');
    this.newGameButton = this.requireElement<HTMLButtonElement>('[data-action="new-game"]');
    this.settingsButton = this.requireElement<HTMLButtonElement>('[data-action="settings"]');
    this.logAdvanceButton = this.requireElement<HTMLButtonElement>('[data-action="advance-log"]');
    this.endTurnButton = this.requireElement<HTMLButtonElement>('[data-action="end-turn"]');
    this.eventContinueButton = this.requireElement<HTMLButtonElement>('[data-action="complete-event"]');

    this.enableTooltipToggles();
    this.enableTooltipPositioning();
    this.newGameButton.addEventListener('click', this.handleNewGameClick);
    this.settingsButton.addEventListener('click', this.handleSettingsClick);
    this.soundToggle.addEventListener('click', this.handleSoundToggleClick);
    this.logAdvanceButton.addEventListener('click', this.handleAdvanceLogClick);
    this.endTurnButton.addEventListener('click', this.handleEndTurnClick);
    this.eventContinueButton.addEventListener('click', this.handleCompleteEventClick);
    this.root.addEventListener('click', this.handleRootCommand);
  }

  public bind(engine: GameEngine): void {
    if (this.engine) {
      throw new Error('GameLayout is already bound to an engine');
    }

    this.engine = engine;
  }

  public render(state: GameState): void {
    this.renderActions(state.turn);
    this.renderPlayerDeck(state.decks);
    this.renderHand(state.hand);
    this.renderPhase(state.phase);
    this.renderStatuses(state.statuses, state.temporaryMarkers);
    this.renderNpcs(state.npcs);
    this.renderScenario(state.scenario);
    this.renderWorldTracks(state.worldTracks);
    this.renderCharacterStats(state.characterStats);
    this.renderEvent(state);
    this.renderInteractionStage(state);
    this.renderLog(state.log, state.autoScrollLog);
    this.updateSoundToggle(state.soundEnabled);
    this.updateGuidanceHighlights(state);
  }

  private requireElement<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) {
      throw new Error(`GameLayout expected element ${selector}`);
    }
    return element;
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

  private renderPhase(phase: GameState['phase']): void {
    this.phaseIcon.textContent = phase.icon;
    this.phaseTitle.textContent = phase.name;
    this.phaseSubtitle.textContent = phase.subtitle;
  }

  private renderStatuses(
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

  private renderNpcs(npcs: GameState['npcs']): void {
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

  private renderScenario(scenario: GameState['scenario']): void {
    this.scenarioTitle.textContent = scenario?.title ?? 'Сценарий';
  }

  private renderWorldTracks(tracks: GameState['worldTracks']): void {
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

  private renderCharacterStats(stats: GameState['characterStats']): void {
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

  private renderEvent(state: GameState): void {
    const event = state.event;
    const tone = event.type ?? 'mystery';
    this.interactionPanel.setAttribute('data-event-tone', tone);
    this.eventCard.setAttribute('data-event-tone', tone);
    this.eventTitle.textContent = event.title;
    this.eventFlavor.textContent = event.flavor;
    this.eventEffect.textContent = event.effect;
    const eventActive = state.loopStage === 'event' && !state.gameOutcome;
    const awaitingChoice = eventActive && state.eventResolutionPending;
    this.eventChoices.classList.toggle('is-hidden', !awaitingChoice);
    this.renderEventChoices(event, awaitingChoice);
    this.renderEventDeck(state.decks.event);
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

  private renderInteractionStage(state: GameState): void {
    const storyActive = state.loopStage === 'story' && this.hasPendingJournalEntry(state.journalScript);
    const eventActive = state.loopStage === 'event' && !state.gameOutcome;
    const stage = storyActive ? 'story' : eventActive ? 'event' : 'player';
    this.interactionPanel.setAttribute('data-stage', stage);
    this.storyView.classList.toggle('is-active', storyActive);
    this.playerView.classList.toggle('is-active', stage === 'player');
    this.eventView.classList.toggle('is-active', eventActive);
    this.renderStoryPrompt(state.journalScript, storyActive);
    this.renderEventResolution(state, eventActive);
    this.renderEndTurnButton(state, stage === 'player');
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

  private renderLog(log: GameState['log'], autoScroll: boolean): void {
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

  private renderEndTurnButton(state: GameState, playerStageActive: boolean): void {
    const visible =
      playerStageActive && state.loopStage === 'player' && state.journalScript.completed && !state.gameOutcome;
    this.endTurnButton.classList.toggle('is-hidden', !visible);
    this.endTurnButton.disabled = !visible;
  }

  private hasPendingJournalEntry(script: GameState['journalScript']): boolean {
    return !script.completed && script.nextIndex < script.entries.length;
  }

  private updateGuidanceHighlights(state: GameState): void {
    const needsJournal = state.loopStage === 'story' && this.hasPendingJournalEntry(state.journalScript);
    this.logPanel.classList.remove('woh-panel--pulse-journal');
    this.interactionPanel.classList.toggle('woh-panel--pulse-journal', needsJournal);

    const playerPhaseActive = state.loopStage === 'player' && !state.gameOutcome;
    this.interactionPanel.classList.toggle('woh-panel--pulse-hand', playerPhaseActive);

    const eventPhaseActive = state.loopStage === 'event' && !state.gameOutcome;
    this.interactionPanel.classList.toggle('woh-panel--pulse-event', eventPhaseActive);
  }

  private updateSoundToggle(enabled: boolean): void {
    this.soundToggle.textContent = enabled ? '🔊' : '🔇';
    this.soundToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  // No heuristic helpers required: variants are assigned by the engine.

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
      horizontalShift = (viewportWidth - viewportPadding) - bubbleRect.right;
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

