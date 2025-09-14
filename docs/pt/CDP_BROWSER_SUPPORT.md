# Suporte ao Chrome DevTools Protocol (CDP)

## Visão Geral

Foi implementado suporte completo para conexão com navegadores externos através do Chrome DevTools Protocol. Isso permite usar navegadores já em execução em vez de criar novas instâncias do Playwright.

## Principais Funcionalidades

### 🔗 **Conexão com Navegadores Externos**
- Detecção automática de navegadores em execução com CDP
- Conexão com Chrome, Edge, Chromium
- Suporte a múltiplos navegadores e abas

### 🔍 **Detecção Automática**
- Escaneamento de portas para navegadores CDP
- Detecção de navegadores em portas diferentes (9222-9226)
- Validação de endpoints CDP

### 🔄 **Gerenciamento de Conexões**
- Conexões WebSocket para CDP
- Reconexão automática em caso de perda de conexão
- Keep-alive para conexões estáveis

### 🎯 **Funcionalidade Completa**
- Navegação por URL
- Execução de JavaScript
- Criação de capturas de tela
- Extração de conteúdo de páginas

## Configuração

### config/default.yaml

```yaml
browser:
  engine: cdp                # usar CDP em vez de playwright
  headless: false            # geralmente false para CDP
  
  # Configurações do Chrome DevTools Protocol
  cdp:
    enabled: true            # habilitar suporte CDP
    host: "localhost"        # host do servidor CDP
    port: 9222              # porta CDP (porta padrão de debug do Chrome)
    autoDetect: true        # detecção automática de navegadores
    maxRetries: 3           # tentativas de conexão
    retryDelay: 1000        # atraso entre tentativas (ms)
    
    # Configurações de detecção de navegadores
    detection:
      enabled: true         # habilitar detecção
      ports: [9222, 9223, 9224, 9225, 9226]  # portas para escanear
      timeout: 5000         # timeout de detecção por porta
      
    # Configurações de inicialização do navegador
    launch:
      autoLaunch: false     # auto-inicializar navegador se não encontrado
      browserPath: null     # caminho do navegador (null = busca automática)
      userDataDir: null     # diretório de dados do usuário
      additionalArgs: []    # argumentos adicionais do navegador
      
    # Configurações de conexão
    connection:
      timeout: 30000        # timeout de conexão
      keepAlive: true       # manter conexão
      reconnect: true       # reconectar automaticamente em caso de desconexão
      maxReconnects: 5      # máximo de tentativas de reconexão
```

## Iniciando Navegador com CDP

### Chrome/Chromium
```bash
# Iniciar Chrome com CDP habilitado
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Ou Chromium
chromium --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Com opções adicionais
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  --disable-web-security \
  --disable-features=VizDisplayCompositor
```

### Microsoft Edge
```bash
# Iniciar Edge com CDP
msedge --remote-debugging-port=9222 --user-data-dir=/tmp/edge-debug
```

### Portas Alternativas
```bash
# Usando portas diferentes para múltiplos navegadores
google-chrome --remote-debugging-port=9223 --user-data-dir=/tmp/chrome-debug-2
google-chrome --remote-debugging-port=9224 --user-data-dir=/tmp/chrome-debug-3
```

## Exemplos de Uso

### 1. Detecção e Conexão Automática

```typescript
// Habilitar CDP na configuração
browser:
  engine: cdp
  cdp:
    enabled: true
    autoDetect: true
    detection:
      ports: [9222, 9223, 9224]

// O sistema encontrará e conectará automaticamente ao primeiro navegador disponível
```

### 2. Conexão com Navegador Específico

```typescript
// Especificar porta específica
browser:
  engine: cdp
  cdp:
    enabled: true
    autoDetect: false
    host: "localhost"
    port: 9222
```

### 3. Múltiplos Navegadores

```bash
# Iniciar múltiplos navegadores em portas diferentes
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-1 &
google-chrome --remote-debugging-port=9223 --user-data-dir=/tmp/chrome-2 &
google-chrome --remote-debugging-port=9224 --user-data-dir=/tmp/chrome-3 &

# O sistema encontrará automaticamente todos os navegadores disponíveis
```

## API para Operações CDP

### Detecção de Navegadores

```typescript
import { CDPDetector } from './src/utils/cdp-detector.js';

const detector = new CDPDetector(logger);

// Detectar todos os navegadores
const result = await detector.detectBrowsers({
  host: 'localhost',
  ports: [9222, 9223, 9224, 9225, 9226],
  timeout: 5000
});

console.log(`Encontrados ${result.browsers.length} navegadores`);
result.browsers.forEach(browser => {
  console.log(`- ${browser.title} na porta ${browser.webSocketDebuggerUrl.split(':')[2]}`);
});
```

### Conexão com Navegador

```typescript
import { CDPBrowserManager } from './src/core/cdp-browser-manager.js';

const cdpManager = new CDPBrowserManager(logger, config);

// Conectar a navegador específico
const contextId = await cdpManager.connectToBrowser(browserInfo);

// Navegação
await cdpManager.navigateToUrl(contextId, 'https://example.com');

// Execução de JavaScript
const result = await cdpManager.executeScript(contextId, 'document.title');

// Criação de captura de tela
const screenshot = await cdpManager.takeScreenshot(contextId, { fullPage: true });

// Extração de conteúdo
const content = await cdpManager.getPageContent(contextId);
```

