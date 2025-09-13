# LCBro - Barato Operações Remotas de Navegador Chrome

LCBro é um poderoso servidor MCP para automação de navegador com suporte tanto para Playwright quanto para Chrome DevTools Protocol (CDP). Ele fornece pré-processamento inteligente, logging abrangente e capacidades de gerenciamento de navegador remoto.

## Recursos

- **Automação de Navegador**: Controle navegadores reais com execução JavaScript, login, cliques, digitação
- **Extração de Conteúdo**: Extrair texto, HTML, tabelas, atributos e capturas de tela
- **Gerenciamento de Sessão**: Sessões persistentes de navegador com fluxos de autenticação
- **Integração LLM**: Transformar e limpar dados extraídos usando vários provedores LLM
- **Múltiplos Provedores**: Suporte para OpenAI, Anthropic, Ollama e JAN AI
- **Integração IDE**: Funciona com Claude Desktop e Cursor IDE

## Instalação

```bash
npm install
npm run build
npm run install:browsers
```

## Configuração

Crie um arquivo `config/default.yaml` ou defina a variável de ambiente `CONFIG_PATH`:

```yaml
browser:
  headless: true
  maxContexts: 8
  storageDir: /data/profiles
  defaultTimeoutMs: 30000

llm:
  defaultModel: "ollama:llama3.1"
  maxOutputTokens: 2000
  temperature: 0
  host: "localhost"
  port: 11434
  janPort: 1337
  autoPreprocess: true

security:
  allowDomains: ["example.com", "gov.br"]
  blockPrivateNetworks: true

limits:
  maxChars: 300000
  maxScreenshotBytes: 8000000
```

## Variáveis de Ambiente

### Para LLMs Locais (Recomendado)

#### Ollama (gratuito, sem chaves API necessárias)
```yaml
llm:
  defaultModel: "ollama:llama3.1"  # ou seu modelo
  host: "localhost"                # endereço do servidor Ollama
  port: 11434                     # porta Ollama
```

#### JAN AI (gratuito, com chave API opcional)
```yaml
llm:
  defaultModel: "jan:llama-3.1-8b"  # ou seu modelo no JAN
  host: "localhost"                 # endereço do servidor JAN
  janPort: 1337                    # porta JAN
```

Para JAN, também configure a variável de ambiente se necessário:
```bash
JAN_API_KEY=sua_chave_api_jan_aqui
```

### Para Provedores LLM Externos (Opcional)

Crie arquivo `.env` apenas se quiser usar APIs externas:

```bash
# Chave API JAN (apenas se JAN requer autenticação)
JAN_API_KEY=sua_chave_api_jan_aqui

# Chave API OpenAI (apenas se precisar de modelos GPT)
OPENAI_API_KEY=sk-sua_chave_api_openai_aqui

# Chave API Anthropic (apenas se precisar de modelos Claude)  
ANTHROPIC_API_KEY=sk-ant-sua_chave_api_anthropic_aqui

# Caminho do arquivo de configuração (opcional)
CONFIG_PATH=/caminho/para/config.yaml
```

### Como obter chaves API:

**OpenAI:**
1. Vá para https://platform.openai.com/api-keys
2. Crie uma nova chave API
3. Copie a chave no formato `sk-...`

**Anthropic:**
1. Vá para https://console.anthropic.com/
2. Navegue para a seção API Keys
3. Crie uma nova chave no formato `sk-ant-...`

**JAN AI:**
1. Baixe e instale o JAN de https://jan.ai/
2. Inicie o JAN e carregue um modelo
3. Se a chave API for necessária, configure-a nas Configurações do JAN

**Para Ollama e JAN (modelos locais):**
Chaves API geralmente não são necessárias, apenas configure `host`, `port` e `janPort` na configuração.

## Uso

### Início Rápido

1. **Instale dependências:**
```bash
npm install
npm run install:browsers
```

2. **Configure LLM (escolha uma opção):**

### Opção A - Ollama (recomendado, gratuito)
```bash
# Certifique-se de que o Ollama está rodando
ollama serve

# Verifique modelos disponíveis
ollama list

# Baixe modelo se necessário
ollama pull llama3.1
```

