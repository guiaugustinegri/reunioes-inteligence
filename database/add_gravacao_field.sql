-- =====================================================
-- ADICIONAR CAMPO DE GRAVAÇÃO ÀS REUNIÕES
-- Data: 2025-01-27
-- Motivo: Implementar funcionalidade de gravações vinculadas às reuniões
-- =====================================================

-- Adicionar coluna para URL da gravação
ALTER TABLE reunioes 
ADD COLUMN gravacao_url text;

-- Adicionar comentário na coluna
COMMENT ON COLUMN reunioes.gravacao_url IS 'URL externa da gravação da reunião (Google Drive, OneDrive, etc.)';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reunioes' 
AND column_name = 'gravacao_url';
