-- =====================================================
-- CRIAÇÃO DAS TABELAS PARA SÉRIES DE REUNIÕES
-- Data: 2025-10-10
-- Motivo: Implementar funcionalidade de atas contínuas
-- =====================================================

-- Tabela para armazenar séries de reuniões (atas contínuas)
CREATE TABLE series_reunioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  produto_id uuid REFERENCES produtos(id) ON DELETE SET NULL,
  tipo_agrupamento text NOT NULL CHECK (tipo_agrupamento IN ('manual', 'auto_produto')),
  visivel_cliente boolean DEFAULT false,
  ultima_analise_llm text,
  ultima_analise_data timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar campo serie_id na tabela reunioes
ALTER TABLE reunioes 
ADD COLUMN serie_id uuid REFERENCES series_reunioes(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX idx_series_reunioes_empresa_id ON series_reunioes(empresa_id);
CREATE INDEX idx_series_reunioes_produto_id ON series_reunioes(produto_id);
CREATE INDEX idx_series_reunioes_tipo_agrupamento ON series_reunioes(tipo_agrupamento);
CREATE INDEX idx_series_reunioes_visivel_cliente ON series_reunioes(visivel_cliente);
CREATE INDEX idx_reunioes_serie_id ON reunioes(serie_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_series_reunioes_updated_at 
    BEFORE UPDATE ON series_reunioes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE series_reunioes IS 'Armazena séries de reuniões para criação de atas contínuas de projetos';
COMMENT ON COLUMN series_reunioes.nome IS 'Nome do projeto/cliente da série';
COMMENT ON COLUMN series_reunioes.descricao IS 'Descrição/contexto do projeto';
COMMENT ON COLUMN series_reunioes.empresa_id IS 'Empresa associada (para agrupamento automático)';
COMMENT ON COLUMN series_reunioes.produto_id IS 'Produto associado (para agrupamento automático)';
COMMENT ON COLUMN series_reunioes.tipo_agrupamento IS 'Tipo: manual (criado pelo usuário) ou auto_produto (gerado automaticamente)';
COMMENT ON COLUMN series_reunioes.visivel_cliente IS 'Se true, pode ser compartilhado com cliente (futuro)';
COMMENT ON COLUMN series_reunioes.ultima_analise_llm IS 'Cache da última análise LLM realizada';
COMMENT ON COLUMN series_reunioes.ultima_analise_data IS 'Data da última análise LLM';
COMMENT ON COLUMN reunioes.serie_id IS 'Série de reuniões à qual esta reunião pertence';

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS na tabela series_reunioes
ALTER TABLE series_reunioes ENABLE ROW LEVEL SECURITY;

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
-- VIEWS ÚTEIS PARA CONSULTAS
-- =====================================================

-- View para listar séries com contagem de reuniões
CREATE VIEW series_com_contagem AS
SELECT 
    s.*,
    COUNT(r.id) as total_reunioes,
    MAX(r.data_reuniao) as ultima_reuniao_data,
    MIN(r.data_reuniao) as primeira_reuniao_data
FROM series_reunioes s
LEFT JOIN reunioes r ON s.id = r.serie_id
GROUP BY s.id, s.nome, s.descricao, s.empresa_id, s.produto_id, 
         s.tipo_agrupamento, s.visivel_cliente, s.ultima_analise_llm, 
         s.ultima_analise_data, s.created_at, s.updated_at;

-- View para séries com informações de empresa e produto
CREATE VIEW series_completa AS
SELECT 
    s.*,
    e.nome as empresa_nome,
    p.nome as produto_nome,
    COUNT(r.id) as total_reunioes,
    MAX(r.data_reuniao) as ultima_reuniao_data
FROM series_reunioes s
LEFT JOIN empresas e ON s.empresa_id = e.id
LEFT JOIN produtos p ON s.produto_id = p.id
LEFT JOIN reunioes r ON s.id = r.serie_id
GROUP BY s.id, s.nome, s.descricao, s.empresa_id, s.produto_id, 
         s.tipo_agrupamento, s.visivel_cliente, s.ultima_analise_llm, 
         s.ultima_analise_data, s.created_at, s.updated_at,
         e.nome, p.nome;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter série com todas as reuniões ordenadas
CREATE OR REPLACE FUNCTION obter_serie_com_reunioes(serie_uuid uuid)
RETURNS TABLE (
    serie_id uuid,
    serie_nome text,
    serie_descricao text,
    empresa_nome text,
    produto_nome text,
    total_reunioes bigint,
    reuniao_id uuid,
    reuniao_titulo text,
    reuniao_data timestamptz,
    reuniao_resumo_ultra_conciso text,
    reuniao_resumo_conciso text,
    reuniao_status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.nome,
        s.descricao,
        e.nome,
        p.nome,
        COUNT(*) OVER() as total_reunioes,
        r.id,
        r.titulo_original,
        r.data_reuniao,
        r.resumo_ultra_conciso,
        r.resumo_conciso,
        r.status
    FROM series_reunioes s
    LEFT JOIN empresas e ON s.empresa_id = e.id
    LEFT JOIN produtos p ON s.produto_id = p.id
    LEFT JOIN reunioes r ON s.id = r.serie_id
    WHERE s.id = serie_uuid
    ORDER BY r.data_reuniao ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir algumas séries de exemplo (comentado por padrão)
/*
INSERT INTO series_reunioes (nome, descricao, tipo_agrupamento, visivel_cliente) VALUES
  ('Projeto Alpha - Cliente XYZ', 'Desenvolvimento de sistema de gestão', 'manual', false),
  ('Projeto Beta - Cliente ABC', 'Consultoria em processos', 'manual', false);
*/

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
INSTRUÇÕES PARA EXECUTAR ESTE SCRIPT:

1. Abrir Supabase SQL Editor
2. Executar este script completo
3. Verificar se as tabelas foram criadas:
   - series_reunioes
   - Campo serie_id adicionado em reunioes
4. Verificar se as views foram criadas:
   - series_com_contagem
   - series_completa
5. Testar a função:
   SELECT * FROM obter_serie_com_reunioes('uuid-da-serie');

NOTAS:
- Este script é seguro para executar em produção
- Não remove dados existentes
- Adiciona apenas novas funcionalidades
- Inclui índices para performance
- Inclui triggers para updated_at automático
*/

