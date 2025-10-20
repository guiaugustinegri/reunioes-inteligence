import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { listarTags, criarTag, atualizarTag, excluirTag } from '../services/tagsService'
import './Gerenciar.css'

function Gerenciar() {
  const [activeTab, setActiveTab] = useState('empresas')
  const [message, setMessage] = useState('')

  const clearMessage = () => {
    setTimeout(() => setMessage(''), 5000)
  }

  const handleMessage = (msg) => {
    setMessage(msg)
    clearMessage()
  }

  return (
    <div className="gerenciar-page">
      <div className="page-header-gerenciar">
        <div className="header-content">
          <h2>GERENCIAMENTO DE DADOS</h2>
          <p className="header-subtitle">Configure empresas, produtos e participantes do sistema</p>
        </div>
      </div>

      {message && (
        <div className={`message-banner ${message.includes('Erro') ? 'error' : 'success'}`}>
          <div className="message-content">
            <span className="message-icon">{message.includes('Erro') ? '✕' : '✓'}</span>
            <span>{message}</span>
          </div>
          <button className="message-close" onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs-gerenciar">
          <button 
            className={`tab-gerenciar ${activeTab === 'empresas' ? 'active' : ''}`}
            onClick={() => setActiveTab('empresas')}
          >
            <span className="tab-icon">■</span>
            <span>EMPRESAS</span>
          </button>
          <button 
            className={`tab-gerenciar ${activeTab === 'produtos' ? 'active' : ''}`}
            onClick={() => setActiveTab('produtos')}
          >
            <span className="tab-icon">■</span>
            <span>PRODUTOS</span>
          </button>
          <button 
            className={`tab-gerenciar ${activeTab === 'participantes' ? 'active' : ''}`}
            onClick={() => setActiveTab('participantes')}
          >
            <span className="tab-icon">■</span>
            <span>PARTICIPANTES</span>
          </button>
          <button 
            className={`tab-gerenciar ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            <span className="tab-icon">■</span>
            <span>TAGS</span>
          </button>
        </div>
      </div>

      <div className="tab-content-gerenciar">
        {activeTab === 'empresas' && <EmpresasManager onMessage={handleMessage} />}
        {activeTab === 'produtos' && <ProdutosManager onMessage={handleMessage} />}
        {activeTab === 'participantes' && <ParticipantesManager onMessage={handleMessage} />}
        {activeTab === 'tags' && <TagsManager onMessage={handleMessage} />}
      </div>
    </div>
  )
}

// Componente para gerenciar empresas
function EmpresasManager({ onMessage }) {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ id: null, nome: '', descricao: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isFormExpanded, setIsFormExpanded] = useState(false)

  useEffect(() => {
    carregarEmpresas()
  }, [])

  const carregarEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome')

      if (error) throw error
      setEmpresas(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      onMessage('Erro ao carregar empresas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('empresas')
          .update({ nome: formData.nome, descricao: formData.descricao })
          .eq('id', formData.id)

        if (error) throw error
        onMessage('Empresa atualizada com sucesso!')
      } else {
        // Criar nova empresa
        const { error } = await supabase
          .from('empresas')
          .insert({ nome: formData.nome, descricao: formData.descricao })

        if (error) throw error
        onMessage('Empresa criada com sucesso!')
      }

      setFormData({ id: null, nome: '', descricao: '' })
      setIsEditing(false)
      setIsFormExpanded(false)
      carregarEmpresas()
    } catch (error) {
      console.error('Erro ao salvar empresa:', error)
      onMessage('Erro ao salvar empresa: ' + error.message)
    }
  }

  const editarEmpresa = (empresa) => {
    setFormData({ id: empresa.id, nome: empresa.nome, descricao: empresa.descricao || '' })
    setIsEditing(true)
    setIsFormExpanded(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setFormData({ id: null, nome: '', descricao: '' })
    setIsEditing(false)
    setIsFormExpanded(false)
  }

  const excluirEmpresa = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)

      if (error) throw error

      onMessage('Empresa excluída com sucesso!')
      carregarEmpresas()
    } catch (error) {
      console.error('Erro ao excluir empresa:', error)
      onMessage('Erro ao excluir empresa: ' + error.message)
    }
  }

  if (loading) return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>CARREGANDO DADOS...</p>
    </div>
  )

  return (
    <div className="manager-container">
      <div className="form-card">
        <div className="form-card-header" onClick={() => setIsFormExpanded(!isFormExpanded)}>
          <div className="form-card-title">
            <span className="form-icon">▼</span>
            <h3>{isEditing ? 'EDITAR EMPRESA' : 'NOVA EMPRESA'}</h3>
          </div>
          <button 
            type="button" 
            className="btn-toggle-form"
          >
            {isFormExpanded ? '▲' : '▼'}
          </button>
        </div>
        
        {isFormExpanded && (
          <form onSubmit={handleSubmit} className="form-modern">
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="nome">NOME DA EMPRESA</label>
                <input
                  type="text"
                  id="nome"
                  className="input-modern"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome da empresa..."
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="descricao">DESCRIÇÃO</label>
                <textarea
                  id="descricao"
                  className="textarea-modern"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Adicione uma descrição (opcional)..."
                  rows="4"
                />
              </div>
            </div>
            
            <div className="form-actions-modern">
              <button type="submit" className="btn btn-success">
                {isEditing ? '✓ ATUALIZAR' : '+ ADICIONAR'}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-primary" onClick={cancelarEdicao}>
                  ✕ CANCELAR
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="data-section">
        <div className="section-header">
          <h3>EMPRESAS CADASTRADAS</h3>
          <span className="count-badge">{empresas.length}</span>
        </div>
        
        {empresas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">□</div>
            <p>Nenhuma empresa cadastrada</p>
            <span className="empty-hint">Clique em "Nova Empresa" para começar</span>
          </div>
        ) : (
          <div className="data-table-modern">
            <div className="table-header-modern">
              <div className="col-empresa-nome">EMPRESA</div>
              <div className="col-empresa-desc">DESCRIÇÃO</div>
              <div className="col-empresa-actions">AÇÕES</div>
            </div>
            <div className="table-body-modern">
              {empresas.map(empresa => (
                <div key={empresa.id} className="table-row-modern">
                  <div className="col-empresa-nome">
                    <span className="empresa-marker">■</span>
                    <span className="empresa-name">{empresa.nome}</span>
                  </div>
                  <div className="col-empresa-desc">
                    {empresa.descricao || <span className="text-muted">—</span>}
                  </div>
                  <div className="col-empresa-actions">
                    <button 
                      className="btn-action btn-edit"
                      onClick={() => editarEmpresa(empresa)}
                      title="Editar empresa"
                    >
                      EDITAR
                    </button>
                    <button 
                      className="btn-action btn-delete"
                      onClick={() => excluirEmpresa(empresa.id)}
                      title="Excluir empresa"
                    >
                      EXCLUIR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para gerenciar produtos
function ProdutosManager({ onMessage }) {
  const [produtos, setProdutos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [participantes, setParticipantes] = useState([])
  const [participantesProduto, setParticipantesProduto] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ id: null, nome: '', descricao: '', empresa_id: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isFormExpanded, setIsFormExpanded] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const [produtosRes, empresasRes, participantesRes] = await Promise.all([
        supabase.from('produtos').select('*, empresas!produtos_empresa_id_fkey(nome)').order('nome'),
        supabase.from('empresas').select('id, nome').order('nome'),
        supabase.from('participantes').select('id, nome, email').order('nome')
      ])

      if (produtosRes.error) throw produtosRes.error
      if (empresasRes.error) throw empresasRes.error
      if (participantesRes.error) throw participantesRes.error

      setProdutos(produtosRes.data || [])
      setEmpresas(empresasRes.data || [])
      setParticipantes(participantesRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      onMessage('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('produtos')
          .update({ nome: formData.nome, descricao: formData.descricao, empresa_id: formData.empresa_id })
          .eq('id', formData.id)

        if (error) throw error
        onMessage('Produto atualizado com sucesso!')
      } else {
        // Criar novo produto
        const { error } = await supabase
          .from('produtos')
          .insert({ nome: formData.nome, descricao: formData.descricao, empresa_id: formData.empresa_id })

        if (error) throw error
        onMessage('Produto criado com sucesso!')
      }

      setFormData({ id: null, nome: '', descricao: '', empresa_id: '' })
      setIsEditing(false)
      setIsFormExpanded(false)
      carregarDados()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      onMessage('Erro ao salvar produto: ' + error.message)
    }
  }

  const carregarParticipantesProduto = async (produtoId) => {
    try {
      const { data, error } = await supabase
        .from('produto_participantes')
        .select(`
          participantes!produto_participantes_participante_id_fkey(id, nome, email)
        `)
        .eq('produto_id', produtoId)

      if (error) throw error
      setParticipantesProduto(data?.map(p => p.participantes) || [])
    } catch (error) {
      console.error('Erro ao carregar participantes do produto:', error)
      onMessage('Erro ao carregar participantes: ' + error.message)
    }
  }

  const associarParticipante = async (produtoId, participanteId) => {
    try {
      const { error } = await supabase
        .from('produto_participantes')
        .insert({ produto_id: produtoId, participante_id: participanteId })

      if (error) throw error
      carregarParticipantesProduto(produtoId)
      onMessage('Participante associado com sucesso!')
    } catch (error) {
      console.error('Erro ao associar participante:', error)
      onMessage('Erro ao associar participante: ' + error.message)
    }
  }

  const desassociarParticipante = async (produtoId, participanteId) => {
    try {
      const { error } = await supabase
        .from('produto_participantes')
        .delete()
        .eq('produto_id', produtoId)
        .eq('participante_id', participanteId)

      if (error) throw error
      carregarParticipantesProduto(produtoId)
      onMessage('Participante removido com sucesso!')
    } catch (error) {
      console.error('Erro ao remover participante:', error)
      onMessage('Erro ao remover participante: ' + error.message)
    }
  }

  const editarProduto = async (produto) => {
    setFormData({ 
      id: produto.id, 
      nome: produto.nome, 
      descricao: produto.descricao || '', 
      empresa_id: produto.empresa_id || '' 
    })
    setIsEditing(true)
    setIsFormExpanded(true)
    await carregarParticipantesProduto(produto.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setFormData({ id: null, nome: '', descricao: '', empresa_id: '' })
    setIsEditing(false)
    setIsFormExpanded(false)
  }

  const excluirProduto = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)

      if (error) throw error

      onMessage('Produto excluído com sucesso!')
      carregarDados()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      onMessage('Erro ao excluir produto: ' + error.message)
    }
  }

  if (loading) return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>CARREGANDO DADOS...</p>
    </div>
  )

  return (
    <div className="manager-container">
      <div className="form-card">
        <div className="form-card-header" onClick={() => setIsFormExpanded(!isFormExpanded)}>
          <div className="form-card-title">
            <span className="form-icon">▼</span>
            <h3>{isEditing ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}</h3>
          </div>
          <button 
            type="button" 
            className="btn-toggle-form"
          >
            {isFormExpanded ? '▲' : '▼'}
          </button>
        </div>
        
        {isFormExpanded && (
          <form onSubmit={handleSubmit} className="form-modern">
            <div className="form-row-double">
              <div className="form-field">
                <label htmlFor="nome">NOME DO PRODUTO</label>
                <input
                  type="text"
                  id="nome"
                  className="input-modern"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome do produto..."
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="empresa_id">EMPRESA</label>
                <select
                  id="empresa_id"
                  className="select-modern"
                  value={formData.empresa_id}
                  onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                  required
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="descricao">DESCRIÇÃO</label>
                <textarea
                  id="descricao"
                  className="textarea-modern"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Adicione uma descrição (opcional)..."
                  rows="4"
                />
              </div>
            </div>

            {/* Seção de Participantes - Apenas ao editar */}
            {isEditing && (
              <div className="participantes-section">
                <div className="participantes-header">
                  <h4>PARTICIPANTES DO PRODUTO</h4>
                  <span className="participantes-count">{participantesProduto.length} selecionados</span>
                </div>
                <div className="participantes-grid">
                  {participantes.map(participante => {
                    const isAssociado = participantesProduto.some(p => p.id === participante.id)
                    return (
                      <div key={participante.id} className="checkbox-card">
                        <input
                          type="checkbox"
                          id={`participante-${participante.id}`}
                          checked={isAssociado}
                          onChange={(e) => {
                            if (e.target.checked) {
                              associarParticipante(formData.id, participante.id)
                            } else {
                              desassociarParticipante(formData.id, participante.id)
                            }
                          }}
                        />
                        <label htmlFor={`participante-${participante.id}`} className="checkbox-label">
                          <span className="checkbox-name">{participante.nome}</span>
                          {participante.email && (
                            <span className="checkbox-email">{participante.email}</span>
                          )}
                        </label>
                      </div>
                    )
                  })}
                </div>
                {participantes.length === 0 && (
                  <div className="empty-hint-box">
                    Nenhum participante cadastrado. Vá na aba "Participantes" para criar novos.
                  </div>
                )}
              </div>
            )}

            <div className="form-actions-modern">
              <button type="submit" className="btn btn-success">
                {isEditing ? '✓ ATUALIZAR' : '+ ADICIONAR'}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-primary" onClick={cancelarEdicao}>
                  ✕ CANCELAR
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="data-section">
        <div className="section-header">
          <h3>PRODUTOS CADASTRADOS</h3>
          <span className="count-badge">{produtos.length}</span>
        </div>
        
        {produtos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">□</div>
            <p>Nenhum produto cadastrado</p>
            <span className="empty-hint">Clique em "Novo Produto" para começar</span>
          </div>
        ) : (
          <div className="data-table-modern">
            <div className="table-header-modern">
              <div className="col-produto-nome">PRODUTO</div>
              <div className="col-produto-empresa">EMPRESA</div>
              <div className="col-produto-desc">DESCRIÇÃO</div>
              <div className="col-produto-actions">AÇÕES</div>
            </div>
            <div className="table-body-modern">
              {produtos.map(produto => (
                <div key={produto.id} className="table-row-modern">
                  <div className="col-produto-nome">
                    <span className="produto-marker">■</span>
                    <span className="produto-name">{produto.nome}</span>
                  </div>
                  <div className="col-produto-empresa">
                    {produto.empresas?.nome || <span className="text-muted">—</span>}
                  </div>
                  <div className="col-produto-desc">
                    {produto.descricao || <span className="text-muted">—</span>}
                  </div>
                  <div className="col-produto-actions">
                    <button 
                      className="btn-action btn-edit"
                      onClick={() => editarProduto(produto)}
                      title="Editar produto"
                    >
                      EDITAR
                    </button>
                    <button 
                      className="btn-action btn-delete"
                      onClick={() => excluirProduto(produto.id)}
                      title="Excluir produto"
                    >
                      EXCLUIR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para gerenciar participantes
function ParticipantesManager({ onMessage }) {
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ id: null, nome: '', email: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [isFormExpanded, setIsFormExpanded] = useState(false)

  useEffect(() => {
    carregarParticipantes()
  }, [])

  const carregarParticipantes = async () => {
    try {
      const { data, error } = await supabase
        .from('participantes')
        .select('*')
        .order('nome')

      if (error) throw error
      setParticipantes(data || [])
    } catch (error) {
      console.error('Erro ao carregar participantes:', error)
      onMessage('Erro ao carregar participantes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        // Atualizar participante existente
        const { error } = await supabase
          .from('participantes')
          .update({ nome: formData.nome, email: formData.email })
          .eq('id', formData.id)

        if (error) throw error
        onMessage('Participante atualizado com sucesso!')
      } else {
        // Criar novo participante
        const { error } = await supabase
          .from('participantes')
          .insert({ nome: formData.nome, email: formData.email })

        if (error) throw error
        onMessage('Participante criado com sucesso!')
      }

      setFormData({ id: null, nome: '', email: '' })
      setIsEditing(false)
      setIsFormExpanded(false)
      carregarParticipantes()
    } catch (error) {
      console.error('Erro ao salvar participante:', error)
      onMessage('Erro ao salvar participante: ' + error.message)
    }
  }

  const editarParticipante = (participante) => {
    setFormData({ id: participante.id, nome: participante.nome, email: participante.email || '' })
    setIsEditing(true)
    setIsFormExpanded(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setFormData({ id: null, nome: '', email: '' })
    setIsEditing(false)
    setIsFormExpanded(false)
  }

  const excluirParticipante = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este participante?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('participantes')
        .delete()
        .eq('id', id)

      if (error) throw error

      onMessage('Participante excluído com sucesso!')
      carregarParticipantes()
    } catch (error) {
      console.error('Erro ao excluir participante:', error)
      onMessage('Erro ao excluir participante: ' + error.message)
    }
  }

  if (loading) return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>CARREGANDO DADOS...</p>
    </div>
  )

  return (
    <div className="manager-container">
      <div className="form-card">
        <div className="form-card-header" onClick={() => setIsFormExpanded(!isFormExpanded)}>
          <div className="form-card-title">
            <span className="form-icon">▼</span>
            <h3>{isEditing ? 'EDITAR PARTICIPANTE' : 'NOVO PARTICIPANTE'}</h3>
          </div>
          <button 
            type="button" 
            className="btn-toggle-form"
          >
            {isFormExpanded ? '▲' : '▼'}
          </button>
        </div>
        
        {isFormExpanded && (
          <form onSubmit={handleSubmit} className="form-modern">
            <div className="form-row-double">
              <div className="form-field">
                <label htmlFor="nome">NOME COMPLETO</label>
                <input
                  type="text"
                  id="nome"
                  className="input-modern"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome completo..."
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="email">E-MAIL</label>
                <input
                  type="email"
                  id="email"
                  className="input-modern"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>
            
            <div className="form-actions-modern">
              <button type="submit" className="btn btn-success">
                {isEditing ? '✓ ATUALIZAR' : '+ ADICIONAR'}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-primary" onClick={cancelarEdicao}>
                  ✕ CANCELAR
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="data-section">
        <div className="section-header">
          <h3>PARTICIPANTES CADASTRADOS</h3>
          <span className="count-badge">{participantes.length}</span>
        </div>
        
        {participantes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">□</div>
            <p>Nenhum participante cadastrado</p>
            <span className="empty-hint">Clique em "Novo Participante" para começar</span>
          </div>
        ) : (
          <div className="data-table-modern">
            <div className="table-header-modern">
              <div className="col-participante-nome">PARTICIPANTE</div>
              <div className="col-participante-email">E-MAIL</div>
              <div className="col-participante-actions">AÇÕES</div>
            </div>
            <div className="table-body-modern">
              {participantes.map(participante => (
                <div key={participante.id} className="table-row-modern">
                  <div className="col-participante-nome">
                    <span className="participante-marker">■</span>
                    <span className="participante-name">{participante.nome}</span>
                  </div>
                  <div className="col-participante-email">
                    {participante.email || <span className="text-muted">—</span>}
                  </div>
                  <div className="col-participante-actions">
                    <button 
                      className="btn-action btn-edit"
                      onClick={() => editarParticipante(participante)}
                      title="Editar participante"
                    >
                      EDITAR
                    </button>
                    <button 
                      className="btn-action btn-delete"
                      onClick={() => excluirParticipante(participante.id)}
                      title="Excluir participante"
                    >
                      EXCLUIR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para gerenciar tags
function TagsManager({ onMessage }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ id: null, nome: '', cor: '#3b82f6' })
  const [isEditing, setIsEditing] = useState(false)
  const [isFormExpanded, setIsFormExpanded] = useState(false)

  useEffect(() => {
    carregarTags()
  }, [])

  const carregarTags = async () => {
    try {
      const { data, error } = await listarTags()

      if (error) throw error
      setTags(data || [])
    } catch (error) {
      console.error('Erro ao carregar tags:', error)
      onMessage('Erro ao carregar tags: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        // Atualizar tag existente
        const { error } = await atualizarTag(formData.id, formData.nome, formData.cor)

        if (error) throw error
        onMessage('Tag atualizada com sucesso!')
      } else {
        // Criar nova tag
        const { error } = await criarTag(formData.nome, formData.cor)

        if (error) throw error
        onMessage('Tag criada com sucesso!')
      }

      setFormData({ id: null, nome: '', cor: '#3b82f6' })
      setIsEditing(false)
      setIsFormExpanded(false)
      carregarTags()
    } catch (error) {
      console.error('Erro ao salvar tag:', error)
      onMessage('Erro ao salvar tag: ' + error.message)
    }
  }

  const editarTag = (tag) => {
    setFormData({ id: tag.id, nome: tag.nome, cor: tag.cor })
    setIsEditing(true)
    setIsFormExpanded(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setFormData({ id: null, nome: '', cor: '#3b82f6' })
    setIsEditing(false)
    setIsFormExpanded(false)
  }

  const excluirTagConfirm = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta tag? Ela será removida de todas as reuniões.')) {
      return
    }

    try {
      const { error } = await excluirTag(id)

      if (error) throw error

      onMessage('Tag excluída com sucesso!')
      carregarTags()
    } catch (error) {
      console.error('Erro ao excluir tag:', error)
      onMessage('Erro ao excluir tag: ' + error.message)
    }
  }

  // Função para determinar se o texto deve ser branco ou preto baseado na cor de fundo
  const getContrastColor = (hexColor) => {
    // Remover o # se presente
    const color = hexColor.replace('#', '')
    
    // Converter para RGB
    const r = parseInt(color.substr(0, 2), 16)
    const g = parseInt(color.substr(2, 2), 16)
    const b = parseInt(color.substr(4, 2), 16)
    
    // Calcular luminosidade
    const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Retornar preto para cores claras, branco para cores escuras
    return luminosity > 0.5 ? '#000' : '#fff'
  }

  if (loading) return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>CARREGANDO DADOS...</p>
    </div>
  )

  return (
    <div className="manager-container">
      <div className="form-card">
        <div className="form-card-header" onClick={() => setIsFormExpanded(!isFormExpanded)}>
          <div className="form-card-title">
            <span className="form-icon">▼</span>
            <h3>{isEditing ? 'EDITAR TAG' : 'NOVA TAG'}</h3>
          </div>
          <button 
            type="button" 
            className="btn-toggle-form"
          >
            {isFormExpanded ? '▲' : '▼'}
          </button>
        </div>
        
        {isFormExpanded && (
          <form onSubmit={handleSubmit} className="form-modern">
            <div className="form-row-double">
              <div className="form-field">
                <label htmlFor="nome">NOME DA TAG</label>
                <input
                  type="text"
                  id="nome"
                  className="input-modern"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome da tag..."
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="cor">COR DA TAG</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    id="cor"
                    className="color-picker"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    className="color-text-input"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="#000000"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                  <div 
                    className="color-preview"
                    style={{ 
                      backgroundColor: formData.cor,
                      border: '2px solid #000'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-actions-modern">
              <button type="submit" className="btn btn-success">
                {isEditing ? '✓ ATUALIZAR' : '+ ADICIONAR'}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-primary" onClick={cancelarEdicao}>
                  ✕ CANCELAR
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="data-section">
        <div className="section-header">
          <h3>TAGS CADASTRADAS</h3>
          <span className="count-badge">{tags.length}</span>
        </div>
        
        {tags.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">□</div>
            <p>Nenhuma tag cadastrada</p>
            <span className="empty-hint">Clique em "Nova Tag" para começar</span>
          </div>
        ) : (
          <div className="data-table-modern">
            <div className="table-header-modern">
              <div className="col-tag-nome">TAG</div>
              <div className="col-tag-cor">COR</div>
              <div className="col-tag-actions">AÇÕES</div>
            </div>
            <div className="table-body-modern">
              {tags.map(tag => (
                <div key={tag.id} className="table-row-modern">
                  <div className="col-tag-nome">
                    <div 
                      className="tag-badge-large"
                      style={{ 
                        backgroundColor: tag.cor,
                        color: getContrastColor(tag.cor),
                        border: '2px solid #000'
                      }}
                    >
                      {tag.nome}
                    </div>
                  </div>
                  <div className="col-tag-cor">
                    <span className="tag-color-code">{tag.cor.toUpperCase()}</span>
                  </div>
                  <div className="col-tag-actions">
                    <button 
                      className="btn-action btn-edit"
                      onClick={() => editarTag(tag)}
                      title="Editar tag"
                    >
                      EDITAR
                    </button>
                    <button 
                      className="btn-action btn-delete"
                      onClick={() => excluirTagConfirm(tag.id)}
                      title="Excluir tag"
                    >
                      EXCLUIR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Gerenciar