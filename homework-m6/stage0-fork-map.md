# Шаг 0 — Карта форка proshop_mern

> Заполнено перед стартом M6 homework. Используется как PROJECT CONTEXT во всех spawn-промптах.

| Что | Твой форк |
|---|---|
| MCP-сервер (feature flags) | `mcp-feature-flags/src/server.ts` (TypeScript/Node.js) |
| RAG-сервер (docs search) | `mcp-docs-search/src/server.ts` (TypeScript/Node.js) |
| Слой feature flags | `mcp-feature-flags/` (MCP server) + `features.json` (root, backend data) |
| Язык MCP/RAG | TypeScript/Node.js (оба) |
| Test framework | Jest (JS/TS) |
| Mutation tool (опц.) | Stryker (JS) |
| Файл правил агента | `CLAUDE.md` (root) + `backend/CLAUDE.md` + `frontend/CLAUDE.md` |
| Папка существующих docs | `docs/` |
| Папка ADR | `docs/adr/` |

## Дополнительные модули (M3-M5)

| Модуль | Путь | Описание |
|---|---|---|
| MCP Feature Flags Server | `mcp-feature-flags/src/server.ts` | HTTP Streamable MCP server, управляет feature flags |
| MCP Feature Flags Helpers | `mcp-feature-flags/src/helpers.ts` | Хелперы для работы с features.json |
| MCP Feature Flags HTTP | `mcp-feature-flags/src/server-http.ts` | HTTP transport layer |
| MCP Docs Search Server | `mcp-docs-search/src/server.ts` | RAG-based doc search MCP |
| MCP Docs Search | `mcp-docs-search/src/search.ts` | Логика поиска по документам |
| Feature Flags Data | `features.json` (root) | JSON store feature flags |
| Backend Feature Routes | `backend/routes/featureRoutes.js` | REST API для feature flags |
| Feature Dashboard | `frontend/src/screens/FeatureDashboardScreen.js` | Admin UI для feature flags |

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
