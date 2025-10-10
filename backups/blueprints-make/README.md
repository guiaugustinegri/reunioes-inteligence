# 🔧 Blueprints Make.com - Banco de Reuniões

Esta pasta contém os blueprints de automação do Make.com para setup e manutenção do banco de dados.

## 📁 Arquivos Disponíveis

### `09-10-25.blueprint.json`
- **Data**: 09/10/2025
- **Versão**: Estrutura inicial do banco
- **Conteúdo**: Automação para criação das tabelas principais
- **Status**: ✅ Estável

### `10-10-25.blueprint.json`
- **Data**: 10/10/2025
- **Versão**: Atualizada com tabelas LLM
- **Conteúdo**: Inclui tabelas de custos e requests LLM
- **Status**: ✅ Atual

## 🚀 Como Usar

### 1. Importar no Make.com
1. Acessar [Make.com](https://www.make.com)
2. Ir para "Scenarios" > "Import"
3. Selecionar o arquivo `.json` desejado
4. Configurar conexões necessárias

### 2. Configurar Conexões
- **Supabase**: Configurar com URL e chave de API
- **Triggers**: Definir quando executar a automação
- **Actions**: Configurar ações de criação/atualização

### 3. Executar Automação
- **Manual**: Executar uma vez para setup inicial
- **Agendado**: Configurar para execução periódica
- **Trigger**: Executar baseado em eventos

## 📋 O que os Blueprints Fazem

### Setup Inicial
- ✅ Criação de todas as tabelas necessárias
- ✅ Configuração de relacionamentos (foreign keys)
- ✅ Criação de índices para performance
- ✅ Inserção de dados iniciais (preços LLM)

### Manutenção
- ✅ Backup automático de dados
- ✅ Sincronização entre ambientes
- ✅ Atualização de estruturas
- ✅ Limpeza de dados antigos

## 🔄 Atualizações

### Quando Atualizar
- [ ] Nova funcionalidade adicionada
- [ ] Estrutura do banco modificada
- [ ] Novos relacionamentos criados
- [ ] Otimizações de performance

### Como Atualizar
1. Exportar blueprint atual do Make.com
2. Salvar com nova data no formato `DD-MM-AA.blueprint.json`
3. Documentar mudanças no README
4. Testar em ambiente de desenvolvimento

## ⚠️ Cuidados

- **Sempre teste em desenvolvimento primeiro**
- **Faça backup antes de executar em produção**
- **Verifique permissões de API do Supabase**
- **Monitore logs de execução**

## 📊 Monitoramento

### Métricas Importantes
- ✅ Taxa de sucesso das execuções
- ⏱️ Tempo de execução dos cenários
- 💰 Custo de operações (se aplicável)
- 📈 Volume de dados processados

### Alertas Recomendados
- Falha na execução de cenários
- Tempo de execução acima do normal
- Erros de conexão com Supabase
- Quota de API próxima do limite

## 🔗 Links Úteis

- [Make.com Documentation](https://www.make.com/en/help)
- [Supabase API Documentation](https://supabase.com/docs/guides/api)
- [Banco de Reuniões - Supabase Dashboard](https://supabase.com/dashboard/project/lvzllltiszzwqxvtvswh)

## 📝 Log de Mudanças

### 10/10/2025
- ✅ Adicionadas tabelas LLM (llm_requests, llm_precos)
- ✅ Configuração de preços padrão OpenAI
- ✅ Índices para performance

### 09/10/2025
- ✅ Estrutura inicial do banco
- ✅ Tabelas principais (empresas, produtos, participantes, reuniões)
- ✅ Relacionamentos básicos