Configure em `config/default.yaml`:
```yaml
llm:
  defaultModel: "ollama:llama3.1"  # seu modelo de "ollama list"
  host: "localhost"                # ou IP do seu servidor
  port: 11434                     # porta Ollama
```

### Opção B - JAN AI (gratuito, interface gráfica)
```bash
# 1. Baixe JAN AI de https://jan.ai/
# 2. Inicie o JAN
# 3. Carregue modelo através da interface
# 4. Habilite API Server nas Configurações
```

Configure em `config/default.yaml`:
```yaml
llm:
  defaultModel: "jan:llama-3.1-8b"  # nome do modelo no JAN
  host: "localhost"                 # ou IP do servidor JAN
  janPort: 1337                    # porta do API Server JAN
```

Se JAN requer chave API, adicione ao `.env`:
```bash
echo "JAN_API_KEY=sua_chave_jan" > .env
```

### Opção C - APIs Externas (pago)
```bash
# Crie arquivo .env com chaves
cp env.example .env
nano .env  # adicione suas chaves API
```

3. **Compile o projeto:**
```bash
npm run build
```

4. **Inicie o servidor:**
```bash
npm start
```

### Configuração para Claude Desktop

1. **Encontre o arquivo de configuração do Claude Desktop:**
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. **Adicione configuração do servidor MCP:**

**Importante:** Substitua `/caminho/para/seu` pelo caminho absoluto real do seu projeto.

Para encontrar o caminho completo, execute na raiz do projeto:
```bash
pwd
# Exemplo de saída: /Users/username/projects/mcp_servers/lc-browser-mcp
```

### Exemplos de Configuração Claude Desktop:

**Para Ollama (sem chaves API):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node",
      "args": ["/caminho/para/seu/mcp_servers/lc-browser-mcp/dist/index.js"]
    }
  }
}
```

**Para JAN AI (com chave API):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node",
      "args": ["/caminho/para/seu/mcp_servers/lc-browser-mcp/dist/index.js"],
      "env": {
        "JAN_API_KEY": "sua_chave_api_jan_aqui"
      }
    }
  }
}
```

