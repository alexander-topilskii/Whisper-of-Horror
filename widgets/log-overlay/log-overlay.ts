import type { GameState } from "../game-engine/game-engine";

const STYLE_TOKEN = "woh-log-overlay-styles";
const MIN_WIDTH = 280;
const MIN_HEIGHT = 160;

type ResizeHandle = "top" | "right" | "bottom" | "left" | "corner";

function ensureStyles(): void {
  if (document.head.querySelector(`style[data-token="${STYLE_TOKEN}"]`)) {
    return;
  }

  const style = document.createElement("style");
  style.dataset.token = STYLE_TOKEN;
  style.textContent = `
    .woh-log-overlay {
      position: fixed;
      top: 24px;
      right: 24px;
      width: 360px;
      height: 300px;
      min-width: ${MIN_WIDTH}px;
      min-height: ${MIN_HEIGHT}px;
      display: flex;
      flex-direction: column;
      background: rgba(5, 12, 11, 0.92);
      border: 1px solid rgba(98, 156, 144, 0.4);
      border-radius: 18px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65);
      z-index: 999;
      color: rgba(214, 238, 229, 0.92);
      overflow: hidden;
      backdrop-filter: blur(6px);
      cursor: default;
    }

    .woh-log-overlay[data-state="collapsed"] {
      height: auto;
      min-height: auto;
    }

    .woh-log-overlay-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(110, 160, 148, 0.25);
      gap: 12px;
      cursor: grab;
      user-select: none;
    }

    .woh-log-overlay[data-state="collapsed"] .woh-log-overlay-header {
      border-bottom: none;
    }

    .woh-log-overlay-title {
      display: flex;
      flex-direction: column;
      font-size: 0.78rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      gap: 4px;
    }

    .woh-log-overlay-autoscroll {
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      color: rgba(177, 210, 202, 0.75);
    }

    .woh-log-overlay-toggle {
      appearance: none;
      border: 1px solid rgba(128, 198, 182, 0.6);
      border-radius: 999px;
      background: rgba(10, 24, 22, 0.8);
      color: inherit;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 6px 12px;
      cursor: pointer;
    }

    .woh-log-overlay-last {
      padding: 12px 16px;
      font-size: 0.78rem;
      line-height: 1.4;
      border-bottom: 1px solid rgba(110, 160, 148, 0.2);
    }

    .woh-log-overlay[data-state="collapsed"] .woh-log-overlay-last {
      border-bottom: none;
    }

    .woh-log-overlay-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .woh-log-overlay[data-state="collapsed"] .woh-log-overlay-body {
      display: none;
    }

    .woh-log-overlay-entries {
      flex: 1;
      overflow-y: auto;
      padding: 12px 16px 16px;
      display: grid;
      gap: 10px;
      font-size: 0.82rem;
      line-height: 1.5;
    }

    .woh-log-overlay-entry {
      border-radius: 12px;
      border: 1px solid rgba(94, 146, 134, 0.3);
      background: rgba(16, 34, 32, 0.8);
      padding: 10px 14px;
      display: grid;
      gap: 6px;
    }

    .woh-log-overlay-entry-type {
      font-size: 0.68rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(161, 202, 193, 0.7);
    }

    .woh-log-overlay-resizer {
      position: absolute;
      z-index: 1000;
    }

    .woh-log-overlay-resizer[data-resize="right"],
    .woh-log-overlay-resizer[data-resize="left"] {
      top: 0;
      bottom: 0;
      width: 8px;
      cursor: ew-resize;
    }

    .woh-log-overlay-resizer[data-resize="right"] { right: -4px; }
    .woh-log-overlay-resizer[data-resize="left"] { left: -4px; }

    .woh-log-overlay-resizer[data-resize="top"],
    .woh-log-overlay-resizer[data-resize="bottom"] {
      left: 0;
      right: 0;
      height: 8px;
      cursor: ns-resize;
    }

    .woh-log-overlay-resizer[data-resize="top"] { top: -4px; }
    .woh-log-overlay-resizer[data-resize="bottom"] { bottom: -4px; }

    .woh-log-overlay-resizer[data-resize="corner"] {
      width: 12px;
      height: 12px;
      right: -6px;
      bottom: -6px;
      cursor: nwse-resize;
    }

    .woh-log-overlay[data-state="collapsed"] .woh-log-overlay-resizer {
      display: none;
    }

    @media (max-width: 720px) {
      .woh-log-overlay {
        width: calc(100% - 32px);
        left: 16px !important;
        right: 16px;
      }
    }
  `;

  document.head.appendChild(style);
}

export class LogOverlayWidget {
  private readonly root: HTMLElement;
  private readonly entries: HTMLElement;
  private readonly autoScrollLabel: HTMLElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly lastEntryPreview: HTMLElement;
  private collapsed = false;
  private lastRenderedSize = 0;

