-- =====================================================
-- CONTROLE DE ENVIO DE EMAILS
-- Criado em: 2025-10-13
-- =====================================================

-- Tabela para rastrear envios de email
CREATE TABLE IF NOT EXISTS email_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id uuid REFERENCES reunioes(id) ON DELETE CASCADE,
  destinatarios text[] NOT NULL, -- Array de emails que receberam
  assunto text NOT NULL,
  enviado_por text DEFAULT 'Sistema', -- Futuramente pode ser o usuário logado
  enviado_em timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índice para consultas rápidas por reunião
CREATE INDEX IF NOT EXISTS idx_email_envios_reuniao_id ON email_envios(reuniao_id);

-- Índice para consultas por data
CREATE INDEX IF NOT EXISTS idx_email_envios_data ON email_envios(enviado_em DESC);

-- Comentários
COMMENT ON TABLE email_envios IS 'Registra histórico de envios de email das reuniões';
COMMENT ON COLUMN email_envios.destinatarios IS 'Array com os emails dos destinatários';
COMMENT ON COLUMN email_envios.assunto IS 'Assunto do email enviado';
COMMENT ON COLUMN email_envios.enviado_por IS 'Quem enviou o email (usuário)';
COMMENT ON COLUMN email_envios.enviado_em IS 'Data e hora do envio';


