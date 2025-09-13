<div align="center">
  <img src="assets/logo.svg" alt="LCBro Logo" width="200" height="150">
  
# LCBro - Недорогие Удаленные Операции Браузера Chrome

**Легковесные Chrome Browser Remote Operations - Крутой MCP сервер для автоматизации браузера**

[![npm version](https://img.shields.io/npm/v/lcbro.svg?style=flat-square)](https://www.npmjs.com/package/lcbro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org/)

[![CI/CD Pipeline](https://github.com/your-username/lcbro/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/lcbro/actions/workflows/ci.yml)
[![Docker Testing](https://github.com/your-username/lcbro/actions/workflows/docker.yml/badge.svg)](https://github.com/your-username/lcbro/actions/workflows/docker.yml)
[![Release](https://github.com/your-username/lcbro/actions/workflows/release.yml/badge.svg)](https://github.com/your-username/lcbro/actions/workflows/release.yml)
[![Nightly Tests](https://github.com/your-username/lcbro/actions/workflows/nightly.yml/badge.svg)](https://github.com/your-username/lcbro/actions/workflows/nightly.yml)

⚡ **Молниеносно быстро** • 🎯 **Без настройки** • 🚀 **Готов к продакшену**
</div>

LCBro - это мощный MCP сервер для автоматизации браузера с поддержкой как Playwright, так и Chrome DevTools Protocol (CDP). Он предоставляет интеллектуальную предобработку, всестороннее логирование и возможности управления удаленными браузерами.

## Возможности

- **Автоматизация браузера**: Управление реальными браузерами с выполнением JavaScript, входом в систему, кликами, вводом текста
- **Извлечение контента**: Извлечение текста, HTML, таблиц, атрибутов и скриншотов
- **Управление сессиями**: Постоянные сессии браузера с потоками аутентификации
- **Интеграция LLM**: Преобразование и очистка извлеченных данных с использованием различных LLM провайдеров
- **Множественные провайдеры**: Поддержка OpenAI, Anthropic, Ollama и JAN AI
- **Интеграция IDE**: Работает с Claude Desktop и Cursor IDE

## Установка

```bash
npm install
npm run build
npm run install:browsers
```

## Конфигурация

Создайте файл `config/default.yaml` или установите переменную окружения `CONFIG_PATH`:

```yaml
browser:
  headless: true
  maxContexts: 8
  storageDir: /data/profiles
  defaultTimeoutMs: 30000

llm:
  defaultModel: "gpt-4o-mini"
  maxOutputTokens: 2000
  temperature: 0
  host: "localhost"
  port: 11434

security:
  allowDomains: ["example.com", "gov.br"]
  blockPrivateNetworks: true

limits:
  maxChars: 300000
  maxScreenshotBytes: 8000000
```

## Переменные окружения

### Для локальных LLM (рекомендуется)

#### Ollama (бесплатно, без API ключей)
```yaml
llm:
  defaultModel: "ollama:llama3.1"  # или ваша модель
  host: "localhost"                # адрес сервера Ollama
  port: 11434                     # порт Ollama
```

#### JAN AI (бесплатно, с опциональным API ключом)
```yaml
llm:
  defaultModel: "jan:llama-3.1-8b"  # или ваша модель в JAN
  host: "localhost"                 # адрес сервера JAN
  janPort: 1337                    # порт JAN
```

Для JAN также настройте переменную окружения (если требуется):
```bash
JAN_API_KEY=your_jan_api_key_here
```

### Для внешних LLM провайдеров (опционально)

Создайте файл `.env` только если хотите использовать внешние API:

```bash
# JAN API Key (только если JAN требует аутентификацию)
JAN_API_KEY=your_jan_api_key_here

# OpenAI API Key (только если нужны модели GPT)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Anthropic API Key (только если нужны модели Claude)  
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here

# Путь к файлу конфигурации (опционально)
CONFIG_PATH=/path/to/config.yaml
```

### Как получить API ключи:

**OpenAI:**
1. Зайдите на https://platform.openai.com/api-keys
2. Создайте новый API ключ
3. Скопируйте ключ в формате `sk-...`

**Anthropic:**
1. Зайдите на https://console.anthropic.com/
2. Перейдите в раздел API Keys
3. Создайте новый ключ в формате `sk-ant-...`

**JAN AI:**
1. Скачайте и установите JAN с https://jan.ai/
2. Запустите JAN и загрузите модель
3. Если требуется API ключ, настройте его в JAN Settings

**Для Ollama и JAN (локальные модели):**
API ключи обычно не требуются, только настройте `host`, `port` и `janPort` в конфигурации.

## Использование

### Быстрый старт

1. **Установите зависимости:**
```bash
npm install
npm run install:browsers
```

2. **Настройте LLM (выберите один вариант):**

### Вариант A - Ollama (рекомендуется, бесплатно)
```bash
# Убедитесь что Ollama запущен
ollama serve

# Проверьте доступные модели
ollama list

# Если нужно, скачайте модель
ollama pull llama3.1
```

Настройте в `config/default.yaml`:
```yaml
llm:
  defaultModel: "ollama:llama3.1"  # ваша модель из "ollama list"
  host: "localhost"                # или IP вашего сервера
  port: 11434                     # порт Ollama
```

### Вариант B - JAN AI (бесплатно, графический интерфейс)
```bash
# 1. Скачайте JAN AI с https://jan.ai/
# 2. Запустите JAN
# 3. Загрузите модель через интерфейс
# 4. Включите API Server в Settings
```

Настройте в `config/default.yaml`:
```yaml
llm:
  defaultModel: "jan:llama-3.1-8b"  # имя модели в JAN
  host: "localhost"                 # или IP сервера JAN
  janPort: 1337                    # порт JAN API Server
```

Если JAN требует API ключ, добавьте в `.env`:
```bash
echo "JAN_API_KEY=your_jan_key" > .env
```

### Вариант C - Внешние API (платно)
```bash
# Создайте .env файл с ключами
cp env.example .env
nano .env  # добавьте ваши API ключи
```

3. **Соберите проект:**
```bash
npm run build
```

4. **Запустите сервер:**
```bash
npm start
```

### Настройка для Claude Desktop

1. **Найдите файл конфигурации Claude Desktop:**
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. **Добавьте конфигурацию MCP сервера:**

**Важно:** Замените `/path/to/your` на реальный абсолютный путь к вашему проекту.

Чтобы узнать полный путь, выполните в корне проекта:
```bash
pwd
# Пример вывода: /Users/username/projects/mcp_servers/lc-browser-mcp
```

### Примеры конфигураций Claude Desktop:

**Для Ollama (без API ключей):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node",
      "args": ["/path/to/your/mcp_servers/lc-browser-mcp/dist/index.js"]
    }
  }
}
```

**Для JAN AI (с API ключом):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node",
      "args": ["/path/to/your/mcp_servers/lc-browser-mcp/dist/index.js"],
      "env": {
        "JAN_API_KEY": "your_jan_api_key_here"
      }
    }
  }
}
```

**Для внешних API (OpenAI/Anthropic):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node", 
      "args": ["/path/to/your/mcp_servers/lc-browser-mcp/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your_openai_key_here",
        "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_key_here"
      }
    }
  }
}
```

**Комбинированный вариант (все провайдеры):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node",
      "args": ["/path/to/your/mcp_servers/lc-browser-mcp/dist/index.js"],
      "env": {
        "JAN_API_KEY": "your_jan_key",
        "OPENAI_API_KEY": "sk-your_openai_key", 
        "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_key"
      }
    }
  }
}
```

3. **Перезапустите Claude Desktop**

### Настройка для Cursor IDE

1. **Найдите файл конфигурации Cursor:**
   - **macOS:** `~/Library/Application Support/Cursor/User/settings.json`
   - **Windows:** `%APPDATA%\Cursor\User\settings.json`
   - **Linux:** `~/.config/Cursor/User/settings.json`

   Или используйте готовый файл `cursor-mcp-config.json` из проекта.

2. **Узнайте полный путь к проекту:**
```bash
pwd
# Пример: /Users/username/projects/mcp_servers/lc-browser-mcp
```

3. **Добавьте MCP сервер в settings.json (замените пути на свои):**

**Для Ollama (без API ключей):**
```json
{
  "mcp": {
    "servers": {
      "lc-browser-mcp": {
        "command": "node",
        "args": ["/path/to/your/mcp_servers/lc-browser-mcp/dist/index.js"],
        "cwd": "/path/to/your/mcp_servers/lc-browser-mcp"
      }
    }
  }
}
```

**Для JAN AI (с API ключом):**
```json
{
  "mcp": {
    "servers": {
      "lc-browser-mcp": {
        "command": "node",
        "args": ["/path/to/your/mcp_servers/lc-browser-mcp/dist/index.js"],
        "cwd": "/path/to/your/mcp_servers/lc-browser-mcp",
        "env": {
          "JAN_API_KEY": "your_jan_api_key_here"
        }
      }
    }
  }
}
```

**Для внешних API:**
```json
{
  "mcp": {
    "servers": {
      "lc-browser-mcp": {
        "command": "node",
        "args": ["/path/to/your/mcp_servers/lc-browser-mcp/dist/index.js"],
        "cwd": "/path/to/your/mcp_servers/lc-browser-mcp",
        "env": {
          "OPENAI_API_KEY": "sk-your_openai_key_here",
          "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_key_here",
          "JAN_API_KEY": "your_jan_key"
        }
      }
    }
  }
}
```

4. **Перезапустите Cursor**

5. **Активируйте MCP в чате:**
   - Откройте AI чат в Cursor (`Cmd/Ctrl + L`)
   - Используйте `@lc-browser-mcp` для обращения к инструментам браузинга

### Проверка работы

После настройки в Claude Desktop или Cursor появятся новые инструменты. Вы можете протестировать их:

**В Claude Desktop:**
```
Можешь открыть сайт example.com и извлечь заголовок страницы?
```

**В Cursor IDE:**
```
@lc-browser-mcp открой сайт example.com и извлеки заголовок страницы
```

AI должен ответить что-то вроде:
> Конечно! Я открою сайт example.com и извлеку заголовок страницы.

И выполнить команды navigate.open и extract.content.

### Доступные инструменты

1. **navigate.open** - Открыть URL и создать контекст страницы
2. **navigate.goto** - Перейти к URL в существующем контексте
3. **interact.click** - Кликнуть по элементам по CSS/тексту/роли
4. **interact.type** - Вводить текст в поля ввода
5. **interact.wait** - Ожидать условия
6. **extract.content** - Извлечь содержимое страницы (text/html/markdown)
7. **extract.table** - Извлечь таблицы как JSON
8. **extract.attributes** - Извлечь атрибуты элементов
9. **extract.screenshot** - Сделать скриншоты
10. **session.auth** - Выполнить последовательности аутентификации
11. **llm.transform** - Преобразовать данные с использованием LLM с пользовательскими инструкциями, валидацией JSON схемы и опциональной предварительной обработкой

### Пример: Извлечение таблицы с веб-сайта

```typescript
// 1. Открыть страницу
const openResult = await mcp.callTool('navigate.open', {
  url: 'https://example.com/data',
  persistSessionKey: 'my-session'
});

// 2. Дождаться загрузки таблицы
await mcp.callTool('interact.wait', {
  pageId: openResult.pageId,
  for: 'selector',
  selector: 'table.data'
});

// 3. Извлечь таблицу
const tableResult = await mcp.callTool('extract.table', {
  pageId: openResult.pageId,
  tableCss: 'table.data',
  headerStrategy: 'auto'
});

// 4. Преобразовать с помощью LLM (с опциональной предварительной обработкой)
const cleanResult = await mcp.callTool('llm.transform', {
  input: {
    kind: 'json',
    data: JSON.stringify(tableResult.tables[0])
  },
  instruction: 'Извлечь только самые важные поля и стандартизировать формат данных',
  model: 'gpt-4o-mini',
  preprocessRequest: 'Удалить любые пустые или null значения, нормализовать текстовые поля и обеспечить согласованные форматы дат'
});
```

### Автоматическая пред-обработка

**Что это такое?**

Автоматическая пред-обработка — это интеллектуальная система, которая анализирует входящие данные и автоматически очищает их перед основной обработкой через LLM. Это двухэтапный процесс:

1. **Этап пред-обработки** (автоматический) — локальная LLM очищает и подготавливает данные
2. **Этап основной обработки** — целевая LLM обрабатывает уже очищенные данные

**Зачем это нужно?**

🎯 **Экономия токенов и денег** — дорогие API (OpenAI, Anthropic) получают уже очищенные данные  
📊 **Лучшее качество результатов** — LLM работает с чистыми, структурированными данными  
⚡ **Автоматизация** — не нужно вручную планировать очистку данных  
🔧 **Умная адаптация** — система сама понимает, что нужно очистить в зависимости от типа данных и задачи  

**Как это работает?**

```
Сырые данные → [Локальная LLM очищает] → Чистые данные → [Целевая LLM обрабатывает] → Результат
     ↓                    ↓                      ↓                    ↓
HTML с рекламой    Удаляет навигацию,         Только контент    Извлекает структуру
и навигацией       рекламу, скрипты          товаров           в JSON формате
```

По умолчанию система автоматически определяет, когда нужна пред-обработка данных:

**Автоматически включается для:**
- HTML контента > 5000 символов
- Текста > 3000 символов  
- JSON массивов > 10 элементов
- JSON объектов > 20 полей
- Инструкций с ключевыми словами: "clean", "extract", "parse", "standardize", "normalize"

**Примеры автоматической обработки:**

📄 **HTML контент** — система удаляет:
- Навигационные меню и боковые панели
- Рекламные блоки и баннеры  
- JavaScript код и CSS стили
- Комментарии и служебную информацию
- Фокусируется на основном контенте статьи/товара

📝 **Текстовые данные** — система исправляет:
- Опечатки и грамматические ошибки
- Множественные пробелы и переносы строк
- Дублирующиеся предложения
- Нелогичное расположение абзацев

📊 **JSON данные** — система стандартизирует:
- Удаляет null и пустые значения
- Приводит имена полей к единому стилю
- Конвертирует даты в формат YYYY-MM-DD
- Нормализует числовые значения и валюты
- Объединяет дублирующиеся записи

**Умная адаптация под задачу:**

Система анализирует вашу инструкцию и адаптирует пред-обработку:

- "извлеки **таблицу**" → сохраняет табличные структуры
- "найди **товары**" → фокусируется на карточках товаров  
- "получи **статью**" → сохраняет основной текст статьи
- "структурируй **данные**" → нормализует форматы

**Настройка автоматической пред-обработки:**

```yaml
# config/default.yaml
llm:
  autoPreprocess: true   # включить автоматическую пред-обработку (по умолчанию)
  autoPreprocess: false  # отключить автоматическую пред-обработку
```

**Сравнение: с пред-обработкой и без**

❌ **Без пред-обработки:**
```
Входные данные: HTML страница (50KB) с рекламой, меню, скриптами
                ↓
Результат: LLM пытается найти товары среди рекламы и навигации
          → Низкое качество, много ошибок, дорого (много токенов)
```

✅ **С автоматической пред-обработкой:**
```
Входные данные: HTML страница (50KB) с рекламой, меню, скриптами
                ↓
Пред-обработка: Локальная LLM удаляет рекламу, оставляет только товары (5KB)
                ↓ 
Основная обработка: Целевая LLM структурирует чистые данные о товарах
                ↓
Результат: Высокое качество, быстро, экономично
```

**Экономия на примере:**
- Обработка 50KB HTML через GPT-4: ~$0.50
- С пред-обработкой: ~$0.05 (локальная очистка) + ~$0.05 (GPT-4 для 5KB) = ~$0.10
- **Экономия: 80%** + лучшее качество результата!

### Инструкции для Cursor IDE

**Простой запрос (автоматическая пред-обработка):**
```
@lc-browser-mcp извлеки товары из этой HTML страницы и структурируй в JSON
```

**С явной пред-обработкой:**
```
@lc-browser-mcp используй llm.transform с:
- input: извлеченный HTML
- instruction: "создать каталог товаров в JSON"
- preprocessRequest: "удалить меню, рекламу, оставить только карточки товаров"
- model: "ollama:llama3.1"
```

**Для извлечения и очистки таблиц:**
```
@lc-browser-mcp:
1. Открой страницу с данными
2. Извлеки таблицу
3. Используй llm.transform для очистки с preprocessRequest: "удалить пустые строки, стандартизировать даты в YYYY-MM-DD"
```

### Примеры использования пред-обработки

**Очистка HTML перед анализом:**
```typescript
const result = await mcp.callTool('llm.transform', {
  input: {
    kind: 'html',
    data: extractedHTML
  },
  instruction: 'Извлечь информацию о товарах в формате JSON',
  model: 'ollama:llama3.1',
  preprocessRequest: 'Удалить все HTML теги, навигационные меню, рекламу и оставить только основной контент товаров'
});
```

**Нормализация текста перед структурированием:**
```typescript
const result = await mcp.callTool('llm.transform', {
  input: {
    kind: 'text',
    data: messyText
  },
  instruction: 'Создать структурированное резюме статьи',
  model: 'jan:llama-3.1-8b',
  preprocessRequest: 'Исправить опечатки, нормализовать пробелы, удалить дублирующиеся предложения и логично организовать абзацы'
});
```

**Очистка данных таблицы:**
```typescript
const result = await mcp.callTool('llm.transform', {
  input: {
    kind: 'json',
    data: JSON.stringify(tableData)
  },
  instruction: 'Преобразовать в стандартизированный формат с конкретными именами полей',
  model: 'gpt-4o-mini',
  preprocessRequest: 'Удалить пустые строки, объединить дублирующиеся записи, стандартизировать форматы дат (YYYY-MM-DD) и нормализовать значения валют'
});
```

### Практические сценарии для Cursor

**Сценарий 1: Анализ товаров интернет-магазина**
```
@lc-browser-mcp открой https://shop.example.com/catalog
Извлеки информацию о товарах и очисти данные через пред-обработку для удаления рекламных блоков
```

**Сценарий 2: Парсинг новостей**
```
@lc-browser-mcp:
1. Открой новостной сайт
2. Извлеки статьи с автоматической очисткой от рекламы и навигации
3. Структурируй в JSON с полями: заголовок, дата, краткое содержание
```

**Сценарий 3: Обработка судебных документов**
```
@lc-browser-mcp извлеки таблицу процессов из судебного портала
Используй автоматическую пред-обработку для стандартизации дат и номеров дел
```

## 🔧 Статус CI/CD Пайплайна

**Автоматизированное тестирование и развёртывание** 🚀

| Пайплайн | Статус | Описание |
|----------|--------|----------|
| **CI/CD** | [![CI/CD Pipeline](https://github.com/your-username/lcbro/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/lcbro/actions/workflows/ci.yml) | Основной пайплайн сборки, тестирования и развёртывания |
| **Docker** | [![Docker Testing](https://github.com/your-username/lcbro/actions/workflows/docker.yml/badge.svg)](https://github.com/your-username/lcbro/actions/workflows/docker.yml) | Сборка контейнеров и мультиплатформенное тестирование |
| **Release** | [![Release](https://github.com/your-username/lcbro/actions/workflows/release.yml/badge.svg)](https://github.com/your-username/lcbro/actions/workflows/release.yml) | Автоматический релиз и публикация в npm |
| **Nightly** | [![Nightly Tests](https://github.com/your-username/lcbro/actions/workflows/nightly.yml/badge.svg)](https://github.com/your-username/lcbro/actions/workflows/nightly.yml) | Расширенные тесты и бенчмарки производительности |

### 📊 Метрики качества
- **Покрытие тестами**: >80% (Unit + E2E)
- **Время сборки**: ~3-5 минут  
- **Docker сборка**: Многоступенчатая с кэшированием слоёв
- **Безопасность**: CodeQL анализ + сканирование зависимостей

[📋 Просмотреть все workflow →](.github/WORKFLOWS.md) | [🚀 Просмотреть запуски пайплайна →](https://github.com/your-username/lcbro/actions)

## 🏆 Статус проекта

✅ **Готов к продакшену** - Все функции реализованы и протестированы  
✅ **npm пакет готов** - Можно установить глобально через npm  
✅ **CLI интерфейс** - Полный интерфейс командной строки  
✅ **Документация** - Исчерпывающая документация предоставлена  
✅ **Поддержка нескольких языков** - Английский, русский, португальский  
✅ **Без breaking changes** - Вся оригинальная функциональность сохранена  
✅ **Непрерывная интеграция** - Автоматизированное тестирование и развёртывание  
✅ **Поддержка Docker** - Многоступенчатые сборки и тестирование контейнеров  
✅ **Сканирование безопасности** - Автоматическое обнаружение уязвимостей

## Разработка

### Предварительные требования
```bash
npm install
npm run install:browsers
```

### Сборка и тестирование
```bash
# Собрать проект
npm run build

# Запустить тесты
npm test

# Запустить E2E тесты
npm run test:e2e

# Запустить CI пайплайн локально
make ci
```

### Режим разработки
```bash
npm run dev          # Запуск в режиме разработки
npm run dev:watch    # Запуск с автоперезагрузкой
npm test             # Запуск тестов
```

## Коды ошибок

- `nav_timeout` - Таймаут навигации
- `selector_not_found` - Элемент не найден
- `captcha_required` - Обнаружена CAPTCHA
- `dom_too_large` - Содержимое превышает лимиты размера
- `llm_failed` - Ошибка обработки LLM
- `page_not_found` - Неверный ID страницы
- `internal_error` - Общая ошибка сервера

## Языки документации

Этот проект поддерживает несколько языков:

- **English**: [README.md](README.md)
- **Русский** (текущий): [README.ru.md](README.ru.md) 
- **Português**: [README.pt.md](README.pt.md)
- **Навигация по языкам**: [README.languages.md](README.languages.md)

### Файлы конфигурации по языкам

**English (по умолчанию):**
- `example-mcp-config.json` - конфигурация Claude Desktop
- `cursor-mcp-config.json` - конфигурация Cursor IDE  
- `env.example` - шаблон переменных окружения

**Português:**
- `example-mcp-config.pt.json` - Configuração Claude Desktop
- `cursor-mcp-config.pt.json` - Configuração Cursor IDE
- `env.pt.example` - Modelo de variáveis de ambiente

## Участие в разработке

Мы приветствуем вклад в развитие Low Cost Browsing MCP Server! Вот как вы можете помочь:

### 🚀 Как внести свой вклад

1. **Сделайте Fork репозитория**
   ```bash
   # Нажмите кнопку "Fork" на GitHub или используйте GitHub CLI
   gh repo fork nightweb/lc-browser-mcp
   ```

2. **Клонируйте ваш Fork**
   ```bash
   git clone https://github.com/ВАШ_ЛОГИН/lc-browser-mcp.git
   cd lc-browser-mcp
   ```

3. **Создайте ветку для функциональности**
   ```bash
   git checkout -b feature/название-вашей-функции
   # или
   git checkout -b fix/исправление-бага
   ```

4. **Внесите изменения**
   - Пишите чистый, хорошо документированный код
   - Следуйте существующему стилю кода
   - Добавляйте тесты для новой функциональности
   - Обновляйте документацию при необходимости

5. **Протестируйте изменения**
   ```bash
   # Запустите локальные тесты
   npm test
   npm run build
   
   # Запустите Docker тесты
   make test-unit
   make test-e2e
   ```

6. **Зафиксируйте изменения**
   ```bash
   git add .
   git commit -m "feat: добавить описание вашей функции"
   # или
   git commit -m "fix: описать исправление бага"
   ```

7. **Отправьте в ваш Fork**
   ```bash
   git push origin feature/название-вашей-функции
   ```

8. **Создайте Pull Request**
   - Перейдите в оригинальный репозиторий на GitHub
   - Нажмите "New Pull Request"
   - Выберите ваш fork и ветку
   - Заполните шаблон PR с:
     - Четким описанием изменений
     - Ссылками на связанные issues
     - Скриншотами если применимо
     - Инструкциями по тестированию

### 📋 Требования к Pull Request

**Перед отправкой:**
- ✅ Код собирается без ошибок (`npm run build`)
- ✅ Все тесты проходят (`npm test`)
- ✅ Docker тесты работают (`make test-unit`)
- ✅ Код следует соглашениям проекта
- ✅ Документация обновлена
- ✅ Сообщения коммитов описательные

**Требования к PR:**
- Четкий, описательный заголовок
- Подробное описание изменений
- Ссылка на связанные issues (`Fixes #123`)
- Добавьте рецензентов если знаете кто должен проверить
- Используйте метки: `bug`, `feature`, `documentation`, и т.д.

**Процесс ревью:**
1. Автоматические тесты запускаются через GitHub Actions
2. Ревью кода мейнтейнерами
3. Исправление запрошенных изменений
4. Финальное одобрение и слияние

### 🐛 Сообщение об ошибках

Нашли баг? Создайте issue с:
- **Четким заголовком** описывающим проблему
- **Шагами воспроизведения** проблемы
- **Ожидаемым поведением** против фактического
- **Деталями окружения** (ОС, версия Node.js, и т.д.)
- **Скриншотами** если применимо
- **Логами ошибок** если доступны

### 💡 Предложения функций

Есть идея? Создайте issue с:
- **Четким описанием** функции
- **Случаем использования** - зачем это нужно?
- **Предлагаемым решением** если у вас есть идея
- **Альтернативными решениями** которые вы рассматривали

### 🏗️ Настройка разработки

1. **Предварительные требования**
   ```bash
   node --version  # >= 18
   npm --version   # >= 8
   docker --version # для тестирования
   ```

2. **Установка зависимостей**
   ```bash
   npm install
   npm run install:browsers
   ```

3. **Настройка окружения**
   ```bash
   cp env.example .env
   # Отредактируйте .env с вашими настройками
   ```

4. **Запуск сервера разработки**
   ```bash
   npm run dev
   ```

### 🧪 Тестирование

```bash
# Unit тесты
npm test
npm run test:watch
npm run test:coverage

# E2E тесты  
npm run test:e2e
npm run test:e2e:ui

# Docker тесты
make test-unit
make test-e2e
make test-all

# CI тесты
./scripts/ci-test.sh
```

### 📖 Документация

Помогите улучшить нашу документацию:
- Исправляйте опечатки и грамматику
- Добавляйте недостающие примеры
- Улучшайте API документацию
- Переводите на другие языки
- Добавляйте руководства и гайды

### 🤝 Кодекс поведения

- Будьте уважительны и инклюзивны
- Помогайте другим учиться и расти
- Фокусируйтесь на конструктивной обратной связи
- Следуйте рекомендациям сообщества GitHub

### 📞 Получение помощи

- 📖 **Документация**: Сначала проверьте существующие документы
- 🐛 **Issues**: Поищите в существующих issues
- 💬 **Обсуждения**: Используйте GitHub Discussions для вопросов
- 🔧 **CI/CD Workflows**: [Документация по workflow](.github/WORKFLOWS.md)
- 🚀 **Статус пайплайна**: [GitHub Actions](https://github.com/your-username/lcbro/actions)
- 🛡️ **Отчёты безопасности**: [Вкладка безопасности](https://github.com/your-username/lcbro/security)
- 📧 **Контакт**: Обращайтесь к мейнтейнерам

Спасибо за вклад в Low Cost Browsing MCP Server! 🎉

## Лицензия

MIT
