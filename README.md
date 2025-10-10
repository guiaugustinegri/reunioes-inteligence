# Banco de Reuniões

Sistema profissional para gerenciar reuniões com resumos automáticos via LLM, agrupamento em séries/projetos e análise de progressão. Conectado ao Supabase com design inspirado em jornais clássicos.

## 🚀 Funcionalidades Principais

### 📋 Gestão de Reuniões
- **Lista de Reuniões**: Visualização completa com filtros por empresa/produto
- **Formulário Inteligente**: Criação/edição com seleção de participantes
- **Resumos Automáticos**: Geração via LLM (ultra-conciso, conciso, IA)
- **Transcrições Completas**: Armazenamento de conteúdo integral

### 🎯 Séries de Reuniões (Em Desenvolvimento)
- **Atas Contínuas**: Agrupamento de reuniões em projetos
- **Timeline Visual**: Visualização sequencial estilo jornal
- **Análise LLM**: Insights sobre progressão e pontos críticos
- **Compartilhamento**: Preparado para envio a clientes

### ⚙️ Gerenciamento de Dados
- **Empresas**: CRUD completo com relacionamentos
- **Produtos**: Vinculados a empresas com participantes
- **Participantes**: Gestão de pessoas e contatos
- **Custos LLM**: Controle de gastos por modelo e tokens

## 🛠️ Tecnologias

- **Frontend**: Vite + React + React Router
- **Backend**: Supabase (PostgreSQL)
- **LLM**: OpenAI GPT (resumos automáticos)
- **Design**: CSS puro com sistema de design próprio
- **Automação**: Make.com (blueprints para setup do banco)
- **Estilo**: Inspirado em jornais clássicos e Windows antigo

## Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acessar o aplicativo:**
   Abra o navegador em `http://localhost:5173`

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **empresas**: id, nome, created_at
- **produtos**: id, nome, empresa_id, created_at
- **participantes**: id, nome, email, created_at
- **reunioes**: id, titulo_original, data_reuniao, resumo_ultra_conciso, resumo_conciso, resumo_ia, tarefas_guilherme, transcricao_completa, empresa_id, produto_id, status, created_at, updated_at

### Tabelas de Relacionamento
- **reuniao_participantes**: reuniao_id, participante_id
- **produto_participantes**: produto_id, participante_id
- **empresa_participantes**: empresa_id, participante_id

### Tabelas LLM
- **llm_requests**: id, reuniao_id, request_numero, modelo, tokens_entrada, tokens_saida, created_at
- **llm_precos**: id, modelo, preco_entrada_por_milhao, preco_saida_por_milhao, created_at, updated_at

### Tabelas de Séries (Em Desenvolvimento)
- **series_reunioes**: id, nome, descricao, empresa_id, produto_id, tipo_agrupamento, visivel_cliente, ultima_analise_llm, ultima_analise_data, created_at, updated_at

## 🧭 Navegação

- **/** - Lista de reuniões
- **/reuniao/nova** - Criar nova reunião
- **/reuniao/:id** - Editar reunião existente
- **/reuniao/detalhes/:id** - Ver detalhes da reunião
- **/resumo-ia/:id** - Gerar resumo via IA
- **/custos-llm** - Controle de custos LLM
- **/gerenciar** - Gerenciar empresas, produtos e participantes
- **/series** - Séries de reuniões (em desenvolvimento)

## ✨ Características

- ✅ **Design System Próprio**: Estilo jornal/Windows antigo
- ✅ **Resumos Automáticos**: Via LLM (ultra-conciso, conciso, IA)
- ✅ **Controle de Custos**: Tracking de tokens e gastos LLM
- ✅ **Relacionamentos Complexos**: Empresas, produtos, participantes
- ✅ **Interface Responsiva**: Funciona em desktop e mobile
- ✅ **Validação Robusta**: Formulários com validação completa
- ✅ **Feedback Visual**: Mensagens de sucesso/erro claras
- ✅ **Filtros Dinâmicos**: Por empresa, produto, data
- ✅ **Automação**: Setup via Make.com blueprints

## 📁 Estrutura do Projeto

```
banco-reunioes/
├── src/
│   ├── components/          # Componentes React
│   ├── services/           # Lógica de negócio e API
│   └── config/             # Configurações
├── docs/                   # Documentação
│   ├── DESIGN_SYSTEM.md    # Sistema de design
│   ├── BACKLOG.md          # Funcionalidades planejadas
│   └── CONFIGURACAO_EMAIL.md
├── backups/                # Backups organizados
│   ├── 2025-10-10_pre-series/
│   ├── 2025-10-09_antigo/
│   └── blueprints-make/    # Blueprints Make.com
├── database/               # Scripts SQL
└── .cursorrules           # Regras para Cursor AI
```

## 🚀 Próximos Passos

### Em Desenvolvimento
- [ ] **Séries de Reuniões**: Atas contínuas de projetos
- [ ] **Análise LLM**: Insights sobre progressão
- [ ] **Compartilhamento**: Envio de atas para clientes

### Futuro
- [ ] Autenticação com Supabase Auth
- [ ] Busca avançada por texto
- [ ] Exportação para PDF/CSV
- [ ] Dashboard com estatísticas
- [ ] Upload de arquivos de áudio
- [ ] Integração com calendários
