# Поддержка Chrome DevTools Protocol (CDP)

## Обзор

Реализована полная поддержка подключения к внешним браузерам через Chrome DevTools Protocol. Это позволяет использовать уже запущенные браузеры вместо создания новых экземпляров Playwright.

## Основные возможности

### 🔗 **Подключение к внешним браузерам**
- Автоматическое обнаружение запущенных браузеров с CDP
- Подключение к Chrome, Edge, Chromium
- Поддержка множественных браузеров и вкладок

### 🔍 **Автоматическое обнаружение**
- Сканирование портов для поиска CDP браузеров
- Обнаружение браузеров на разных портах (9222-9226)
- Валидация CDP endpoints

### 🔄 **Управление соединениями**
- WebSocket соединения к CDP
- Автоматическое переподключение при обрыве связи
- Keep-alive для стабильных соединений

### 🎯 **Полная функциональность**
- Навигация по URL
- Выполнение JavaScript
- Создание скриншотов
- Извлечение контента страниц

## Конфигурация

### config/default.yaml

```yaml
browser:
  engine: cdp                # использовать CDP вместо playwright
  headless: false            # для CDP обычно false
  
  # Chrome DevTools Protocol настройки
  cdp:
    enabled: true            # включить поддержку CDP
    host: "localhost"        # хост CDP сервера
    port: 9222              # порт CDP (по умолчанию Chrome debug port)
    autoDetect: true        # автоматическое обнаружение браузеров
    maxRetries: 3           # попытки подключения
    retryDelay: 1000        # задержка между попытками (ms)
    
    # Настройки обнаружения браузеров
    detection:
      enabled: true         # включить обнаружение
      ports: [9222, 9223, 9224, 9225, 9226]  # порты для сканирования
      timeout: 5000         # таймаут обнаружения на порт
      
    # Настройки запуска браузера
    launch:
      autoLaunch: false     # автозапуск браузера если не найден
      browserPath: null     # путь к браузеру (null = автопоиск)
      userDataDir: null     # директория пользовательских данных
      additionalArgs: []    # дополнительные аргументы браузера
      
    # Настройки соединения
    connection:
      timeout: 30000        # таймаут соединения
      keepAlive: true       # поддержание соединения
      reconnect: true       # автопереподключение при обрыве
      maxReconnects: 5      # максимум попыток переподключения
```

## Запуск браузера с CDP

### Chrome/Chromium
```bash
# Запуск Chrome с включенным CDP
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Или Chromium
chromium --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# С дополнительными опциями
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  --disable-web-security \
  --disable-features=VizDisplayCompositor
```

### Microsoft Edge
```bash
# Запуск Edge с CDP
msedge --remote-debugging-port=9222 --user-data-dir=/tmp/edge-debug
```

### Альтернативные порты
```bash
# Использование других портов для множественных браузеров
google-chrome --remote-debugging-port=9223 --user-data-dir=/tmp/chrome-debug-2
google-chrome --remote-debugging-port=9224 --user-data-dir=/tmp/chrome-debug-3
```

## Примеры использования

### 1. Автоматическое обнаружение и подключение

```typescript
// В конфигурации включить CDP
browser:
  engine: cdp
  cdp:
    enabled: true
    autoDetect: true
    detection:
      ports: [9222, 9223, 9224]

// Система автоматически найдет и подключится к первому доступному браузеру
```

### 2. Подключение к конкретному браузеру

```typescript
// Указать конкретный порт
browser:
  engine: cdp
  cdp:
    enabled: true
    autoDetect: false
    host: "localhost"
    port: 9222
```

### 3. Множественные браузеры

```bash
# Запустить несколько браузеров на разных портах
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-1 &
google-chrome --remote-debugging-port=9223 --user-data-dir=/tmp/chrome-2 &
google-chrome --remote-debugging-port=9224 --user-data-dir=/tmp/chrome-3 &

# Система автоматически найдет все доступные браузеры
```

## API для работы с CDP

### Обнаружение браузеров

```typescript
import { CDPDetector } from './src/utils/cdp-detector.js';

const detector = new CDPDetector(logger);

// Обнаружить все браузеры
const result = await detector.detectBrowsers({
  host: 'localhost',
  ports: [9222, 9223, 9224, 9225, 9226],
  timeout: 5000
});

console.log(`Found ${result.browsers.length} browsers`);
result.browsers.forEach(browser => {
  console.log(`- ${browser.title} on port ${browser.webSocketDebuggerUrl.split(':')[2]}`);
});
```

### Подключение к браузеру

```typescript
import { CDPBrowserManager } from './src/core/cdp-browser-manager.js';

const cdpManager = new CDPBrowserManager(logger, config);

// Подключиться к конкретному браузеру
const contextId = await cdpManager.connectToBrowser(browserInfo);

// Навигация
await cdpManager.navigateToUrl(contextId, 'https://example.com');

// Выполнение JavaScript
const result = await cdpManager.executeScript(contextId, 'document.title');

// Создание скриншота
const screenshot = await cdpManager.takeScreenshot(contextId, { fullPage: true });

// Извлечение контента
const content = await cdpManager.getPageContent(contextId);
```

