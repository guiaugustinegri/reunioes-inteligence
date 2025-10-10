# 🔄 Instruções de Rollback - Séries de Reuniões

## 📅 Backup Criado em: 2025-10-10 10:03:43

### 📁 Arquivos de Backup Criados

1. **`backup_pre_series_2025-10-10_10-03-43.sql`**
   - Contém a estrutura completa do banco (DDL)
   - Inclui todas as tabelas, índices e comentários
   - Pode ser usado para recriar o banco do zero

2. **`backup_dados_pre_series_2025-10-10_10-03-43.sql`**
   - Script para exportar dados atuais
   - Gera comandos INSERT para restaurar dados
   - Deve ser executado no Supabase SQL Editor

## 🚨 Como Fazer Rollback (se necessário)

### Opção 1: Rollback Completo (Recomendado)

1. **Acessar Supabase Dashboard**
   - Ir para: https://supabase.com/dashboard
   - Selecionar o projeto: `lvzllltiszzwqxvtvswh`

2. **Remover Tabelas de Séries**
   ```sql
   -- Executar no SQL Editor do Supabase
   DROP TABLE IF EXISTS series_reunioes CASCADE;
   ALTER TABLE reunioes DROP COLUMN IF EXISTS serie_id;
   ```

3. **Restaurar Estrutura Original**
   - Executar o arquivo: `backup_pre_series_2025-10-10_10-03-43.sql`
   - Isso recriará todas as tabelas originais

4. **Restaurar Dados (se necessário)**
   - Executar o arquivo: `backup_dados_pre_series_2025-10-10_10-03-43.sql`
   - Copiar os resultados e executar os INSERTs gerados

### Opção 2: Rollback Parcial (Manter Dados Novos)

Se você quiser manter os dados das séries mas remover apenas a funcionalidade:

1. **Remover Apenas as Tabelas de Séries**
   ```sql
   DROP TABLE IF EXISTS series_reunioes CASCADE;
   ALTER TABLE reunioes DROP COLUMN IF EXISTS serie_id;
   ```

2. **Manter Tudo o Mais**
   - Dados das reuniões, empresas, produtos permanecem intactos
   - Apenas remove a funcionalidade de séries

### Opção 3: Rollback do Frontend

Se apenas o frontend estiver com problemas:

1. **Reverter Arquivos Modificados**
   ```bash
   # No terminal, na pasta do projeto
   git checkout HEAD -- src/App.jsx
   git checkout HEAD -- src/components/ReuniaoForm.jsx
   git checkout HEAD -- src/components/ReuniaoDetalhes.jsx
   git checkout HEAD -- src/components/ReunioesLista.jsx
   ```

2. **Remover Arquivos Novos**
   ```bash
   rm src/components/SeriesReunioes.jsx
   rm src/components/SerieModal.jsx
   rm src/components/AnaliseSerieModal.jsx
   rm src/services/seriesService.js
   rm src/services/llmAnaliseService.js
   rm database/create_series_tables.sql
   ```

## 🔍 Verificação Pós-Rollback

Após fazer o rollback, verificar se:

- [ ] Aplicação carrega normalmente
- [ ] Lista de reuniões funciona
- [ ] Formulário de reunião funciona
- [ ] Detalhes de reunião funcionam
- [ ] Não há erros no console do navegador
- [ ] Não há erros no Supabase Dashboard

## 📞 Contato de Emergência

Se algo der muito errado:

1. **Verificar Logs do Supabase**
   - Dashboard > Logs
   - Procurar por erros recentes

2. **Verificar Logs do Frontend**
   - Console do navegador (F12)
   - Network tab para ver requisições falhando

3. **Restaurar Backup Mais Antigo**
   - Usar `backup_dados_20251009_203806.sql` se disponível
   - Ou `backup_rapido.sql` para estrutura básica

## ✅ Checklist de Segurança

Antes de implementar as séries, certifique-se de que:

- [ ] Backup foi criado com sucesso
- [ ] Arquivos de backup estão salvos em local seguro
- [ ] Você tem acesso ao Supabase Dashboard
- [ ] Você sabe como executar SQL no Supabase
- [ ] Você tem uma cópia do código atual (git commit)

---

**💡 Dica**: Sempre teste as mudanças em um ambiente de desenvolvimento primeiro, se possível. Mas como estamos trabalhando diretamente no ambiente de produção, o backup é essencial!
