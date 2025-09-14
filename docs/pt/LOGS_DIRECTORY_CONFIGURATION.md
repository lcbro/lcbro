# Configuração de Diretório de Logs

## Visão Geral

Foi implementado um sistema estendido de gerenciamento de logs com a capacidade de especificar um diretório para armazenar logs, rotação de arquivos, compressão e categorização.

## 📁 Principais Funcionalidades

### **Gerenciamento de Diretório de Logs**
- Diretório configurável para armazenamento de logs
- Criação automática de diretório
- Rotação de logs por tamanho e tempo
- Compressão de logs antigos

### **Categorização de Logs**
- Arquivos separados para diferentes categorias
- Formatos de logging configuráveis
- Logging de console e arquivo
- Saída colorida no console

### **Gerenciamento de Arquivos**
- Rotação automática de logs
- Compressão de arquivos grandes
- Limpeza de arquivos antigos
- Monitoramento de uso de disco

## ⚙️ Configuração

### config/default.yaml

```yaml
logging:
  level: info
  directory: /data/logs           # diretório para armazenamento de logs
  maxFileSize: "100MB"           # tamanho máximo do arquivo de log
  maxFiles: 10                   # número máximo de arquivos de log
  compress: true                 # comprimir arquivos de log antigos
  rotation: "daily"              # rotação de logs: daily, weekly, monthly, size
  
  # Configuração de logging de arquivo
  files:
    enabled: true                # habilitar logging de arquivo
    format: "json"               # formato de log: json, pretty, text
    includeTimestamp: true       # incluir timestamp no nome do arquivo
    includeLevel: true           # incluir nível de log no nome do arquivo
    
  # Configuração de logging de console  
  console:
    enabled: true                # habilitar logging de console
    format: "pretty"             # formato de console: pretty, json, text
    colorize: true               # saída colorida no console
    
  # Categorias de logs
  categories:
    browser: true               # logs de operações do navegador
    llm: true                   # logs de operações LLM
    cdp: true                   # logs de conexões CDP
    network: true               # logs de requisições de rede
    errors: true                # logs de erros
    performance: true           # logs de métricas de performance
  
  # Logging detalhado de LLM
  llm:
    enabled: true                 # habilitar logging detalhado de LLM
    logPrompts: true             # logar todos os prompts enviados ao LLM
    logResponses: true           # logar todas as respostas LLM
    logTokens: true              # logar estatísticas de uso de tokens
    logPerformance: true         # logar métricas de tempo e performance
    logPreprocessing: true       # logar análise e resultados de pré-processamento
    
    # Configurações de logging de dados
    maxPromptLength: 2000        # máximo de caracteres para logging de prompts
    maxResponseLength: 1000      # máximo de caracteres para logging de respostas
    maxInputDataLength: 5000     # máximo de caracteres para logging de dados de entrada
    
    # Rastreamento de performance
    trackMetrics: true           # rastrear métricas de performance
    metricsInterval: 100         # logar métricas a cada N operações
```

## 📂 Estrutura do Diretório de Logs

### **Nomenclatura de Arquivos**
```
/data/logs/
├── application-2024-01-15.log          # Logs gerais da aplicação
├── browser-info-2024-01-15.log         # Logs do navegador (nível info)
├── browser-error-2024-01-15.log        # Logs do navegador (nível error)
├── llm-info-2024-01-15.log             # Logs LLM (nível info)
├── llm-error-2024-01-15.log            # Logs LLM (nível error)
├── cdp-info-2024-01-15.log             # Logs CDP (nível info)
├── network-info-2024-01-15.log         # Logs de rede (nível info)
├── performance-info-2024-01-15.log     # Logs de performance (nível info)
├── errors-error-2024-01-15.log         # Logs de erro (nível error)
├── application-2024-01-14.log.gz       # Arquivos antigos comprimidos
└── browser-2024-01-14.log.gz
```

### **Formato de Nome de Arquivo**
- `{category}-{level}-{timestamp}.log` - se nível e timestamp estão habilitados
- `{category}-{timestamp}.log` - se apenas timestamp está habilitado
- `{category}-{level}.log` - se apenas nível está habilitado
- `{category}.log` - formato básico

## 🔄 Rotação de Logs

### **Tipos de Rotação**

#### **daily** (diário)
```yaml
rotation: "daily"
```
- Novo arquivo a cada dia
- Arquivos antigos comprimidos e arquivados

#### **weekly** (semanal)
```yaml
rotation: "weekly"
```
- Novo arquivo a cada semana
- Adequado para aplicações de baixa atividade

#### **monthly** (mensal)
```yaml
rotation: "monthly"
```
- Novo arquivo a cada mês
- Para armazenamento de longo prazo

#### **size** (por tamanho)
```yaml
rotation: "size"
maxFileSize: "100MB"
```
- Rotação quando tamanho máximo é atingido
- Verificação a cada hora

### **Configurações de Rotação**
```yaml
logging:
  maxFileSize: "100MB"           # tamanho máximo do arquivo
  maxFiles: 10                   # número máximo de arquivos
  compress: true                 # comprimir arquivos antigos
  rotation: "daily"              # tipo de rotação
```

## 🎨 Formatos de Logging

### **Formato JSON** (recomendado para arquivos)
```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "msg": "Navegação do navegador concluída",
  "url": "https://example.com",
  "duration": 1250,
  "category": "browser"
}
```

### **Formato Pretty** (para console)
```
[2024-01-15 10:30:00] [INFO] Navegação do navegador concluída
    url: "https://example.com"
    duration: 1250ms
    category: "browser"
```

