# Unimat UI (Vite + React + TypeScript)

Интерфейс с двумя вкладками:
- `Поезд`
- `Техническая`

Основной фокус проекта сейчас: `Техническая` вкладка (список сигналов + плата диодов + панель неисправности), данные приходят из Bridge по WebSocket.

## 1. Технологии

- React 19
- TypeScript 5
- Vite 7
- CSS Modules
- Firebase Hosting (статический деплой `dist/`)

## 2. Требования к окружению

- Node.js `>= 20`
- npm `>= 10`
- Для деплоя: Firebase CLI (`npm i -g firebase-tools`)

## 3. Быстрый старт (dev)

```bash
npm install
npm run dev
```

По умолчанию Vite поднимается на `http://localhost:5173`.

## 4. Настройка backend/Bridge (обязательно)

Техническая вкладка слушает WebSocket Bridge.

Переменные окружения:
- `VITE_API_BASE_URL` — базовый HTTP адрес backend для `GET /api/state`, `GET /api/config`, `GET /api/journal`
- `VITE_WS_URL` — адрес websocket канала `/ws/state`
- `VITE_DEMO_MODE` — `true/false`, принудительный demo fallback

Если переменные не заданы, используются fallback:
- API: `http://127.0.0.1:8000`
- WS: `ws://127.0.0.1:8000/ws/state`

Пример для локальной разработки (`.env.development`):

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/ws/state
VITE_DEMO_MODE=false
```

Пример для production (`.env.production`):

```env
VITE_API_BASE_URL=https://backend.example.com
VITE_WS_URL=wss://backend.example.com/ws/state
VITE_DEMO_MODE=false
```

Важно:
- для `https` фронта в проде используйте `wss://`, а не `ws://`;
- Bridge должен быть доступен из браузера клиента (не только из локальной сети разработчика).

## 5. Что происходит в Технической вкладке

- Realtime store: `src/store/realtimeStore.tsx`
- API сервис: `src/services/api.ts`
- WS сервис: `src/services/ws.ts`
- Авто-reconnect: `1s -> 2s -> 5s -> 10s`
- Обрабатываются initial запросы (`/api/state`, `/api/config`, `/api/journal`) и realtime сообщения (`/ws/state`)
- Каналы `0..7` отображаются в списке сигналов
- Логика подсветки:
  - `isFault=false` -> диод зелёный, строка обычная
  - `isFault=true` -> диод красный, подсвечивается только строка этого канала
- Если нет соединения или данных:
  - диоды становятся серыми
  - красные подсветки строк отключаются

### Формат ожидаемого сообщения от Bridge

```json
{
  "type": "puma_board_decoded",
  "ts": 1710000000000,
  "raw": { "in": 243, "inversed": 173, "out": 48 },
  "channels": [
    {
      "ch": 0,
      "name": "channel name",
      "bits": { "inv_in": 1, "out": 0, "dg": 1 },
      "state": "NORMAL_OFF",
      "isFault": false,
      "faultKind": null,
      "displayRu": "Норма (выкл)"
    }
  ],
  "faultCount": 1
}
```

## 6. Отдельный список неисправностей

Заготовка для редактируемого списка:
- `src/data/faults.ts`

Сейчас намеренно пусто:

```ts
export const faults: FaultRecord[] = []
```

Это означает, что в панели неисправности пока не выводятся детальные описания из справочника.

## 7. Команды проекта

```bash
npm run dev      # локальная разработка
npm run build    # production-сборка (tsc + vite build)
npm run preview  # локальный просмотр production-сборки
npm run lint     # eslint
```

## 8. Переход из dev в prod (чеклист)

1. Настроить production env:
   - создать `.env.production`
   - прописать `VITE_API_BASE_URL=...` и `VITE_WS_URL=wss://...`
2. Проверить доступность Bridge:
   - Bridge принимает WS с домена фронта
   - корректно настроены CORS / reverse proxy / TLS
3. Собрать проект:
   - `npm run build`
4. Проверить локально production-бандл:
   - `npm run preview`
5. Прогнать smoke-тест:
   - вкладка `Техническая` открывается
   - при `isFault=true` краснеет только нужная строка и нужный диод
   - при отключении WS все диоды серые
6. Деплой:
   - `firebase login`
   - `firebase use unimat-011` (или нужный проект)
   - `firebase deploy --only hosting`

## 9. Firebase деплой (как настроено сейчас)

- `firebase.json`:
  - `hosting.public = "dist"`
- `.firebaserc`:
  - default project: `unimat-011`

Стандартный пайплайн:

```bash
npm run build
firebase deploy --only hosting
```

## 10. Структура важных файлов

- `src/components/Layout.tsx` — переключение вкладок верхнего меню
- `src/components/TopTabs.tsx` — только `Поезд` и `Техническая`
- `src/pages/Technical/TechnicalPage.tsx` — контейнер технической вкладки
- `src/components/LedBoard.tsx` — плата диодов
- `src/components/SignalList.tsx` — список сигналов
- `src/components/FaultPanel.tsx` — панель неисправности
- `src/store/realtimeStore.tsx` — глобальное нормализованное хранилище и realtime слой
- `src/services/api.ts` — initial fetch API
- `src/services/ws.ts` — websocket + reconnect
- `src/data/faults.ts` — справочник неисправностей

## 11. Частые проблемы

- Нет данных в Технической:
  - проверьте, что `VITE_API_BASE_URL` и `VITE_WS_URL` корректны
  - проверьте, что backend отдаёт `/api/state` и websocket `/ws/state`
- В проде WS не подключается:
  - используйте `wss://`
  - проверьте сертификат и доступность endpoint `/ws`
- Подсветка не появляется:
  - в payload должен приходить `isFault: true` для нужного канала
  - `faultCount` сам по себе не включает подсветку, решает флаг `isFault`
