import {
  AppendLogEntryCommand,
  GameEngine,
  PlayCardCommand,
  ResolveEventChoiceCommand,
  StartNewGameCommand,
  ToggleSoundCommand,
} from "../game-engine/game-engine";
import type { GameState } from "../game-engine/game-engine";

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

    html {
      width: 100%;
    }

    body {
      margin: 0;
      font-family: "JetBrains Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(120% 120% at 50% 20%, rgba(16, 37, 32, 0.6) 0%, rgba(5, 10, 10, 1) 55%, rgba(0, 0, 0, 1) 100%);
      color: rgba(220, 235, 229, 0.92);
      min-height: 100vh;
      overflow-x: hidden;
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
      scroll-snap-type: x proximity;
      -webkit-overflow-scrolling: touch;
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
      scroll-snap-align: start;
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

    .woh-tooltip-bubble {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(calc(-50% + var(--tooltip-shift, 0px))) scale(var(--tooltip-scale, 0.9));
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

    .woh-panel-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(102, 152, 141, 0.18);
    }

    .woh-subpanel-title {
      font-family: "IM Fell English", "Times New Roman", serif;
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 10px;
      color: rgba(177, 217, 211, 0.78);
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
      scroll-snap-type: x proximity;
      -webkit-overflow-scrolling: touch;
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

      .woh-turn-resources {
        gap: 12px;
      }

      .woh-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }

      .woh-action-dots {
        justify-content: center;
      }

      .woh-deck-status {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        width: 100%;
      }

      .woh-deck-indicator {
        justify-content: space-between;
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

      .woh-log-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
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

      .woh-actions {
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

      .woh-log-header {
        gap: 4px;
        width: 100%;
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
      <section class="woh-column woh-column--left">
        <article class="woh-panel">
          <h2 class="woh-panel-title">Ресурсы Хода</h2>
          <div class="woh-turn-resources">
            <div class="woh-actions">
              <div class="woh-action-dots" role="group" aria-label="Очки действия" data-role="action-dots"></div>
              <span class="woh-actions-label" data-role="actions-label"></span>
            </div>
            <div class="woh-deck-status" data-role="player-deck"></div>
          </div>
        </article>
        <article class="woh-panel">
          <h2 class="woh-panel-title">Рука</h2>
          <div class="woh-hand" role="list" data-role="hand"></div>
        </article>
      </section>
      <section class="woh-column woh-column--center">
        <article class="woh-panel">
          <h2 class="woh-panel-title">Треки Кампании</h2>
          <div class="woh-world-tracks" data-role="world-tracks"></div>
        </article>
        <article class="woh-panel">
          <h2 class="woh-panel-title">Фаза Мира</h2>
          <div class="woh-phase">
            <div class="woh-phase-icon" aria-hidden="true" data-role="phase-icon"></div>
            <div class="woh-phase-labels">
              <span class="woh-phase-title" data-role="phase-title"></span>
              <span class="woh-phase-subtitle" data-role="phase-subtitle"></span>
            </div>
          </div>
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
      <section class="woh-column woh-column--right">
        <article class="woh-panel woh-event-card">
          <h2 class="woh-panel-title">Текущее Событие</h2>
          <div class="woh-event-main">
            <div class="woh-event-title" data-role="event-title"></div>
            <div class="woh-event-flavor" data-role="event-flavor"></div>
            <div class="woh-event-effect" data-role="event-effect"></div>
            <div class="woh-event-choices" data-role="event-choices"></div>
          </div>
          <div class="woh-event-deck" data-role="event-deck"></div>
        </article>
      </section>
    </div>
    <footer class="woh-log">
      <div class="woh-log-header">
        <span>Журнал Хода</span>
        <span data-role="log-autoscroll"></span>
      </div>
      <div class="woh-log-entries" aria-live="polite" data-role="log-entries"></div>
    </footer>
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
  private readonly characterStats: HTMLElement;
  private readonly eventTitle: HTMLElement;
  private readonly eventFlavor: HTMLElement;
  private readonly eventEffect: HTMLElement;
  private readonly eventChoices: HTMLElement;
  private readonly eventDeck: HTMLElement;
  private readonly logAutoscroll: HTMLElement;
  private readonly logEntries: HTMLElement;
  private readonly soundToggle: HTMLButtonElement;
  private readonly newGameButton: HTMLButtonElement;
  private readonly settingsButton: HTMLButtonElement;
  private lastRenderedLogSize = 0;

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

    this.engine.dispatch(new AppendLogEntryCommand('[Система]', 'Меню настроек пока недоступно.'));
  };

  private readonly handleSoundToggleClick = () => {
    if (!this.engine) {
      return;
    }

    this.engine.dispatch(new ToggleSoundCommand());
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
    this.characterStats = this.requireElement('[data-role="character-stats"]');
    this.eventTitle = this.requireElement('[data-role="event-title"]');
    this.eventFlavor = this.requireElement('[data-role="event-flavor"]');
    this.eventEffect = this.requireElement('[data-role="event-effect"]');
    this.eventChoices = this.requireElement('[data-role="event-choices"]');
    this.eventDeck = this.requireElement('[data-role="event-deck"]');
    this.logAutoscroll = this.requireElement('[data-role="log-autoscroll"]');
    this.logEntries = this.requireElement('[data-role="log-entries"]');
    this.soundToggle = this.requireElement<HTMLButtonElement>('[data-action="toggle-sound"]');
    this.newGameButton = this.requireElement<HTMLButtonElement>('[data-action="new-game"]');
    this.settingsButton = this.requireElement<HTMLButtonElement>('[data-action="settings"]');

    this.enableTooltipToggles();
    this.enableTooltipPositioning();
    this.newGameButton.addEventListener('click', this.handleNewGameClick);
    this.settingsButton.addEventListener('click', this.handleSettingsClick);
    this.soundToggle.addEventListener('click', this.handleSoundToggleClick);
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
    this.renderStatuses(state.statuses);
    this.renderNpcs(state.npcs);
    this.renderWorldTracks(state.worldTracks);
    this.renderCharacterStats(state.characterStats);
    this.renderEvent(state.event, state.decks.event);
    this.renderLog(state.log, state.autoScrollLog);
    this.updateSoundToggle(state.soundEnabled);
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
    this.actionsLabel.textContent = `Действия: ${turn.actions.remaining}/${turn.actions.total}`;
  }

  private renderPlayerDeck(decks: GameState['decks']): void {
    this.playerDeck.innerHTML = '';

    const drawIndicator = document.createElement('div');
    drawIndicator.className = 'woh-deck-indicator';
    const drawIcon = document.createElement('span');
    drawIcon.className = 'woh-deck-icon';
    drawIcon.textContent = '🂠';
    const drawLabel = document.createElement('span');
    drawLabel.textContent = `Колода: ${decks.player.draw}`;
    drawIndicator.append(drawIcon, drawLabel);

    const discardIndicator = document.createElement('div');
    discardIndicator.className = 'woh-deck-indicator';
    const discardIcon = document.createElement('span');
    discardIcon.className = 'woh-deck-icon';
    discardIcon.textContent = '♻︎';
    const discardLabel = document.createElement('span');
    discardLabel.textContent = `Сброс: ${decks.player.discard}`;
    discardIndicator.append(discardIcon, discardLabel);

    this.playerDeck.append(drawIndicator, discardIndicator);
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

  private renderStatuses(statuses: GameState['statuses']): void {
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
      const progressWidth = Math.max(0, Math.min(100, (track.value / track.max) * 100));
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

      card.append(title, value);
      fragment.append(card);
    });

    this.characterStats.append(fragment);
  }

  private renderEvent(event: GameState['event'], deck: GameState['decks']['event']): void {
    this.eventTitle.textContent = event.title;
    this.eventFlavor.textContent = event.flavor;
    this.eventEffect.textContent = event.effect;
    this.renderEventChoices(event.choices);
    this.renderEventDeck(deck);
  }

  private renderEventChoices(choices: GameState['event']['choices']): void {
    this.eventChoices.innerHTML = '';
    const fragment = document.createDocumentFragment();

    choices.forEach((choice) => {
      const button = document.createElement('button');
      button.className = 'woh-choice-button';
      button.type = 'button';
      button.textContent = choice.label;
      button.dataset.command = 'resolve-choice';
      button.dataset.choiceId = choice.id;
      button.disabled = Boolean(choice.resolved);
      button.setAttribute('aria-pressed', choice.resolved ? 'true' : 'false');
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

  private renderLog(log: GameState['log'], autoScroll: boolean): void {
    this.logEntries.innerHTML = '';
    const fragment = document.createDocumentFragment();

    log.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'woh-log-entry';

      const type = document.createElement('span');
      type.className = 'woh-log-entry-type';
      type.textContent = entry.type;

      const body = document.createElement('span');
      body.className = 'woh-log-entry-body';
      body.textContent = entry.body;

      item.append(type, body);
      fragment.append(item);
    });

    this.logEntries.append(fragment);
    if (autoScroll && log.length !== this.lastRenderedLogSize) {
      this.logEntries.scrollTo({ top: 0, behavior: this.lastRenderedLogSize ? 'smooth' : 'auto' });
    }
    this.lastRenderedLogSize = log.length;
    this.logAutoscroll.textContent = autoScroll ? 'Автопрокрутка: Вкл.' : 'Автопрокрутка: Выкл.';
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

