<!-- b9cd2282-42a3-4efe-b9f8-0c83d66f4a28 d01900c7-89e7-4ad1-b671-6ca7b379991f -->
# Implementar Séries de Reuniões (Atas Contínuas)

## Visão Geral

Criar "Séries de Reuniões" como atas contínuas de projetos, agrupando reuniões recorrentes em um documento evolutivo que consolida resumos e pode ser compartilhado com clientes. Inclui análise LLM para acompanhar progressão e pontos críticos.

## 1. Estrutura de Dados

### 1.1 Criar tabela `series_reunioes`

**Arquivo**: `database/create_series_tables.sql`

Criar nova tabela com os campos:

- `id` (uuid, primary key)
- `nome` (text, obrigatório) - nome do projeto/cliente
- `descricao` (text, opcional) - contexto do projeto
- `empresa_id` (uuid, foreign key, opcional) - para agrupamento automático
- `produto_id` (uuid, foreign key, opcional) - para agrupamento automático
- `tipo_agrupamento` (text) - 'manual' ou 'auto_produto'
- `visivel_cliente` (boolean, default false) - controle de compartilhamento futuro
- `ultima_analise_llm` (text, nullable) - cache da última análise
- `ultima_analise_data` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

### 1.2 Adicionar campo em `reunioes`

Adicionar campo `serie_id` (uuid, foreign key nullable) na tabela `reunioes` para associar reuniões a séries.

## 2. Backend - Service Layer

### 2.1 Criar `seriesService.js`

**Arquivo**: `src/services/seriesService.js`

Funções principais:

- `listarSeries()` - buscar todas as séries com contagem de reuniões
- `criarSerie(dados)` - criar nova série (manual ou auto)
- `atualizarSerie(id, dados)` - editar série existente
- `excluirSerie(id)` - remover série
- `obterSerieComReunioes(id)` - buscar série com todas as reuniões ordenadas por data
- `associarReuniaoSerie(reuniaoId, serieId)` - vincular reunião a série
- `desassociarReuniaoSerie(reuniaoId)` - remover reunião de série
- `criarSeriesAutomaticas()` - gerar séries automáticas por empresa+produto
- `gerarAtaContinua(serieId)` - compilar documento consolidado da série

## 3. Frontend - Componente Principal

### 3.1 Criar `SeriesReunioes.jsx`

**Arquivo**: `src/components/SeriesReunioes.jsx`

Interface com layout de 2 colunas:

**A) Sidebar - Lista de Séries** (esquerda, ~30%)

- Card para cada série mostrando: 
  - Nome do projeto
  - Badge "Cliente" se visivel_cliente=true
  - Quantidade de reuniões
  - Data da última reunião
- Botões no topo:
  - "Nova Série Manual"
  - "Gerar Séries Automáticas" (por produto)
- Filtros: por empresa, por produto

**B) Visualização da Ata Contínua** (direita, ~70%)

- **Header da Série**:
  - Título grande estilo jornal
  - Metadados: empresa, produto, período, total de reuniões
  - Botões de ação:
    - "Editar Série"
    - "Excluir Série"
    - "Análise LLM"
    - "Compartilhar com Cliente" (toggle futuro)
    - "Exportar PDF" (futuro)

- **Timeline de Reuniões** (formato ata contínua):
  - Design tipo "edições de jornal" empilhadas
  - Cada reunião como uma "entrada de ata":
    ```
    ┌─────────────────────────────────────────────┐
    │ REUNIÃO #3 - 05/10/2024                     │
    │ Participantes: João, Maria, Cliente X        │
    ├─────────────────────────────────────────────┤
    │ Resumo Ultra-Conciso (sempre visível)       │
    │                                              │
    │ [+ Expandir para ver mais detalhes]         │
    │                                              │
    │ [Ver reunião completa →]                    │
    └─────────────────────────────────────────────┘
    ```

  - Ao expandir: mostra resumo_conciso e tarefas
  - Separadores visuais entre reuniões (linha forte)
  - Numeração sequencial automática

- **Seção de Análise LLM** (opcional, expansível):
  - Mostrar última análise salva (se houver)
  - Data da análise
  - Botão "Nova Análise"

### 3.2 Aplicar Design System de Documento Formal

Seguir `DESIGN_SYSTEM.md` com adaptações para ata:

- Preto, branco e cinzas
- Bordas de 2px
- Tipografia uppercase nos títulos tipo "ATA CONTÍNUA DO PROJETO X"
- Numeração de reuniões estilo formal
- Espaçamento generoso entre seções
- Visual de documento imprimível/compartilhável

## 4. Modal de Análise LLM

### 4.1 Criar `AnaliseSerieModal.jsx`

**Arquivo**: `src/components/AnaliseSerieModal.jsx`

Modal para análise LLM da série:

- **Seleção de Escopo**:
  - Checkbox para cada reunião (default: todas marcadas)
  - Botões rápidos: "Últimas 3", "Últimas 5", "Todas"

