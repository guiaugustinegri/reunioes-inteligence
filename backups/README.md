# 📦 Backups do Banco de Reuniões

Esta pasta contém todos os backups de segurança do projeto, organizados cronologicamente.

## 📁 Estrutura dos Backups

### 🗓️ `2025-10-10_pre-series/`
**Backup mais recente** - Antes da implementação de Séries de Reuniões
- **Data**: 2025-10-10 10:03:43
- **Motivo**: Backup de segurança antes de adicionar funcionalidade de séries
- **Conteúdo**: 
  - Estrutura completa do banco (DDL)
  - Script de exportação de dados
  - Instruções de rollback detalhadas

### 🗓️ `2025-10-09_antigo/`
**Backups anteriores** - Dados históricos
- **Data**: 2025-10-09
- **Conteúdo**: Backups antigos movidos da raiz do projeto
- **Arquivos**: 
  - `backup_dados_20251009_203806.sql`
  - `backup_rapido.sql` (template)

### 🔧 `blueprints-make/`
**Blueprints de Automação** - Make.com
- **Propósito**: Automação para setup do banco de dados
- **Arquivos**:
  - `09-10-25.blueprint.json` - Blueprint de 09/10/2025
  - `10-10-25.blueprint.json` - Blueprint de 10/10/2025
- **Uso**: Importar no Make.com para automatizar criação de tabelas

### 📄 `backup-091025.blueprint.json`
**Blueprint Supabase** - Backup da estrutura do projeto
- **Data**: 09/10/2025
- **Tipo**: Blueprint completo do Supabase
- **Uso**: Restaurar estrutura completa do projeto

## 🔄 Como Usar os Backups

### Para Rollback de Emergência
1. Acessar a pasta do backup desejado
2. Seguir as instruções no `README.md` específico
3. Executar scripts SQL no Supabase Dashboard

### Para Restaurar Blueprints
1. Acessar `blueprints-make/`
2. Importar arquivo `.json` no Make.com
3. Configurar automação conforme necessário

### Para Restaurar Estrutura Completa
1. Usar `backup-091025.blueprint.json`
2. Importar no Supabase Dashboard
3. Executar scripts de dados se necessário

## ⚠️ Importante

- **Sempre faça backup antes de mudanças grandes**
- **Teste restaurações em ambiente de desenvolvimento primeiro**
- **Mantenha backups organizados por data e motivo**
- **Documente o motivo de cada backup**

## 📋 Checklist de Backup

Antes de implementar mudanças grandes:

- [ ] Backup da estrutura atual (DDL)
- [ ] Backup dos dados atuais
- [ ] Documentação do motivo do backup
- [ ] Instruções de rollback
- [ ] Teste de restauração (se possível)

## 🚀 Próximos Backups

- **Próximo**: Após implementação completa das Séries de Reuniões
- **Futuro**: Antes de cada funcionalidade major
- **Automático**: Considerar automação via Make.com