**Para APIs externas (OpenAI/Anthropic):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node", 
      "args": ["/caminho/para/seu/mcp_servers/lc-browser-mcp/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-sua_chave_openai_aqui",
        "ANTHROPIC_API_KEY": "sk-ant-sua_chave_anthropic_aqui"
      }
    }
  }
}
```

**Configuração combinada (todos os provedores):**
```json
{
  "mcpServers": {
    "lc-browser-mcp": {
      "command": "node",
      "args": ["/caminho/para/seu/mcp_servers/lc-browser-mcp/dist/index.js"],
      "env": {
        "JAN_API_KEY": "sua_chave_jan",
        "OPENAI_API_KEY": "sk-sua_chave_openai", 
        "ANTHROPIC_API_KEY": "sk-ant-sua_chave_anthropic"
      }
    }
  }
}
```

3. **Reinicie o Claude Desktop**

### Configuração para Cursor IDE

1. **Encontre o arquivo de configuração do Cursor:**
   - **macOS:** `~/Library/Application Support/Cursor/User/settings.json`
   - **Windows:** `%APPDATA%\Cursor\User\settings.json`
   - **Linux:** `~/.config/Cursor/User/settings.json`

   Ou use o arquivo pronto `cursor-mcp-config.json` do projeto.

2. **Encontre o caminho completo do projeto:**
```bash
pwd
# Exemplo: /Users/username/projects/mcp_servers/lc-browser-mcp
```

3. **Adicione servidor MCP ao settings.json (substitua caminhos pelos seus):**

**Para Ollama (sem chaves API):**
```json
{
  "mcp": {
    "servers": {
      "lc-browser-mcp": {
        "command": "node",
        "args": ["/caminho/para/seu/mcp_servers/lc-browser-mcp/dist/index.js"],
        "cwd": "/caminho/para/seu/mcp_servers/lc-browser-mcp"
      }
    }
  }
}
```

**Para JAN AI (com chave API):**
```json
{
  "mcp": {
    "servers": {
      "lc-browser-mcp": {
        "command": "node",
        "args": ["/caminho/para/seu/mcp_servers/lc-browser-mcp/dist/index.js"],
        "cwd": "/caminho/para/seu/mcp_servers/lc-browser-mcp",
        "env": {
          "JAN_API_KEY": "sua_chave_api_jan_aqui"
        }
      }
    }
  }
}
```

**Para APIs externas:**
```json
{
  "mcp": {
    "servers": {
      "lc-browser-mcp": {
        "command": "node",
        "args": ["/caminho/para/seu/mcp_servers/lc-browser-mcp/dist/index.js"],
        "cwd": "/caminho/para/seu/mcp_servers/lc-browser-mcp",
        "env": {
          "OPENAI_API_KEY": "sk-sua_chave_openai_aqui",
          "ANTHROPIC_API_KEY": "sk-ant-sua_chave_anthropic_aqui",
          "JAN_API_KEY": "sua_chave_jan"
        }
      }
    }
  }
}
```

4. **Reinicie o Cursor**

5. **Ative MCP no chat:**
   - Abra chat AI no Cursor (`Cmd/Ctrl + L`)
   - Use `@lc-browser-mcp` para acessar ferramentas de navegação

### Teste

Após a configuração, novas ferramentas aparecerão no Claude Desktop ou Cursor. Você pode testá-las:

**No Claude Desktop:**
```
Você pode abrir example.com e extrair o título da página?
```

**No Cursor IDE:**
```
@lc-browser-mcp abra example.com e extraia o título da página
```

A IA deve responder algo como:
> Claro! Vou abrir example.com e extrair o título da página.

E executar comandos navigate.open e extract.content.

### Ferramentas Disponíveis

1. **navigate.open** - Abrir URL e criar contexto de página
2. **navigate.goto** - Navegar para URL em contexto existente
3. **interact.click** - Clicar elementos por CSS/texto/papel
4. **interact.type** - Digitar texto em campos de entrada
5. **interact.wait** - Aguardar condições
6. **extract.content** - Extrair conteúdo da página (text/html/markdown)
7. **extract.table** - Extrair tabelas como JSON
8. **extract.attributes** - Extrair atributos de elementos
9. **extract.screenshot** - Tirar capturas de tela
10. **session.auth** - Realizar sequências de autenticação
11. **llm.transform** - Transformar dados usando LLM com instruções personalizadas, validação de esquema JSON e pré-processamento opcional

### Exemplo: Extrair Tabela de Website

```typescript
// 1. Abrir página
const openResult = await mcp.callTool('navigate.open', {
  url: 'https://example.com/data',
  persistSessionKey: 'my-session'
});

// 2. Aguardar carregamento da tabela
await mcp.callTool('interact.wait', {
  pageId: openResult.pageId,
  for: 'selector',
  selector: 'table.data'
});

// 3. Extrair tabela
const tableResult = await mcp.callTool('extract.table', {
  pageId: openResult.pageId,
  tableCss: 'table.data',
  headerStrategy: 'auto'
});

// 4. Transformar com LLM (com pré-processamento opcional)
const cleanResult = await mcp.callTool('llm.transform', {
  input: {
    kind: 'json',
    data: JSON.stringify(tableResult.tables[0])
  },
  instruction: 'Extrair apenas os campos mais importantes e padronizar o formato dos dados',
  model: 'gpt-4o-mini',
  preprocessRequest: 'Remover valores vazios ou nulos, normalizar campos de texto e garantir formatos de data consistentes'
});
```

### Pré-processamento Automático

**O que é?**

O pré-processamento automático é um sistema inteligente que analisa dados de entrada e os limpa automaticamente antes do processamento principal através do LLM. É um processo de duas etapas:

1. **Etapa de pré-processamento** (automática) — LLM local limpa e prepara dados
2. **Etapa de processamento principal** — LLM alvo processa dados já limpos

**Por que é necessário?**

🎯 **Economia de tokens e custos** — APIs caras (OpenAI, Anthropic) recebem dados já limpos  
📊 **Melhores resultados de qualidade** — LLM trabalha com dados limpos e estruturados  
⚡ **Automação** — não é necessário planejar manualmente a limpeza de dados  
🔧 **Adaptação inteligente** — sistema entende o que precisa ser limpo com base no tipo de dados e tarefa  

**Como funciona?**

```
Dados brutos → [LLM local limpa] → Dados limpos → [LLM alvo processa] → Resultado
     ↓                ↓                 ↓               ↓
