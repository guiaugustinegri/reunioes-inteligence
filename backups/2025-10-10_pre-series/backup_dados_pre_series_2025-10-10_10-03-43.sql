-- =====================================================
-- BACKUP DOS DADOS ANTES DA IMPLEMENTAÇÃO DE SÉRIES
-- Data: 2025-10-10 10:03:43
-- Motivo: Backup dos dados existentes antes de adicionar tabelas de séries
-- =====================================================

-- IMPORTANTE: Este script deve ser executado no Supabase SQL Editor
-- para exportar os dados atuais antes das mudanças

-- =====================================================
-- EXPORTAR DADOS DAS EMPRESAS
-- =====================================================
SELECT 'INSERT INTO empresas (id, nome, created_at) VALUES' as sql_statement
UNION ALL
SELECT CONCAT('(''', id, ''', ''', REPLACE(nome, '''', ''''''), ''', ''', created_at, '''),') as sql_statement
FROM empresas
ORDER BY created_at;

-- =====================================================
-- EXPORTAR DADOS DOS PRODUTOS
-- =====================================================
SELECT 'INSERT INTO produtos (id, nome, empresa_id, created_at) VALUES' as sql_statement
UNION ALL
SELECT CONCAT('(''', id, ''', ''', REPLACE(nome, '''', ''''''), ''', ''', 
              COALESCE(empresa_id::text, 'NULL'), ''', ''', created_at, '''),') as sql_statement
FROM produtos
ORDER BY created_at;

-- =====================================================
-- EXPORTAR DADOS DOS PARTICIPANTES
-- =====================================================
SELECT 'INSERT INTO participantes (id, nome, email, created_at) VALUES' as sql_statement
UNION ALL
SELECT CONCAT('(''', id, ''', ''', REPLACE(nome, '''', ''''''), ''', ''', 
              COALESCE('''' || REPLACE(email, '''', '''''') || '''', 'NULL'), ''', ''', created_at, '''),') as sql_statement
FROM participantes
ORDER BY created_at;

-- =====================================================
-- EXPORTAR DADOS DAS REUNIÕES
-- =====================================================
SELECT 'INSERT INTO reunioes (id, titulo_original, data_reuniao, resumo_ultra_conciso, resumo_conciso, resumo_ia, tarefas_guilherme, transcricao_completa, empresa_id, produto_id, status, created_at, updated_at) VALUES' as sql_statement
UNION ALL
SELECT CONCAT('(''', id, ''', ''', 
              REPLACE(titulo_original, '''', ''''''), ''', ''',
              COALESCE('''' || data_reuniao::text || '''', 'NULL'), ''', ''',
              COALESCE('''' || REPLACE(resumo_ultra_conciso, '''', '''''') || '''', 'NULL'), ''', ''',
              COALESCE('''' || REPLACE(resumo_conciso, '''', '''''') || '''', 'NULL'), ''', ''',
              COALESCE('''' || REPLACE(resumo_ia, '''', '''''') || '''', 'NULL'), ''', ''',
              COALESCE('''' || REPLACE(tarefas_guilherme, '''', '''''') || '''', 'NULL'), ''', ''',
              COALESCE('''' || REPLACE(transcricao_completa, '''', '''''') || '''', 'NULL'), ''', ''',
              COALESCE(empresa_id::text, 'NULL'), ''', ''',
              COALESCE(produto_id::text, 'NULL'), ''', ''',
              COALESCE('''' || status || '''', 'NULL'), ''', ''',
              created_at, ''', ''',
              updated_at, '''),') as sql_statement
FROM reunioes
ORDER BY created_at;

-- =====================================================
-- EXPORTAR RELAÇÕES REUNIÃO-PARTICIPANTES
-- =====================================================
SELECT 'INSERT INTO reuniao_participantes (reuniao_id, participante_id) VALUES' as sql_statement
UNION ALL
SELECT CONCAT('(''', reuniao_id, ''', ''', participante_id, '''),') as sql_statement
FROM reuniao_participantes;

-- =====================================================
-- EXPORTAR RELAÇÕES PRODUTO-PARTICIPANTES
-- =====================================================
SELECT 'INSERT INTO produto_participantes (produto_id, participante_id) VALUES' as sql_statement
UNION ALL
SELECT CONCAT('(''', produto_id, ''', ''', participante_id, '''),') as sql_statement
FROM produto_participantes;

-- =====================================================
-- EXPORTAR RELAÇÕES EMPRESA-PARTICIPANTES
-- =====================================================
SELECT 'INSERT INTO empresa_participantes (empresa_id, participante_id) VALUES' as sql_statement
UNION ALL
SELECT CONCAT('(''', empresa_id, ''', ''', participante_id, '''),') as sql_statement
FROM empresa_participantes;

-- =====================================================
-- EXPORTAR DADOS LLM_REQUESTS
-- =====================================================
SELECT 'INSERT INTO llm_requests (id, reuniao_id, request_numero, modelo, tokens_entrada, tokens_saida, created_at) VALUES' as sql_statement
UNION ALL
SELECT CONCAT('(''', id, ''', ''', 
              reuniao_id, ''', ''',
              request_numero, ''', ''',
              COALESCE('''' || modelo || '''', 'NULL'), ''', ''',
              tokens_entrada, ''', ''',
              tokens_saida, ''', ''',
              created_at, '''),') as sql_statement
FROM llm_requests
ORDER BY created_at;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
INSTRUÇÕES PARA USAR ESTE BACKUP:

1. Abrir o Supabase SQL Editor
2. Executar cada seção separadamente
3. Copiar os resultados e salvar em arquivos .sql
4. Para restaurar, executar os INSERTs gerados

ALTERNATIVA MAIS SIMPLES:
- Usar o Supabase Dashboard > Table Editor
- Exportar cada tabela como CSV
- Salvar os CSVs como backup

NOTA: Este script gera comandos INSERT que podem ser executados
para recriar exatamente os dados atuais.
*/