### **Formato Text** (simples)
```
2024-01-15T10:30:00.000Z [INFO] Navegação do navegador concluída
```

## 🛠️ Utilitários de Gerenciamento de Logs

### **logs-manager.sh**

#### **Listar Arquivos de Log**
```bash
./scripts/logs-manager.sh list
./scripts/logs-manager.sh list -d /custom/logs/dir
```

#### **Estatísticas de Logs**
```bash
./scripts/logs-manager.sh summary
```

#### **Limpar Logs Antigos**
```bash
./scripts/logs-manager.sh cleanup 7    # remover arquivos mais antigos que 7 dias
./scripts/logs-manager.sh cleanup 30   # remover arquivos mais antigos que 30 dias
```

#### **Comprimir Logs**
```bash
./scripts/logs-manager.sh compress
```

#### **Monitorar Logs**
```bash
# Visualizar entradas recentes
./scripts/logs-manager.sh tail browser

# Seguir logs em tempo real
./scripts/logs-manager.sh tail browser -f

# Visualizar com filtragem
./scripts/logs-manager.sh tail browser -g "error"
```

#### **Buscar em Logs**
```bash
./scripts/logs-manager.sh search "error"
./scripts/logs-manager.sh search "timeout" -g "browser"
```

#### **Exportar Logs**
```bash
# Exportar todos os logs
./scripts/logs-manager.sh export

# Exportar logs do navegador
./scripts/logs-manager.sh export browser -o browser-logs.tar.gz

# Exportar logs LLM
./scripts/logs-manager.sh export llm -o llm-logs.tar.gz
```

#### **Estatísticas de Uso de Disco**
```bash
./scripts/logs-manager.sh size
```

## 💻 Uso Programático

### **LogsManager**

```typescript
import { LogsManager } from './src/utils/logs-manager.js';
import { Config } from './src/utils/config.js';

const logsManager = new LogsManager(logger, config);

// Inicializar
await logsManager.initialize();

// Agendar rotação automática
logsManager.scheduleLogRotation();

// Obter informações dos arquivos de log
const logFiles = await logsManager.listLogFiles();
console.log(`Encontrados ${logFiles.length} arquivos de log`);

// Obter arquivos por categoria
const browserLogs = await logsManager.getLogFilesByCategory('browser');

// Obter arquivos por nível
const errorLogs = await logsManager.getLogFilesByLevel('error');

// Comprimir arquivo de log
await logsManager.compressLogFile('/data/logs/old-file.log');

// Limpar logs antigos
await logsManager.cleanupOldLogs(30); // remover arquivos mais antigos que 30 dias

// Obter estatísticas de uso de disco
const diskUsage = await logsManager.getLogsDiskUsage();
console.log(`Tamanho total: ${diskUsage.totalSize} bytes`);

// Obter resumo de logs
const summary = await logsManager.getLogsSummary();
console.log(summary);
```

### **Criar Logger Avançado**

```typescript
import { createAdvancedLogger } from './src/utils/logger.js';

// Criar logger com gerenciamento de arquivos
const { logger, logsManager } = await createAdvancedLogger(config);

// Logging com categoria
logger.info({ 
  category: 'browser', 
  url: 'https://example.com' 
}, 'Navegação do navegador iniciada');

// Rotação automática já configurada
```

## 📊 Monitoramento e Análise

### **Estatísticas de Uso**
```bash
# Estatísticas gerais
./scripts/logs-manager.sh summary

# Uso de disco
./scripts/logs-manager.sh size

# Lista de arquivos
./scripts/logs-manager.sh list
```

### **Análise de Logs**
```bash
# Buscar erros
./scripts/logs-manager.sh search "error" -g "level.*error"

# Análise de performance
./scripts/logs-manager.sh search "duration" -g "performance"

# Monitorar conexões CDP
./scripts/logs-manager.sh tail cdp -f
```

### **Exportar para Análise**
```bash
# Exportar todos os logs por período
./scripts/logs-manager.sh export

# Exportar logs por categoria específica
./scripts/logs-manager.sh export browser -o browser-analysis.tar.gz
```

## 🔧 Configuração para Diferentes Ambientes

### **Desenvolvimento**
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

### **Teste**
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

### **Produção**
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

## 🚨 Avisos e Recomendações

### **Segurança**
- Não logar dados sensíveis (senhas, tokens)
- Restringir acesso ao diretório de logs
- Limpar regularmente logs antigos

### **Performance**
- Usar logging assíncrono
- Configurar rotação para prevenir transbordamento do disco
- Comprimir arquivos antigos para economizar espaço

### **Monitoramento**
- Configurar alertas de erro
- Monitorar tamanho do diretório de logs
- Analisar regularmente logs para problemas

## 🎯 Exemplos de Uso

### **1. Configuração para Aplicação de Alta Carga**
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

### **2. Configuração para Depuração**
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

### **3. Configuração para Monitoramento**
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

## 🚀 Pronto para Uso

O sistema de gerenciamento de diretório de logs está totalmente implementado:

- ✅ **Diretório configurável** para armazenamento de logs
- ✅ **Rotação automática** por tamanho e tempo
- ✅ **Compressão de arquivos antigos** para economia de espaço
- ✅ **Categorização de logs** por tipos de operação
- ✅ **Utilitários de gerenciamento** para administração
- ✅ **Monitoramento de uso de disco**
- ✅ **Capacidades de exportação e análise**
- ✅ **Configuração flexível** para diferentes ambientes

---

**Implementado com modelo Claude Sonnet 4**
