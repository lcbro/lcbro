# Детальное логирование LLM для отладки и статистики

## Обзор

Реализована комплексная система логирования всех операций LLM с детальной информацией о промптах, ответах, производительности и экономии затрат.

## Основные возможности

### 🔍 **Детальное логирование запросов**
- Все промпты, отправляемые в LLM
- Системные промпты и пользовательские инструкции
- Параметры модели (температура, макс. токены)
- Метаданные операции (тип, ID, временные метки)

### 📊 **Логирование ответов и метрик**
- Полные ответы от LLM моделей
- Статистика использования токенов
- Время выполнения операций
- Обработка ошибок с детальной информацией

### 💰 **Анализ экономии затрат**
- Расчет стоимости по моделям
- Экономия от preprocessing
- Сравнение токенов до/после обработки
- Статистика по типам операций

### 📈 **Метрики производительности**
- Автоматическое отслеживание статистики
- Анализ по моделям (количество операций, средние токены, время)
- Эффективность preprocessing (сокращение данных, экономия)
- Периодические сводки производительности

## Конфигурация

### config/default.yaml

```yaml
logging:
  level: info
  
  # Детальное логирование LLM
  llm:
    enabled: true                 # включить/отключить логирование LLM
    logPrompts: true             # логировать все промпты
    logResponses: true           # логировать все ответы
    logTokens: true              # логировать статистику токенов
    logPerformance: true         # логировать метрики производительности
    logPreprocessing: true       # логировать анализ preprocessing
    
    # Настройки логирования данных
    maxPromptLength: 2000        # макс. символов для промптов
    maxResponseLength: 1000      # макс. символов для ответов
    maxInputDataLength: 5000     # макс. символов для входных данных
    
    # Отслеживание производительности
    trackMetrics: true           # отслеживать метрики
    metricsInterval: 100         # логировать метрики каждые N операций
```

## Типы логируемых операций

### 1. **Анализ контента (analysis)**
```json
{
  "level": "info",
  "msg": "LLM Request [ANALYSIS]",
  "timestamp": "2025-01-13T10:30:15.123Z",
  "operationId": "op_1705135815123_1",
  "operationType": "analysis",
  "model": "ollama:qwen2.5:7b",
  "systemPrompt": "You are an expert content analyzer...",
  "userPrompt": "MAIN TASK: Extract product information...",
  "maxTokens": 300,
  "temperature": 0.1,
  "inputDataLength": 15420,
  "inputDataType": "html",
  "instruction": "Extract product information as JSON"
}
```

### 2. **Preprocessing (preprocessing)**
```json
{
  "level": "info",
  "msg": "LLM Request [PREPROCESSING]",
  "operationType": "preprocessing",
  "model": "ollama:qwen2.5:7b",
  "systemPrompt": "You are a data preprocessor...",
  "userPrompt": "Preprocessing request: Remove HTML noise...",
  "preprocessRequest": "Remove HTML noise: scripts, styles, navigation, ads, footers. Focus on product/item information, remove marketing fluff. Keep only content relevant to the main task."
}
```

### 3. **Основная обработка (main)**
```json
{
  "level": "info",
  "msg": "LLM Request [MAIN]",
  "operationType": "main",
  "model": "gpt-4o-mini",
  "systemPrompt": "You are a helpful assistant...",
  "userPrompt": "Task: Extract product information as JSON...",
  "instruction": "Extract product information as JSON",
  "preprocessRequest": "Remove HTML noise: scripts, styles, navigation, ads, footers..."
}
```

## Ответы и метрики

### Успешные ответы
```json
{
  "level": "info",
  "msg": "LLM Response [PREPROCESSING]",
  "timestamp": "2025-01-13T10:30:18.456Z",
  "operationId": "op_1705135815123_2",
  "operationType": "preprocessing",
  "model": "ollama:qwen2.5:7b",
  "content": "Cleaned HTML content without navigation and ads...",
  "tokensUsed": {
    "prompt": 1250,
    "completion": 320,
    "total": 1570
  },
  "duration": 2847,
  "success": true
}
```