HTML com anúncios  Remove navegação,   Apenas conteúdo  Extrai estrutura
e navegação        anúncios, scripts   do produto       JSON
```

O sistema determina automaticamente quando o pré-processamento é necessário:

**Automaticamente habilitado para:**
- Conteúdo HTML > 5000 caracteres
- Texto > 3000 caracteres  
- Arrays JSON > 10 elementos
- Objetos JSON > 20 campos
- Instruções com palavras-chave: "limpar", "extrair", "analisar", "padronizar", "normalizar"

**Exemplos de processamento automático:**

📄 **Conteúdo HTML** — sistema remove:
- Menus de navegação e barras laterais
- Blocos de anúncio e banners  
- Código JavaScript e estilos CSS
- Comentários e informações de serviço
- Foca no conteúdo principal do artigo/produto

📝 **Dados de texto** — sistema corrige:
- Erros de digitação e gramática
- Múltiplos espaços e quebras de linha
- Frases duplicadas
- Organização lógica de parágrafos

📊 **Dados JSON** — sistema padroniza:
- Remove valores nulos e vazios
- Padroniza nomes de campos para estilo unificado
- Converte datas para formato YYYY-MM-DD
- Normaliza valores numéricos e moedas
- Mescla registros duplicados

**Adaptação inteligente de tarefa:**

O sistema analisa sua instrução e adapta o pré-processamento:

- "extrair **tabela**" → preserva estruturas de tabela
- "encontrar **produtos**" → foca em cartões de produto  
- "obter **artigo**" → preserva texto principal do artigo
- "estruturar **dados**" → normaliza formatos

**Configurando pré-processamento automático:**

```yaml
# config/default.yaml
llm:
  autoPreprocess: true   # habilitar pré-processamento automático (padrão)
  autoPreprocess: false  # desabilitar pré-processamento automático
```

**Comparação: com e sem pré-processamento**

❌ **Sem pré-processamento:**
```
Dados de entrada: Página HTML (50KB) com anúncios, menus, scripts
                ↓
Resultado: LLM tenta encontrar produtos entre anúncios e navegação
          → Baixa qualidade, muitos erros, caro (muitos tokens)
```

✅ **Com pré-processamento automático:**
```
Dados de entrada: Página HTML (50KB) com anúncios, menus, scripts
                ↓
Pré-processamento: LLM local remove anúncios, mantém apenas produtos (5KB)
                ↓ 
Processamento principal: LLM alvo estrutura dados limpos de produto
                ↓
