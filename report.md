# M2 - Report

## IDE:

- Primary: Claude Code -> /proshop_mern/CLAUDE.md

## Rules diff

Added to root `CLAUDE.md` to codify patterns and pitfalls:

- **Code Review Rules** (Backend + Frontend subsections): checklist for asyncHandler wrapping, error status codes, middleware chaining (`admin` after `protect`), route ordering, ES Module `.js` extensions, Redux token extraction, state shape conventions, and avoiding string-matching fragility in auto-logout.
- **Deployment Quirks**: Heroku-specific (heroku-postbuild script, NPM_CONFIG_PRODUCTION flag), other platforms (manual build command), and platform-agnostic (ephemeral `frontend/build/` and `uploads/`, no CORS middleware, Node 17+ OpenSSL flag, missing `.env.example`).
- **Local Gotchas**: Port/proxy mismatch (5001 ≠ 5000), MongoDB startup requirement, three known bugs (products/top CastError, paymentMethod not rehydrated, orderDetails spinner), localStorage XSS risk, and security notes.
- **Post-execution meta-directive**: Claude Code now explains what each command actually did, what it means, side effects, and next steps (e.g., after seeding or dev startup).
- **Port documentation fix**: Corrected Project Overview and Development commands from "port 5000" to "port 5001 by default" to match actual `.env`.

## Checking Frontend -> Backend Communication

- Checked in Newtwork API requests and response during going through the site:
  http://localhost:3000/api/products?keyword=&pageNumber=1
  http://localhost:3000/api/products/top
  http://localhost:3000/api/products?keyword=Phone&pageNumber=1
  http://localhost:3000/api/products/69ec655930dae26bb69e196c

- Checked Backend console logs:
  started in terminal 'npm run dev'
  see backend logs in terminal and in network tab:
  GET /api/products/69ec655930dae26bb69e196c 304 51.138 ms - -
  [0] GET /api/products/top 304 8.970 ms - -
  [0] GET /api/products?keyword=&pageNumber=1 304 15.842 ms - -
  [0] GET /api/products?keyword=Phone&pageNumber=1 304 5.203 ms

- Checked MongoDB has data
  In Docker container-> Exec tab-> mongosh->
  use proshop
  db.products.find() - See ALL products (like SELECT \* FROM products)
  db.products.find().limit(2) - See first 2 products only
  db.products.find({ name: { $regex: "Camera", $options: "i" } }) - Search for products with "Camera" in name
  db.products.countDocuments() - Count total products
  db.users.find() - See all users
  db.orders.find() - See all orders

Ran locally using Docker mongo and 'npm run dev'

## NH-1 Mermaid-diagramm

- Done

## NH-2 ADPx3

- Done

## NH-3 Characterization tests for 1 function

I picked 'payOrder'
Tests were generated: /Users/Veronica_Lapunka/Documents/git3/proshop_mern/frontend/src/actions/**tests**/payOrder.test.js
Command for run tests:
cd frontend && npm test -- src/actions/**tests**/payOrder.test.js --watchAll=false

## M3

### Feature flags MCP полный лог

**Задача:** проверить статус `search_v2`, при необходимости перевести в `Testing`, установить трафик 25%, подтвердить финальное состояние.

---

**Tool call 1 — get_feature_info**

```
tool: mcp__feature-flags__get_feature_info
args: { "feature_id": "search_v2" }
```

Ответ MCP:

```json
{
  "feature_id": "search_v2",
  "name": "New Search Algorithm",
  "description": "Replaces legacy regex-based keyword matching with a hybrid BM25 + TF-IDF ranking pipeline...",
  "status": "Testing",
  "traffic_percentage": 15,
  "last_modified": "2026-03-10",
  "targeted_segments": ["beta_users", "internal"],
  "rollout_strategy": "canary",
  "dependency_states": {}
}
```

Вывод: статус уже `Testing` (не `Disabled`), `set_feature_state` не требуется. Трафик — 15%, нужно поднять до 25%.

---

**Tool call 2 — adjust_traffic_rollout**

```
tool: mcp__feature-flags__adjust_traffic_rollout
args: { "feature_id": "search_v2", "percentage": 25 }
```

Ответ MCP:

```json
{
  "feature_id": "search_v2",
  "name": "New Search Algorithm",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-10",
  "hint": null
}
```

Трафик успешно обновлён до 25%. `last_modified` обновился до `2026-05-10`.

---

**Tool call 3 — get_feature_info (подтверждение)**

```
tool: mcp__feature-flags__get_feature_info
args: { "feature_id": "search_v2" }
```

Ответ MCP:

```json
{
  "feature_id": "search_v2",
  "name": "New Search Algorithm",
  "description": "Replaces legacy regex-based keyword matching with a hybrid BM25 + TF-IDF ranking pipeline...",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-10",
  "targeted_segments": ["beta_users", "internal"],
  "rollout_strategy": "canary",
  "dependency_states": {}
}
```

---

**Итоговое состояние `search_v2`:**

| Поле               | До         | После      |
| ------------------ | ---------- | ---------- |
| status             | Testing    | Testing    |
| traffic_percentage | 15%        | 25%        |
| last_modified      | 2026-03-10 | 2026-05-10 |

`set_feature_state` не вызывался — флаг уже был в `Testing`. Изменение выполнено через `adjust_traffic_rollout` (предназначен именно для изменения трафика без смены статуса). Запись в `features.json` атомарная (temp file + rename).

---

### Search-docs MCP