### Анализ preprocessing
```json
{
  "level": "info",
  "msg": "Preprocessing Analysis & Results",
  "timestamp": "2025-01-13T10:30:18.500Z",
  "inputData": "<html><head><script>...</script></head><body>...",
  "instruction": "Extract product information as JSON",
  "analysisResponse": "This HTML contains product information with navigation and ads that should be removed...",
  "generatedPreprocessRequest": "Remove HTML noise: scripts, styles, navigation, ads, footers. Focus on product/item information...",
  "originalLength": 15420,
  "processedLength": 3200,
  "reductionPercentage": "79.25",
  "analysisDuration": 1500,
  "preprocessingDuration": 2847,
  "totalDuration": 4347
}
```

### Анализ экономии затрат
```json
{
  "level": "info",
  "msg": "Preprocessing Cost Analysis",
  "operationId": "op_1705135815123_2",
  "originalInput": "<html><head><script>...</script></head>...",
  "processedInput": "Product: iPhone 15 Pro\nPrice: $999\nDescription: Latest iPhone model...",
  "preprocessRequest": "Remove HTML noise: scripts, styles, navigation, ads, footers...",
  "originalTokens": 3855,
  "processedTokens": 800,
  "tokenReduction": 3055,
  "tokenReductionPercentage": "79.25",
  "estimatedCostSaved": "0.0457"
}
```

## Метрики производительности

### Периодические сводки
```json
{
  "level": "info",
  "msg": "LLM Performance Metrics Summary",
  "timestamp": "2025-01-13T10:35:00.000Z",
  "metrics": {
    "totalOperations": 100,
    "totalTokensUsed": 125000,
    "totalCost": 0.1875,
    "averageResponseTime": 2850,
    "preprocessingStats": {
      "count": 45,
      "avgReduction": 72.3,
      "avgTime": 2100
    },
    "modelStats": {
      "gpt-4o-mini": {
        "count": 55,
        "avgTokens": 1200,
        "avgTime": 3200,
        "totalCost": 0.1250
      },
      "ollama:qwen2.5:7b": {
        "count": 45,
        "avgTokens": 800,
        "avgTime": 1800,
        "totalCost": 0.0000
      }
    }
  }
}
```

### Финальная сводка
```json
{
  "level": "info",
  "msg": "Final LLM Performance Summary",
  "finalMetrics": {
    "totalOperations": 500,
    "totalTokensUsed": 650000,
    "estimatedTotalCost": 0.9750,
    "averageResponseTime": 2750,
    "preprocessingEffectiveness": {
      "operations": 200,
      "avgReduction": "75.2%",
      "avgTime": 1950
    },
    "modelUsage": [
      {
        "model": "gpt-4o-mini",
        "operations": 300,
        "avgTokens": 1100,
        "avgTime": 3100,
        "totalCost": "0.7500"
      },
      {
        "model": "ollama:qwen2.5:7b",
        "operations": 200,
        "avgTokens": 750,
        "avgTime": 1700,
        "totalCost": "0.0000"
      }
    ]
  }
}
```

## Обработка ошибок

### Ошибки LLM запросов
```json
{
  "level": "error",
  "msg": "LLM Error [ANALYSIS]",
  "timestamp": "2025-01-13T10:30:15.123Z",
  "operationId": "op_1705135815123_1",
  "operationType": "analysis",
  "model": "ollama:qwen2.5:7b",
  "content": "",
  "duration": 5000,
  "success": false,
  "error": "Connection timeout to Ollama server"
}
```

## Анализ логов

### Использование grep для анализа

```bash
# Все операции preprocessing
grep '"operationType": "preprocessing"' logs/app.log

# Все ошибки
grep '"success": false' logs/app.log

# Метрики производительности
grep 'Performance Metrics Summary' logs/app.log

# Анализ экономии затрат
grep 'Preprocessing Cost Analysis' logs/app.log

# Статистика по конкретной модели
grep '"model": "gpt-4o-mini"' logs/app.log
```

### Анализ с jq

```bash
# Извлечение всех операций preprocessing
cat logs/app.log | jq 'select(.operationType == "preprocessing")'

# Статистика токенов
cat logs/app.log | jq 'select(.tokensUsed) | .tokensUsed.total' | awk '{sum+=$1} END {print "Total tokens:", sum}'

# Средняя продолжительность операций
cat logs/app.log | jq 'select(.duration) | .duration' | awk '{sum+=$1; count++} END {print "Average duration:", sum/count, "ms"}'

# Анализ экономии от preprocessing
cat logs/app.log | jq 'select(.msg == "Preprocessing Cost Analysis") | .estimatedCostSaved' | awk '{sum+=$1} END {print "Total cost saved: $", sum}'
```

## Мониторинг в реальном времени

