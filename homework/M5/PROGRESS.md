# HW5 Progress — n8n Agentic Workflows

## Spec

https://github.com/Serg1kk/aidev-course-materials/blob/main/M5/homework-spec.md

---

## Что запущено (инфраструктура)

| Сервис           | Порт  | Команда запуска                                 |
| ---------------- | ----- | ----------------------------------------------- |
| MongoDB          | 27017 | `docker start mongo`                            |
| ProShop backend  | 5001  | `node backend/server.js` (из корня проекта)     |
| MCP HTTP server  | 3001  | `cd mcp-feature-flags && npm run dev:http`      |
| n8n              | 5678  | `docker start n8n`                              |
| Logs HTTP server | 8765  | `cd homework/M5 && python3 -m http.server 8765` |

**Важно:** при каждом запуске все 5 сервисов должны быть запущены.

---

## Часть A — WF1 (Manual/Webhook trigger) DONE

- Workflow: **My workflow** (ID: `fIQW4XazcgSM3WBA`)
- Webhook: `POST /webhook/feature-control`
- Nodes: Webhook → Switch (валидация) → AI Agent (OpenRouter + MCP) → Code JS → Respond to Webhook
- Файл: `homework/M5/My workflow.json` — экспортировать из n8n (ещё не сохранён)

---

## Часть B — WF2 (Scheduled defensive monitor) MOSTLY DONE

- Workflow: **My workflow 2** (ID: `gTN6q3LUExrkBQYs`)
- Файл: `homework/M5/My workflow 2.json` — экспортировать из n8n (ещё не сохранён)

### Архитектура WF2:

```
Schedule Trigger (1 min)
  → HTTP Request (GET http://host.docker.internal:8765/logs.json)
  → Code in JavaScript (error_rate за последние 60s)
  → HTTP Request1 (GET http://host.docker.internal:5001/api/feature-flags/search_v2)
  → Code in JavaScript1 (merge + decision: deactivate/re_enable/noop)
  → Switch
      ├─ output 0 (deactivate) → AI Agent → Telegram
      ├─ output 1 (re_enable)  → AI Agent → Telegram
      └─ Fallback (noop)       → [NoOp node — нужно добавить]
```

### AI Agent (WF2):

- Model: OpenRouter (Gemini Flash)
- Tool: MCP Client → `http://host.docker.internal:3001/mcp`
- No Memory (stateless)
- Structured Output Parser schema: `action_taken, alert_message, previous_status, new_status, error_rate_pct, success, rejected_at`
- Telegram Text: `{{ $json.output.alert_message }}`

### Thresholds:

- Deactivate: `error_rate > 5%` AND `status != "Disabled"`
- Re-enable: `error_rate < 1%` AND `status == "Disabled"`

---

## Что осталось доделать (B.6 checklist)

### Быстрые правки в n8n (15 мин):

- [ ] AI Agent → Max Iterations = 3 (сейчас вероятно 5 или 10)
- [ ] Switch Fallback → добавить NoOp node (n8n-nodes-base.noOp) чтобы в execution trace было видно intentional no-op
- [ ] Экспортировать My workflow.json → сохранить в `homework/M5/My workflow.json`
- [ ] Экспортировать My workflow 2.json → сохранить в `homework/M5/My workflow 2.json`

### Тест (10 мин):

- [ ] Запустить быстрый тест 2 полных цикла:
  ```bash
  cd homework/M5 && python3 simulate_wf2.py --output logs.json --duration 600 --period 120
  ```
  Ожидаемый результат: ~4 Telegram-сообщения за 10 минут (2x деактивация + 2x восстановление)

### Error handling в Code node (5 мин):

- [ ] Открыть Code in JavaScript (первый) → заменить строку:
  ```js
  const logs = $input.all().map((item) => item.json);
  ```
  На:
  ```js
  const logs = $input
    .all()
    .map((item) => item.json)
    .filter((e) => e && e.timestamp && e.status);
  ```

---

## Симулятор

```bash
# Стандартный запуск (30 мин, период 5 мин)
cd homework/M5 && python3 simulate_wf2.py --output logs.json --duration 1800 --period 300

# Быстрый тест (10 мин, период 2 мин)
cd homework/M5 && python3 simulate_wf2.py --output logs.json --duration 600 --period 120
```

---

## Последовательность запуска

```bash
# 1. MongoDB + n8n (Docker)
docker start mongo && docker start n8n

# 2. Backend (из корня проекта)
node backend/server.js &

# 3. MCP server
cd mcp-feature-flags && npm run dev:http &

# 4. Logs server
cd homework/M5 && python3 -m http.server 8765 &

# 5. Симулятор (ОБЯЗАТЕЛЬНО — без него WF2 всегда идёт в No Operation!)
cd homework/M5 && python3 simulate_wf2.py --output logs.json --duration 900 --period 120 &
```

Затем открыть localhost:5678 и убедиться что оба workflow активны (Published).

**ВАЖНО:** симулятор завершается через N секунд (duration). Если WF2 перестал ходить в Telegram — первым делом проверить `ps aux | grep simulate_wf2`. Если не запущен — перезапустить.

Скриншот / curl-лог с попыткой -50 и отказом
В README отметить где именно стоит проверка (Switch-нода и JSON Schema)
Прогнать simulate_wf1.py --include-invalid — видно что каждый 7-й запрос отвергается на Switch