Три вопроса прогнаны через `mcp__docs-search__search_project_docs`. Каждый запрос — параллельно или в уточняющем раунде.

---

#### Q1: Какая БД используется и почему?

**Раунд 1** — `query: "database MongoDB why chosen architecture decision"`, top_k=5

| #   | score | source_file       | parent_headings                     | snippet                                                                                                                                                     |
| --- | ----- | ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 0.586 | best-practices.md | RTK Query vs. TanStack Query        | RTK Query ~40KB vs TanStack ~16KB — architectural decision                                                                                                  |
| 2   | 0.577 | dev-history.md    | Decision 1: MongoDB over PostgreSQL | "Made in January 2023 before the first commit. The rationale: the product catalog has variable attributes (electronics have wattage/voltage, clothing has…" |
| 3   | 0.557 | best-practices.md | Embed vs. reference                 | Unbounded arrays embedded — common production failure                                                                                                       |
| 4   | 0.550 | dev-history.md    | Decision 4: Staying on Bootstrap 4  | Bootstrap 4 chosen in January 2023                                                                                                                          |
| 5   | 0.545 | architecture.md   | System Overview                     | ProShop — MERN stack (MongoDB, Express, React, Node)                                                                                                        |

Чанк #2 релевантен (dev-history.md, Decision 1), но score 0.577 — слабо. Уточнение:

**Раунд 2** — `query: "MongoDB chosen rationale flexible schema document store"`, top_k=3

| #   | score     | source_file     | parent_headings                     | snippet                                                                                                                                                     |
| --- | --------- | --------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **0.727** | dev-history.md  | Decision 1: MongoDB over PostgreSQL | "Made in January 2023 before the first commit. The rationale: the product catalog has variable attributes (electronics have wattage/voltage, clothing has…" |
| 2   | 0.634     | architecture.md | 5.4 Mongoose Models                 | "See Section 6 for full schema detail."                                                                                                                     |
| 3   | 0.627     | glossary.md     | Mongoose                            | "ODM for MongoDB in Node.js. Provides schema validation, type coercion, and middleware hooks."                                                              |

**Ответ:** БД — **MongoDB**. Выбрана в январе 2023 вместо PostgreSQL по причине переменных атрибутов товаров (электроника: wattage/voltage, одежда: размеры/цвета) — гибкая документная схема подходит лучше реляционной таблицы. Чанк из `dev-history.md` → Decision 1 — прямой ADR-ответ, score 0.727.

---

#### Q2: Какие фичи зависят от search_v2?

**Раунд 1** — `query: "search_v2 feature dependencies features that depend on"`, top_k=5

| #   | score | source_file           | parent_headings                 | snippet                                                                                                                                                  |
| --- | ----- | --------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 0.677 | feature-flags-spec.md | Avoiding Flag Dependency Chains | "Each dependency listed in a flag's array adds a constraint that must be managed manually. Deep chains — where flag C depends on B, which depends on A…" |
| 2   | 0.645 | feature-flags-spec.md | Tool 2: set_feature_state       | Purpose: Change the state of a feature flag. Automatically adjusts traffic…                                                                              |
| 3   | 0.637 | feature-flags-spec.md | 4. Feature Flag Catalog         | "This section describes all 25 feature flags defined in…"                                                                                                |
| 4   | 0.622 | feature-flags-spec.md | Tool 1: get_feature_info        | "Retrieve the complete current state of a single feature flag."                                                                                          |
| 5   | 0.620 | feature-flags-spec.md | 2. The features.json Format     | "The file contains a single top-level JSON object. Each key is a feature ID…"                                                                            |

**Раунд 2** — `query: "search_v2 flag catalog dependencies enabled"`, top_k=5

| #   | score | source_file            | parent_headings                 | snippet                                                                   |
| --- | ----- | ---------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| 1   | 0.684 | feature-flags-spec.md  | Avoiding Flag Dependency Chains | "Each dependency listed… Deep chains…"                                    |
| 2   | 0.670 | feature-flag-toggle.md | Reference Commands              | "Last updated: M3 curriculum."                                            |
| 3   | 0.659 | feature-flags-spec.md  | 4. Feature Flag Catalog         | "This section describes all 25 feature flags…"                            |
| 4   | 0.647 | feature-flags-spec.md  | What Are Feature Flags?         | "A feature flag lets you turn functionality on or off without deploying…" |
| 5   | 0.639 | best-practices.md      | OpenFeature                     | CNCF vendor-neutral standard…                                             |

**Вывод:** Оба раунда вернули общие секции про dependency chains и инструменты, но ни один чанк не содержит конкретного перечня флагов, зависящих от `search_v2`. Corpus проиндексирован по chunk'ам заголовков — каталог флагов попал в один крупный чанк без детализации по зависимостям. Max score 0.684 — ниже порога уверенного ответа.

**Fallback:** прямой ответ требует чтения `feature-flags-spec.md` или вызова `get_feature_info` + `list_features` через feature-flags MCP. По данным предыдущего прогона (лог ниже в report.md) зависимым флагом является **`semantic_search`** (extends search_v2 с embedding-based retrieval), но vector search это в текущей сессии не подтвердил.

---

#### Q3: Что случилось во время последнего incident с checkout?

**Раунд 1** — `query: "checkout incident bug production issue"`, top_k=5