### Monitoramento de Navegadores

```typescript
// Monitorar novos navegadores
const stopMonitoring = await detector.monitorBrowsers(
  { host: 'localhost', ports: [9222, 9223, 9224], timeout: 5000 },
  (browsers) => {
    console.log(`Detectados ${browsers.length} navegadores`);
    browsers.forEach(browser => {
      console.log(`Novo navegador: ${browser.title}`);
    });
  },
  5000 // verificar a cada 5 segundos
);

// Parar monitoramento
stopMonitoring();
```

## Arquitetura do Sistema

### 1. **CDPDetector** (`src/utils/cdp-detector.ts`)
- Detecção de navegadores em portas
- Validação de endpoints CDP
- Monitoramento de novos navegadores
- Escaneamento de intervalos de portas

### 2. **CDPBrowserManager** (`src/core/cdp-browser-manager.ts`)
- Gerenciamento de conexões WebSocket
- Execução de comandos CDP
- Tratamento de eventos do navegador
- Reconexão automática

### 3. **BrowserManager** (atualizado)
- Suporte tanto para Playwright quanto CDP
- Seleção automática de engine
- Interface unificada para operações

## Comandos e Eventos CDP

### Comandos Principais
```typescript
// Navegação
{ method: 'Page.navigate', params: { url: 'https://example.com' } }

// Execução de JavaScript
{ method: 'Runtime.evaluate', params: { expression: 'document.title' } }

// Criação de captura de tela
{ method: 'Page.captureScreenshot', params: { format: 'png', fullPage: true } }

// Obter HTML
{ method: 'Runtime.evaluate', params: { expression: 'document.documentElement.outerHTML' } }
```

### Eventos
```typescript
// Carregamento de página
{ method: 'Page.loadEventFired' }

// Mensagens do console
{ method: 'Runtime.consoleAPICalled', params: { type: 'log', args: [...] } }

// Requisições de rede
{ method: 'Network.responseReceived', params: { response: { url: '...' } } }
```

## Depuração e Monitoramento

### Logging
```json
{
  "level": "info",
  "msg": "Navegador CDP encontrado",
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
  "msg": "Conexão CDP estabelecida",
  "contextId": "cdp_1705135815123_abc123",
  "browserId": "browser_9222"
}
```

### Monitoramento de Conexões
```json
{
  "level": "warn",
  "msg": "Conexão CDP fechada",
  "contextId": "cdp_1705135815123_abc123",
  "attemptingReconnect": true
}

{
  "level": "info",
  "msg": "Reconexão CDP bem-sucedida",
  "contextId": "cdp_1705135815123_abc123",
  "attempts": 2
}
```

## Vantagens do CDP

### **Performance**
- ✅ Usar navegadores já em execução
- ✅ Sem overhead de inicialização
- ✅ Troca rápida entre abas

### **Flexibilidade**
- ✅ Conectar a qualquer navegador compatível com CDP
- ✅ Trabalhar com perfis de usuário
- ✅ Acesso a extensões e configurações

### **Depuração**
- ✅ Acesso direto ao DevTools
- ✅ Monitoramento do console do navegador
- ✅ Rastreamento de requisições de rede

### **Escalabilidade**
- ✅ Suporte a múltiplos navegadores
- ✅ Distribuição de carga entre portas
- ✅ Isolamento de sessões

## Limitações e Recomendações

### **Segurança**
- CDP fornece acesso completo ao navegador
- Use apenas em redes confiáveis
- Restrinja acesso por IP se possível

### **Estabilidade**
- Conexões WebSocket podem se desconectar
- Habilite reconexão automática
- Monitore status da conexão

### **Performance**
- CDP pode ser mais lento que Playwright para algumas operações
- Use para casos que requerem acesso ao navegador existente
- Playwright permanece preferido para automação

## Exemplos de Cenários de Uso

### 1. **Integração com Testes Existentes**
```bash
# Iniciar navegador para testes
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/test-profile

# Conectar do servidor MCP
# O sistema encontrará e conectará automaticamente ao navegador
```

### 2. **Monitoramento de Atividade do Usuário**
```bash
# Usuário trabalhando no navegador
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/user-profile

# Servidor MCP pode monitorar e analisar atividade
```

### 3. **Automação com Configurações do Usuário**
```bash
# Navegador com extensões e configurações
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/home/user/.config/google-chrome \
  --profile-directory="Profile 1"
```

## Conclusão

O suporte CDP expande significativamente as capacidades do servidor MCP de navegador:

- ✅ **Flexibilidade**: conectar a qualquer navegador compatível com CDP
- ✅ **Performance**: usar navegadores existentes
- ✅ **Integração**: trabalhar com perfis e configurações do usuário
- ✅ **Monitoramento**: rastrear atividade real do usuário
- ✅ **Depuração**: acesso direto ao DevTools e console

**Modelo:** Claude Sonnet 4
