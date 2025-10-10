-- =====================================================
-- BACKUP COMPLETO ANTES DA IMPLEMENTAÇÃO DE SÉRIES
-- Data: 2025-10-10 10:03:43
-- Motivo: Backup de segurança antes de adicionar tabelas de séries
-- =====================================================

-- =====================================================
-- ESTRUTURA DAS TABELAS (DDL)
-- =====================================================

-- Tabela empresas
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela produtos
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Tabela participantes
CREATE TABLE IF NOT EXISTS participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Tabela reunioes
CREATE TABLE IF NOT EXISTS reunioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo_original text NOT NULL,
  data_reuniao timestamptz,
  resumo_ultra_conciso text,
  resumo_conciso text,
  resumo_ia text,
  tarefas_guilherme text,
  transcricao_completa text,
  empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  produto_id uuid REFERENCES produtos(id) ON DELETE SET NULL,
  status text DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela reuniao_participantes
CREATE TABLE IF NOT EXISTS reuniao_participantes (
  reuniao_id uuid REFERENCES reunioes(id) ON DELETE CASCADE,
  participante_id uuid REFERENCES participantes(id) ON DELETE CASCADE,
  PRIMARY KEY (reuniao_id, participante_id)
);

-- Tabela produto_participantes
CREATE TABLE IF NOT EXISTS produto_participantes (
  produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE,
  participante_id uuid REFERENCES participantes(id) ON DELETE CASCADE,
  PRIMARY KEY (produto_id, participante_id)
);

-- Tabela empresa_participantes
CREATE TABLE IF NOT EXISTS empresa_participantes (
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  participante_id uuid REFERENCES participantes(id) ON DELETE CASCADE,
  PRIMARY KEY (empresa_id, participante_id)
);

-- Tabela llm_requests
CREATE TABLE IF NOT EXISTS llm_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id uuid REFERENCES reunioes(id) ON DELETE CASCADE,
  request_numero integer NOT NULL CHECK (request_numero IN (1, 2)),
  modelo text NOT NULL,
  tokens_entrada integer NOT NULL CHECK (tokens_entrada >= 0),
  tokens_saida integer NOT NULL CHECK (tokens_saida >= 0),
  created_at timestamptz DEFAULT now()
);

-- Tabela llm_precos
CREATE TABLE IF NOT EXISTS llm_precos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo text UNIQUE NOT NULL,
  preco_entrada_por_milhao numeric(10,4) NOT NULL CHECK (preco_entrada_por_milhao >= 0),
  preco_saida_por_milhao numeric(10,4) NOT NULL CHECK (preco_saida_por_milhao >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices para llm_requests
CREATE INDEX IF NOT EXISTS idx_llm_requests_reuniao_id ON llm_requests(reuniao_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_numero ON llm_requests(reuniao_id, request_numero);

-- =====================================================
-- DADOS DE EXEMPLO (se existirem)
-- =====================================================

-- Inserir preços padrão da OpenAI (se não existirem)
INSERT INTO llm_precos (modelo, preco_entrada_por_milhao, preco_saida_por_milhao) VALUES
  ('gpt-4o', 2.50, 10.00),
  ('gpt-4o-mini', 0.15, 0.60),
  ('gpt-4-turbo', 10.00, 30.00),
  ('gpt-3.5-turbo', 0.50, 1.50)
ON CONFLICT (modelo) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE llm_requests IS 'Armazena informações sobre requests LLM feitos para processar reuniões';
COMMENT ON TABLE llm_precos IS 'Configuração de preços dos modelos LLM por milhão de tokens';

-- =====================================================
-- INSTRUÇÕES DE RESTAURAÇÃO
-- =====================================================

/*
INSTRUÇÕES PARA RESTAURAR ESTE BACKUP:

1. Conectar ao banco Supabase
2. Executar este script completo
3. Se houver dados existentes, fazer backup primeiro
4. Este script usa CREATE TABLE IF NOT EXISTS para evitar conflitos

NOTA: Este backup contém apenas a estrutura (DDL) e dados de configuração.
Os dados das reuniões, empresas, produtos e participantes devem ser 
exportados separadamente usando as ferramentas do Supabase Dashboard
ou scripts de exportação específicos.
*/
