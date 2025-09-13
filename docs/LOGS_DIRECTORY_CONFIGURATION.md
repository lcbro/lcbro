# Конфигурация директории для логов

## Обзор

Реализована расширенная система управления логами с возможностью указания директории для хранения логов, ротацией файлов, сжатием и категоризацией.

## 📁 Основные возможности

### **Управление директорией логов**
- Настраиваемая директория для хранения логов
- Автоматическое создание директории
- Ротация логов по размеру и времени
- Сжатие старых логов

### **Категоризация логов**
- Отдельные файлы для разных категорий
- Настраиваемые форматы логирования
- Консольное и файловое логирование
- Цветной вывод в консоль

### **Управление файлами**
- Автоматическая ротация логов
- Сжатие больших файлов
- Очистка старых файлов
- Мониторинг использования диска

## ⚙️ Конфигурация

### config/default.yaml

```yaml
logging:
  level: info
  directory: /data/logs           # директория для хранения логов
  maxFileSize: "100MB"           # максимальный размер файла лога
  maxFiles: 10                   # максимальное количество файлов логов
  compress: true                 # сжимать старые файлы логов
  rotation: "daily"              # ротация логов: daily, weekly, monthly, size
  
  # Конфигурация файлового логирования
  files:
    enabled: true                # включить файловое логирование
    format: "json"               # формат лога: json, pretty, text
    includeTimestamp: true       # включать временную метку в имя файла
    includeLevel: true           # включать уровень лога в имя файла
    
  # Конфигурация консольного логирования  
  console:
    enabled: true                # включить консольное логирование
    format: "pretty"             # формат консоли: pretty, json, text
    colorize: true               # цветной вывод в консоль
    
  # Категории логов
  categories:
    browser: true               # логи операций браузера
    llm: true                   # логи операций LLM
    cdp: true                   # логи подключений CDP
    network: true               # логи сетевых запросов
    errors: true                # логи ошибок
    performance: true           # логи метрик производительности
  
  # Детальное логирование LLM
  llm:
    enabled: true                 # включить детальное логирование LLM
    logPrompts: true             # логировать все промпты отправляемые в LLM
    logResponses: true           # логировать все ответы от LLM
    logTokens: true              # логировать статистику использования токенов
    logPerformance: true         # логировать метрики времени и производительности
    logPreprocessing: true       # логировать анализ и результаты предобработки
    
    # Настройки логирования данных
    maxPromptLength: 2000        # максимум символов для логирования промптов
    maxResponseLength: 1000      # максимум символов для логирования ответов
    maxInputDataLength: 5000     # максимум символов для логирования входных данных
    
    # Отслеживание производительности
    trackMetrics: true           # отслеживать метрики производительности
    metricsInterval: 100         # логировать метрики каждые N операций
```

## 📂 Структура директории логов

### **Именование файлов**
```
/data/logs/
├── application-2024-01-15.log          # Общие логи приложения
├── browser-info-2024-01-15.log         # Логи браузера (уровень info)
├── browser-error-2024-01-15.log        # Логи браузера (уровень error)
├── llm-info-2024-01-15.log             # Логи LLM (уровень info)
├── llm-error-2024-01-15.log            # Логи LLM (уровень error)
├── cdp-info-2024-01-15.log             # Логи CDP (уровень info)
├── network-info-2024-01-15.log         # Логи сети (уровень info)
├── performance-info-2024-01-15.log     # Логи производительности (уровень info)
├── errors-error-2024-01-15.log         # Логи ошибок (уровень error)
├── application-2024-01-14.log.gz       # Сжатые старые файлы
└── browser-2024-01-14.log.gz
```

### **Формат имен файлов**
- `{category}-{level}-{timestamp}.log` - если включены уровень и временная метка
- `{category}-{timestamp}.log` - если включена только временная метка
- `{category}-{level}.log` - если включен только уровень
- `{category}.log` - базовый формат

## 🔄 Ротация логов

### **Типы ротации**

#### **daily** (ежедневно)
```yaml
rotation: "daily"
```
- Новый файл каждый день
- Старые файлы сжимаются и архивируются

