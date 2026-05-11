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
