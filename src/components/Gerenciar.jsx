import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

function Gerenciar() {
  const [activeTab, setActiveTab] = useState('empresas')
  const [message, setMessage] = useState('')

  return (
    <div>
      <div className="page-header">
        <h2>Gerenciar Dados</h2>
      </div>

      {message && (
        <div className={`message ${message.includes('Erro') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'empresas' ? 'active' : ''}`}
          onClick={() => setActiveTab('empresas')}
        >
          Empresas
        </button>
        <button 
          className={`tab ${activeTab === 'produtos' ? 'active' : ''}`}
          onClick={() => setActiveTab('produtos')}
        >
          Produtos
        </button>
        <button 
          className={`tab ${activeTab === 'participantes' ? 'active' : ''}`}
          onClick={() => setActiveTab('participantes')}
        >
          Participantes
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'empresas' && <EmpresasManager onMessage={setMessage} />}
        {activeTab === 'produtos' && <ProdutosManager onMessage={setMessage} />}
        {activeTab === 'participantes' && <ParticipantesManager onMessage={setMessage} />}
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
      carregarEmpresas()
    } catch (error) {
      console.error('Erro ao salvar empresa:', error)
      onMessage('Erro ao salvar empresa: ' + error.message)
    }
  }

  const editarEmpresa = (empresa) => {
    setFormData({ id: empresa.id, nome: empresa.nome, descricao: empresa.descricao || '' })
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setFormData({ id: null, nome: '', descricao: '' })
    setIsEditing(false)
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

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      <div className="form-container">
        <h3>{isEditing ? 'Editar Empresa' : 'Adicionar Nova Empresa'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome:</label>
            <input
              type="text"
              id="nome"
              className="form-control"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="descricao">Descrição:</label>
            <textarea
              id="descricao"
              className="form-control"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              {isEditing ? 'Atualizar' : 'Adicionar'}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-primary" onClick={cancelarEdicao}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-container">
        <h3>Empresas Cadastradas</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                  Nenhuma empresa cadastrada
                </td>
              </tr>
            ) : (
              empresas.map(empresa => (
                <tr key={empresa.id}>
                  <td>{empresa.nome}</td>
                  <td>{empresa.descricao || '-'}</td>
                  <td>
                    <button 
                      className="btn btn-primary"
                      onClick={() => editarEmpresa(empresa)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => excluirEmpresa(empresa.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Componente para gerenciar produtos
function ProdutosManager({ onMessage }) {
  const [produtos, setProdutos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ id: null, nome: '', descricao: '', empresa_id: '' })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const [produtosRes, empresasRes] = await Promise.all([
        supabase.from('produtos').select('*, empresas!produtos_empresa_id_fkey(nome)').order('nome'),
        supabase.from('empresas').select('id, nome').order('nome')
      ])

      if (produtosRes.error) throw produtosRes.error
      if (empresasRes.error) throw empresasRes.error

      setProdutos(produtosRes.data || [])
      setEmpresas(empresasRes.data || [])
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
      carregarDados()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      onMessage('Erro ao salvar produto: ' + error.message)
    }
  }

  const editarProduto = (produto) => {
    setFormData({ 
      id: produto.id, 
      nome: produto.nome, 
      descricao: produto.descricao || '', 
      empresa_id: produto.empresa_id || '' 
    })
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setFormData({ id: null, nome: '', descricao: '', empresa_id: '' })
    setIsEditing(false)
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

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      <div className="form-container">
        <h3>{isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome:</label>
            <input
              type="text"
              id="nome"
              className="form-control"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="empresa_id">Empresa:</label>
            <select
              id="empresa_id"
              className="form-control"
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
          <div className="form-group">
            <label htmlFor="descricao">Descrição:</label>
            <textarea
              id="descricao"
              className="form-control"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              {isEditing ? 'Atualizar' : 'Adicionar'}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-primary" onClick={cancelarEdicao}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-container">
        <h3>Produtos Cadastrados</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Empresa</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                  Nenhum produto cadastrado
                </td>
              </tr>
            ) : (
              produtos.map(produto => (
                <tr key={produto.id}>
                  <td>{produto.nome}</td>
                  <td>{produto.empresas?.nome || '-'}</td>
                  <td>{produto.descricao || '-'}</td>
                  <td>
                    <button 
                      className="btn btn-primary"
                      onClick={() => editarProduto(produto)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => excluirProduto(produto.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
      carregarParticipantes()
    } catch (error) {
      console.error('Erro ao salvar participante:', error)
      onMessage('Erro ao salvar participante: ' + error.message)
    }
  }

  const editarParticipante = (participante) => {
    setFormData({ id: participante.id, nome: participante.nome, email: participante.email || '' })
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicao = () => {
    setFormData({ id: null, nome: '', email: '' })
    setIsEditing(false)
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

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      <div className="form-container">
        <h3>{isEditing ? 'Editar Participante' : 'Adicionar Novo Participante'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome:</label>
            <input
              type="text"
              id="nome"
              className="form-control"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-mail:</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              {isEditing ? 'Atualizar' : 'Adicionar'}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-primary" onClick={cancelarEdicao}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-container">
        <h3>Participantes Cadastrados</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {participantes.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                  Nenhum participante cadastrado
                </td>
              </tr>
            ) : (
              participantes.map(participante => (
                <tr key={participante.id}>
                  <td>{participante.nome}</td>
                  <td>{participante.email || '-'}</td>
                  <td>
                    <button 
                      className="btn btn-primary"
                      onClick={() => editarParticipante(participante)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => excluirParticipante(participante.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Gerenciar