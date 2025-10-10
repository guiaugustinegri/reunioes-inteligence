-- =====================================================
-- DESABILITAR RLS PARA TABELAS DE SÉRIES
-- Data: 2025-10-10
-- Motivo: Permitir acesso público às séries (mesmo padrão das outras tabelas)
-- =====================================================

-- Desabilitar RLS na tabela series_reunioes
ALTER TABLE series_reunioes DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'series_reunioes';

-- Resultado esperado: rowsecurity = false

