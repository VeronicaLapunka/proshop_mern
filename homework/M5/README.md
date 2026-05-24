# M5 Homework — n8n Agentic Workflows

## Screencast

Файл: `homework/M5/screencast.mp4 .mov`

Показано:
1. AutoPilot Controls в Feature Dashboard — клик "Rollback" → статус фичи меняется
2. `simulate_wf1.py --include-invalid` → `[INVALID test] → status=400` (Switch отклоняет до AI Agent)
3. n8n WF2 Executions — регулярные срабатывания cron + execution через AI Agent (8s)
4. Telegram — алерты deactivate → re_enable

---

## Архитектура

WF1 (Manual trigger) принимает команды управления feature flags через webhook и делегирует решения о валидности параметров LLM (Claude Sonnet 4) с двойной защитой от галлюцинаций: Switch-нода на основе JSON Schema + валидация на уровне LLM. WF2 (Scheduled monitor) периодически анализирует логи из logs.json, вычисляет error rate за последние 60 секунд и автоматически вызывает WF1 для DEACTIVATE/RE_ENABLE/NOOP решений. Оба workflow интегрируются с MCP M3 (feature-flags) для синхронизации статуса фич в backend и отправляют уведомления в Telegram.

## Стек

- **n8n**: Self-hosted Docker (`docker-compose.yml` с образом `n8n:latest`, порт 5678)
- **Chat Model**: Claude Sonnet 4 (OpenAI-compatible через OpenRouter) — выбран за точность в JSON schema validation и способность к structured reasoning
- **Storage логов**: JSON файл (`homework/M5/logs.json`) — простой, достаточный для демо;
- **Telegram bot**: Создан бот @proshop_hw5_bot для оповещений; chat_id передан отдельно преподавателю

## WF1 — Manual trigger

- **Webhook URL**: `http://localhost:5678/webhook/feature-control` (production) и `http://localhost:5678/webhook-test/feature-control` (test mode)
- **Входные параметры**:
  ```json
  {
    "feature_id": "search_v2",
    "action": "check|test|rollback|rollout",
    "traffic_percentage": 0-100
  }
  ```
- **Архитектура**: `Webhook → Switch (валидация) → AI Agent (OpenRouter + MCP) → Code JS → Respond to Webhook`

## WF2 — Scheduled monitor

- **Trigger**: Cron expression `*/1 * * * *` (каждую минуту)
- **Threshold deactivate**: 5% — если error_rate > 5%, вызывается WF1 с action="disable"
- **Threshold re-enable**: 1% — если error_rate < 1%, вызывается WF1 с action="enable"
- **Logs storage**: `homework/M5/logs.json` — JSON массив на первой строке файла (один большой объект с массивом записей)
- **Sine period симулятора**: 300 секунд (настраивается в `simulate_wf2.py`)
- **Telegram chat**: ID получен и используется для алертов о threshold breaches

## Тест на галлюцинации (Part C)

Принцип **Algorithm-before-AI**: все невалидные запросы отклоняются **до** вызова LLM — Switch-нода работает как детерминированный guard.

### Слой 1 — Switch-нода (WF1, до AI Agent)

Нода `Switch` (режим Rules) проверяет 4 условия. При нарушении любого → HTTP 400 немедленно, AI Agent **не вызывается**:

| Правило                     | Условие                                               | Выход                       |
| --------------------------- | ----------------------------------------------------- | --------------------------- |
| Rule 1 `missing_feature_id` | `!$json.body.feature_id`                              | → Respond to Webhook1 (400) |
| Rule 2 `missing_action`     | `!$json.body.action`                                  | → Respond to Webhook1 (400) |
| Rule 3 `invalid_action`     | action не входит в `[check, test, rollback, rollout]` | → Respond to Webhook1 (400) |
| Rule 4 `invalid_traffic`    | `traffic_percentage` задан AND (< 0 OR > 100)         | → Respond to Webhook1 (400) |
| Fallback                    | всё валидно                                           | → AI Agent                  |

**Respond to Webhook1** возвращает фиксированный JSON (не LLM-генерация):

```json
{
  "success": false,
  "message": "Validation error",
  "rejected_at": "input-validation"
}
```

### Слой 2 — Structured Output Parser (внутри AI Agent)

