# Logging Detalhado de LLM para Depuração e Estatísticas

## Visão Geral

Foi implementado um sistema abrangente de logging de todas as operações LLM com informações detalhadas sobre prompts, respostas, performance e economia de custos.

## Principais Funcionalidades

### 🔍 **Logging Detalhado de Solicitações**
- Todos os prompts enviados ao LLM
- Prompts do sistema e instruções do usuário
- Parâmetros do modelo (temperatura, máx tokens)
- Metadados da operação (tipo, ID, timestamps)

### 📊 **Logging de Respostas e Métricas**
- Respostas completas dos modelos LLM
- Estatísticas de uso de tokens
- Tempo de execução da operação
- Tratamento de erros com informações detalhadas

### 💰 **Análise de Economia de Custos**
- Cálculo de custo por modelos
- Economia do pré-processamento
- Comparação de tokens antes/depois
- Estatísticas por tipos de operação

### 📈 **Métricas de Performance**
- Rastreamento automático de estatísticas
- Análise por modelos (número de operações, tokens médios, tempo)
- Eficiência do pré-processamento (redução de dados, economia)
- Resumos periódicos de performance

## Configuração

### config/default.yaml

```yaml
logging:
  level: info
  
  # Logging detalhado de LLM
  llm:
    enabled: true                 # habilitar/desabilitar logging LLM
    logPrompts: true             # logar todos os prompts
    logResponses: true           # logar todas as respostas
    logTokens: true              # logar estatísticas de tokens
    logPerformance: true         # logar métricas de performance
    logPreprocessing: true       # logar análise de pré-processamento
    
    # Configurações de logging de dados
    maxPromptLength: 2000        # máx caracteres para prompts
    maxResponseLength: 1000      # máx caracteres para respostas
    maxInputDataLength: 5000     # máx caracteres para dados de entrada
    
    # Rastreamento de performance
    trackMetrics: true           # rastrear métricas
    metricsInterval: 100         # logar métricas a cada N operações
```

## Tipos de Operações Logadas

### 1. **Análise de Conteúdo (analysis)**
```json
{
  "level": "info",
  "msg": "Solicitação LLM [ANÁLISE]",
  "timestamp": "2025-01-13T10:30:15.123Z",
  "operationId": "op_1705135815123_1",
  "operationType": "analysis",
  "model": "ollama:qwen2.5:7b",
  "systemPrompt": "Você é um analisador de conteúdo especialista...",
  "userPrompt": "TAREFA PRINCIPAL: Extrair informações do produto...",
  "maxTokens": 300,
  "temperature": 0.1,
  "inputDataLength": 15420,
  "inputDataType": "html",
  "instruction": "Extrair informações do produto como JSON"
}
```

### 2. **Pré-processamento (preprocessing)**
```json
{
  "level": "info",
  "msg": "Solicitação LLM [PRÉ-PROCESSAMENTO]",
  "operationType": "preprocessing",
  "model": "ollama:qwen2.5:7b",
  "systemPrompt": "Você é um pré-processador de dados...",
  "userPrompt": "Solicitação de pré-processamento: Remover ruído HTML...",
  "preprocessRequest": "Remove HTML noise: scripts, styles, navigation, ads, footers. Focus on product/item information, remove marketing fluff. Keep only content relevant to the main task."
}
```

### 3. **Processamento Principal (main)**
```json
{
  "level": "info",
  "msg": "Solicitação LLM [PRINCIPAL]",
  "operationType": "main",
  "model": "gpt-4o-mini",
  "systemPrompt": "Você é um assistente útil...",
  "userPrompt": "Tarefa: Extrair informações do produto como JSON...",
  "instruction": "Extrair informações do produto como JSON",
  "preprocessRequest": "Remove HTML noise: scripts, styles, navigation, ads, footers..."
}
```

## Respostas e Métricas

