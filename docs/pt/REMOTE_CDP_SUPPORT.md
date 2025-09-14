# Suporte a Servidores CDP Remotos

## Visão Geral

Foi implementado suporte para conexão com servidores Chrome DevTools Protocol (CDP) remotos via API HTTP/HTTPS. Isso permite obter uma lista de navegadores e portas disponíveis de servidores remotos.

## 🔗 Principais Funcionalidades

### **Servidores CDP Remotos**
- Conexão com servidores CDP remotos via HTTP/HTTPS
- Obter lista de navegadores e portas disponíveis
- Suporte SSL/TLS para conexões seguras
- Autenticação via chaves de API

### **Configuração Flexível**
- Seleção automática entre detecção local e remota
- Configuração de modo SSL
- Cabeçalhos HTTP personalizados
- Timeouts e tentativas

### **Segurança**
- Suporte HTTPS para conexões criptografadas
- Chaves de API para autenticação
- Modos SSL configuráveis
- Validação de URL

## 📋 Configuração

### config/default.yaml

```yaml
browser:
  engine: cdp
  cdp:
    enabled: true
    host: "localhost"        # para detecção local
    port: 9222              # para detecção local
    
    # Configuração do servidor CDP remoto
    remote:
      enabled: true         # habilitar suporte a servidor remoto
      url: "https://cdp.example.com:9222"  # URL do servidor remoto
      sslMode: "auto"       # modo SSL: auto, enabled, disabled, insecure
      apiKey: "your-api-key"  # chave de API para autenticação (opcional)
      headers:              # cabeçalhos HTTP adicionais
        "X-Custom-Header": "value"
        "User-Agent": "MCP-Browser-Server/1.0"
    
    # Configurações de detecção
    detection:
      enabled: true
      ports: [9222, 9223, 9224, 9225, 9226]  # para escaneamento local
      timeout: 5000
      useRemote: true       # usar servidor remoto em vez de escaneamento local
```

## 🔧 Modos SSL

### **auto** (padrão)
- Detecta automaticamente SSL baseado na URL
- URL HTTPS → SSL habilitado
- URL HTTP → SSL desabilitado

### **enabled**
- Força habilitação SSL
- Todas as conexões devem ser criptografadas

### **disabled**
- Força desabilitação SSL
- Todas as conexões sem criptografia

### **insecure**
- Desabilita verificação de certificados SSL
- Usado para certificados auto-assinados
- ⚠️ **Inseguro** - apenas para desenvolvimento

## 🌐 Exemplos de Uso

### 1. **Conexão com Servidor CDP Remoto**

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

### 2. **Certificado Auto-assinado (Desenvolvimento)**

```yaml
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "https://localhost:9222"
      sslMode: "insecure"  # desabilita verificação de certificados
    detection:
      useRemote: true
```

### 3. **Conexão HTTP (Inseguro)**

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

### 4. **Cabeçalhos Personalizados**

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

## 🔌 API do Servidor CDP Remoto

### **Formato de Resposta Esperado**

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
      "description": "Chrome browser na porta 9222"
    }
  ],
  "serverVersion": "1.0.0",
  "serverInfo": "Remote CDP Server v1.0.0"
}
```

### **Endpoints**

#### **GET /api/browsers**
Retorna lista de todos os navegadores disponíveis.

**Cabeçalhos:**
```
Authorization: Bearer your-api-key
X-API-Key: your-api-key
Accept: application/json
```

**Resposta:**
```json
{
  "browsers": [...],
  "serverVersion": "1.0.0",
  "serverInfo": "Remote CDP Server"
}
```

#### **GET /api/browsers/{id}**
Retorna detalhes de navegador específico.

**Resposta:**
```json
{
  "id": "browser_9222",
  "title": "Chrome Browser",
  "webSocketUrl": "ws://localhost:9222/devtools/browser/...",
  ...
}
```

#### **GET /api/info**
Retorna informações do servidor.

**Resposta:**
```json
{
  "name": "Remote CDP Server",
  "version": "1.0.0",
  "capabilities": ["browser-detection", "websocket-proxy"],
  "uptime": 3600
}
```

#### **GET /api/health**
Verificação de disponibilidade do servidor.

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": 1705135815123
}
```

## 💻 Uso Programático

### **RemoteCDPClient**

```typescript
import { RemoteCDPClient } from './src/utils/remote-cdp-client.js';

// Criar cliente
const client = new RemoteCDPClient(logger, {
  url: 'https://cdp-server.example.com:9222',
  sslMode: 'enabled',
  apiKey: 'your-api-key',
  headers: {
    'X-Client-ID': 'mcp-browser-server'
  },
  timeout: 30000
});

// Obter lista de navegadores
const response = await client.getAvailableBrowsers();
if (response.success) {
  console.log(`Encontrados ${response.browsers.length} navegadores`);
  response.browsers.forEach(browser => {
    console.log(`- ${browser.title}: ${browser.webSocketDebuggerUrl}`);
  });
}

// Verificar disponibilidade do servidor
const isAvailable = await client.isServerAvailable();
console.log(`Servidor disponível: ${isAvailable}`);

// Obter informações do servidor
const serverInfo = await client.getServerInfo();
if (serverInfo.success) {
  console.log(`Servidor: ${serverInfo.info.name} v${serverInfo.info.version}`);
}
```

