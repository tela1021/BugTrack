# BugTrack

Локальное веб-приложение для отслеживания задач. Стек: Next.js, NextAuth, Prisma и PostgreSQL.

## Быстрый запуск

### 1. Подготовьте зависимости

Нужны Node.js (проверено на Node.js 24), npm и доступная PostgreSQL-база. После клонирования репозитория установите зависимости:

```bash
npm ci
```

### 2. Создайте базу PostgreSQL

Создайте пустую базу и роль, которая является её владельцем. Для локальной разработки можно использовать одну и ту же роль для приложения и миграций:

```sql
CREATE ROLE bugtrack_app LOGIN PASSWORD 'replace-with-a-local-password';
CREATE DATABASE bugtrack OWNER bugtrack_app;
```

В production для `DIRECT_URL` лучше использовать отдельную роль с правами на миграции.

### 3. Настройте переменные окружения

Создайте `.env` из примера:

```bash
cp .env.example .env
```

Замените все `CHANGE_ME` и тестовые значения. Минимальная конфигурация для локального запуска:

```dotenv
DATABASE_URL="postgresql://bugtrack_app:<password>@127.0.0.1:5432/bugtrack?schema=public"
DIRECT_URL="postgresql://bugtrack_app:<password>@127.0.0.1:5432/bugtrack?schema=public"
NEXTAUTH_SECRET="<строка не короче 32 символов>"
NEXTAUTH_URL="http://localhost:3008"
AUTH_TRUST_HOST="true"
SEED_ADMIN_PASSWORD="<локальный пароль не короче 12 символов>"
```

Секрет для `NEXTAUTH_SECRET` можно сгенерировать так:

```bash
openssl rand -base64 48
```

`GITHUB_WEBHOOK_SECRET` и `GITLAB_WEBHOOK_TOKEN` нужны только при настройке соответствующих вебхуков; они не требуются для первого локального запуска. Не добавляйте `.env` в Git.

### 4. Примените схему и создайте тестовые данные

```bash
npx prisma generate
npm run db:validate
npm run db:migrate
npm run seed
```

Миграции применяются к пустой PostgreSQL-базе, а `seed` можно запускать повторно: он создаёт или обновляет пользователей, команду `BUG` и статусы workflow.

### 5. Запустите приложение

```bash
npm run dev
```

Откройте [http://localhost:3008](http://localhost:3008). После seed войдите с одним из адресов:

- `admin@bugzero.local` — администратор;
- `member@bugzero.local` — участник команды.

Пароль в обоих случаях — значение `SEED_ADMIN_PASSWORD` из `.env`.

## Альтернативный порт для E2E

Для изолированного запуска на порту 3009 используйте:

```bash
npm run dev:bugtrack
```

Перед этим измените `NEXTAUTH_URL` в `.env` на `http://localhost:3009`, затем откройте [http://localhost:3009](http://localhost:3009). Этот порт использует и команда `npm run test:e2e`.

## Проверка установки

После запуска можно выполнить основные проверки:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Частые проблемы

- **`Missing required environment variable`** — проверьте, что `.env` существует и содержит `DATABASE_URL`, `NEXTAUTH_SECRET` и `NEXTAUTH_URL`.
- **Ошибка подключения Prisma** — убедитесь, что PostgreSQL запущен, база существует, а строки `DATABASE_URL` и `DIRECT_URL` содержат корректный пароль и порт.
- **Пустой список команд или статусов** — выполните `npm run seed`, выйдите из аккаунта и войдите снова: JWT-сессия могла быть создана до заполнения базы.
- **Ошибка при seed о пароле** — задайте `SEED_ADMIN_PASSWORD` длиной не менее 12 символов.