### Respostas Bem-sucedidas
```json
{
  "level": "info",
  "msg": "Resposta LLM [PRÉ-PROCESSAMENTO]",
  "timestamp": "2025-01-13T10:30:18.456Z",
  "operationId": "op_1705135815123_2",
  "operationType": "preprocessing",
  "model": "ollama:qwen2.5:7b",
  "content": "Conteúdo HTML limpo sem navegação e anúncios...",
  "tokensUsed": {
    "prompt": 1250,
    "completion": 320,
    "total": 1570
  },
  "duration": 2847,
  "success": true
}
```

### Análise de Pré-processamento
```json
{
  "level": "info",
  "msg": "Análise e Resultados do Pré-processamento",
  "timestamp": "2025-01-13T10:30:18.500Z",
  "inputData": "<html><head><script>...</script></head><body>...",
  "instruction": "Extrair informações do produto como JSON",
  "analysisResponse": "Este HTML contém informações do produto com navegação e anúncios que devem ser removidos...",
  "generatedPreprocessRequest": "Remove HTML noise: scripts, styles, navigation, ads, footers. Focus on product/item information...",
  "originalLength": 15420,
  "processedLength": 3200,
  "reductionPercentage": "79.25",
  "analysisDuration": 1500,
  "preprocessingDuration": 2847,
  "totalDuration": 4347
}
```

### Análise de Economia de Custos
```json
{
  "level": "info",
  "msg": "Análise de Custo do Pré-processamento",
  "operationId": "op_1705135815123_2",
  "originalInput": "<html><head><script>...</script></head>...",
  "processedInput": "Produto: iPhone 15 Pro\nPreço: $999\nDescrição: Último modelo iPhone...",
  "preprocessRequest": "Remove HTML noise: scripts, styles, navigation, ads, footers...",
  "originalTokens": 3855,
  "processedTokens": 800,
  "tokenReduction": 3055,
  "tokenReductionPercentage": "79.25",
  "estimatedCostSaved": "0.0457"
}
```

## Métricas de Performance

