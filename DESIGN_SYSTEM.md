# Sistema de Design - Estética Jornal/Windows Antigo

## 🎨 Filosofia de Design

Este sistema de design é inspirado em jornais clássicos e interfaces Windows antigas, priorizando:
- **Minimalismo**: Preto, branco e tons de cinza
- **Clareza**: Bordas fortes, tipografia legível
- **Funcionalidade**: Sem elementos decorativos desnecessários
- **Contraste**: Alto contraste para máxima legibilidade

## 🎯 Paleta de Cores

### Cores Principais
- **Preto Principal**: `#000` - Bordas, headers, texto principal
- **Branco**: `#fff` - Backgrounds, texto em fundos escuros
- **Cinza Escuro**: `#111827` - Texto secundário
- **Cinza Médio**: `#6b7280` - Texto terciário, labels
- **Cinza Claro**: `#d1d5db` - Bordas secundárias
- **Cinza Muito Claro**: `#f9fafb` - Hover states
- **Background**: `#e5e7eb` - Fundo da página

### Uso das Cores
```css
/* Texto principal */
color: #000;

/* Texto secundário */
color: #6b7280;

/* Bordas principais */
border: 2px solid #000;

/* Bordas secundárias */
border: 1px solid #d1d5db;

/* Background hover */
background: #f9fafb;
```

## 📝 Tipografia

### Fonte Principal
```css
font-family: 'Courier New', 'Consolas', monospace, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Hierarquia de Tamanhos
- **Título Principal (h1)**: `2.5rem` (40px)
- **Título Secundário (h2)**: `2rem` (32px)
- **Título Terciário (h3)**: `1.5rem` (24px)
- **Texto Normal**: `1rem` (16px)
- **Texto Pequeno**: `0.875rem` (14px)
- **Texto Muito Pequeno**: `0.75rem` (12px)

### Estilo de Texto
```css
/* Títulos principais */
text-transform: uppercase;
letter-spacing: 2px;
font-weight: 700;

/* Labels e headers */
text-transform: uppercase;
letter-spacing: 1px;
font-weight: 600;

