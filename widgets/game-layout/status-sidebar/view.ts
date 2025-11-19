import type { GameState } from "../../game-engine/state";
import { statMeterPresets } from "../styles";
import { expectElement, type TooltipDelegate } from "../dom-utils";

type StatChangeVariant = 'heal' | 'damage';

export class StatusSidebarView {
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

  public renderStatuses(statuses: GameState['statuses'], markers: GameState['temporaryMarkers']): void {
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
