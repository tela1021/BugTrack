# IMPLEMENT.md

## Task reference

Анализ BugZero и подготовка ТЗ на улучшения, 2026-07-21.


## Log

### 2026-07-21 —

**What happened:**

Проведён обзор Prisma-схемы, Server Actions, страниц и компонентов. Исходное PDF-ТЗ прочитано и визуально проверено. В локальном приложении вручную проверены список и Kanban-представление; `npm run build` прошёл, `npm run lint` не прошёл: 91 error, 16 warning.

**Decision:**

Подготовить отдельное ТЗ, которое сначала устраняет риски доступа, целостности данных и функциональные макеты, а потом добавляет продуктовые возможности.

**Deviation from plan:**

Код и данные не менялись: пользователь запросил анализ и спецификацию, а не реализацию.

**Next:**

Передать ТЗ на согласование владельцу продукта и затем реализовывать фазы строго по приоритету.

### 2026-07-21 — уточнение базы данных

**What happened:**

В ТЗ первоначально добавлен обязательный переход SQLite -> PostgreSQL 16+ для staging и production.

**Decision:**

После повторной ревизии это решение уточнено ниже: PostgreSQL используется во всех runtime-окружениях, а SQLite остаётся только источником и архивом миграции.

### 2026-07-21 — повторная ревизия ТЗ

**What happened:**

Проверены deployment scripts, текущие тесты, история попытки Neon PostgreSQL и фактические данные SQLite. Выявлено, что один Prisma schema не должен использовать SQLite local и PostgreSQL production, существующие тесты намеренно фиксируют SQLite, `TeamMember` пуст, а статусы смешаны между global/team-specific.

**Decision:**

ТЗ переведено на PostgreSQL 16+ во всех runtime-окружениях. Добавлены cutover, data backfill, замена `db push`, тестовый/CI-контракт, разграничение NextAuth/Prisma/RLS, auth hardening и операционные критерии.

**Verification:**

`node --test test/*.mjs`: 3/3 passed. `npx prisma validate`: passed. `npm run build`: passed с уже известными предупреждениями о workspace root и `middleware.ts`. `npm run lint`: baseline fail, 91 errors и 16 warnings; документальные изменения новых lint-проблем не добавляют.

### 2026-07-21 — старт реализации P0

**What happened:**

Реализация начата с подготовки тестового и миграционного контура. Подтверждено, что текущий проект не содержит TypeScript test runner или тестового скрипта; Node.js 24 доступен, а зависимости не изменяются без согласования.

**Decision:**

Первым рабочим срезом будет контракт PostgreSQL и миграций, реализуемый через RED → GREEN тесты. Изменение provider и перенос фактических данных не выполняются до выбора PostgreSQL-инфраструктуры и получения параметров staging/cutover.

**Next:**

Получить от владельца продукта решение по PostgreSQL provider и затем начать RED-тесты и минимальную реализацию первого среза.

### 2026-07-21 — P0 / PostgreSQL runtime-контракт

**What happened:**

Выбран собственный PostgreSQL-сервер. Добавлены RED → GREEN контрактные тесты, PostgreSQL provider в Prisma, `.env.example`, `migration_lock.toml` и базовая миграция для чистой БД. `deploy.sh` и `install.sh` переведены с `prisma db push` на `prisma migrate deploy`; установщик больше не создаёт SQLite БД и не запускает seed автоматически. Админская статистика сделана request-time, чтобы production build не обращался к БД.

**Verification:**

`node --test test/*.mjs`: 6/6 passed. `DATABASE_URL=<валидный PostgreSQL URL> npx prisma validate`: passed. `DATABASE_URL=<валидный PostgreSQL URL> npx prisma generate`: passed. `DATABASE_URL=<валидный PostgreSQL URL> npm run build`: passed. Сохранились исходные предупреждения Next.js о workspace root и устаревшем `middleware.ts`.

**Decision:**

Текущий `.env` и `prisma/dev.db` намеренно не менялись: они содержат существующий SQLite-контур и пользовательские данные. Базовая миграция предназначена только для пустой PostgreSQL БД; перенос данных будет отдельным idempotent-скриптом после предоставления staging-доступа.

**Next:**