  constructor() {
    ensureStyles();
    this.root = document.createElement("section");
    this.root.className = "woh-log-overlay";
    this.root.dataset.state = "expanded";
    this.root.innerHTML = `
      <div class="woh-log-overlay-resizer" data-resize="top"></div>
      <div class="woh-log-overlay-resizer" data-resize="right"></div>
      <div class="woh-log-overlay-resizer" data-resize="bottom"></div>
      <div class="woh-log-overlay-resizer" data-resize="left"></div>
      <div class="woh-log-overlay-resizer" data-resize="corner"></div>
      <header class="woh-log-overlay-header" data-role="log-overlay-drag">
        <div class="woh-log-overlay-title">
          <span>Журнал хода</span>
          <span class="woh-log-overlay-autoscroll" data-role="log-overlay-autoscroll"></span>
        </div>
        <button class="woh-log-overlay-toggle" type="button" data-role="log-overlay-toggle" aria-expanded="true">
          Свернуть
        </button>
      </header>
      <div class="woh-log-overlay-last" data-role="log-overlay-last">Журнал пуст</div>
      <div class="woh-log-overlay-body">
        <div class="woh-log-overlay-entries" aria-live="polite" data-role="log-overlay-entries"></div>
      </div>
    `;

    document.body.appendChild(this.root);

    this.entries = this.query('[data-role="log-overlay-entries"]');
    this.autoScrollLabel = this.query('[data-role="log-overlay-autoscroll"]');
    this.toggleButton = this.query<HTMLButtonElement>('[data-role="log-overlay-toggle"]');
    this.lastEntryPreview = this.query('[data-role="log-overlay-last"]');

    this.toggleButton.addEventListener("click", () => this.toggle());
    this.setupDrag();
    this.setupResize();
  }

  public render(log: GameState["log"], autoScroll: boolean): void {
    this.autoScrollLabel.textContent = autoScroll ? "Автопрокрутка: Вкл." : "Автопрокрутка: Выкл.";
    this.entries.innerHTML = "";

    if (!log.length) {
      this.lastEntryPreview.textContent = "Новых событий нет";
      this.lastRenderedSize = 0;
      return;
    }

    const fragment = document.createDocumentFragment();
    log.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "woh-log-overlay-entry";
      item.dataset.logId = entry.id;

      const type = document.createElement("span");
      type.className = "woh-log-overlay-entry-type";
      type.textContent = entry.type;

      const body = document.createElement("p");
      body.textContent = entry.body;

      item.append(type, body);
      fragment.append(item);
    });

    this.entries.append(fragment);

    if (autoScroll && log.length !== this.lastRenderedSize) {
      this.entries.scrollTo({ top: 0, behavior: this.lastRenderedSize ? "smooth" : "auto" });
    }

    this.lastEntryPreview.textContent = `${log[0].type}: ${log[0].body}`;
    this.lastRenderedSize = log.length;
  }

  private toggle(): void {
    this.collapsed = !this.collapsed;
    this.root.dataset.state = this.collapsed ? "collapsed" : "expanded";
    this.toggleButton.textContent = this.collapsed ? "Развернуть" : "Свернуть";
    this.toggleButton.setAttribute("aria-expanded", String(!this.collapsed));
  }

  private setupDrag(): void {
    const dragHandle = this.root.querySelector<HTMLElement>('[data-role="log-overlay-drag"]');
    if (!dragHandle) {
      return;
    }

    dragHandle.addEventListener("mousedown", (event) => {
      if ((event.target as HTMLElement | null)?.closest("button")) {
        return;
      }
      this.startDrag(event);
    });
  }

  private startDrag(event: MouseEvent): void {
    event.preventDefault();
    const rect = this.root.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    this.ensureAbsolutePosition(rect.left, rect.top);

    const handleMove = (moveEvent: MouseEvent) => {
      const newLeft = Math.min(Math.max(0, moveEvent.clientX - offsetX), window.innerWidth - this.root.offsetWidth);
      const newTop = Math.min(Math.max(0, moveEvent.clientY - offsetY), window.innerHeight - this.root.offsetHeight);
      this.root.style.left = `${newLeft}px`;
      this.root.style.top = `${newTop}px`;
    };

    const stop = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stop);
  }

  private setupResize(): void {
    this.root.querySelectorAll<HTMLElement>("[data-resize]").forEach((handle) => {
      handle.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const type = handle.dataset.resize as ResizeHandle;
        this.startResize(event, type);
      });
    });
  }

  private startResize(event: MouseEvent, handle: ResizeHandle): void {
    const rect = this.root.getBoundingClientRect();
    this.ensureAbsolutePosition(rect.left, rect.top);
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;
    const startLeft = rect.left;
    const startTop = rect.top;

    const onMove = (moveEvent: MouseEvent) => {
      let width = startWidth;
      let height = startHeight;
      let left = startLeft;
      let top = startTop;
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (handle === "right" || handle === "corner") {
        width = Math.max(MIN_WIDTH, startWidth + deltaX);
      }

      if (handle === "bottom" || handle === "corner") {
        height = Math.max(MIN_HEIGHT, startHeight + deltaY);
      }

      if (handle === "left") {
        width = Math.max(MIN_WIDTH, startWidth - deltaX);
        left = startLeft + deltaX;
      }

      if (handle === "top") {
        height = Math.max(MIN_HEIGHT, startHeight - deltaY);
        top = startTop + deltaY;
      }

      left = Math.min(Math.max(0, left), window.innerWidth - width);
      top = Math.min(Math.max(0, top), window.innerHeight - height);

      this.root.style.width = `${width}px`;
      this.root.style.height = `${height}px`;
      this.root.style.left = `${left}px`;
      this.root.style.top = `${top}px`;
    };

    const stop = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
  }

  private ensureAbsolutePosition(left: number, top: number): void {
    this.root.style.left = `${left}px`;
    this.root.style.top = `${top}px`;
    this.root.style.right = "auto";
    this.root.style.bottom = "auto";
  }

  private query<T extends Element = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) {
      throw new Error(`LogOverlayWidget expected ${selector}`);
    }
    return element;
  }
}
