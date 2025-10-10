# 📋 Backlog - Banco de Reuniões

## 🔴 Alta Prioridade

### Banco de Dados

#### 1. Dicionário de Pessoas
- [ ] Criar tabela `dicionario_pessoas` para mapear nomes/apelidos
- [ ] Adicionar campos: `nome_original`, `nome_padronizado`, `apelidos` (array)
- [ ] Implementar lógica de normalização de nomes antes do resumo IA
- [ ] Integrar no fluxo de processamento de transcrições
- [ ] Interface para gerenciar o dicionário (adicionar/editar/excluir entradas)

**Benefício:** Consistência nos nomes das pessoas mencionadas nos resumos

#### 2. Sistema de Fallback
- [ ] Definir estratégias de fallback para falhas de processamento
- [ ] Implementar retry automático com backoff exponencial
- [ ] Salvar estado de erro e permitir reprocessamento manual
- [ ] Notificar usuário sobre falhas e status de processamento
- [ ] Log de tentativas e erros para debugging

### - Arrumar DATA! Tem que pegar a data lá do nosso amigo CALENDAR

**Benefício:** Maior resiliência e confiabilidade do sistema

### Automação e Controle

#### 3. Tabela de Uso e Custos do GPT
- [ ] Criar tabela `gpt_usage_logs`
  - `id` (UUID)
  - `reuniao_id` (FK, nullable)
  - `operacao` (tipo: resumo_ia, transcricao, etc)
  - `timestamp_inicio` (timestamp)
  - `timestamp_fim` (timestamp)
  - `status` (sucesso, erro, em_progresso)
  - `modelo_usado` (string: gpt-4, gpt-3.5-turbo, etc)
  - `tokens_prompt` (integer)
  - `tokens_completion` (integer)
  - `tokens_total` (integer)
  - `custo_estimado` (decimal)
  - `erro_mensagem` (text, nullable)
  - `metadata` (jsonb - dados adicionais)
- [ ] Implementar logging automático em todas as chamadas GPT
- [ ] Dashboard de custos e uso
- [ ] Alertas quando custo ultrapassar threshold
- [ ] Relatório mensal de gastos por operação/reunião

**Benefício:** Controle financeiro e visibilidade de custos de IA

---

## 🟡 Média Prioridade

### Melhorias de Interface

#### 4. Busca Avançada
- [ ] Busca por participantes
- [ ] Busca por período (intervalo de datas)
- [ ] Busca em transcrição completa
- [ ] Filtros combinados salvos (perfis de busca)

#### 5. Exportação e Relatórios
- [ ] Exportar reuniões para Excel/CSV
- [ ] Relatório de reuniões por empresa/produto
- [ ] Estatísticas de reuniões tratadas vs pendentes
- [ ] Timeline visual de reuniões

### Otimizações

#### 6. Performance
- [ ] Paginação na lista de reuniões
- [ ] Lazy loading de dados pesados (transcrição)
- [ ] Cache de dados frequentemente acessados
- [ ] Índices otimizados no banco de dados

#### 7. Processamento IA
- [ ] Processamento em batch de múltiplas reuniões
- [ ] Fila de processamento para operações pesadas
- [ ] Templates de prompt customizáveis
- [ ] Versionamento de resumos (histórico de edições)

---

## 🟢 Baixa Prioridade

### Funcionalidades Adicionais

#### 8. Colaboração
- [ ] Comentários em reuniões
- [ ] Atribuição de tarefas a partir do "To-do"
- [ ] Notificações de reuniões pendentes
- [ ] Compartilhamento de reuniões via link

#### 9. Integrações
- [ ] Importação direta de Google Meet/Zoom
- [ ] Sincronização com Google Calendar
- [ ] Webhook para notificações externas
- [ ] API REST para integrações

#### 10. Personalização
- [ ] Temas customizáveis
- [ ] Campos personalizados por empresa
- [ ] Templates de e-mail customizáveis
- [ ] Layouts de PDF personalizáveis

---

## 🐛 Bugs Conhecidos

- [ ] Verificar duplicação de tags `<br />` em alguns resumos IA
- [ ] Melhorar validação de URLs de transcrição
- [ ] Tratamento de erros quando empresa/produto não existem

---

## 📝 Notas Técnicas

### Dicionário de Pessoas - Estrutura Sugerida

```sql
CREATE TABLE dicionario_pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_padronizado TEXT NOT NULL UNIQUE,
  apelidos TEXT[] DEFAULT '{}',
  cargo TEXT,
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dicionario_pessoas_apelidos ON dicionario_pessoas USING GIN(apelidos);
```

### GPT Usage Logs - Estrutura Sugerida

```sql
CREATE TABLE gpt_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id UUID REFERENCES reunioes(id) ON DELETE SET NULL,
  operacao VARCHAR(50) NOT NULL,
  timestamp_inicio TIMESTAMPTZ NOT NULL,
  timestamp_fim TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'em_progresso',
  modelo_usado VARCHAR(50) NOT NULL,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  tokens_total INTEGER,
  custo_estimado DECIMAL(10, 4),
  erro_mensagem TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gpt_logs_reuniao ON gpt_usage_logs(reuniao_id);
CREATE INDEX idx_gpt_logs_timestamp ON gpt_usage_logs(timestamp_inicio DESC);
CREATE INDEX idx_gpt_logs_status ON gpt_usage_logs(status);
```

### Cálculo de Custos (Valores de Referência - 2024)

- **GPT-4**: ~$0.03/1K tokens (prompt) + ~$0.06/1K tokens (completion)
- **GPT-4 Turbo**: ~$0.01/1K tokens (prompt) + ~$0.03/1K tokens (completion)
- **GPT-3.5 Turbo**: ~$0.0005/1K tokens (prompt) + ~$0.0015/1K tokens (completion)

---

## 🚀 Roadmap

### Q1 2025
- ✅ Sistema base de reuniões
- ✅ Integração com IA para resumos
- ✅ Seleção e exclusão em massa
- 🔲 Dicionário de pessoas
- 🔲 Tabela de custos GPT

### Q2 2025
- Sistema de fallback
- Dashboard de custos
- Busca avançada
- Exportação de relatórios

### Q3 2025
- Processamento em batch
- Integrações externas
- Sistema de notificações

---

## 💡 Ideias para Futuro

- [ ] IA para sugerir próximos passos baseado em reuniões anteriores
- [ ] Análise de sentimento das reuniões
- [ ] Detecção automática de action items
- [ ] Integração com ferramentas de gerenciamento de projetos (Jira, Trello, Notion)
- [ ] Timeline interativa de decisões por empresa/produto
- [ ] Análise de frequência de reuniões e padrões
- [ ] Sugestão automática de participantes baseado em tópicos
- [ ] Transcrição em tempo real durante reuniões

---

**Última atualização:** 10/01/2025