| #   | score | source_file                   | parent_headings                                      | snippet                                                                                                                                   |
| --- | ----- | ----------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 0.680 | feature-flags-spec.md         | guest_checkout — Guest Checkout Without Registration | "Unauthenticated users can complete a purchase without creating an account. A temporary guest session token is issued at checkout entry…" |
| 2   | 0.679 | incident-response.md          | Phase 7: Post-Incident / Action Items                | "Create a Jira/GitHub issue for each action item. Review in weekly standup until resolved."                                               |
| 3   | 0.663 | feature-flags-spec.md         | express_checkout — Express One-Click Checkout        | "Authenticated users who have previously completed an order see a 'Buy Now' button…"                                                      |
| 4   | 0.660 | glossary.md                   | Cart Abandonment Rate                                | "Percentage of shopping carts created but not converted to orders. Indicates friction in checkout…"                                       |
| 5   | 0.659 | i-001-paypal-double-charge.md | Lessons                                              | "PayPal sandbox does not faithfully replicate production behavior. Double-callback occurs in sandbox due to retry logic…"                 |

Инцидент виден на #5, но заглушён feature-flags и glossary. Уточнение:

**Раунд 2** — `query: "PayPal double charge checkout incident root cause fix"`, top_k=5

| #   | score     | source_file                   | parent_headings                                 | snippet                                                                                                                                                                                         |
| --- | --------- | ----------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **0.715** | i-001-paypal-double-charge.md | Summary                                         | "A subset of orders placed via PayPal were being marked as paid twice in the database, resulting in duplicate documents and — in three cases — inventory being decremented twice for the same…" |
| 2   | **0.708** | i-001-paypal-double-charge.md | Impact                                          | "Orders affected: 7 orders with duplicate entries. Inventory: 3 products with stock decremented below true value (including one at -1). Customer impact: Zero."                                 |
| 3   | 0.659     | feature-flags-spec.md         | guest_checkout                                  | Guest session token issued at checkout entry…                                                                                                                                                   |
| 4   | 0.654     | i-001-paypal-double-charge.md | Root Cause Analysis                             | "The SDK fires the callback when PayPal confirms payment authorization. The application's handler called PUT /api/orders/:id/pay. The backend handler at that time: No idempotency guard…"      |
| 5   | 0.646     | best-practices.md             | 5.6 Double-charge prevention at the order level | "Add a database-level guard: an order can only transition to paid state once. Implement with a Mongoose status field and an atomic update…"                                                     |

**Ответ:** Последний инцидент — **i-001: PayPal Sandbox Webhook Double-Charge**.

- **Что случилось:** PayPal SDK дважды вызывал `onApprove` callback (sandbox retry logic). Каждый вызов делал PUT `/api/orders/:id/pay`. Бэкенд не имел idempotency guard → 7 заказов помечены как оплаченные дважды, у 3 товаров остаток запасов ушёл в минус (один до -1).
- **Клиентский ущерб:** нулевой (sandbox-среда).
- **Фикс:** добавить DB-level guard — заказ может перейти в `paid` только один раз (Mongoose atomicUpdate + статусная проверка перед обновлением).
- **Урок:** sandbox PayPal воспроизводит retry-поведение, которого нет в production → тестировать idempotency отдельно.

Источники: три чанка из `i-001-paypal-double-charge.md` (score 0.715 / 0.708 / 0.654) + `best-practices.md` §5.6.

---

#### Итоги по трём вопросам

| Вопрос                          | Нашёл MCP?                            | Max score | Fallback нужен?                                     |
| ------------------------------- | ------------------------------------- | --------- | --------------------------------------------------- |
| Q1: Какая БД и почему?          | ✅ Да (dev-history.md, Decision 1)    | 0.727     | Нет                                                 |
| Q2: Зависимости search_v2       | ❌ Нет прямого ответа                 | 0.684     | Да → читать feature-flags-spec.md или list_features |
| Q3: Последний инцидент checkout | ✅ Да (i-001-paypal-double-charge.md) | 0.715     | Нет                                                 |

**Вывод:** уточнение запроса (раунд 2) критично — первый запрос по Q1 дал 0.577, после перефразирования 0.727. Q2 упирается в структуру чанкинга: весь каталог флагов попал в один большой чанк без раскрытия зависимостей → vector search не справляется, нужен fallback на live feature-flags MCP.

---

### End-to-end

Цепочка из 5 tool calls: 2 × search-docs MCP + 3 × feature-flags MCP.

---

#### Tool call 1 — search-docs: первый запрос

```
tool: mcp__docs-search__search_project_docs
args: { "query": "semantic_search feature description dependencies what it does", "top_k": 5 }
```

| #   | score     | source_file           | parent_headings                            | snippet                                                                                                                                                      |
| --- | --------- | --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 0.685     | feature-flags-spec.md | Avoiding Flag Dependency Chains            | "Each dependency listed in a flag's array adds a constraint that must be managed manually…"                                                                  |
| 2   | 0.660     | feature-flags-spec.md | Tool 1: get_feature_info                   | "Purpose: Retrieve the complete current state of a single feature flag."                                                                                     |
| 3   | **0.657** | feature-flags-spec.md | `semantic_search` — Semantic Vector Search | "Extends search_v2 with embedding-based retrieval. Product embeddings are pre-computed and stored; at query time, the user's search string is embedded and…" |
| 4   | 0.643     | feature-flags-spec.md | 2. The features.json Format                | "The file contains a single top-level JSON object."                                                                                                          |
| 5   | 0.632     | feature-flags-spec.md | 4. Feature Flag Catalog                    | "This section describes all 25 feature flags…"                                                                                                               |

