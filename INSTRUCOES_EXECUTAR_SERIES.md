# 🚀 INSTRUÇÕES PARA ATIVAR SÉRIES DE REUNIÕES

## ⚠️ IMPORTANTE: Execute ANTES de usar a funcionalidade

A funcionalidade de Séries está implementada no código, mas precisa das tabelas no banco de dados.

## 📋 Passo a Passo:

### 1. Acessar Supabase SQL Editor
1. Abra: https://supabase.com/dashboard/project/lvzllltiszzwqxvtvswh
2. Clique em **"SQL Editor"** no menu lateral
3. Clique em **"New query"**

### 2. Executar Script de Criação das Tabelas
1. Abra o arquivo: `database/create_series_tables.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** (ou Ctrl+Enter)
5. Aguarde mensagem de sucesso

### 3. Executar Script de Campo Ignorada
1. Abra o arquivo: `database/add_ignorada_field.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** (ou Ctrl+Enter)
5. Aguarde mensagem de sucesso

### 4. Verificar se Funcionou
Execute no SQL Editor:
```sql
-- Deve retornar as tabelas criadas
SELECT * FROM series_reunioes LIMIT 1;
SELECT * FROM reunioes LIMIT 1;
```

Se não der erro, está tudo certo! ✅

### 5. Recarregar a Aplicação
1. Volte para `http://localhost:5173`
2. Clique em **"Séries"** no menu
3. As séries devem aparecer automaticamente!

## ❌ Se Der Erro:

### Erro: "relation series_reunioes does not exist"
- Você não executou o script `create_series_tables.sql`
- Execute o passo 2 acima

### Erro: "column ignorada does not exist"
- Você não executou o script `add_ignorada_field.sql`
- Execute o passo 3 acima

### Erro 406: "Not Acceptable"
- As tabelas não existem no banco
- Execute os passos 2 e 3 acima

## ✅ Após Executar:

As séries automáticas serão criadas automaticamente quando você:
1. Acessar a página de Séries
2. Sistema detecta empresa+produto de cada reunião
3. Cria séries e associa reuniões
4. Tudo aparece pronto para uso!

---

**RESUMO**: Execute os 2 scripts SQL no Supabase e recarregue a página.
