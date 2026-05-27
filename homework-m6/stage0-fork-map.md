# Шаг 0 — Карта форка proshop_mern

> Заполнено перед стартом M6 homework. Используется как PROJECT CONTEXT во всех spawn-промптах.

## PROJECT CONTEXT

- **Repo**: proshop_mern fork (MERN e-commerce + MCP feature-flags + MCP RAG doc-search layers from M3–M5)
- **Stack**:
  - Backend: Node.js + Express + Mongoose + MongoDB (port 5001)
  - Frontend: React + Redux (port 3000)
  - MCP servers: TypeScript/Node.js (both)
    - `mcp-feature-flags/src/server.ts` (feature flag management)
    - `mcp-docs-search/src/server.ts` (RAG-based documentation search)
- **Agent rule files** (read first):
  - [`CLAUDE.md`](CLAUDE.md) (root – main rules)
  - [`backend/CLAUDE.md`](backend/CLAUDE.md) (backend patterns)
  - [`frontend/CLAUDE.md`](frontend/CLAUDE.md) (Redux/frontend patterns)
- **ADRs**: [`docs/adr/`](docs/adr/) (Architecture Decision Records)
  - Key: JWT header injection in thunks, selective localStorage persistence, ES modules, MongoDB vs Postgres, Redux vs Context, etc.
- **Auth model**: JWT-based, password hashing via bcrypt; token stored in localStorage
- **Data store**: `features.json` (root) + MCP feature-flags server
- **Test framework**: Jest
- **Docs**: [`docs/`](docs/) including project-data/ for runbooks, incidents, features

## SCOPE

**In scope** (files to review/audit):

- `backend/controllers/*.js` (productController.js, orderController.js, userController.js)
- `backend/middleware/*.js` (authMiddleware.js, errorMiddleware.js)
- `backend/routes/*.js` (productRoutes.js, orderRoutes.js, userRoutes.js, featureFlagRoutes.js, uploadRoutes.js)
- `mcp-feature-flags/src/**/*.ts` (feature flags MCP server – TypeScript)
  - `mcp-feature-flags/src/server.ts` (main server)
  - `mcp-feature-flags/src/helpers.ts` (flag helpers)
  - `mcp-feature-flags/src/server-http.ts` (HTTP transport)
- `mcp-docs-search/src/**/*.ts` (RAG document search MCP server – TypeScript)
  - `mcp-docs-search/src/server.ts` (main server)
  - `mcp-docs-search/src/search.ts` (search logic)
- `features.json` (root – feature flags data store)

**Out of scope**:

- tests/, **tests**/, _.test.js, _.test.ts
- scripts/, tmp/
- frontend/public/, frontend/build/
- node_modules/
- homework-m6/ (homework submission itself)

## Дополнительные модули (M3-M5)

| Модуль                    | Путь                                             | Описание                                            |
| ------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| MCP Feature Flags Server  | `mcp-feature-flags/src/server.ts`                | HTTP Streamable MCP server, управляет feature flags |
| MCP Feature Flags Helpers | `mcp-feature-flags/src/helpers.ts`               | Хелперы для работы с features.json                  |
| MCP Feature Flags HTTP    | `mcp-feature-flags/src/server-http.ts`           | HTTP transport layer                                |
| MCP Docs Search Server    | `mcp-docs-search/src/server.ts`                  | RAG-based doc search MCP                            |
| MCP Docs Search           | `mcp-docs-search/src/search.ts`                  | Логика поиска по документам                         |
| Feature Flags Data        | `features.json` (root)                           | JSON store feature flags                            |
| Backend Feature Routes    | `backend/routes/featureRoutes.js`                | REST API для feature flags                          |
| Feature Dashboard         | `frontend/src/screens/FeatureDashboardScreen.js` | Admin UI для feature flags                          |

## Структура верхнего уровня

```
proshop_mern/
├── backend/             # Express API (JS)
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/            # React (JS)
├── mcp-feature-flags/   # MCP server for feature flags (TypeScript)
│   └── src/
├── mcp-docs-search/     # MCP server for RAG doc search (TypeScript)
│   └── src/
├── docs/                # Documentation
│   ├── adr/             # Architecture Decision Records
│   ├── architecture.md
│   └── project-data/
├── features.json        # Feature flags store (root)
├── CLAUDE.md            # AI agent rules
└── homework-m6/         # M6 homework submission
```