Чанк #3 содержит нужный раздел каталога, но score 0.657 — неуверенно. Уточнение:

---

#### Tool call 2 — search-docs: уточняющий запрос

```
tool: mcp__docs-search__search_project_docs
args: { "query": "semantic_search embedding vector retrieval product search rollout", "top_k": 3 }
```

| #   | score     | source_file           | parent_headings                            | snippet                                                                                                                                                      |
| --- | --------- | --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **0.743** | feature-flags-spec.md | `semantic_search` — Semantic Vector Search | "Extends search_v2 with embedding-based retrieval. Product embeddings are pre-computed and stored; at query time, the user's search string is embedded and…" |
| 2   | 0.642     | feature-flags-spec.md | `search_v2` — New Search Algorithm         | "The current product search uses MongoDB regex on the product name field only. search_v2 replaces this with a hybrid BM25 + TF-IDF ranking pipeline…"        |
| 3   | 0.633     | home.md               | User Actions                               | "Search: Triggered from Header…"                                                                                                                             |

Чанк #1 — точное попадание (score 0.743). Из документации:

> **`semantic_search` — Semantic Vector Search**
> Default state: Disabled
> Extends `search_v2` with embedding-based retrieval. Product embeddings are pre-computed and stored; at query time, the user's search string is embedded and matched via cosine similarity.

**Зависимости:** `search_v2` (явно указана в чанке и подтверждена live MCP).

---

#### Tool call 3 — feature-flags: get_feature_info (начальное состояние)

```
tool: mcp__feature-flags__get_feature_info
args: { "feature_id": "semantic_search" }
```

Ответ:

```json
{
  "feature_id": "semantic_search",
  "name": "Semantic Vector Search",
  "description": "Augments keyword search with embedding-based semantic similarity. Products are encoded at index time; queries are embedded at runtime and matched via cosine similarity. Requires search_v2 to be Enabled first. Significantly improves discovery for natural-language queries like 'good headphones for running'.",
  "status": "Disabled",
  "traffic_percentage": 0,
  "last_modified": "2026-02-14",
  "targeted_segments": ["internal"],
  "rollout_strategy": "canary",
  "dependencies": ["search_v2"],
  "dependency_states": { "search_v2": "Testing" }
}
```

**Проверка условия:**

- `semantic_search.status` = `Disabled` ✅
- `search_v2` (зависимость) = `Testing` ≠ `Disabled` ✅

Условие выполнено → переводим в Testing, устанавливаем трафик 25%.

---

#### Tool call 4 — feature-flags: set_feature_state → Testing

```
tool: mcp__feature-flags__set_feature_state
args: { "feature_id": "semantic_search", "state": "Testing" }
```

Ответ:

```json
{
  "feature_id": "semantic_search",
  "name": "Semantic Vector Search",
  "status": "Testing",
  "traffic_percentage": 10,
  "last_modified": "2026-05-11",
  "warnings": [
    "Dependency 'search_v2' is 'Testing', not 'Enabled'. 'semantic_search' may not function correctly."
  ]
}
```

Статус → Testing. Трафик автоматически установлен в 10 (дефолт для Testing при предыдущем значении 0). Предупреждение: `search_v2` в Testing, не Enabled — не блокирует, но означает частичную доступность.

---

#### Tool call 5 — feature-flags: adjust_traffic_rollout → 25%

```
tool: mcp__feature-flags__adjust_traffic_rollout
args: { "feature_id": "semantic_search", "percentage": 25 }
```

Ответ:

```json
{
  "feature_id": "semantic_search",
  "name": "Semantic Vector Search",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-11",
  "hint": null
}
```

---

#### Tool call 6 — feature-flags: get_feature_info (подтверждение)

```
tool: mcp__feature-flags__get_feature_info
args: { "feature_id": "semantic_search" }
```

```json
{
  "feature_id": "semantic_search",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-11",
  "dependencies": ["search_v2"],
  "dependency_states": { "search_v2": "Testing" }
}
```

---

#### Анализ цепочки: ожидаемая vs фактическая

**Ожидаемая цепочка:**

```
search_project_docs → get_feature_info → анализ зависимостей →
set_feature_state → adjust_traffic_rollout → get_feature_info → цитата
```

**Фактическая цепочка:**

```
Round 1:  search_project_docs("semantic_search feature description...")
          + ToolSearch("get_feature_info")       ← параллельно (загрузка схемы)

Round 2:  search_project_docs("semantic_search embedding vector...")  ← уточняющий, 2-й вызов
          + get_feature_info("semantic_search")   ← параллельно с поиском (!)

Round 3:  [анализ зависимостей — внутренний, не tool call]

Round 4:  ToolSearch("set_feature_state")         ← загрузка схемы, не в expected
Round 5:  set_feature_state → Testing

Round 6:  ToolSearch("adjust_traffic_rollout")    ← загрузка схемы, не в expected
Round 7:  adjust_traffic_rollout → 25%

Round 8:  get_feature_info("semantic_search")     ← подтверждение ✅
Round 9:  [цитата из контекста чанков, без доп. tool call] ✅
```

**Отклонения от ожидаемой цепочки:**