#### **weekly** (еженедельно)
```yaml
rotation: "weekly"
```
- Новый файл каждую неделю
- Подходит для приложений с низкой активностью

#### **monthly** (ежемесячно)
```yaml
rotation: "monthly"
```
- Новый файл каждый месяц
- Для долгосрочного хранения

#### **size** (по размеру)
```yaml
rotation: "size"
maxFileSize: "100MB"
```
- Ротация при достижении максимального размера
- Проверка каждый час

### **Настройки ротации**
```yaml
logging:
  maxFileSize: "100MB"           # максимальный размер файла
  maxFiles: 10                   # максимальное количество файлов
  compress: true                 # сжимать старые файлы
  rotation: "daily"              # тип ротации
```

## 🎨 Форматы логирования

### **JSON формат** (рекомендуется для файлов)
```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "msg": "Browser navigation completed",
  "url": "https://example.com",
  "duration": 1250,
  "category": "browser"
}
```

### **Pretty формат** (для консоли)
```
[2024-01-15 10:30:00] [INFO] Browser navigation completed
    url: "https://example.com"
    duration: 1250ms
    category: "browser"
```

### **Text формат** (простой)
```
2024-01-15T10:30:00.000Z [INFO] Browser navigation completed
```

## 🛠️ Утилиты управления логами

### **logs-manager.sh**

#### **Список файлов логов**
```bash
./scripts/logs-manager.sh list
./scripts/logs-manager.sh list -d /custom/logs/dir
```

#### **Статистика логов**
```bash
./scripts/logs-manager.sh summary
```

#### **Очистка старых логов**
```bash
./scripts/logs-manager.sh cleanup 7    # удалить файлы старше 7 дней
./scripts/logs-manager.sh cleanup 30   # удалить файлы старше 30 дней
```

#### **Сжатие логов**
```bash
./scripts/logs-manager.sh compress
```

#### **Мониторинг логов**
```bash
# Просмотр последних записей
./scripts/logs-manager.sh tail browser

# Следить за логами в реальном времени
./scripts/logs-manager.sh tail browser -f

# Просмотр с фильтрацией
./scripts/logs-manager.sh tail browser -g "error"
```

#### **Поиск в логах**
```bash
./scripts/logs-manager.sh search "error"
./scripts/logs-manager.sh search "timeout" -g "browser"
```

#### **Экспорт логов**
```bash
# Экспорт всех логов
./scripts/logs-manager.sh export

# Экспорт логов браузера
./scripts/logs-manager.sh export browser -o browser-logs.tar.gz

# Экспорт логов LLM
./scripts/logs-manager.sh export llm -o llm-logs.tar.gz
```

#### **Статистика использования диска**
```bash
./scripts/logs-manager.sh size
```

## 💻 Программное использование

### **LogsManager**

```typescript
import { LogsManager } from './src/utils/logs-manager.js';
import { Config } from './src/utils/config.js';

const logsManager = new LogsManager(logger, config);

// Инициализация
await logsManager.initialize();

// Планирование автоматической ротации
logsManager.scheduleLogRotation();

// Получение информации о файлах логов
const logFiles = await logsManager.listLogFiles();
console.log(`Found ${logFiles.length} log files`);

// Получение файлов по категории
const browserLogs = await logsManager.getLogFilesByCategory('browser');

// Получение файлов по уровню
const errorLogs = await logsManager.getLogFilesByLevel('error');

// Сжатие файла лога
await logsManager.compressLogFile('/data/logs/old-file.log');

// Очистка старых логов
await logsManager.cleanupOldLogs(30); // удалить файлы старше 30 дней

// Получение статистики использования диска
const diskUsage = await logsManager.getLogsDiskUsage();
console.log(`Total size: ${diskUsage.totalSize} bytes`);

// Получение сводки логов
const summary = await logsManager.getLogsSummary();
console.log(summary);
```

### **Создание продвинутого логгера**

