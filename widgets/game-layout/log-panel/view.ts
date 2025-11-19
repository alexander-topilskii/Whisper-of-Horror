import type { GameState } from "../../game-engine/state";
import { expectElement } from "../dom-utils";

export class LogPanelView {
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