Получить безопасно переданный staging `DATABASE_URL` и утверждённую матрицу membership/ролей команд, затем выполнить dry run SQLite -> PostgreSQL и начать серверный RBAC.

### 2026-07-21 — локальный PostgreSQL и dry-run данных

**What happened:**

Запущен уже установленный PostgreSQL 16. Созданы изолированные базы `bugtrack_dev` и `bugtrack_test`, а также две отдельные роли: `bugtrack_migrator` для миграций и `bugtrack_app` с CRUD-правами. В Prisma добавлен `DIRECT_URL`, чтобы deployment-миграции не использовали runtime-роль. Базовая migration применена к обеим БД; в каждой 14 таблиц и актуальная запись `_prisma_migrations`.

Пустая незавершённая папка `prisma/migrations/20260717000000_init` с разрешения владельца перенесена в `prisma/migrations-archive/20260717000000_init`; данные в ней отсутствовали. Добавлен `npm run db:migration-report`: read-only dry-run для SQLite. Он подтвердил 3 users, 3 teams, 9 issues, 4 comments, 7 attachments и 0 TeamMember, поэтому безопасно блокирует запись в PostgreSQL.

**Verification:**

`node --test test/*.mjs`: 8/8 passed. `prisma validate`, `prisma generate`, `prisma migrate status` для `bugtrack_dev` и `npm run build` с разделёнными PostgreSQL URL: passed. Dev-server на `http://localhost:3008/login`: HTTP 200. `npm run lint` остаётся исходно красным: 91 error, 16 warning.

**Decision:**

Текущий `prisma/dev.db` не переносится автоматически и не модифицируется. Скрипт intentionally не создаёт вымышленные memberships/роли; следующий write-этап требует утверждённой матрицы `user -> team -> role` либо отдельного решения владельца об автоматическом backfill.

**Next:**

После решения по memberships реализовать idempotent SQLite -> PostgreSQL import на `bugtrack_test`, затем начать enforcement RBAC в Server Actions.

### 2026-07-21 — core RBAC задач

**What happened:**

Добавлены типизированные командные роли `OWNER`, `ADMIN`, `MEMBER`, центральные guards `requireAuthenticatedUser`, `requireTeamRole` и `requireIssueAccess`. Глобальная роль пользователя не заменяет участие в команде. `getIssues` теперь ограничивает запрос только `TeamMember` текущего пользователя, а выбор конкретной команды дополнительно проверяется. Открытие задачи по readable ID и ключевые изменения задачи — создание, комментарий, update и вложение — проверяют membership до чтения/записи.

**Verification:**

15/15 `npm test` passed, включая RED → GREEN тесты иерархии ролей, отказа без membership и статические action-contracts. `npx tsc --noEmit` and production build passed с PostgreSQL URL. `git diff --check` passed.

**Decision:**

При отсутствии TeamMember доступ намеренно запрещён. Поэтому текущие SQLite-данные не могут быть включены в PostgreSQL runtime до утверждённого membership backfill; это устраняет ранее возможный доступ к чужим задачам через прямой Server Action вызов.

**Next:**

Подключить guards к labels, workflow, projects, notifications и admin actions, затем реализовать подтверждённый import SQLite -> PostgreSQL с membership-матрицей.

### 2026-07-21 — защита управления пользователями

**What happened:**

В центральную authorization layer добавлен `requireGlobalAdmin`, который проверяет актуальную роль пользователя в БД. Все Server Actions управления пользователями (`getUsers`, update, create, reset password) вызывают guard до выполнения запроса. Удалён пароль по умолчанию `123456`: создание пользователя теперь требует явный пароль.

**Verification:**

`npm test`: 16/16 passed. `npx tsc --noEmit` and production build with local PostgreSQL passed.

**Next:**

Подключить guards к labels, workflow, projects и notifications; затем добавить Zod-валидацию входных данных и import SQLite -> PostgreSQL с membership-матрицей.

### 2026-07-21 — решение по тестовым SQLite-данным

**Decision:**

Владелец продукта подтвердил, что SQLite-данные тестовые. Их перенос в PostgreSQL, membership backfill и cutover verification не требуются. PostgreSQL `bugtrack_dev` и `bugtrack_test` остаются чистыми базами, созданными через Prisma migrations.

## Deviations summary

| Deviation | Reason | Plan updated? |
|---|---|---|
