-- =====================================================
-- ADICIONAR CAMPO IGNORADA ÀS SÉRIES E REUNIÕES
-- Data: 2025-10-10
-- Motivo: Permitir que usuário ignore séries automáticas e reuniões individuais
-- =====================================================

-- Adicionar campo ignorada nas séries (default false)
ALTER TABLE series_reunioes 
ADD COLUMN IF NOT EXISTS ignorada boolean DEFAULT false;

-- Adicionar campo ignorada nas reuniões (default false)
ALTER TABLE reunioes 
ADD COLUMN IF NOT EXISTS ignorada boolean DEFAULT false;

-- Comentários
COMMENT ON COLUMN series_reunioes.ignorada IS 'Se true, série vai para final da lista e fica cinza (menos prioritária)';
COMMENT ON COLUMN reunioes.ignorada IS 'Se true, reunião vai para final da ata e fica cinza (menos prioritária na leitura)';

-- Índices para filtros
CREATE INDEX IF NOT EXISTS idx_series_reunioes_ignorada ON series_reunioes(ignorada);
CREATE INDEX IF NOT EXISTS idx_reunioes_ignorada ON reunioes(ignorada);