### Просмотр логов в реальном времени
```bash
# Следить за всеми LLM операциями
tail -f logs/app.log | grep -E "(LLM Request|LLM Response|Performance Metrics)"

# Следить только за ошибками
tail -f logs/app.log | grep '"success": false'

# Следить за метриками производительности
tail -f logs/app.log | grep 'Performance Metrics Summary'
```

### Создание dashboard с помощью jq
```bash
# Простой dashboard в терминале
while true; do
  clear
  echo "=== LLM Performance Dashboard ==="
  echo "Total operations: $(grep 'LLM Request' logs/app.log | wc -l)"
  echo "Total errors: $(grep '"success": false' logs/app.log | wc -l)"
  echo "Preprocessing operations: $(grep '"operationType": "preprocessing"' logs/app.log | wc -l)"
  echo "Average response time: $(grep 'LLM Response' logs/app.log | jq -r '.duration' | awk '{sum+=$1; count++} END {if(count>0) print sum/count "ms"; else print "N/A"}')"
  sleep 5
done
```

## Настройка уровней логирования

### Для отладки (максимальная детализация)
```yaml
logging:
  level: debug
  llm:
    enabled: true
    logPrompts: true
    logResponses: true
    logTokens: true
    logPerformance: true
    logPreprocessing: true
    maxPromptLength: 5000      # больше данных для отладки
    maxResponseLength: 2000
    maxInputDataLength: 10000
    trackMetrics: true
    metricsInterval: 10        # чаще логировать метрики
```

### Для продакшена (оптимизированное логирование)
```yaml
logging:
  level: info
  llm:
    enabled: true
    logPrompts: false          # отключить промпты для экономии места
    logResponses: false        # отключить ответы
    logTokens: true           # оставить токены для мониторинга
    logPerformance: true      # оставить метрики
    logPreprocessing: false   # отключить детали preprocessing
    trackMetrics: true
    metricsInterval: 1000     # реже логировать метрики
```

### Для анализа производительности
```yaml
logging:
  level: info
  llm:
    enabled: true
    logPrompts: false
    logResponses: false
    logTokens: true
    logPerformance: true
    logPreprocessing: true    # включить для анализа эффективности
    maxPromptLength: 500      # минимальные данные
    maxResponseLength: 200
    maxInputDataLength: 1000
    trackMetrics: true
    metricsInterval: 50       # частые метрики
```

## Автоматизация анализа

### Скрипт для ежедневного отчета
```bash
#!/bin/bash
# daily_llm_report.sh

LOG_FILE="logs/app-$(date +%Y-%m-%d).log"
REPORT_FILE="reports/llm-$(date +%Y-%m-%d).txt"

echo "=== LLM Performance Report for $(date +%Y-%m-%d) ===" > $REPORT_FILE

# Общая статистика
echo "Total operations: $(grep 'LLM Request' $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "Total errors: $(grep '"success": false' $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "Preprocessing operations: $(grep '"operationType": "preprocessing"' $LOG_FILE | wc -l)" >> $REPORT_FILE

# Анализ токенов
TOTAL_TOKENS=$(grep 'LLM Response' $LOG_FILE | jq -r 'select(.tokensUsed) | .tokensUsed.total' | awk '{sum+=$1} END {print sum}')
echo "Total tokens used: $TOTAL_TOKENS" >> $REPORT_FILE

# Анализ экономии
COST_SAVED=$(grep 'Preprocessing Cost Analysis' $LOG_FILE | jq -r '.estimatedCostSaved' | awk '{sum+=$1} END {print sum}')
echo "Estimated cost saved: \$${COST_SAVED}" >> $REPORT_FILE

# Средняя продолжительность
AVG_DURATION=$(grep 'LLM Response' $LOG_FILE | jq -r '.duration' | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print "N/A"}')
echo "Average response time: ${AVG_DURATION}ms" >> $REPORT_FILE

echo "Report saved to $REPORT_FILE"
```

## Заключение

Система детального логирования LLM обеспечивает:

- ✅ **Полную прозрачность** всех операций LLM
- ✅ **Детальную отладку** промптов и ответов
- ✅ **Анализ производительности** и оптимизацию
- ✅ **Мониторинг экономии** от preprocessing
- ✅ **Гибкую конфигурацию** под разные нужды
- ✅ **Автоматизацию анализа** с помощью стандартных инструментов

**Модель:** Claude Sonnet 4
