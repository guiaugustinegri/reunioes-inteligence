# Instruções para Adicionar Campo de Gravação

## ✅ Componentes Atualizados

Os seguintes arquivos foram atualizados com sucesso:

- `src/components/ReuniaoForm.jsx` - Adicionado campo de gravação no formulário
- `src/components/ReuniaoDetalhes.jsx` - Adicionado exibição do link da gravação
- `database/add_gravacao_field.sql` - Script SQL criado

## 🔧 Executar Script SQL

Para completar a implementação, execute o seguinte SQL no painel do Supabase:

1. Acesse: https://supabase.com/dashboard/project/lvzllltiszzwqxvtvswh/sql
2. Cole e execute o seguinte comando:

```sql
ALTER TABLE reunioes 
ADD COLUMN gravacao_url text;

COMMENT ON COLUMN reunioes.gravacao_url IS 'URL externa da gravação da reunião (Google Drive, OneDrive, etc.)';
```

## 🎯 Funcionalidades Implementadas

### Formulário de Reunião
- ✅ Campo "Gravação (URL)" adicionado após "Transcrição Completa"
- ✅ Validação de URL automática (type="url")
- ✅ Placeholder com exemplo de URL do Google Drive
- ✅ Campo salvo no banco de dados

### Página de Detalhes
- ✅ Link "🎥 Abrir Gravação" exibido nas informações básicas
- ✅ Link abre em nova aba (target="_blank")
- ✅ Só aparece quando há URL cadastrada
- ✅ Estilo consistente com o design system

## 🧪 Como Testar

1. Execute o SQL acima no Supabase
2. Acesse o sistema
3. Crie ou edite uma reunião
4. Adicione uma URL de gravação (ex: https://drive.google.com/file/d/123/view)
5. Salve a reunião
6. Visualize os detalhes da reunião
7. Clique no botão "🎥 Abrir Gravação"

## 📝 Notas

- O campo é opcional (nullable)
- Aceita qualquer URL válida
- Recomendado usar URLs de compartilhamento do Google Drive, OneDrive, etc.
- O link abre em nova aba para não sair do sistema
