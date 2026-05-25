# Счётчик игроков (Telegram Mini App)

Учитываются **уникальные пользователи Telegram**, которые нажали «Играть» или начали раунд. ID проверяется на сервере через `initData` и токен бота.

## Настройка на Vercel (один раз)

1. **Upstash Redis**  
   Vercel → проект → **Storage** → **Create Database** → **Upstash Redis** → Connect.  
   После Connect в проекте появятся переменные (часто `KV_REST_API_URL` и `KV_REST_API_TOKEN`, иногда `UPSTASH_REDIS_REST_*`).

2. **Токен бота**  
   **Settings → Environment Variables** → добавить:
   - `BOT_TOKEN` — токен от [@BotFather](https://t.me/BotFather) для вашего бота.

3. **Секрет для просмотра статистики** (по желанию):
   - `STATS_READ_SECRET` — любая длинная случайная строка.

4. **Deploy** после `git push`.

## Как посмотреть число игроков

В браузере или curl (подставьте домен и секрет):

```text
https://ВАШ-ПРОЕКТ.vercel.app/api/stats?secret=ВАШ_STATS_READ_SECRET
```

Ответ:

```json
{
  "ok": true,
  "uniquePlayers": 42,
  "totalSessions": 128
}
```

- **uniquePlayers** — сколько разных людей играли (по `user.id` Telegram).
- **totalSessions** — сколько раз нажали «Играть» / начали раунд (с повторами).

Без `STATS_READ_SECRET` endpoint `/api/stats` открыт всем (удобно для теста, для продакшена лучше задать секрет).

## Локальная разработка

`npm run dev` не запускает API. Для проверки API: установите [Vercel CLI](https://vercel.com/docs/cli) и выполните `vercel dev` в корне проекта (с теми же env в `.env.local`).

## Важно

- Счётчик работает **только в Telegram** (есть `initData`). Игра в обычном браузере на `vercel.app` не увеличивает счётчик.
- URL Mini App в BotFather: `https://ВАШ-ПРОЕКТ.vercel.app/game/`