- **Tipo de Análise** (radio buttons):
  - "Progressão e Status Atual do Projeto"
  - "Identificar Pontos Críticos e Bloqueios"
  - "Listar Todas as Pendências Acumuladas"
  - "Análise Customizada" (textarea livre)

- **Opções Avançadas**:
  - Checkbox "Incluir transcrições completas" (com aviso: "⚠️ Aumenta custo significativamente")
  - Info de tokens estimados

- **Ações**:
  - Botão "Gerar Análise"
  - Preview do resultado
  - Botão "Salvar na Série" (guardar análise na tabela)

- **Exibição do Resultado**:
  - Área de texto com resultado formatado
  - Metadados: modelo usado, tokens, custo

## 5. Componente de Modal de Série

### 5.1 Criar `SerieModal.jsx`

**Arquivo**: `src/components/SerieModal.jsx`

Modal para criar/editar série:

- Campo nome (obrigatório) - sugestão: "Projeto X - Cliente Y"
- Campo descrição (opcional) - contexto do projeto
- Radio buttons: "Série Manual" ou "Auto por Produto"
- Se auto: selects de empresa e produto
- Se manual: multi-select de reuniões existentes (com preview)
- Toggle "Visível para cliente" (desabilitado por padrão)
- Botões salvar/cancelar

## 6. Integração com Reuniões Existentes

### 6.1 Atualizar `ReuniaoForm.jsx`

Adicionar select opcional "Série / Projeto" para associar reunião ao criar/editar.

### 6.2 Atualizar `ReuniaoDetalhes.jsx`

- Mostrar badge da série (se houver) tipo "📋 Série: Projeto X"
- Link "Ver Ata Completa da Série"
- Seção compacta "Contexto da Série":
  - Mini-timeline com 3 reuniões anteriores (resumos ultra-concisos)
  - Link para ver série completa

### 6.3 Atualizar `ReunioesLista.jsx`

- Adicionar coluna "Série/Projeto" na tabela
- Filtro por série no cabeçalho
- Ícone 📋 para reuniões que pertencem a séries

## 7. Análise LLM (preparação)

### 7.1 Criar `llmAnaliseService.js`

**Arquivo**: `src/services/llmAnaliseService.js`

Preparar estrutura para:

- `montarContextoSerie(reunioes, opcoes)` - compilar dados das reuniões
- `calcularTokensEstimados(contexto)` - estimar custo
- `analisarSerie(serieId, config)` - função principal (placeholder por agora)
- `salvarAnalise(serieId, resultado)` - persistir análise na série

Templates de prompt:

- Prompt para "progressão do projeto"
- Prompt para "pontos críticos"
- Prompt para "pendências"

**Nota**: API real fica para o futuro, por agora retornar mock/mensagem informativa.

## 8. Navegação e Rotas

### 8.1 Atualizar `App.jsx`

Adicionar:

- Link "Séries" no navbar (pode ser chamado "Atas/Séries" ou "Projetos")
- Rota `/series` → `<SeriesReunioes />`
- Rota `/series/:id` → `<SeriesReunioes />` (com série pré-selecionada)

## Arquivos que serão criados

1. `database/create_series_tables.sql` - schema do banco
2. `src/services/seriesService.js` - lógica de negócio
3. `src/services/llmAnaliseService.js` - preparação para análise
4. `src/components/SeriesReunioes.jsx` - página principal (ata contínua)
5. `src/components/SerieModal.jsx` - modal criar/editar série
6. `src/components/AnaliseSerieModal.jsx` - modal de análise LLM

## Arquivos que serão modificados

1. `src/App.jsx` - adicionar rota e link
2. `src/components/ReuniaoForm.jsx` - adicionar select de série
3. `src/components/ReuniaoDetalhes.jsx` - mostrar contexto da série
4. `src/components/ReunioesLista.jsx` - adicionar coluna e filtro por série

## Conceitos-Chave

- **Ata Contínua**: documento evolutivo que consolida todas as reuniões de um projeto
- **Compartilhável**: preparado para futura visualização por clientes (sem dados internos sensíveis)
- **Análise Contextual**: LLM pode ver o histórico completo para dar insights sobre progressão
- **Visual Formal**: design de documento profissional, não apenas lista técnica

### To-dos

- [ ] Criar schema do banco de dados para séries
- [ ] Implementar seriesService.js com funções CRUD
- [ ] Criar llmAnaliseService.js (estrutura preparatória)
- [ ] Criar componente SerieModal para criar/editar séries
- [ ] Criar página SeriesReunioes.jsx com visualização timeline
- [ ] Atualizar App.jsx com rota e navegação
- [ ] Adicionar select de série em ReuniaoForm
- [ ] Mostrar info de série em ReuniaoDetalhes
- [ ] Adicionar filtro por série em ReunioesLista