-- =====================================================
-- ADICIONAR POLÍTICAS RLS PARA SÉRIES DE REUNIÕES
-- Data: 2025-10-10
-- Motivo: Corrigir erro 406 (Not Acceptable)
-- =====================================================

-- Habilitar RLS na tabela series_reunioes
ALTER TABLE series_reunioes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para recriar)
DROP POLICY IF EXISTS "Permitir leitura pública de séries" ON series_reunioes;
DROP POLICY IF EXISTS "Permitir inserção pública de séries" ON series_reunioes;
DROP POLICY IF EXISTS "Permitir atualização pública de séries" ON series_reunioes;
DROP POLICY IF EXISTS "Permitir exclusão pública de séries" ON series_reunioes;

-- Política: permitir leitura pública
CREATE POLICY "Permitir leitura pública de séries"
ON series_reunioes FOR SELECT
TO public
USING (true);

-- Política: permitir inserção pública
CREATE POLICY "Permitir inserção pública de séries"
ON series_reunioes FOR INSERT
TO public
WITH CHECK (true);

-- Política: permitir atualização pública
CREATE POLICY "Permitir atualização pública de séries"
ON series_reunioes FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Política: permitir exclusão pública
CREATE POLICY "Permitir exclusão pública de séries"
ON series_reunioes FOR DELETE
TO public
USING (true);

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
1. Abrir Supabase SQL Editor
2. Executar este script
3. Verificar se as políticas foram criadas em:
   Authentication > Policies > series_reunioes
   
IMPORTANTE: Este script corrige o erro 406 permitindo acesso
público às séries de reuniões.
*/

