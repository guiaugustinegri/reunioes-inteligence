# Painel de Gerenciamento de Reuniões

Um aplicativo web simples para gerenciar reuniões, empresas, produtos e participantes, conectado ao Supabase.

## Funcionalidades

### 🏠 Tela Principal - Lista de Reuniões
- Visualização de todas as reuniões cadastradas
- Filtros por empresa e produto
- Botões para editar e excluir reuniões
- Botão para adicionar nova reunião

### 📝 Formulário de Reunião
- Campos para título, data, resumo e transcrição completa
- Seleção de empresa e produto (dropdowns)
- Seleção múltipla de participantes
- Modo criar/editar automático

### ⚙️ Gerenciamento de Dados
- **Empresas**: Adicionar, visualizar e excluir empresas
- **Produtos**: Adicionar, visualizar e excluir produtos (vinculados a empresas)
- **Participantes**: Adicionar, visualizar e excluir participantes

## Tecnologias Utilizadas

- **Frontend**: Vite + React
- **Roteamento**: React Router DOM
- **Banco de Dados**: Supabase
- **Estilização**: CSS simples e responsivo

## Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acessar o aplicativo:**
   Abra o navegador em `http://localhost:5173`

## Estrutura do Banco de Dados

O aplicativo utiliza as seguintes tabelas no Supabase:

- **empresas**: id, nome, descricao, created_at
- **produtos**: id, empresa_id, nome, descricao, created_at
- **participantes**: id, nome, email, created_at
- **reunioes**: id, empresa_id, produto_id, titulo_original, data_reuniao, resumo_conciso, transcricao_completa, etc.
- **reuniao_participantes**: reuniao_id, participante_id (tabela de relacionamento)

## Navegação

- **/** - Lista de reuniões
- **/reuniao/nova** - Criar nova reunião
- **/reuniao/:id** - Editar reunião existente
- **/gerenciar** - Gerenciar empresas, produtos e participantes

## Características

- ✅ Interface simples e intuitiva
- ✅ Responsivo para dispositivos móveis
- ✅ Validação básica de formulários
- ✅ Mensagens de sucesso/erro
- ✅ Filtros dinâmicos
- ✅ Relacionamentos entre entidades
- ✅ Sem autenticação (uso local)

## Próximos Passos

- [ ] Implementar autenticação com Supabase Auth
- [ ] Adicionar busca por texto nas reuniões
- [ ] Exportar dados para CSV/PDF
- [ ] Dashboard com estatísticas
- [ ] Upload de arquivos de áudio
