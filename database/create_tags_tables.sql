-- =====================================================
-- CRIAÇÃO DAS TABELAS PARA SISTEMA DE TAGS
-- Data: 2025-10-20
-- Motivo: Implementar sistema de tags para categorização de reuniões
-- =====================================================

-- Tabela de tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cor text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de relacionamento reunião-tags (N:N)
CREATE TABLE IF NOT EXISTS reuniao_tags (
  reuniao_id uuid REFERENCES reunioes(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (reuniao_id, tag_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reuniao_tags_reuniao_id ON reuniao_tags(reuniao_id);
CREATE INDEX IF NOT EXISTS idx_reuniao_tags_tag_id ON reuniao_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_nome ON tags(nome);

-- Trigger para atualizar updated_at automaticamente (reutiliza função existente)
CREATE TRIGGER update_tags_updated_at 
  BEFORE UPDATE ON tags 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE tags IS 'Tags para categorização e filtro de reuniões';
COMMENT ON COLUMN tags.nome IS 'Nome da tag (único)';
COMMENT ON COLUMN tags.cor IS 'Código hexadecimal da cor da tag (ex: #FF0000)';

COMMENT ON TABLE reuniao_tags IS 'Relacionamento N:N entre reuniões e tags - uma reunião pode ter múltiplas tags';
COMMENT ON COLUMN reuniao_tags.reuniao_id IS 'ID da reunião';
COMMENT ON COLUMN reuniao_tags.tag_id IS 'ID da tag';

-- Inserir algumas tags de exemplo
INSERT INTO tags (nome, cor) VALUES 
  ('Interna', '#3b82f6'),
  ('Urgente', '#ef4444'),
  ('Cliente VIP', '#f59e0b')
ON CONFLICT (nome) DO NOTHING;

