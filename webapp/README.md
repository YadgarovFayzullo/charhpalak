# KiGo — Telegram Mini App

Мини-приложение KiGo для Telegram (React + Vite) по дизайну «KiGo UI dizayn», экраны TG-*.

```bash
npm install
npm run dev     # http://localhost:5174
npm run build   # сборка в dist/
```

## Как это устроено

- Mini App — это обычная веб-страница: Telegram открывает её по HTTPS-URL внутри себя.
  Бот (`/start`, кнопка «Ilovani ochish», уведомления) — отдельный сервер, например на Python (aiogram).
- `src/telegram.js` — обёртка над `window.Telegram.WebApp`: цвета, BackButton, haptic, контакт, ссылки, шаринг.
  Вне Telegram всё работает в обычном браузере: рисуется своя шапка «✕ Yopish / ← Orqaga».
- Роутинг через `HashRouter`, поэтому сборку можно положить на любой статический хостинг.
- Данные берутся из [`../backend`](../backend) (`src/api.js`). Адрес API задаётся в `VITE_API_URL`, по умолчанию `http://localhost:8010`.
  Каждый запрос несёт `Authorization: tma <initData>`. Вне Telegram бэкенд с `DEV_MODE=1` подставляет демо-пользователя.

## Экраны

| Путь | Экран |
|---|---|
| `#/start` | Онбординг: роли, спорт, район, телефон |
| `#/` | Главная |
| `#/search` | Поиск площадок: список, карта, фильтры |
| `#/club/:id` | Клуб и выбор времени |
| `#/booking`, `#/booking/:id` | Оплата и подтверждение брони (`done` = ближайшая бронь) |
| `#/games`, `#/games/new` | Открытые игры, игроки, новое объявление |
| `#/tournament/:id` | Турнир: сетка, правила, участники |
| `#/tournament-apply`, `#/applications` | Заявка на турнир и её статус |
| `#/profile` | Профиль, брони, настройки |
| `#/business` | Подключение клуба |

## Подключение к боту

1. Задеплоить `dist/` на HTTPS (Vercel, Netlify, GitHub Pages).
2. В @BotFather: `/newapp` или `Bot Settings → Menu Button` и указать URL.
3. На бэкенде проверять `Telegram.WebApp.initData` (подпись HMAC токеном бота) перед тем, как доверять данным пользователя.
