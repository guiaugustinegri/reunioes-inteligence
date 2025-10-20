# Sistema de Tags - Instruções de Instalação

## ✅ Implementação Completa

O sistema de tags foi totalmente implementado com as seguintes funcionalidades:

### 🎯 Funcionalidades Implementadas

1. **Gerenciamento de Tags** (Gerenciar → Tags)
   - Criar tags com nome e cor personalizável
   - Editar tags existentes
   - Excluir tags (remove automaticamente de todas as reuniões)
   - Visualização com badges coloridas

2. **Formulário de Reunião**
   - Seleção múltipla de tags
   - Interface com cards coloridos interativos
   - Preview visual das tags selecionadas

3. **Lista de Reuniões**
   - Coluna dedicada mostrando as tags de cada reunião
   - Filtro multi-seleção por tags
   - Badges coloridas com limite de 3 tags visíveis (+N para excesso)

4. **Detalhes da Reunião**
   - Visualização de todas as tags da reunião
   - Badges coloridas com contraste automático

### 📦 Arquivos Criados/Modificados

**Novos Arquivos:**
- `database/create_tags_tables.sql` - Script de criação das tabelas
- `src/services/tagsService.js` - Service layer para operações com tags

**Arquivos Modificados:**
- `src/components/Gerenciar.jsx` - Adicionada tab e manager de tags
- `src/components/Gerenciar.css` - Estilos para gerenciamento de tags
- `src/components/ReuniaoForm.jsx` - Integração de seleção de tags
- `src/components/ReunioesLista.jsx` - Filtros e coluna de tags
- `src/components/ReuniaoDetalhes.jsx` - Visualização de tags
- `src/App.css` - Estilos para badges e seleção de tags

## 🚀 Como Instalar

### Passo 1: Executar Script SQL no Supabase

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `database/create_tags_tables.sql`
6. Clique em **RUN** ou pressione `Ctrl+Enter`

### Passo 2: Verificar Criação

Execute esta query para verificar:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tags', 'reuniao_tags');

-- Verificar tags de exemplo
SELECT * FROM tags;
```

### Passo 3: Testar o Sistema

1. Execute o projeto: `npm run dev`
2. Acesse **Gerenciar → Tags**
3. Crie novas tags com nomes e cores personalizadas
4. Ao criar/editar uma reunião, selecione as tags desejadas
5. Na lista de reuniões, use os filtros de tags
6. Visualize as tags nos detalhes das reuniões

## 🎨 Design System

O sistema de tags segue o design system do projeto:

- **Estrutura**: Preto, branco e cinza (#000, #fff, tons de cinza)
- **Bordas**: 2px solid em todos os containers
- **Tipografia**: Uppercase em labels, Courier New/Consolas
- **Exceção**: Os badges de tags usam as cores personalizadas definidas pelo usuário
- **Contraste**: Cálculo automático de cor de texto (preto/branco) baseado na luminosidade da cor de fundo

## 📊 Estrutura do Banco de Dados

### Tabela `tags`
- `id` (uuid, PK)
- `nome` (text, único)
- `cor` (text, formato #RRGGBB)
- `created_at`, `updated_at` (timestamptz)

### Tabela `reuniao_tags`
- `reuniao_id` (uuid, FK → reunioes)
- `tag_id` (uuid, FK → tags)
- `created_at` (timestamptz)
- PK composta: (reuniao_id, tag_id)

## 🔧 Service Layer

O arquivo `src/services/tagsService.js` contém todas as operações:

- `listarTags()` - Lista todas as tags
- `criarTag(nome, cor)` - Cria nova tag
- `atualizarTag(id, nome, cor)` - Atualiza tag existente
- `excluirTag(id)` - Remove tag (cascade automático)
- `obterTagsReuniao(reuniaoId)` - Busca tags de uma reunião
- `associarTagReuniao(reuniaoId, tagId)` - Adiciona tag à reunião
- `desassociarTagReuniao(reuniaoId, tagId)` - Remove tag da reunião
- `atualizarTagsReuniao(reuniaoId, tagIds)` - Atualiza todas as tags de uma vez

## 💡 Exemplos de Uso

### Tags Sugeridas

- **Interna** (#3b82f6 - Azul) - Reuniões internas da equipe
- **Cliente** (#10b981 - Verde) - Reuniões com clientes
- **Urgente** (#ef4444 - Vermelho) - Assuntos urgentes
- **Follow-up** (#f59e0b - Laranja) - Requer acompanhamento
- **Planejamento** (#8b5cf6 - Roxo) - Reuniões de planejamento
- **Review** (#ec4899 - Rosa) - Revisões e retrospectivas

## ✅ Checklist de Verificação

- [ ] Script SQL executado com sucesso
- [ ] Tabelas `tags` e `reuniao_tags` criadas
- [ ] Tags de exemplo visíveis no banco
- [ ] Tab "TAGS" aparece em Gerenciar
- [ ] Possível criar, editar e excluir tags
- [ ] Seleção de tags funciona no formulário de reunião
- [ ] Filtro de tags funciona na lista
- [ ] Coluna de tags visível na tabela
- [ ] Tags aparecem nos detalhes da reunião

## 🐛 Troubleshooting

### Tags não aparecem no formulário
- Verifique se as tabelas foram criadas no Supabase
- Confirme que há pelo menos uma tag cadastrada

### Erro ao salvar reunião com tags
- Verifique as políticas RLS no Supabase
- Confirme que as foreign keys estão corretas

### Badges de tags com cores erradas
- Verifique se o formato da cor é #RRGGBB
- Confirme que não há caracteres extras no campo cor

## 📚 Próximos Passos (Opcional)

Funcionalidades que podem ser adicionadas no futuro:

- Filtrar séries por tags
- Estatísticas de uso de tags
- Tags mais usadas no dashboard
- Exportar relatórios filtrados por tags
- Tags hierárquicas (tags pai/filho)
- Atalhos de teclado para tags frequentes

---

**Data de Implementação**: 20 de outubro de 2025
**Versão**: 1.0.0