`outputParserStructured` применяет JSON Schema к выходу LLM:

```json
{
  "required": ["success", "message"],
  "properties": {
    "success": { "type": "boolean" },
    "message": { "type": "string" },
    "current_state": { "type": ["object", "null"] },
    "rejected_at": { "type": ["string", "null"] }
  }
}
```

Если LLM вернул невалидный JSON — n8n отклоняет ответ и повторяет (до `maxIterations: 5`).

### Доказательство: curl-лог

```bash
# traffic_percentage = -50 → Switch Rule 4 → HTTP 400, AI Agent не вызван
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","action":"rollout","traffic_percentage":-50}'
```

```json
{"success":false,"message":"Validation error","rejected_at":"input-validation"}
HTTP 400
```

```bash
# action = "disable" (не в enum) → Switch Rule 3 → HTTP 400
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","action":"disable"}'
```

```json
{"success":false,"message":"Validation error","rejected_at":"input-validation"}
HTTP 400
```

Автоматический тест (каждый 7-й запрос — невалидный `-50`):

```bash
python3 simulate_wf1.py --webhook-url http://localhost:5678/webhook/feature-control \
  --api-key dummy --duration 200 --interval 3 --include-invalid
# [INVALID test] → status=400 success=False message=Validation error
```

## Как запустить

### 1. Импортировать workflow в n8n

```bash
# Открыть n8n UI на http://localhost:5678
# Projects → Import → выбрать WF1 и WF2 JSON файлы из homework/M5/workflows/
```

### 2. Настроить credentials

В n8n UI перейти в Settings → Credentials:

- **MCP (M3)**: endpoint `http://localhost:3001`, token из backend
- **Telegram Bot**: Token от @BotFather (в .env)
- **OpenRouter API**: Ключ для Claude Sonnet 4
- **X-API-Key**: Сгенерировать и сохранить для защиты webhook

### 3. Запустить симуляторы

```bash
cd homework/M5

# Симулятор WF2 (генерирует логи с синусоидальным error rate)
python3 simulate_wf2.py --output logs.json --duration 1800 --period 300 &

# Симулятор WF1 (отправляет тестовые команды с валидацией)
python3 simulate_wf1.py \
  --webhook-url http://localhost:5678/webhook/feature-control \
  --duration 120 \
  --include-invalid  # включает тесты на -50%, 150%, "invalid_action"

# Проверить ошибки
tail -f logs.json | python3 -m json.tool
```

### 4. Мониторить результаты

```bash
# Error rate за последние 60 секунд
python3 -c "
  import json,time
  from datetime import datetime
  with open('logs.json') as f:
    logs=json.loads(f.readline())
  now=time.time()*1000
  r=[e for e in logs if (now-datetime.fromisoformat(e['timestamp']).timestamp()*1000)<60000]
  er=len([e for e in r if e['status']=='error'])/len(r) if r else 0
  d='DEACTIVATE' if er>0.05 else ('RE_ENABLE' if er<0.01 else 'NOOP')
  print(f'rate={er:.1%} ({len([e for e in r if e[\"status\"]==\"error\"])}/{len(r)}) → {d}')
"
```

## Структура файлов

```
homework/M5/
├── README.md              (этот файл)
├── My workflow.json        (WF1 — Manual trigger, экспорт из n8n)
├── My workflow 2.json      (WF2 — Scheduled monitor, экспорт из n8n)
├── logs.json              (сгенерирован симулятором)
├── simulate_wf1.py        (тестирует WF1: валидные + невалидные команды)
├── simulate_wf2.py        (генерирует логи с синусоидальным error rate)
├── screenshots/           (скриншоты для сдачи)
└── PROGRESS.md            (лог выполнения задачи)
```

## Известные ограничения

- JSON файл logs.json хранит весь массив на первой строке (не JSONL) для простоты парсинга
- n8n test mode webhook срабатывает только один раз после нажатия "Execute" — для production использовать production webhook
- Claude Sonnet 4 через OpenRouter имеет небольшую задержку (~500ms) — приемлемо для автоматизации

## Что было сложно

Заставить WF работать - то одни ошбки, то вторые
Думаю 10+ часов на все точно ушло
Часть Д не пробовала. Может когда-нибудь позже.
