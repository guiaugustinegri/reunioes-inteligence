-- Tabela para armazenar requests LLM associados às reuniões
CREATE TABLE llm_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id uuid REFERENCES reunioes(id) ON DELETE CASCADE,
  request_numero integer NOT NULL CHECK (request_numero IN (1, 2)),
  modelo text NOT NULL,
  tokens_entrada integer NOT NULL CHECK (tokens_entrada >= 0),
  tokens_saida integer NOT NULL CHECK (tokens_saida >= 0),
  created_at timestamptz DEFAULT now()
);

-- Índice para buscar requests por reunião
CREATE INDEX idx_llm_requests_reuniao_id ON llm_requests(reuniao_id);

-- Índice para buscar por número do request
CREATE INDEX idx_llm_requests_numero ON llm_requests(reuniao_id, request_numero);

-- Tabela para configuração de preços dos modelos LLM
CREATE TABLE llm_precos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo text UNIQUE NOT NULL,
  preco_entrada_por_milhao numeric(10,4) NOT NULL CHECK (preco_entrada_por_milhao >= 0),
  preco_saida_por_milhao numeric(10,4) NOT NULL CHECK (preco_saida_por_milhao >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir alguns preços padrão da OpenAI (valores de exemplo - ajustar conforme necessário)
INSERT INTO llm_precos (modelo, preco_entrada_por_milhao, preco_saida_por_milhao) VALUES
  ('gpt-4o', 2.50, 10.00),
  ('gpt-4o-mini', 0.15, 0.60),
  ('gpt-4-turbo', 10.00, 30.00),
  ('gpt-3.5-turbo', 0.50, 1.50);

-- Comentários nas tabelas
COMMENT ON TABLE llm_requests IS 'Armazena informações sobre requests LLM feitos para processar reuniões';
COMMENT ON TABLE llm_precos IS 'Configuração de preços dos modelos LLM por milhão de tokens';

