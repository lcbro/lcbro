# Поддержка удаленных CDP серверов

## Обзор

Реализована поддержка подключения к удаленным Chrome DevTools Protocol (CDP) серверам через HTTP/HTTPS API. Это позволяет получать список доступных браузеров и портов с удаленных серверов.

## 🔗 Основные возможности

### **Удаленные CDP серверы**
- Подключение к удаленным CDP серверам через HTTP/HTTPS
- Получение списка доступных браузеров и портов
- Поддержка SSL/TLS для безопасных подключений
- Аутентификация через API ключи

### **Гибкая конфигурация**
- Автоматический выбор между локальным и удаленным обнаружением
- Настройка SSL режимов
- Кастомные HTTP заголовки
- Таймауты и повторные попытки

### **Безопасность**
- Поддержка HTTPS для зашифрованных соединений
- API ключи для аутентификации
- Настраиваемые SSL режимы
- Валидация URL

## 📋 Конфигурация

### config/default.yaml

```yaml
browser:
  engine: cdp
  cdp:
    enabled: true
    host: "localhost"        # для локального обнаружения
    port: 9222              # для локального обнаружения
    
    # Конфигурация удаленного CDP сервера
    remote:
      enabled: true         # включить поддержку удаленных серверов
      url: "https://cdp.example.com:9222"  # URL удаленного сервера
      sslMode: "auto"       # режим SSL: auto, enabled, disabled, insecure
      apiKey: "your-api-key"  # API ключ для аутентификации (опционально)
      headers:              # дополнительные HTTP заголовки
        "X-Custom-Header": "value"
        "User-Agent": "MCP-Browser-Server/1.0"
    
    # Настройки обнаружения
    detection:
      enabled: true
      ports: [9222, 9223, 9224, 9225, 9226]  # для локального сканирования
      timeout: 5000
      useRemote: true       # использовать удаленный сервер вместо локального сканирования
```

## 🔧 SSL режимы

### **auto** (по умолчанию)
- Автоматически определяет SSL на основе URL
- HTTPS URL → включен SSL
- HTTP URL → отключен SSL

### **enabled**
- Принудительно включает SSL
- Все соединения должны быть зашифрованы

### **disabled**
- Принудительно отключает SSL
- Все соединения без шифрования

### **insecure**
- Отключает проверку SSL сертификатов
- Используется для самоподписанных сертификатов
- ⚠️ **Небезопасно** - только для разработки

## 🌐 Примеры использования

### 1. **Подключение к удаленному CDP серверу**

```yaml
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "https://cdp-server.company.com:9222"
      sslMode: "enabled"
      apiKey: "secret-api-key-123"
    detection:
      useRemote: true
```

### 2. **Самоподписанный сертификат (разработка)**

```yaml
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "https://localhost:9222"
      sslMode: "insecure"  # отключает проверку сертификатов
    detection:
      useRemote: true
```

### 3. **HTTP соединение (небезопасно)**

```yaml
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "http://internal-cdp-server:9222"
      sslMode: "disabled"
    detection:
      useRemote: true
```

### 4. **Кастомные заголовки**

```yaml
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "https://api.cdp-provider.com/v1"
      sslMode: "enabled"
      apiKey: "your-api-key"
      headers:
        "X-Client-ID": "mcp-browser-server"
        "X-Client-Version": "1.0.0"
        "Accept": "application/json"
    detection:
      useRemote: true
```

## 🔌 API удаленного CDP сервера

### **Ожидаемый формат ответа**

```json
{
  "browsers": [
    {
      "id": "browser_9222",
      "title": "Chrome Browser",
      "name": "Chrome Browser",
      "version": "Chrome/120.0.0.0",
      "userAgent": "Mozilla/5.0...",
      "url": "https://example.com",
      "webSocketUrl": "ws://localhost:9222/devtools/browser/...",
      "wsUrl": "ws://localhost:9222/devtools/browser/...",
      "description": "Chrome browser on port 9222"
    }
  ],
  "serverVersion": "1.0.0",
  "serverInfo": "Remote CDP Server v1.0.0"
}
```

### **Endpoints**

#### **GET /api/browsers**
Возвращает список всех доступных браузеров.

**Заголовки:**
```
Authorization: Bearer your-api-key
X-API-Key: your-api-key
Accept: application/json
```

**Ответ:**
```json
{
  "browsers": [...],
  "serverVersion": "1.0.0",
  "serverInfo": "Remote CDP Server"
}
```

#### **GET /api/browsers/{id}**
Возвращает детали конкретного браузера.

**Ответ:**
```json
{
  "id": "browser_9222",
  "title": "Chrome Browser",
  "webSocketUrl": "ws://localhost:9222/devtools/browser/...",
  ...
}
```

#### **GET /api/info**
Возвращает информацию о сервере.

**Ответ:**
```json
{
  "name": "Remote CDP Server",
  "version": "1.0.0",
  "capabilities": ["browser-detection", "websocket-proxy"],
  "uptime": 3600
}
```

#### **GET /api/health**
Проверка доступности сервера.

**Ответ:**
```json
{
  "status": "healthy",
  "timestamp": 1705135815123
}
```

## 💻 Программное использование

### **RemoteCDPClient**