Resultado: Alta qualidade, rápido, econômico
```

**Exemplo de economia de custos:**
- Processamento de 50KB HTML através do GPT-4: ~$0.50
- Com pré-processamento: ~$0.05 (limpeza local) + ~$0.05 (GPT-4 para 5KB) = ~$0.10
- **Economia: 80%** + melhor qualidade de resultado!

### Instruções para Cursor IDE

**Solicitação simples (pré-processamento automático):**
```
@lc-browser-mcp extraia produtos desta página HTML e estruture em JSON
```

**Com pré-processamento explícito:**
```
@lc-browser-mcp use llm.transform com:
- input: HTML extraído
- instruction: "criar catálogo de produtos em JSON"
- preprocessRequest: "remover menus, anúncios, manter apenas cartões de produto"
- model: "ollama:llama3.1"
```

**Para extração e limpeza de tabela:**
```
@lc-browser-mcp:
1. Abra página de dados
2. Extraia tabela
3. Use llm.transform para limpeza com preprocessRequest: "remover linhas vazias, padronizar datas para YYYY-MM-DD"
```

### Exemplos de Uso de Pré-processamento

**Limpeza de HTML antes da análise:**
```typescript
const result = await mcp.callTool('llm.transform', {
  input: {
    kind: 'html',
    data: extractedHTML
  },
  instruction: 'Extrair informações do produto como JSON',
  model: 'ollama:llama3.1',
  preprocessRequest: 'Remover todas as tags HTML, menus de navegação, anúncios e manter apenas o conteúdo principal do produto'
});
```

**Normalização de texto antes da estruturação:**
```typescript
const result = await mcp.callTool('llm.transform', {
  input: {
    kind: 'text',
    data: messyText
  },
  instruction: 'Criar um resumo estruturado do artigo',
  model: 'jan:llama-3.1-8b',
  preprocessRequest: 'Corrigir erros de digitação, normalizar espaços em branco, remover frases duplicadas e organizar parágrafos logicamente'
});
```

**Limpeza de dados de tabela:**
```typescript
const result = await mcp.callTool('llm.transform', {
  input: {
    kind: 'json',
    data: JSON.stringify(tableData)
  },
  instruction: 'Converter para formato padronizado com nomes de campos específicos',
  model: 'gpt-4o-mini',
  preprocessRequest: 'Remover linhas vazias, mesclar entradas duplicadas, padronizar formatos de data (YYYY-MM-DD) e normalizar valores de moeda'
});
```

### Cenários Práticos para Cursor

**Cenário 1: Análise de produtos de e-commerce**
```
@lc-browser-mcp abra https://loja.exemplo.com/catalogo
Extraia informações do produto e limpe dados através de pré-processamento para remover blocos de anúncio
```

**Cenário 2: Análise de notícias**
```
@lc-browser-mcp:
1. Abra site de notícias
2. Extraia artigos com limpeza automática de anúncios e navegação
3. Estruture em JSON com campos: título, data, resumo
```

**Cenário 3: Processamento de documentos legais**
```
@lc-browser-mcp extraia tabela de processos do portal judicial
Use pré-processamento automático para padronizar datas e números de casos
```

## Desenvolvimento

```bash
npm run dev          # Iniciar em modo de desenvolvimento
npm run dev:watch    # Iniciar com recarga automática
npm test             # Executar testes
```

## Códigos de Erro

- `nav_timeout` - Timeout de navegação
- `selector_not_found` - Elemento não encontrado
- `captcha_required` - CAPTCHA detectado
- `dom_too_large` - Conteúdo excede limites de tamanho
- `llm_failed` - Erro de processamento LLM
- `page_not_found` - ID de página inválido
- `internal_error` - Erro geral do servidor

## Idiomas da Documentação

Este projeto suporta múltiplos idiomas:

- **English**: [README.md](README.md)
- **Русский**: [README.ru.md](README.ru.md) 
- **Português** (atual): [README.pt.md](README.pt.md)
- **Navegação de idiomas**: [README.languages.md](README.languages.md)

### Arquivos de Configuração por Idioma

**English (padrão):**
- `example-mcp-config.json` - configuração Claude Desktop
- `cursor-mcp-config.json` - configuração Cursor IDE  
- `env.example` - modelo de variáveis de ambiente

**Português:**
- `example-mcp-config.pt.json` - Configuração Claude Desktop
- `cursor-mcp-config.pt.json` - Configuração Cursor IDE
- `env.pt.example` - Modelo de variáveis de ambiente

## Contribuindo

Damos as boas-vindas às contribuições para o Low Cost Browsing MCP Server! Veja como você pode ajudar:

### 🚀 Como Contribuir

1. **Faça um Fork do Repositório**
   ```bash
   # Clique no botão "Fork" no GitHub ou use GitHub CLI
   gh repo fork nightweb/lc-browser-mcp
   ```

2. **Clone seu Fork**
   ```bash
   git clone https://github.com/SEU_USUARIO/lc-browser-mcp.git
   cd lc-browser-mcp
   ```

3. **Crie uma Branch para Feature**
   ```bash
   git checkout -b feature/nome-da-sua-feature
   # ou
   git checkout -b fix/correção-do-bug
   ```

4. **Faça suas Alterações**
   - Escreva código limpo e bem documentado
   - Siga o estilo de código existente
   - Adicione testes para novas funcionalidades
   - Atualize a documentação conforme necessário

5. **Teste suas Alterações**
   ```bash
   # Execute testes locais
   npm test
   npm run build
   
   # Execute testes Docker
   make test-unit
   make test-e2e
   ```

6. **Faça Commit das suas Alterações**
   ```bash
   git add .
   git commit -m "feat: adicionar descrição da sua feature"
   # ou
   git commit -m "fix: descrever a correção do bug"
   ```

7. **Envie para seu Fork**
   ```bash
   git push origin feature/nome-da-sua-feature
   ```

8. **Crie um Pull Request**
   - Vá para o repositório original no GitHub
   - Clique em "New Pull Request"
   - Selecione seu fork e branch
   - Preencha o template do PR com:
     - Descrição clara das alterações
     - Link para issues relacionadas
     - Screenshots se aplicável
     - Instruções de teste

### 📋 Diretrizes do Pull Request

**Antes de enviar:**
- ✅ O código compila sem erros (`npm run build`)
- ✅ Todos os testes passam (`npm test`)
- ✅ Testes Docker funcionam (`make test-unit`)
- ✅ Código segue as convenções do projeto
- ✅ Documentação está atualizada
- ✅ Mensagens de commit são descritivas

**Requisitos do PR:**
- Título claro e descritivo
- Descrição detalhada das alterações
- Referência a issues relacionadas (`Fixes #123`)
- Adicione revisores se souber quem deve revisar
- Use labels: `bug`, `feature`, `documentation`, etc.