### Мониторинг браузеров

```typescript
// Мониторинг появления новых браузеров
const stopMonitoring = await detector.monitorBrowsers(
  { host: 'localhost', ports: [9222, 9223, 9224], timeout: 5000 },
  (browsers) => {
    console.log(`Detected ${browsers.length} browsers`);
    browsers.forEach(browser => {
      console.log(`New browser: ${browser.title}`);
    });
  },
  5000 // проверка каждые 5 секунд
);

// Остановить мониторинг
stopMonitoring();
```

## Архитектура системы

### 1. **CDPDetector** (`src/utils/cdp-detector.ts`)
- Обнаружение браузеров на портах
- Валидация CDP endpoints
- Мониторинг новых браузеров
- Сканирование диапазонов портов

### 2. **CDPBrowserManager** (`src/core/cdp-browser-manager.ts`)
- Управление WebSocket соединениями
- Выполнение CDP команд
- Обработка событий браузера
- Автоматическое переподключение

### 3. **BrowserManager** (обновлен)
- Поддержка как Playwright, так и CDP
- Автоматический выбор движка
- Единый интерфейс для операций

## CDP команды и события

### Основные команды
```typescript
// Навигация
{ method: 'Page.navigate', params: { url: 'https://example.com' } }

// Выполнение JavaScript
{ method: 'Runtime.evaluate', params: { expression: 'document.title' } }

// Создание скриншота
{ method: 'Page.captureScreenshot', params: { format: 'png', fullPage: true } }

// Получение HTML
{ method: 'Runtime.evaluate', params: { expression: 'document.documentElement.outerHTML' } }
```

### События
```typescript
// Загрузка страницы
{ method: 'Page.loadEventFired' }

// Консольные сообщения
{ method: 'Runtime.consoleAPICalled', params: { type: 'log', args: [...] } }

// Сетевые запросы
{ method: 'Network.responseReceived', params: { response: { url: '...' } } }
```

## Отладка и мониторинг

### Логирование
```json
{
  "level": "info",
  "msg": "Found CDP browser",
  "browser": {
    "id": "browser_9222",
    "title": "Chrome Browser",
    "type": "chrome",
    "url": "https://example.com",
    "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
  }
}

{
  "level": "info",
  "msg": "CDP connection established",
  "contextId": "cdp_1705135815123_abc123",
  "browserId": "browser_9222"
}
```

### Мониторинг соединений
```json
{
  "level": "warn",
  "msg": "CDP connection closed",
  "contextId": "cdp_1705135815123_abc123",
  "attemptingReconnect": true
}

{
  "level": "info",
  "msg": "CDP reconnection successful",
  "contextId": "cdp_1705135815123_abc123",
  "attempts": 2
}
```

## Преимущества CDP

### **Производительность**
- ✅ Использование уже запущенных браузеров
- ✅ Отсутствие накладных расходов на запуск
- ✅ Быстрое переключение между вкладками

### **Гибкость**
- ✅ Подключение к любому CDP-совместимому браузеру
- ✅ Работа с пользовательскими профилями
- ✅ Доступ к расширениям и настройкам

### **Отладка**
- ✅ Прямой доступ к DevTools
- ✅ Мониторинг консоли браузера
- ✅ Отслеживание сетевых запросов

### **Масштабируемость**
- ✅ Поддержка множественных браузеров
- ✅ Распределение нагрузки между портами
- ✅ Изоляция сессий

## Ограничения и рекомендации

### **Безопасность**
- CDP позволяет полный доступ к браузеру
- Используйте только в доверенных сетях
- Ограничьте доступ по IP если возможно

### **Стабильность**
- WebSocket соединения могут обрываться
- Включите автопереподключение
- Мониторьте состояние соединений

### **Производительность**
- CDP может быть медленнее Playwright для некоторых операций
- Используйте для случаев когда нужен доступ к существующему браузеру
- Playwright остается предпочтительным для автоматизации

## Примеры сценариев использования

### 1. **Интеграция с существующими тестами**
```bash
# Запустить браузер для тестирования
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/test-profile

# Подключиться из MCP сервера
# Система автоматически найдет и подключится к браузеру
```

### 2. **Мониторинг пользовательской активности**
```bash
# Пользователь работает в браузере
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/user-profile

# MCP сервер может мониторить и анализировать активность
```

### 3. **Автоматизация с пользовательскими настройками**
```bash
# Браузер с расширениями и настройками
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/home/user/.config/google-chrome \
  --profile-directory="Profile 1"
```

## Заключение

Поддержка CDP значительно расширяет возможности MCP браузерного сервера:

- ✅ **Гибкость**: подключение к любым CDP-совместимым браузерам
- ✅ **Производительность**: использование существующих браузеров
- ✅ **Интеграция**: работа с пользовательскими профилями и настройками
- ✅ **Мониторинг**: отслеживание реальной пользовательской активности
- ✅ **Отладка**: прямой доступ к DevTools и консоли

**Модель:** Claude Sonnet 4
