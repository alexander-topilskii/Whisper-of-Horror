## Name
GameEngine

## Purpose
`GameEngine` управляет единым состоянием партии «Whisper of Horror». Компонент применяет команды (command pattern) к снимку `GameState`, хранит историю действий и оповещает подписчиков об изменениях. UI-виджеты получают только снимки состояния и не изменяют данные напрямую.

## Visual Overview
```
┌────────────────────────────────────────────────────────────────────────┐
│ GameEngine                                                             │
│  ├─ state: GameState                                                   │
│  │    ├─ turn / decks / hand / statuses / NPC / event / log            │
│  │    └─ soundEnabled, autoScrollLog                                   │
│  ├─ dispatch(command) ➜ command.execute(clonedState) ➜ notify()        │
│  ├─ history[]: последовательность команд                               │
│  └─ listeners: Set<(GameState) => void>                                 │
└────────────────────────────────────────────────────────────────────────┘
```
- Темы и визуализации остаются в UI, здесь только данные.
- Команды возвращают новый снимок состояния; движок сам решает, когда уведомлять UI.
- Состояние клонится через `structuredClone` перед мутациями.

## Behavior
- Конструктор принимает начальный `GameState`, клонирует его и подготавливает историю.
- `dispatch(command)` клонирует текущее состояние, применяет команду, сохраняет результат и записывает команду в историю.
- `subscribe(listener)` добавляет подписчика и возвращает функцию для отписки; уведомления отправляются только после успешного `dispatch`.
- Команды (`PlayCardCommand`, `ResolveEventChoiceCommand`, `ToggleSoundCommand`, `StartNewGameCommand`, `AppendLogEntryCommand`) используют вспомогательные функции для изменения треков, статов и логов.
- Логи ограничиваются 20 последними записями, новые вставляются в начало.

## API (Props / Inputs / Outputs)
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `constructor(initialState)` | `GameState` | — | Создаёт движок на основе стартового снимка. |
| `dispatch(command)` | `GameCommand` | — | Применяет команду, обновляет состояние и уведомляет подписчиков. |
| `getState()` | `GameState` | — | Возвращает текущий снимок состояния (клон). |
| `getInitialStateSnapshot()` | `GameState` | — | Возвращает клон исходного начального состояния. |
| `subscribe(listener)` | `(GameState) => void` | — | Добавляет слушателя, возвращает функцию `unsubscribe`. |

### Команды
| Command | Purpose |
|---------|---------|
| `StartNewGameCommand(snapshot)` | Сбрасывает игру к начальному состоянию и пишет запись `[Система]`. |
| `PlayCardCommand(cardId)` | Удаляет карту из руки, тратит действия и записывает событие в лог. |
| `ResolveEventChoiceCommand(choiceId)` | Помечает выбор как завершённый, применяет эффекты (треки, статы, действия). |
| `ToggleSoundCommand()` | Переключает `soundEnabled` и фиксирует изменение в логе. |
| `AppendLogEntryCommand(type, body)` | Добавляет произвольную запись в журнал. |

## States and Examples
- **Старт игры**: `StartNewGameCommand` возвращает базовое состояние с заполненными руками и обнулённой историей.
- **Розыгрыш карты**: `PlayCardCommand` уменьшает `turn.actions.remaining`, переносит карту из `hand` в `decks.player.discard`, добавляет запись `[Действие]`.
- **Развилка события**: `ResolveEventChoiceCommand` помечает кнопку выбора как `resolved`, изменяет трек разрушения или статы, добавляет записи `[Событие]` и `[Улика]` (если выбор даёт улику).
- **Переключение звука**: `ToggleSoundCommand` меняет `soundEnabled` и фиксирует состояние в логе.

## Lifecycle
- **Init**: создать `const engine = new GameEngine(initialState);`.
- **Update**: любые изменения проходят через `engine.dispatch(new SomeCommand())`.
- **Destroy**: отписать слушателей, очистить ссылки (UI должен вызвать `unsubscribe`). Дополнительного состояния вне `engine` нет.
- **Dependencies**: стандартный браузерный `structuredClone`; дополнительных библиотек нет.

## Integration Example
```ts
import initialState from "../../src/data/initial-state.json";
import { GameEngine, PlayCardCommand } from "./game-engine";

const engine = new GameEngine(initialState);
const unsubscribe = engine.subscribe((state) => render(state));

engine.dispatch(new PlayCardCommand("lantern"));
// ...
unsubscribe();
```