```typescript
import { RemoteCDPClient } from './src/utils/remote-cdp-client.js';

// Создание клиента
const client = new RemoteCDPClient(logger, {
  url: 'https://cdp-server.example.com:9222',
  sslMode: 'enabled',
  apiKey: 'your-api-key',
  headers: {
    'X-Client-ID': 'mcp-browser-server'
  },
  timeout: 30000
});

// Получение списка браузеров
const response = await client.getAvailableBrowsers();
if (response.success) {
  console.log(`Found ${response.browsers.length} browsers`);
  response.browsers.forEach(browser => {
    console.log(`- ${browser.title}: ${browser.webSocketDebuggerUrl}`);
  });
}

// Проверка доступности сервера
const isAvailable = await client.isServerAvailable();
console.log(`Server available: ${isAvailable}`);

// Получение информации о сервере
const serverInfo = await client.getServerInfo();
if (serverInfo.success) {
  console.log(`Server: ${serverInfo.info.name} v${serverInfo.info.version}`);
}
```

### **Валидация URL**

```typescript
import { RemoteCDPClient } from './src/utils/remote-cdp-client.js';

// Валидация URL
const validation = RemoteCDPClient.validateURL('https://cdp.example.com:9222');
if (validation.valid) {
  console.log('URL is valid');
} else {
  console.error(`Invalid URL: ${validation.error}`);
}

// Парсинг URL
const parsed = RemoteCDPClient.parseRemoteURL('https://cdp.example.com:9222/api');
console.log(parsed);
// {
//   host: 'cdp.example.com',
//   port: 9222,
//   protocol: 'https:',
//   path: '/api'
// }
```

## 🔍 Логирование и отладка

### **Успешное подключение**
```json
{
  "level": "info",
  "msg": "Detecting browsers from remote CDP server",
  "url": "https://cdp.example.com:9222"
}

{
  "level": "info",
  "msg": "Retrieved browsers from remote CDP server",
  "count": 3,
  "browsers": [
    {"id": "browser_9222", "title": "Chrome Browser"},
    {"id": "browser_9223", "title": "Edge Browser"}
  ]
}
```

### **Ошибки подключения**
```json
{
  "level": "error",
  "msg": "Failed to fetch browsers from remote CDP server",
  "url": "https://cdp.example.com:9222",
  "error": "HTTP 401: Unauthorized"
}

{
  "level": "error",
  "msg": "Remote CDP browser detection failed",
  "error": "Network timeout after 30000ms"
}
```

### **SSL предупреждения**
```json
{
  "level": "warn",
  "msg": "SSL verification disabled - connections may not be secure",
  "sslMode": "insecure"
}
```

## 🛡️ Безопасность

### **Рекомендации**

1. **Используйте HTTPS** для продакшена
2. **API ключи** для аутентификации
3. **Валидируйте сертификаты** (не используйте `insecure`)
4. **Ограничьте доступ** по IP адресам
5. **Логируйте подключения** для аудита

### **Настройка SSL**

```yaml
# Продакшен (безопасно)
remote:
  url: "https://cdp.company.com:9222"
  sslMode: "enabled"
  apiKey: "secure-api-key"

# Разработка с самоподписанным сертификатом
remote:
  url: "https://localhost:9222"
  sslMode: "insecure"  # только для разработки!

# Внутренняя сеть
remote:
  url: "http://internal-cdp:9222"
  sslMode: "disabled"  # только в доверенной сети
```

## 🔧 Интеграция с существующей системой

### **Автоматическое переключение**

```yaml
browser:
  engine: cdp
  cdp:
    enabled: true
    # Локальное обнаружение как fallback
    host: "localhost"
    ports: [9222, 9223, 9224]
    
    # Удаленный сервер как основной
    remote:
      enabled: true
      url: "https://primary-cdp.example.com:9222"
      sslMode: "enabled"
    
    detection:
      useRemote: true  # сначала попробовать удаленный
      # Если удаленный недоступен, использовать локальное сканирование
```

### **Мониторинг состояния**

```typescript
// Проверка доступности удаленного сервера
const isRemoteAvailable = await remoteClient.isServerAvailable();
if (!isRemoteAvailable) {
  // Fallback на локальное обнаружение
  const localBrowsers = await detectLocalBrowsers();
  return localBrowsers;
}
```

## 📊 Примеры сценариев

### **1. Корпоративная среда**
```yaml
# Централизованный CDP сервер компании
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "https://cdp.company.com:9222"
      sslMode: "enabled"
      apiKey: "corporate-api-key"
      headers:
        "X-Department": "QA"
        "X-Environment": "staging"
    detection:
      useRemote: true
```

### **2. Облачная инфраструктура**
```yaml
# CDP сервер в облаке
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "https://cdp.aws.region.com:9222"
      sslMode: "enabled"
      apiKey: "${CDP_API_KEY}"  # из переменных окружения
    detection:
      useRemote: true
```

### **3. Локальная разработка**
```yaml
# Локальный CDP сервер для разработки
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "https://localhost:9222"
      sslMode: "insecure"  # самоподписанный сертификат
    detection:
      useRemote: true
```

## 🚀 Готово к использованию

Поддержка удаленных CDP серверов полностью реализована:

- ✅ **HTTP/HTTPS клиент** для удаленных серверов
- ✅ **SSL/TLS поддержка** с различными режимами
- ✅ **Аутентификация** через API ключи
- ✅ **Валидация URL** и обработка ошибок
- ✅ **Интеграция** с существующей системой CDP
- ✅ **Логирование** и отладка
- ✅ **Документация** и примеры

---

**Реализовано с помощью модели Claude Sonnet 4**