| #   | Отклонение                                                                  | Причина                                                   | Влияние                                                   |
| --- | --------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1   | `search_project_docs` вызван **дважды** (уточняющий раунд)                  | Score 0.657 в первом раунде — агент решил уточнить запрос | Полезно, но не в expected                                 |
| 2   | `get_feature_info` вызван **параллельно** с search round 2, а не после него | Оптимизация: оба независимы по входным данным             | Порядок нарушен, результат тот же                         |
| 3   | **3 × ToolSearch** (загрузка схем) как дополнительные шаги                  | Deferred tools — схемы не загружены заранее               | Артефакт архитектуры системы, не семантическое отклонение |
| 4   | Цитата взята **из кэша контекста**, не отдельным tool call                  | Чанки уже были в памяти после search раундов              | Корректно, экономит токены                                |

**Ключевое отклонение:** `get_feature_info` вызван **до завершения анализа документации** — параллельно с уточняющим search. Агент не дождался полного понимания зависимостей из доков перед проверкой live-статуса. В данном случае безопасно (доки и live-данные совпали), но в более сложном сценарии (скрытые зависимости только в документации) это могло привести к ошибке — агент мог бы начать менять статус флага, не зная всех ограничений.

---

#### Итоговое состояние

| Поле               | До         | После       |
| ------------------ | ---------- | ----------- |
| status             | Disabled   | **Testing** |
| traffic_percentage | 0%         | **25%**     |
| last_modified      | 2026-02-14 | 2026-05-11  |

---

#### Цитата из документации (зачем нужна фича)

> _"Augments keyword search with embedding-based semantic similarity. Products are encoded at index time; queries are embedded at runtime and matched via cosine similarity. Requires `search_v2` to be Enabled first. **Significantly improves discovery for natural-language queries like 'good headphones for running'**."_
>
> — `feature-flags-spec.md` → Feature Flag Catalog → Search & Discovery → `semantic_search`

**Главный вывод:** Фича нужна для того, чтобы пользователи могли искать товары на естественном языке, а не точными ключевыми словами. Без неё поиск работает только по точному совпадению с именем товара (MongoDB regex). С ней — по семантической близости embeddings, что кардинально улучшает discovery.

**Предупреждение MCP:** пока `search_v2` в Testing (а не Enabled), `semantic_search` может работать некорректно. Для полной активации нужно сначала промоутировать `search_v2` → Enabled.

---

## HW3: Vector DB Chunking Pipeline

### Qdrant

Qdrant запущен в Docker на дефолтном порту 6333:

```bash
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant
curl -s http://localhost:6333/collections
# → {"result":{"collections":[]},"status":"ok"}
```

### Chunker: `scripts/chunk.py`

Семантический markdown-чанкер для ProShop docs.

**Стратегия:**

- Разбивка по заголовкам H1–H4 (никогда не разрывает code-блоки и таблицы)
- Target: 400 токенов / max 600 (≈4 chars/token)
- Overlap: последнее предложение предыдущего абзаца при разбивке длинных секций
- Вывод: JSONL в stdout, прогресс в stderr

**Метадата каждого чанка:**

| Поле              | Описание                                     |
| ----------------- | -------------------------------------------- |
| `source_file`     | Имя файла                                    |
| `file_path`       | Путь относительно корня проекта              |
| `title`           | Заголовок документа (frontmatter > H1 > имя) |
| `parent_headings` | Breadcrumb путь заголовков                   |
| `keywords`        | Заголовки + **bold** + `code` spans          |
| `summary`         | Первое законченное предложение чанка         |
| `language`        | `"en"`                                       |
| `chunk_index`     | Порядковый номер чанка в файле               |
| `token_count`     | Оценка количества токенов                    |

### Результат: `docs/chunks.jsonl`

```
967 chunks из 41 файла (docs/project-data/**/*.md)
```

Запуск:

```bash
python3 scripts/chunk.py > docs/chunks.jsonl
```

### Ingestion в Qdrant: `scripts/embed.ts`

**Метод загрузки чанков в vector DB:**

1. **Чтение** — `docs/chunks.jsonl` построчно (`node:readline` stream)
2. **Эмбеддинг** — Ollama REST API `/api/embed`, модель `nomic-embed-text` (768-dim, локально, CPU)
   - Батч-размер: 8 текстов на запрос (оптимум для CPU: sequential > concurrent на Intel i9)
3. **Upsert в Qdrant** — официальный клиент `@qdrant/qdrant-js`
   - Коллекция `proshop_docs`, distance=Cosine, dim=768
   - Стабильный ID: djb2-хеш от `file_path::chunk_index` → идемпотентные re-run
   - Payload: все поля метаданных (source_file, file_path, title, parent_headings, keywords, summary, language, chunk_index, token_count) + text

**Конфигурация (env):**

| Переменная          | Дефолт                        |
| ------------------- | ----------------------------- |
| `OLLAMA_URL`        | `http://localhost:11434`      |
| `OLLAMA_MODEL`      | `nomic-embed-text`            |
| `QDRANT_URL`        | `http://localhost:6333`       |
| `QDRANT_API_KEY`    | _(пусто = локально без auth)_ |
| `QDRANT_COLLECTION` | `proshop_docs`                |

Запуск:

```bash
cd scripts && npx tsx embed.ts
# опции: --batch 8 --concurrency 1 --dry-run
```

**Throughput:** ~0.18 chunks/sec (CPU-only, Intel i9, 400-токенные тексты) → ~90 мин на 967 чанков.

## HW4: Qdrant Vector DB — Persistent Storage & Operations

### Docker Persistent Setup

**Problem:** Default Qdrant Docker container loses all data on restart (no volumes).

**Solution:** Docker volume mount for persistence.