### **Validação de URL**

```typescript
import { RemoteCDPClient } from './src/utils/remote-cdp-client.js';

// Validar URL
const validation = RemoteCDPClient.validateURL('https://cdp.example.com:9222');
if (validation.valid) {
  console.log('URL é válida');
} else {
  console.error(`URL inválida: ${validation.error}`);
}

// Analisar URL
const parsed = RemoteCDPClient.parseRemoteURL('https://cdp.example.com:9222/api');
console.log(parsed);
// {
//   host: 'cdp.example.com',
//   port: 9222,
//   protocol: 'https:',
//   path: '/api'
// }
```

## 🔍 Logging e Depuração

### **Conexão Bem-sucedida**
```json
{
  "level": "info",
  "msg": "Detectando navegadores do servidor CDP remoto",
  "url": "https://cdp.example.com:9222"
}

{
  "level": "info",
  "msg": "Navegadores recuperados do servidor CDP remoto",
  "count": 3,
  "browsers": [
    {"id": "browser_9222", "title": "Chrome Browser"},
    {"id": "browser_9223", "title": "Edge Browser"}
  ]
}
```

### **Erros de Conexão**
```json
{
  "level": "error",
  "msg": "Falha ao buscar navegadores do servidor CDP remoto",
  "url": "https://cdp.example.com:9222",
  "error": "HTTP 401: Unauthorized"
}

{
  "level": "error",
  "msg": "Detecção de navegador CDP remoto falhou",
  "error": "Timeout de rede após 30000ms"
}
```

### **Avisos SSL**
```json
{
  "level": "warn",
  "msg": "Verificação SSL desabilitada - conexões podem não ser seguras",
  "sslMode": "insecure"
}
```

## 🛡️ Segurança

### **Recomendações**

1. **Use HTTPS** para produção
2. **Chaves de API** para autenticação
3. **Valide certificados** (não use `insecure`)
4. **Restrinja acesso** por endereços IP
5. **Registre conexões** para auditoria

### **Configuração SSL**

```yaml
# Produção (seguro)
remote:
  url: "https://cdp.company.com:9222"
  sslMode: "enabled"
  apiKey: "secure-api-key"

# Desenvolvimento com certificado auto-assinado
remote:
  url: "https://localhost:9222"
  sslMode: "insecure"  # apenas para desenvolvimento!

# Rede interna
remote:
  url: "http://internal-cdp:9222"
  sslMode: "disabled"  # apenas em rede confiável
```

## 🔧 Integração com Sistema Existente

### **Mudança Automática**

```yaml
browser:
  engine: cdp
  cdp:
    enabled: true
    # Detecção local como fallback
    host: "localhost"
    ports: [9222, 9223, 9224]
    
    # Servidor remoto como primário
    remote:
      enabled: true
      url: "https://primary-cdp.example.com:9222"
      sslMode: "enabled"
    
    detection:
      useRemote: true  # tentar remoto primeiro
      # Se remoto indisponível, usar escaneamento local
```

### **Monitoramento de Status**

```typescript
// Verificar disponibilidade do servidor remoto
const isRemoteAvailable = await remoteClient.isServerAvailable();
if (!isRemoteAvailable) {
  // Fallback para detecção local
  const localBrowsers = await detectLocalBrowsers();
  return localBrowsers;
}
```

## 📊 Exemplos de Cenários de Uso

### **1. Ambiente Corporativo**
```yaml
# Servidor CDP centralizado da empresa
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

### **2. Infraestrutura em Nuvem**
```yaml
# Servidor CDP na nuvem
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "https://cdp.aws.region.com:9222"
      sslMode: "enabled"
      apiKey: "${CDP_API_KEY}"  # de variáveis de ambiente
    detection:
      useRemote: true
```

### **3. Desenvolvimento Local**
```yaml
# Servidor CDP local para desenvolvimento
browser:
  engine: cdp
  cdp:
    enabled: true
    remote:
      enabled: true
      url: "https://localhost:9222"
      sslMode: "insecure"  # certificado auto-assinado
    detection:
      useRemote: true
```

## 🚀 Pronto para Uso

O suporte a servidores CDP remotos está totalmente implementado:

- ✅ **Cliente HTTP/HTTPS** para servidores remotos
- ✅ **Suporte SSL/TLS** com vários modos
- ✅ **Autenticação** via chaves de API
- ✅ **Validação de URL** e tratamento de erros
- ✅ **Integração** com sistema CDP existente
- ✅ **Logging** e depuração
- ✅ **Documentação** e exemplos

---

**Implementado com modelo Claude Sonnet 4**
