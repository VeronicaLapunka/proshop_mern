# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.
See also: `backend/CLAUDE.md` (architecture, code review, deployment) and `frontend/CLAUDE.md` (architecture, Redux rules).

## Project Overview

ProShop is a deprecated MERN (MongoDB, Express, React, Node.js) eCommerce platform:

- **Backend**: Express.js REST API with MongoDB/Mongoose, running on port 5001 (set via `PORT` in `.env`)
- **Frontend**: React with Redux state management, running on port 3000
- Uses ES Modules (Node 14.6+), no build/transpile step for backend

## Common Development Commands

### Setup

```bash
npm install
cd frontend && npm install && cd ..
```

### Development

```bash
npm run dev        # frontend (:3000) + backend (:5001) concurrently
npm run server     # backend only
npm run client     # frontend only
```

### Database

```bash
npm run data:import    # seed sample products + users (wipes existing data first)
npm run data:destroy   # destroy all data
```

Sample credentials after seeding:

- Admin: `admin@example.com` / `123456`
- Customer: `john@example.com` / `123456` or `jane@example.com` / `123456`

### Building

```bash
cd frontend && npm run build    # creates frontend/build/
npm start                       # production: backend serves frontend from build/
```

## Environment Configuration

Create a `.env` file in the root directory:

```
NODE_ENV = development
PORT = 5001
MONGO_URI = your_mongodb_uri
JWT_SECRET = your_jwt_secret
PAYPAL_CLIENT_ID = your_paypal_client_id
```

| Variable           | Required | Notes                                                                  |
| ------------------ | -------- | ---------------------------------------------------------------------- |
| `NODE_ENV`         | Yes      | `development` enables morgan logging and error stacks                  |
| `PORT`             | No       | Defaults to 5001 if unset                                              |
| `MONGO_URI`        | Yes      | Local: `mongodb://localhost:27017/proshop`; Atlas URI works as drop-in |
| `JWT_SECRET`       | Yes      | Any long random string; changing it invalidates all active sessions    |
| `PAYPAL_CLIENT_ID` | Yes      | Use `sandbox` for dev; real client ID for production                   |

## Key Patterns

### File Naming

- Backend route and controller files are plural (`productRoutes.js`, `productControllers.js`)
- Frontend action/reducer files are plural (`productActions.js`, `productReducers.js`)
- React screen components are named `*Screen.js`; reusable components go in `components/`

### API Communication

- All API calls go through Redux action creators (Thunk) using Axios
- Backend endpoints are prefixed with `/api/` (proxied via `frontend/package.json`)
- Auth: JWT token in `Authorization: Bearer <token>` header, manually extracted per-thunk

### Error Handling

- Backend: `express-async-handler` catches thrown errors → error middleware formats response
- Frontend: dispatches `_FAIL` actions; error extraction pattern: `error.response?.data.message ?? error.message`

## Local Gotchas

### Ports

- **Port 5000 is permanently held by macOS Control Center** — backend uses 5001.
- If you change `PORT` in `.env`, update the proxy in `frontend/package.json` to match — mismatch causes silent ECONNREFUSED on all `/api/` calls.

### MongoDB

- Must be running **before** `npm run dev`. No retry logic — fails immediately with `process.exit(1)`.
- Docker: `docker run -d -p 27017:27017 --name mongo mongo:7`
- Atlas URIs are a drop-in replacement for the local URI in `.env`.

### Known Bugs

- **`/api/products/top` CastError** — `/top` route registered after `/:id` in `productRoutes.js`; Express treats `"top"` as an id. (Not fixed.)
- **`paymentMethod` lost on refresh** — written to localStorage but missing from Redux `initialState` in `store.js`.
- **`orderDetailsReducer` starts with `loading: true`** — intentional, but can mask real loading bugs.

### Security

- JWT stored in `localStorage` (XSS-readable). Expires in 30 days.
- Auto-logout matches exact string `'Not authorized, token failed'` — renaming it silently breaks logout.

## Поиск по документации продукта proshop_mern (search-docs MCP)

- При любых вопросах про функционал, фичи, архитектуру, ADR, runbooks, incidents — **СНАЧАЛА** вызывать `search_project_docs` (MCP `docs-search`).
- Это быстрее и возвращает релевантные чанки с метаданными (source_file, score, snippet).
- При end-to-end цепочках (search-docs + feature-flags) — сначала ПОЛНОСТЬЮ завершить все `search_project_docs` вызовы и проанализировать зависимости из доков, ТОЛЬКО ПОТОМ вызывать feature-flags MCP tools. Не параллелизировать search и `get_feature_info`.
- Fallback на grep+read **только если**:
  - vector search не дал нужных результатов (все score < 0.6), или
  - нужно полное содержимое конкретного файла из метаданных найденного чанка.
- **Никогда не начинать с grep+read по проекту** — медленно и дорого по токенам.

## Управление feature flags (feature-flags MCP)

- **Статус фичи** ("какой статус у gift_message?", "включена ли search_v2?") → вызывать `get_feature_info`. Не читать `backend/features.json` напрямую.
- **Изменение статуса** ("включи фичу X", "переведи Y в Testing", "поставь трафик 25%") → вызывать `set_feature_state` / `adjust_traffic_rollout`. **Никогда не редактировать `backend/features.json` вручную через Edit/Write.**
- **Список всех фич** → вызывать `list_features`. Не grep'ать файл.

## Screenshot Workflow (before/after redesign)

After redesigning any screen, capture before/after screenshots to document the visual change.

**RULE: After completing any screen redesign task, always run `node tmp/screenshot-admin.mjs after` (auth screens) or `bash tmp/capture.sh after` (all screens) automatically — do not wait for the user to ask.**

### Quick command
```bash
bash tmp/capture.sh           # full before + after for all pages
bash tmp/capture.sh after     # only "after" (current design, no stash needed)
```

### Prerequisites (one-time)
```bash
npm run data:import    # seed DB — required for order/profile screenshots
cd tmp && npm install  # install puppeteer (already done)
```

### Adding a newly redesigned screen to the capture pipeline

1. **Public page** — add one entry to `PAGES` array in `tmp/screenshot.mjs`:
   ```js
   { path: '/your-path', name: 'slug', waitFor: 'css-selector', delay: 800 },
   ```

2. **Auth-required page** — add a `shoot()` call in `tmp/screenshot-admin.mjs` after the login block:
   ```js
   await shoot(page, `${BASE}/your-path`, 'slug', { waitFor: 'selector', delay: 1000 });
   ```

3. **Add the screen file to the stash list** in `tmp/capture.sh` (the `git stash push` block), so the "before" state can be restored correctly.

Screenshots land in `tmp/screenshots/` as `{before,after}_{slug}.png` at 2× retina.
Full instructions: `tmp/README.md`.

## After Running Commands

When running any command, Claude Code will summarize:

- **What happened** — files created, data inserted, processes started
- **What it means** — practical impact on the dev environment
- **Side effects** — ports occupied, data written, files changed
- **What to do next** — required follow-up steps