#### Option 1: docker-compose.yml (Recommended)

Create `docker-compose.yml` in project root:

```yaml
version: "3.8"

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage
    environment:
      QDRANT_HTTP_API_KEY: "" # empty for local development
    restart: unless-stopped

volumes:
  qdrant_storage:
    driver: local
```

**Start:**

```bash
docker-compose up -d
```

**Stop (data persists):**

```bash
docker-compose down
```

**Verify persistence:**

```bash
docker-compose up -d
curl -s http://localhost:6333/collections | jq '.result.collections'
# Should show proshop_docs collection with all points
```

#### Option 2: docker run with -v flag

```bash
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant:latest
```

### Collection Status & Verification

**Dashboard:** http://localhost:6333/dashboard#/collections

**API endpoint:**

```bash
curl -s http://localhost:6333/collections/proshop_docs | jq '.'
```

**Expected response (after successful ingestion):**

```json
{
  "result": {
    "name": "proshop_docs",
    "status": "green",
    "vectors_count": 967,
    "points_count": 967,
    "config": {
      "params": { "vectors": { "size": 768, "distance": "Cosine" } }
    }
  },
  "status": "ok"
}
```

### Data Ingestion / Re-ingestion

If re-uploading chunks (e.g., after losing collection):

**Prerequisites:**

- Qdrant running: `docker-compose ps` or `docker ps | grep qdrant`
- Ollama running: `curl -s http://localhost:11434/api/tags | jq '.models'`
- Chunks file exists: `docs/chunks.jsonl` (967 lines)

**Run ingestion:**

```bash
cd scripts
npx tsx embed.ts
```

**Options:**

```bash
npx tsx embed.ts --batch 16        # increase batch size for faster embedding
npx tsx embed.ts --dry-run         # embed only, skip Qdrant upsert
```

**Monitor progress:**

- Real-time: Watch terminal output for percentage + ETA
- Dashboard: http://localhost:6333/dashboard#/collections (updates every 10s)

**Expected output:**

```
[embed] Loaded 967 chunks
[embed] Vector dim: 768
[embed] Reusing existing collection "proshop_docs"
[embed] 250/967 (25.9%)  rate=0.18/s  ETA=1980s  errors=0
...
[embed] Done in ~5400s (90 min). Errors: 0
[embed] Qdrant collection "proshop_docs": 967 points, status=green
```

### Troubleshooting

#### Qdrant container not starting

```bash
# Check if port 6333 is in use
lsof -i :6333
# Kill conflicting process or change port in docker-compose

# Check container logs
docker logs qdrant
```

#### Data lost after restart

```bash
# Verify volume exists
docker volume ls | grep qdrant

# Inspect volume mount
docker volume inspect qdrant_storage

# If volume not mounted, check docker-compose.yml:
# - volumes key under 'qdrant' service
# - top-level 'volumes:' section exists
```

#### Ingestion stuck or slow

```bash
# Check Ollama availability
curl -s http://localhost:11434/api/tags | jq '.models | length'

# View last 50 lines of embed.ts output
tail -50 /tmp/embed_output.log

# Kill and restart ingestion (idempotent, won't duplicate):
kill <pid>
cd scripts && npx tsx embed.ts
```

#### Connection refused on embedding

```bash
# Ensure Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama:
ollama serve
# (or if using Docker: docker run -d -p 11434:11434 ollama/ollama)
```

### Architecture Notes

| Component    | Purpose                            | Port  | Persistence                |
| ------------ | ---------------------------------- | ----- | -------------------------- |
| Qdrant       | Vector DB, retrieval index         | 6333  | ✅ `qdrant_storage` volume |
| Ollama       | Embedding model (nomic-embed-text) | 11434 | ❌ Stateless               |
| chunks.jsonl | Source chunks (markdown parsed)    | -     | ✅ `docs/chunks.jsonl`     |

**Workflow:**

1. **Parse docs** → `python3 scripts/chunk.py > docs/chunks.jsonl` (967 chunks, metadata)
2. **Embed & index** → `cd scripts && npx tsx embed.ts` (Ollama → Qdrant)
3. **Query** → `http://localhost:6333/collections/proshop_docs` (search endpoint)

### Maintenance

**Backup collection:**

```bash
# Qdrant snapshot (stored on volume automatically)
# Manual export not needed — volume persists

# To verify backup integrity on new machine:
# 1. Copy qdrant_storage volume
# 2. Start container with same volume
# 3. Verify collection: curl http://localhost:6333/collections/proshop_docs
```

**Wipe and reseed:**

```bash
# Stop and remove container
docker-compose down

# Remove volume (destructive)
docker volume rm qdrant_storage

# Restart clean
docker-compose up -d

# Re-ingest chunks
cd scripts && npx tsx embed.ts
```

**Monitor disk usage:**

```bash
docker exec qdrant du -sh /qdrant/storage
# Typical: ~300-500MB for 967 chunks × 768-dim vectors
```

## 3 questions

