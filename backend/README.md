# KiGo — API (FastAPI + PostgreSQL)

Единый бэкенд для мини-приложения [`../webapp`](../webapp), CRM (`~/Desktop/kigo-crm`) и бота [`../bot`](../bot): у всех одна база.

## Запуск

```bash
cd backend
cp .env.example .env               # вписать BOT_TOKEN, KIGO_DB_PASSWORD (тот же пароль в KIGO_DATABASE_URL), NOTIFY_SECRET
docker compose up -d               # PostgreSQL 16 на 127.0.0.1:5434 (+ база kigo_test для тестов)
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8010 --reload
```

Документация API: http://localhost:8010/docs. Тесты (на базе `kigo_test`): `.venv/bin/python -m pytest`.

При старте сервер сам применяет миграции (`alembic upgrade head`). С `SEED_DEMO=1` пустая база заполняется демо-данными из дизайна.
Меняете модели — создайте миграцию: `.venv/bin/alembic revision --autogenerate -m "что изменилось"`.

## Авторизация

Мини-приложение отправляет `Authorization: tma <Telegram.WebApp.initData>`.
Подпись проверяется токеном бота (`BOT_TOKEN`), пользователь создаётся при первом запросе.
С `DEV_MODE=1` запросы без заголовка выполняются от имени `DEV_USER_ID`: так можно работать в обычном браузере. **В продакшене DEV_MODE выключить.**

## Эндпоинты

| Метод | Путь | Что делает |
|---|---|---|
| GET/PATCH | `/api/me` | Профиль, онбординг, статистика, ожидающая оценка |
| GET | `/api/clubs` | Площадки: `sport`, `q`, `district`, `max_price`, `min_rating`, `free_only` |
| GET | `/api/clubs/{id}` | Клуб: типы столов, цены, отзывы, занятость на 6 дней |
| GET/POST | `/api/bookings` | Мои брони / новая бронь (проверка пересечений) |
| POST | `/api/bookings/{id}/pay` | **Заглушка оплаты**: сразу подтверждает |
| POST | `/api/bookings/{id}/cancel` | Отмена; депозит возвращается, если до начала больше 2 часов |
| GET/POST | `/api/games` | Открытые игры (`sport`, `mine`) / новое объявление |
| POST | `/api/games/{id}/join` | Присоединиться или выйти |
| GET | `/api/players` | Игроки по спорту |
| POST | `/api/ratings` | Оценить партнёра по прошедшей игре |
| GET | `/api/tournaments`, `/api/tournaments/{id}` | Турниры |
| POST | `/api/tournaments/{id}/register` | Записаться или отписаться |
| GET/POST | `/api/applications` | Мои заявки на проведение турнира / новая заявка |
| PUT | `/api/applications/{id}` | Исправить или отправить заново после отказа |
| POST | `/api/applications/{id}/answer` | Ответ на вопрос модератора |
| GET | `/api/admin/applications` | Все заявки (только `ADMIN_IDS`) |
| POST | `/api/admin/applications/{id}/request-info` · `approve` · `reject` | Модерация. `approve` создаёт турнир |
| POST | `/api/business-leads` | Заявка клуба или тренера |

## Уведомления

Бэкенд вызывает `POST {BOT_NOTIFY_URL}`, который обслуживает бот:
- заявка принята, запрошена информация, одобрена, отклонена;
- новый участник турнира (организатору);
- бронь подтверждена;
- напоминание за час до игры (фоновая задача проверяет раз в минуту).

Пустой `BOT_NOTIFY_URL` — уведомления только пишутся в лог.

## CRM (`/api/admin/*`)

Вход — через бота: CRM получает одноразовую ссылку `t.me/<бот>?start=login_…`, бот просит подтвердить, после этого токен становится сессией (`Authorization: Bearer …`, 7 дней).
Войти могут только люди из таблицы `staff`. `ADMIN_IDS` — всегда Super admin, остальных Super admin добавляет в «Sozlamalar» по @username
(человек должен один раз нажать /start в боте). Права ролей — матрица из «Rollar va ruxsatlar», проверяется на каждом запросе.

| Раздел CRM | API | Что меняется в мини-приложении |
|---|---|---|
| Boshqaruv | `GET /dashboard` | — |
| Arizalar | `GET /requests`, `POST /requests/{key}/open · approve · request-info · reject`, `PUT …/checks · note` | Заявки на турнир из приложения и «Klubni ulash / Murabbiy bo‘lish». Одобрение создаёт турнир или тренера, бот сообщает автору |
| Turnirlar | `GET /tournaments`, `POST /{id}/featured · banner · stop`, `PUT /featured` | Баннер на главной, остановленный турнир закрыт для записи |
| Landing va ilova | `GET/PUT /content` | Блоки главной экрана (`GET /api/content`) |
| Klublar / Foydalanuvchilar | `GET /directory`, `PATCH /directory/{tab}/{id}` | Блокировка входа, запрет броней/заявок, закрытие клуба |
| To‘lovlar | `GET /payments`, `POST /payments/{id}/refund` | Поздняя отмена → запрос возврата → решение → бот |
| Shikoyatlar | `GET /complaints`, `PATCH /complaints/{id}` | Скрытие/маскировка отзывов, ответ автору через бота |
| Sozlamalar | `GET/PUT /team`, `POST /team/staff` | Правила: уведомления админам о новых заявках, автовозврат |

## Что ещё не сделано

- **Оплата.** `/bookings/{id}/pay` — заглушка. Нужно подключить Click/Payme (или счёт Telegram через `WebApp.openInvoice`) и подтверждать бронь из callback платёжки. То же для взноса за турнир и обратных выплат.
- **Жалобы и отзывы из приложения**: в CRM их модерируют, но в мини-приложении пока нет формы «Shikoyat qilish» и «Sharh yozish» (в базе — демо из дизайна).
- **Загрузка файлов**: обложка турнира, вложения.
- **Расстояние до клуба** хранится строкой; нужны координаты и геолокация.
- **Публикация игры в Telegram-группу** (`to_group`) и пост в канал при одобрении турнира.