### Resumos Periódicos
```json
{
  "level": "info",
  "msg": "Resumo de Métricas de Performance LLM",
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

### Resumo Final
```json
{
  "level": "info",
  "msg": "Resumo Final de Performance LLM",
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

## Tratamento de Erros

### Erros de Solicitação LLM
```json
{
  "level": "error",
  "msg": "Erro LLM [ANÁLISE]",
  "timestamp": "2025-01-13T10:30:15.123Z",
  "operationId": "op_1705135815123_1",
  "operationType": "analysis",
  "model": "ollama:qwen2.5:7b",
  "content": "",
  "duration": 5000,
  "success": false,
  "error": "Timeout de conexão com servidor Ollama"
}
```

## Análise de Logs

### Usando grep para Análise

```bash
# Todas as operações de pré-processamento
grep '"operationType": "preprocessing"' logs/app.log

# Todos os erros
grep '"success": false' logs/app.log

# Métricas de performance
grep 'Performance Metrics Summary' logs/app.log

# Análise de economia de custos
grep 'Preprocessing Cost Analysis' logs/app.log

# Estatísticas para modelo específico
grep '"model": "gpt-4o-mini"' logs/app.log
```

### Análise com jq

```bash
# Extrair todas as operações de pré-processamento
cat logs/app.log | jq 'select(.operationType == "preprocessing")'

# Estatísticas de tokens
cat logs/app.log | jq 'select(.tokensUsed) | .tokensUsed.total' | awk '{sum+=$1} END {print "Total tokens:", sum}'

# Duração média das operações
cat logs/app.log | jq 'select(.duration) | .duration' | awk '{sum+=$1; count++} END {print "Duração média:", sum/count, "ms"}'

# Análise de economia do pré-processamento
cat logs/app.log | jq 'select(.msg == "Preprocessing Cost Analysis") | .estimatedCostSaved' | awk '{sum+=$1} END {print "Custo total economizado: $", sum}'
```

## Monitoramento em Tempo Real

### Visualizando Logs em Tempo Real
```bash
# Seguir todas as operações LLM
tail -f logs/app.log | grep -E "(LLM Request|LLM Response|Performance Metrics)"

# Seguir apenas erros
tail -f logs/app.log | grep '"success": false'

# Seguir métricas de performance
tail -f logs/app.log | grep 'Performance Metrics Summary'
```

### Criando Dashboard com jq
```bash
# Dashboard simples no terminal
while true; do
  clear
  echo "=== Dashboard de Performance LLM ==="
  echo "Total de operações: $(grep 'LLM Request' logs/app.log | wc -l)"
  echo "Total de erros: $(grep '"success": false' logs/app.log | wc -l)"
  echo "Operações de pré-processamento: $(grep '"operationType": "preprocessing"' logs/app.log | wc -l)"
  echo "Tempo médio de resposta: $(grep 'LLM Response' logs/app.log | jq -r '.duration' | awk '{sum+=$1; count++} END {if(count>0) print sum/count "ms"; else print "N/A"}')"
  sleep 5
done
```

## Configuração de Nível de Logging

### Para Depuração (Máximo Detalhe)
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
    maxPromptLength: 5000      # mais dados para depuração
    maxResponseLength: 2000
    maxInputDataLength: 10000
    trackMetrics: true
    metricsInterval: 10        # logar métricas com mais frequência
```

### Para Produção (Logging Otimizado)
```yaml
logging:
  level: info
  llm:
    enabled: true
    logPrompts: false          # desabilitar prompts para economizar espaço
    logResponses: false        # desabilitar respostas
    logTokens: true           # manter tokens para monitoramento
    logPerformance: true      # manter métricas
    logPreprocessing: false   # desabilitar detalhes de pré-processamento
    trackMetrics: true
    metricsInterval: 1000     # logar métricas com menos frequência
```

### Para Análise de Performance
```yaml
logging:
  level: info
  llm:
    enabled: true
    logPrompts: false
    logResponses: false
    logTokens: true
    logPerformance: true
    logPreprocessing: true    # habilitar para análise de eficiência
    maxPromptLength: 500      # dados mínimos
    maxResponseLength: 200
    maxInputDataLength: 1000
    trackMetrics: true
    metricsInterval: 50       # métricas frequentes
```

## Automação de Análise

### Script de Relatório Diário
```bash
#!/bin/bash
# daily_llm_report.sh

LOG_FILE="logs/app-$(date +%Y-%m-%d).log"
REPORT_FILE="reports/llm-$(date +%Y-%m-%d).txt"

echo "=== Relatório de Performance LLM para $(date +%Y-%m-%d) ===" > $REPORT_FILE

# Estatísticas gerais
echo "Total de operações: $(grep 'LLM Request' $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "Total de erros: $(grep '"success": false' $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "Operações de pré-processamento: $(grep '"operationType": "preprocessing"' $LOG_FILE | wc -l)" >> $REPORT_FILE

# Análise de tokens
TOTAL_TOKENS=$(grep 'LLM Response' $LOG_FILE | jq -r 'select(.tokensUsed) | .tokensUsed.total' | awk '{sum+=$1} END {print sum}')
echo "Total de tokens usados: $TOTAL_TOKENS" >> $REPORT_FILE

# Análise de economia
COST_SAVED=$(grep 'Preprocessing Cost Analysis' $LOG_FILE | jq -r '.estimatedCostSaved' | awk '{sum+=$1} END {print sum}')
echo "Custo estimado economizado: \$${COST_SAVED}" >> $REPORT_FILE

# Duração média
AVG_DURATION=$(grep 'LLM Response' $LOG_FILE | jq -r '.duration' | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print "N/A"}')
echo "Tempo médio de resposta: ${AVG_DURATION}ms" >> $REPORT_FILE

echo "Relatório salvo em $REPORT_FILE"
```

## Conclusão

O sistema de logging detalhado de LLM fornece:

- ✅ **Transparência completa** de todas as operações LLM
- ✅ **Depuração detalhada** de prompts e respostas
- ✅ **Análise de performance** e otimização
- ✅ **Monitoramento de economia** do pré-processamento
- ✅ **Configuração flexível** para diferentes necessidades
- ✅ **Automação de análise** com ferramentas padrão

**Modelo:** Claude Sonnet 4