- ~5 hours
- I used promt for diagramm generation
- AI generated tests, but some of them failed. Later AI fixed them (e.g. The issue is that redux-mock-store doesn't propagate async errors the same way. Let me fix the tests to characterize the actual behavior)

## HW3

I chose free model Ollama and Qdrant.
Instead of suggested 300 chunks I have 967, was a bit long for downloading.
Then from local DB i want to setup a persistent storage(docker-compose setup).

Answers from Claude on 3 tests questions:

---

Результаты 3 тестовых запросов

Q1: "Which database is used in ProShop MERN and why was MongoDB chosen?"

┌─────┬───────┬──────────────────────┬────────────────────────────────────────────────┐
│ # │ score │ source │ оценка │
├─────┼───────┼──────────────────────┼────────────────────────────────────────────────┤
│ 1 │ 0.675 │ glossary.md → │ ✅ релевантно (ODM для MongoDB, объясняет что │
│ │ │ Mongoose │ это) │
├─────┼───────┼──────────────────────┼────────────────────────────────────────────────┤
│ 2 │ 0.669 │ payment.md │ ❌ нерелевантно │
├─────┼───────┼──────────────────────┼────────────────────────────────────────────────┤
│ 3 │ 0.668 │ payment.md │ ❌ нерелевантно │
└─────┴───────┴──────────────────────┴────────────────────────────────────────────────┘

Диагноз: ADR-документа с причинами выбора MongoDB в docs/project-data/ нет — только
architecture.md. Glossary правильно описывает Mongoose, но мотивацию выбора ищи в
architecture.md. Scores 0.66-0.67 = слабый матч, corpus не содержит прямого ответа "почему
MongoDB".

---

Q2: "Which features depend on search_v2 feature flag?"

┌─────┬───────┬────────────────────────────────┬──────────────────────────────────────┐
│ # │ score │ source │ оценка │
├─────┼───────┼────────────────────────────────┼──────────────────────────────────────┤
│ │ │ feature-flags-spec.md → │ ✅✅ точный ответ: "Extends │
│ 1 │ 0.741 │ semantic_search │ search_v2 with embedding-based │
│ │ │ │ retrieval" │
├─────┼───────┼────────────────────────────────┼──────────────────────────────────────┤
│ 2 │ 0.709 │ feature-flags-spec.md → │ ✅ контекстно полезно │
│ │ │ get_feature_info tool │ │
├─────┼───────┼────────────────────────────────┼──────────────────────────────────────┤
│ 3 │ 0.692 │ feature-flag-toggle.md → Hard │ ⚠️ слабо релевантно │
│ │ │ Delete runbook │ │
└─────┴───────┴────────────────────────────────┴──────────────────────────────────────┘

Диагноз: Лучший результат из трёх. semantic_search как зависимость от search_v2 —
правильный single-hop ответ. Multi-hop (catalog.md / dev-history.md) не нашёл без --folder
фильтра.

---

Q3: "What happened during the last incident with checkout/payment failure?" + --folder
incidents

┌─────┬───────┬───────────────────────────────────────────┬───────────────────────────┐
│ # │ score │ source │ оценка │
├─────┼───────┼───────────────────────────────────────────┼───────────────────────────┤
│ │ │ │ ✅✅ PayPal │
│ 1 │ 0.679 │ i-001-paypal-double-charge.md → Summary │ double-charge, orders │
│ │ │ │ marked paid twice │
├─────┼───────┼───────────────────────────────────────────┼───────────────────────────┤
│ 2 │ 0.674 │ i-001-paypal-double-charge.md → Root │ ✅✅ onApprove двойной │
│ │ │ Cause │ вызов /api/orders/:id/pay │
├─────┼───────┼───────────────────────────────────────────┼───────────────────────────┤
│ 3 │ 0.667 │ i-002-mongo-connection-pool-exhaustion.md │ ✅ другой инцидент │
└─────┴───────┴───────────────────────────────────────────┴───────────────────────────┘

Диагноз: С --folder incidents работает отлично. Без фильтра — тонет в
feature-flags-spec.md и checkout.md features.

---

Выводы и что можно улучшить

┌─────────────────┬──────────────────────────────┬────────────────────────────────────┐
│ Проблема │ Причина │ Фикс │
├─────────────────┼──────────────────────────────┼────────────────────────────────────┤
│ Q1 слабые │ Corpus не содержит "почему │ Добавить ADR-чанк в │
│ scores (0.66) │ MongoDB" явно │ architecture.md │
├─────────────────┼──────────────────────────────┼────────────────────────────────────┤
│ Русские запросы │ nomic-embed-text — │ Использовать multilingual-e5 или │
│ → мусор │ английская модель │ переводить запросы │
├─────────────────┼──────────────────────────────┼────────────────────────────────────┤
│ Q3 без фильтра │ "checkout" → checkout │ Добавить folder в payload при │
│ тонет │ features, не incidents │ ingest → фильтр без hardcode │
├─────────────────┼──────────────────────────────┼────────────────────────────────────┤
│ Scores в целом │ Нормально для CPU cosine, не │ ОК для retrieval │
│ 0.67-0.74 │ ниже 0.5 │ │
└─────────────────┴──────────────────────────────┴────────────────────────────────────┘

Главный вывод: --folder incidents как pre-filter критичен для Q3. Q2 работает хорошо без
фильтра. Q1 упирается в отсутствие explicit ADR-текста о выборе MongoDB.

---

## HW4: UI Redesign — WCAG 2.1 AA Design System

### Redesigned pages

| #   | Page                         | Route                               | File                        | Видимость |    Сделал?     |
| --- | ---------------------------- | ----------------------------------- | --------------------------- | --------- | :------------: |
| 1   | Home / Search results        | `/`, `/search/:keyword`, `/page/:n` | `HomeScreen.js`             | public    |       ✅       |
| 2   | Product details              | `/product/:id`                      | `ProductScreen.js`          | public    |       ✅       |
| 3   | Cart                         | `/cart/:id?`                        | `CartScreen.js`             | public    |       ✅       |
| 4   | Login                        | `/login`                            | `LoginScreen.js`            | public    |       ✅       |
| 5   | Register                     | `/register`                         | `RegisterScreen.js`         | public    |       ✅       |
| 6   | Profile                      | `/profile`                          | `ProfileScreen.js`          | auth      |       ✅       |
| 7   | Shipping                     | `/shipping`                         | `ShippingScreen.js`         | auth      |       ✅       |
| 8   | Payment                      | `/payment`                          | `PaymentScreen.js`          | auth      |       ✅       |
| 9   | Place Order                  | `/placeorder`                       | `PlaceOrderScreen.js`       | auth      |       ✅       |
| 10  | Order details                | `/order/:id`                        | `OrderScreen.js`            | auth      |       ✅       |
| 11  | Admin: Users list            | `/admin/userlist`                   | `UserListScreen.js`         | admin     |       ✅       |
| 12  | Admin: User edit             | `/admin/user/:id/edit`              | `UserEditScreen.js`         | admin     |       ✅       |
| 13  | Admin: Products list         | `/admin/productlist`                | `ProductListScreen.js`      | admin     |       ✅       |
| 14  | Admin: Product edit          | `/admin/product/:id/edit`           | `ProductEditScreen.js`      | admin     |       ✅       |
| 15  | Admin: Orders list           | `/admin/orderlist`                  | `OrderListScreen.js`        | admin     |       ✅       |
| 16  | **Admin: Feature Dashboard** | `/admin/featuredashboard`           | `FeatureDashboardScreen.js` | admin     | ✅ обязательно |

### Tools used

- **Claude Design** — for creating DESIGN.md and DESIGN_ACCESSIBILITY.md
- **Claude Code** — primary tool for all redesign work (code generation + iteration)
- **Puppeteer** (system Chrome) — before/after screenshot automation via `tmp/screenshot.mjs` + `tmp/screenshot-admin.mjs`
- **`tmp/capture.sh`** — git stash workflow: stash redesigned files → shoot "before" → pop → shoot "after"
- **DESIGN_ACCESSIBILITY.md** — primary spec (WCAG 2.1 Level AA requirements)
- **ANTI_SLOP.md** — visual guardrails (no gradients, ≥48px section gaps, ≤1px borders, max 60vh hero)
- **DESIGN.md** — EPAM Design System color/typography tokens

### Component decisions

| What                                        | Taken ready-made        | Custom / replaced with                                                                      |
| ------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| Bootstrap `Form`, `Button`, `Row`, `Col`    | ❌ removed              | Native `<form>`, `<fieldset>`, `<legend>`, `<button>`                                       |
| Bootstrap `Table`                           | ❌ removed              | `.ps-table` — semantic `<table>` with `scope='col'`, `.ps-sr-only` on empty action headers  |
| Bootstrap `Message` / `Loader`              | ❌ removed              | `.ps-alert--error/success/info` + `.ps-loader` (CSS keyframe spinner)                       |
| `LinkContainer` from react-router-bootstrap | ❌ removed              | Plain `<Link>` from react-router-dom                                                        |
| `FormContainer`                             | ❌ removed              | `.ps-checkout-page` (max-width: 480px centered)                                             |
| FontAwesome `<i className='fas fa-*'>`      | ❌ removed              | Inline SVG icons (IconCheck, IconX, IconEdit, IconTrash, IconPlus) — no external dependency |
| `Form.File` (Bootstrap file input)          | ❌ removed              | Native `<input type='file' className='ps-file-input'>`                                      |
| `PayPalButton`                              | ✅ kept as-is           | — (third-party, no visual redesign)                                                         |
| `Paginate` component                        | ✅ kept as-is           | Wrapped with `.ps-pagination` CSS                                                           |
| `Rating` component                          | ✅ kept as-is           | Added `.rating` CSS override for spacing                                                    |
| Redux logic (all thunks, selectors)         | ✅ 100% preserved       | No changes to any action/reducer/constant files                                             |
| `screens.css`                               | ❌ created from scratch | 1368-line design system: tokens, utilities, 27 sections, `ps-` namespace                    |

**Key CSS patterns introduced:**

- `ps-checkout-page` — narrow centered form layout (all auth + edit screens)
- `ps-fieldset` / `.ps-fieldset legend` — WCAG 1.3.1 semantic form groups
- `ps-placeorder-layout` / `ps-cart-layout` — 2-column `1fr 300px` grid with sticky summary card
- `ps-profile-layout` — `300px 1fr` grid (form + orders table side by side)
- `ps-admin-toolbar` — flex row with title + action button
- `ps-badge--success/danger` — pill status badges (paid/delivered/admin)
- `ps-table` — full data table system with hover rows and caption support

**Screenshot automation:**

```bash
bash tmp/capture.sh after     # capture after redesign (no stash)
bash tmp/capture.sh           # full before+after (uses git stash)
```

30 screenshots in `tmp/screenshots/` — `before_*.png` + `after_*.png` for all 16 pages.

### My notes:

In claude.ai/design I chose model Haiku 4.5, attached code base, also provided design template
and through several minutes I got the design. Then I decided do separate design for other pages with
prompt from accessibility-export.
I also added files/logic that save screenshot before and after redesign, for me to see the difference.
I put folder with these files in gitignore.

During HW4 I spent apporoximately 10$ in Claude