```typescript
import { createAdvancedLogger } from './src/utils/logger.js';

// Создание логгера с управлением файлами
const { logger, logsManager } = await createAdvancedLogger(config);

// Логирование с категорией
logger.info({ 
  category: 'browser', 
  url: 'https://example.com' 
}, 'Browser navigation started');

// Автоматическая ротация уже настроена
```

## 📊 Мониторинг и анализ

### **Статистика использования**
```bash
# Общая статистика
./scripts/logs-manager.sh summary

# Использование диска
./scripts/logs-manager.sh size

# Список файлов
./scripts/logs-manager.sh list
```

### **Анализ логов**
```bash
# Поиск ошибок
./scripts/logs-manager.sh search "error" -g "level.*error"

# Анализ производительности
./scripts/logs-manager.sh search "duration" -g "performance"

# Мониторинг CDP подключений
./scripts/logs-manager.sh tail cdp -f
```

### **Экспорт для анализа**
```bash
# Экспорт всех логов за период
./scripts/logs-manager.sh export

# Экспорт логов конкретной категории
./scripts/logs-manager.sh export browser -o browser-analysis.tar.gz
```

## 🔧 Настройка для разных сред

### **Разработка**
```yaml
logging:
  level: debug
  directory: ./logs
  files:
    enabled: true
    format: "pretty"
  console:
    enabled: true
    colorize: true
  rotation: "size"
  maxFileSize: "10MB"
```

### **Тестирование**
```yaml
logging:
  level: info
  directory: /tmp/test-logs
  files:
    enabled: true
    format: "json"
  console:
    enabled: false
  rotation: "daily"
  maxFiles: 5
```

### **Продакшен**
```yaml
logging:
  level: warn
  directory: /var/log/mcp-browser
  files:
    enabled: true
    format: "json"
  console:
    enabled: false
  rotation: "daily"
  maxFiles: 30
  compress: true
```

### **Docker**
```yaml
logging:
  level: info
  directory: /data/logs
  files:
    enabled: true
    format: "json"
  console:
    enabled: true
    format: "text"
  rotation: "size"
  maxFileSize: "50MB"
```

## 🚨 Предупреждения и рекомендации

### **Безопасность**
- Не логируйте чувствительные данные (пароли, токены)
- Ограничьте доступ к директории логов
- Регулярно очищайте старые логи

### **Производительность**
- Используйте асинхронное логирование
- Настройте ротацию для предотвращения переполнения диска
- Сжимайте старые файлы для экономии места

### **Мониторинг**
- Настройте алерты на ошибки
- Мониторьте размер директории логов
- Регулярно анализируйте логи на предмет проблем

## 🎯 Примеры использования

### **1. Настройка для высоконагруженного приложения**
```yaml
logging:
  level: warn
  directory: /var/log/mcp-browser
  rotation: "size"
  maxFileSize: "500MB"
  maxFiles: 20
  compress: true
  files:
    enabled: true
    format: "json"
  console:
    enabled: false
```

### **2. Настройка для отладки**
```yaml
logging:
  level: debug
  directory: ./debug-logs
  rotation: "daily"
  maxFiles: 7
  files:
    enabled: true
    format: "pretty"
  console:
    enabled: true
    colorize: true
  categories:
    browser: true
    llm: true
    cdp: true
    network: true
    errors: true
    performance: true
```

### **3. Настройка для мониторинга**
```yaml
logging:
  level: info
  directory: /monitoring/logs
  rotation: "weekly"
  maxFiles: 12
  compress: true
  files:
    enabled: true
    format: "json"
  console:
    enabled: false
  categories:
    performance: true
    errors: true
```

## 🚀 Готово к использованию

Система управления директорией логов полностью реализована:

- ✅ **Настраиваемая директория** для хранения логов
- ✅ **Автоматическая ротация** по размеру и времени
- ✅ **Сжатие старых файлов** для экономии места
- ✅ **Категоризация логов** по типам операций
- ✅ **Утилиты управления** для администрирования
- ✅ **Мониторинг использования** диска
- ✅ **Экспорт и анализ** логов
- ✅ **Гибкая конфигурация** для разных сред

---

**Реализовано с помощью модели Claude Sonnet 4**