/* Texto normal */
font-weight: 400;
line-height: 1.6;
```

## 🔲 Componentes

### Botões

#### Botão Primário (Branco com borda preta)
```jsx
<button className="btn btn-primary">Texto</button>
```
```css
.btn-primary {
  background-color: #fff;
  color: #000;
  border: 2px solid #000;
  padding: 0.75rem 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

#### Botão Success (Preto)
```jsx
<button className="btn btn-success">Texto</button>
```
```css
.btn-success {
  background-color: #000;
  color: #fff;
  border: 2px solid #000;
}
```

### Formulários

#### Input de Texto
```jsx
<div className="form-group">
  <label htmlFor="campo">Label</label>
  <input 
    type="text" 
    id="campo" 
    className="form-control"
    placeholder="Placeholder..."
  />
</div>
```

#### Select
```jsx
<select className="select-filter">
  <option value="">Selecione...</option>
  <option value="1">Opção 1</option>
</select>
```

#### Textarea
```jsx
<textarea 
  className="form-control"
  rows="5"
  placeholder="Digite aqui..."
/>
```

### Tabelas

#### Tabela Compacta (Estilo Jornal)
```jsx
<div className="table-compact">
  <div className="table-header">
    <div className="col-name">COLUNA 1</div>
    <div className="col-name">COLUNA 2</div>
  </div>
  <div className="table-row">
    <div className="col-name">Dado 1</div>
    <div className="col-name">Dado 2</div>
  </div>
</div>
```

### Mensagens

#### Mensagem de Sucesso
```jsx
<div className="message success">
  Operação realizada com sucesso!
</div>
```

#### Mensagem de Erro
```jsx
<div className="message error">
  Erro ao processar operação
</div>
```

### Navegação

#### Navbar
```jsx
<nav className="navbar">
  <div className="nav-container">
    <h1>TÍTULO DO APP</h1>
    <div className="nav-links">
      <Link to="/" className="nav-link">LINK 1</Link>
      <Link to="/page" className="nav-link">LINK 2</Link>
    </div>
  </div>
</nav>
```

#### Tabs
```jsx
<div className="tabs">
  <button className="tab active">TAB 1</button>
  <button className="tab">TAB 2</button>
  <button className="tab">TAB 3</button>
</div>
```

### Barra de Busca

```jsx
<div className="search-bar">
  <input
    type="text"
    className="search-input"
    placeholder="Buscar..."
  />
  
  <div className="search-filters">
    <input type="date" className="date-input" />
    <select className="select-filter">
      <option>Filtro 1</option>
    </select>
    <button className="clear-btn">Limpar</button>
  </div>
  
  <div className="results-count">
    10 resultados encontrados
  </div>
</div>
```

## 📐 Espaçamento

### Sistema de Espaçamento
- **XXS**: `0.25rem` (4px)
- **XS**: `0.5rem` (8px)
- **SM**: `0.75rem` (12px)
- **MD**: `1rem` (16px)
- **LG**: `1.5rem` (24px)
- **XL**: `2rem` (32px)
- **XXL**: `3rem` (48px)

### Padding Padrão
- **Botões**: `0.75rem 1.5rem`
- **Inputs**: `0.75rem 1rem`
- **Cards/Containers**: `1.5rem` ou `2rem`
- **Tabelas (células)**: `1rem`

### Margin Padrão
- **Entre seções**: `2rem`
- **Entre elementos**: `1rem` ou `1.5rem`
- **Entre grupos de formulário**: `1.5rem`

## 🔳 Bordas

### Espessuras
- **Borda Principal**: `2px solid #000`
- **Borda Secundária**: `1px solid #d1d5db`
- **Borda Grossa (destaque)**: `4px solid #000`

### Aplicação
```css
/* Containers principais */
border: 2px solid #000;

/* Separadores internos */
border-bottom: 1px solid #d1d5db;

/* Headers e destaques */
border-bottom: 4px solid #000;
```

## 🎭 Estados Interativos

### Hover
```css
/* Botões */
.btn:hover {
  background-color: #000;
  color: #fff;
}

/* Links de navegação */
.nav-link:hover {
  background-color: #fff;
  color: #000;
}

/* Linhas de tabela */
.table-row:hover {
  background-color: #f9fafb;
}
```

### Focus
```css
/* Inputs */
.form-control:focus {
  outline: none;
  border-color: #000;
  background: white;
}
```

### Disabled
```css
.select-filter:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}
```

## 📱 Responsividade

### Breakpoints
```css
/* Mobile */
@media (max-width: 768px) {
  /* Ajustes para mobile */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Ajustes para tablet */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Layout padrão */
}
```

## ✅ Checklist para Novos Componentes

Ao criar um novo componente, certifique-se de:

- [ ] Usar apenas preto, branco e tons de cinza
- [ ] Aplicar bordas de 2px em containers principais
- [ ] Usar text-transform: uppercase em títulos e labels
- [ ] Adicionar letter-spacing apropriado
- [ ] Implementar estados hover com inversão preto/branco
- [ ] Garantir alto contraste para acessibilidade
- [ ] Usar a fonte Courier New ou Consolas
- [ ] Manter consistência com componentes existentes
- [ ] Testar em diferentes tamanhos de tela

## 🚀 Exemplos de Uso

### Página Completa
```jsx
<div className="main-content">
  <div className="page-header">
    <h2>Título da Página</h2>
    <button className="btn btn-success">Nova Ação</button>
  </div>

  <div className="search-bar">
    {/* Filtros aqui */}
  </div>

  <div className="table-compact">
    {/* Tabela aqui */}
  </div>
</div>
```

### Formulário Completo
```jsx
<div className="form-container">
  <h3>Título do Formulário</h3>
  
  <form onSubmit={handleSubmit}>
    <div className="form-group">
      <label htmlFor="nome">Nome:</label>
      <input type="text" id="nome" className="form-control" />
    </div>
    
    <div className="form-actions">
      <button type="submit" className="btn btn-success">Salvar</button>
      <button type="button" className="btn btn-primary">Cancelar</button>
    </div>
  </form>
</div>
```

---

**Mantenha a consistência!** Este sistema de design foi criado para proporcionar uma experiência visual única e coesa em todo o aplicativo.