**Processo de Revisão:**
1. Testes automatizados executam via GitHub Actions
2. Revisão de código pelos mantenedores
3. Abordar alterações solicitadas
4. Aprovação final e merge

### 🐛 Reportando Issues

Encontrou um bug? Crie uma issue com:
- **Título claro** descrevendo o problema
- **Passos para reproduzir** a issue
- **Comportamento esperado** vs comportamento real
- **Detalhes do ambiente** (OS, versão Node.js, etc.)
- **Screenshots** se aplicável
- **Logs de erro** se disponíveis

### 💡 Solicitações de Features

Tem uma ideia? Crie uma issue com:
- **Descrição clara** da feature
- **Caso de uso** - por que isso é necessário?
- **Solução proposta** se você tiver uma
- **Soluções alternativas** que você considerou

### 🏗️ Configuração de Desenvolvimento

1. **Pré-requisitos**
   ```bash
   node --version  # >= 18
   npm --version   # >= 8
   docker --version # para testes
   ```

2. **Instalar Dependências**
   ```bash
   npm install
   npm run install:browsers
   ```

3. **Configuração do Ambiente**
   ```bash
   cp env.example .env
   # Edite .env com suas configurações
   ```

4. **Executar Servidor de Desenvolvimento**
   ```bash
   npm run dev
   ```

### 🧪 Testes

```bash
# Testes unitários
npm test
npm run test:watch
npm run test:coverage

# Testes E2E  
npm run test:e2e
npm run test:e2e:ui

# Testes Docker
make test-unit
make test-e2e
make test-all

# Testes CI
./scripts/ci-test.sh
```

### 📖 Documentação

Ajude a melhorar nossa documentação:
- Corrija erros de digitação e gramática
- Adicione exemplos em falta
- Melhore a documentação da API
- Traduza para outros idiomas
- Adicione tutoriais e guias

### 🤝 Código de Conduta

- Seja respeitoso e inclusivo
- Ajude outros a aprender e crescer
- Foque em feedback construtivo
- Siga as diretrizes da comunidade GitHub

### 📞 Obtendo Ajuda

- 📖 **Documentação**: Verifique a documentação existente primeiro
- 🐛 **Issues**: Procure em issues existentes
- 💬 **Discussões**: Use GitHub Discussions para perguntas
- 📧 **Contato**: Entre em contato com os mantenedores

Obrigado por contribuir com o Low Cost Browsing MCP Server! 🎉

## Licença

MIT
