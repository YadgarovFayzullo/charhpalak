# KiGo — Telegram-бот (Python, aiogram 3)

Бот открывает мини-приложение из [`../webapp`](../webapp) и присылает уведомления по макету «TG-bot».

## Запуск

```bash
cd bot
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env      # вписать BOT_TOKEN и WEBAPP_URL
.venv/bin/python main.py
```

`WEBAPP_URL` — HTTPS-адрес, куда задеплоена сборка `webapp/dist`. Telegram открывает мини-приложения только по HTTPS.
Для локальной разработки можно поднять туннель (`cloudflared tunnel --url http://localhost:5174` или ngrok) и указать его адрес.

## Что умеет

- `/start`: приветствие и кнопки «Ilovani ochish», «Sherik topish», «Joy bron qilish».
- `/bronlarim`, `/turnirlar`, `/help`.
- Кнопка меню у поля ввода открывает мини-приложение.
- `POST /notify` отправляет уведомление пользователю. Его вызывает бэкенд.

## Уведомления

```bash
curl -X POST http://127.0.0.1:8081/notify \
  -H "X-Notify-Secret: $NOTIFY_SECRET" -H "Content-Type: application/json" \
  -d '{"chat_id": 123456789, "event": "booking_confirmed", "data": {
        "club": "«Pirat»", "type": "Rus bilyardi", "day": "Bugun", "start": "19:00", "end": "21:00",
        "number": 4821, "paid": "20 000 so‘m", "at_club": "90 000 so‘m", "cancel_until": "17:00"}}'
```

| event | поля `data` |
|---|---|
| `application_received` | `title`, `number` |
| `info_requested` | `comment` |
| `application_approved` | `title`, `tournament_id`, `spots`, `deadline` |
| `application_rejected` | `title`, `reason` |
| `new_participant` | `names`, `amount`, `count`, `max` |
| `booking_confirmed` | `club`, `type`, `day`, `start`, `end`, `number`, `paid`, `at_club`, `cancel_until` |
| `booking_reminder` | `club`, `start` |

Напоминание за час до игры (`booking_reminder`) планирует бэкенд: в нужное время он вызывает `/notify`.

## Проверка пользователя мини-приложения

`initdata.py` → `validate_init_data(init_data, BOT_TOKEN)` проверяет подпись `Telegram.WebApp.initData`.
Бэкенд должен вызывать её на каждый запрос из мини-приложения и только после этого доверять `user.id`.
