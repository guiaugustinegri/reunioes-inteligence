import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { seriesService } from '../services/seriesService'

function ReuniaoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    titulo_original: '',
    data_reuniao: '',
    resumo_ultra_conciso: '',
    resumo_conciso: '',
    resumo_ia: '',
    tarefas_guilherme: '',
    transcricao_completa: '',
    empresa_id: '',
    produto_id: '',
    serie_id: '',
    status: 'pendente',
    participantes: []
  })

  const [empresas, setEmpresas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [series, setSeries] = useState([])
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showNovoParticipante, setShowNovoParticipante] = useState(false)
  const [novoParticipante, setNovoParticipante] = useState({ nome: '', email: '' })

  useEffect(() => {
    carregarDados()
  }, [id])

  const carregarDados = async () => {
    try {
      setLoading(true)

      // Carregar empresas
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome')
        .order('nome')

      if (empresasError) throw empresasError

      // Carregar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, empresa_id')
        .order('nome')

      if (produtosError) throw produtosError

      // Carregar participantes
      const { data: participantesData, error: participantesError } = await supabase
        .from('participantes')
        .select('id, nome, email')
        .order('nome')

      if (participantesError) throw participantesError

      // Carregar séries
      const { data: seriesData, error: seriesError } = await seriesService.listarSeriesCompletas()
      if (seriesError) throw seriesError

      setEmpresas(empresasData || [])
      setProdutos(produtosData || [])
      setSeries(seriesData || [])
      setParticipantes(participantesData || [])

      // Se está editando, carregar dados da reunião
      if (isEdit) {
        const { data: reuniaoData, error: reuniaoError } = await supabase
          .from('reunioes')
          .select('*')
          .eq('id', id)
          .single()

        if (reuniaoError) throw reuniaoError

        if (reuniaoData) {
          setFormData({
            titulo_original: reuniaoData.titulo_original || '',
            data_reuniao: reuniaoData.data_reuniao ? 
              new Date(reuniaoData.data_reuniao).toISOString().split('T')[0] : '',
            resumo_ultra_conciso: reuniaoData.resumo_ultra_conciso || '',
            resumo_conciso: reuniaoData.resumo_conciso || '',
            resumo_ia: reuniaoData.resumo_ia || '',
            tarefas_guilherme: reuniaoData.tarefas_guilherme || '',
            transcricao_completa: reuniaoData.transcricao_completa || '',
            empresa_id: reuniaoData.empresa_id || '',
            produto_id: reuniaoData.produto_id || '',
            serie_id: reuniaoData.serie_id || '',
            status: reuniaoData.status || 'pendente',
            participantes: []
          })

          // Carregar participantes da reunião
          const { data: participantesReuniao, error: participantesReuniaoError } = await supabase
            .from('reuniao_participantes')
            .select('participante_id')
            .eq('reuniao_id', id)

          if (participantesReuniaoError) throw participantesReuniaoError

          setFormData(prev => ({
            ...prev,
            participantes: participantesReuniao?.map(p => p.participante_id) || []
          }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMessage('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Se mudou a empresa, limpar produto selecionado
    if (name === 'empresa_id') {
      setFormData(prev => ({
        ...prev,
        empresa_id: value,
        produto_id: ''
      }))
    }
  }

  const handleParticipanteChange = (participanteId, checked) => {
    setFormData(prev => ({
      ...prev,
      participantes: checked
        ? [...prev.participantes, participanteId]
        : prev.participantes.filter(id => id !== participanteId)
    }))
  }

  const criarNovoParticipante = async () => {
    if (!novoParticipante.nome.trim()) {
      setMessage('Nome do participante é obrigatório!')
      return
    }

    try {
      const { data, error } = await supabase
        .from('participantes')
        .insert({
          nome: novoParticipante.nome.trim(),
          email: novoParticipante.email.trim() || null
        })
        .select()
        .single()

      if (error) throw error

      // Adicionar à lista de participantes
      setParticipantes(prev => [...prev, data])
      
      // Auto-selecionar o novo participante
      setFormData(prev => ({
        ...prev,
        participantes: [...prev.participantes, data.id]
      }))

      // Limpar formulário
      setNovoParticipante({ nome: '', email: '' })
      setShowNovoParticipante(false)
      setMessage('Participante criado e adicionado à reunião!')
      
    } catch (error) {
      console.error('Erro ao criar participante:', error)
      setMessage('Erro ao criar participante: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const reuniaoData = {
        titulo_original: formData.titulo_original,
        data_reuniao: formData.data_reuniao ? `${formData.data_reuniao}T00:00:00.000Z` : null,
        resumo_ultra_conciso: formData.resumo_ultra_conciso,
        resumo_conciso: formData.resumo_conciso,
        resumo_ia: formData.resumo_ia,
        tarefas_guilherme: formData.tarefas_guilherme,
        transcricao_completa: formData.transcricao_completa,
        empresa_id: formData.empresa_id || null,
        produto_id: formData.produto_id || null,
        serie_id: formData.serie_id || null,
        status: formData.status
      }

      let reuniaoId

      if (isEdit) {
        // Atualizar reunião existente
        const { data, error } = await supabase
          .from('reunioes')
          .update(reuniaoData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        reuniaoId = data.id
      } else {
        // Criar nova reunião
        const { data, error } = await supabase
          .from('reunioes')
          .insert(reuniaoData)
          .select()
          .single()

        if (error) throw error
        reuniaoId = data.id
      }

      // Gerenciar participantes
      if (reuniaoId) {
        // Remover todos os participantes existentes
        await supabase
          .from('reuniao_participantes')
          .delete()
          .eq('reuniao_id', reuniaoId)

        // Adicionar novos participantes
        if (formData.participantes.length > 0) {
          const participantesData = formData.participantes.map(participanteId => ({
            reuniao_id: reuniaoId,
            participante_id: participanteId
          }))

          const { error: participantesError } = await supabase
            .from('reuniao_participantes')
            .insert(participantesData)

          if (participantesError) throw participantesError
        }
      }

      setMessage(isEdit ? 'Reunião atualizada com sucesso!' : 'Reunião criada com sucesso!')
      setTimeout(() => {
        navigate('/')
      }, 1500)

    } catch (error) {
      console.error('Erro ao salvar reunião:', error)
      setMessage('Erro ao salvar reunião: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const produtosFiltrados = formData.empresa_id 
    ? produtos.filter(produto => produto.empresa_id === formData.empresa_id)
    : produtos

  if (loading) {
    return <div className="main-content">Carregando...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>{isEdit ? 'Editar Reunião' : 'Nova Reunião'}</h2>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/')}
        >
          Voltar
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Erro') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="titulo_original">Título da Reunião:</label>
          <input
            type="text"
            id="titulo_original"
            name="titulo_original"
            className="form-control"
            value={formData.titulo_original}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="data_reuniao">Data da Reunião:</label>
          <input
            type="date"
            id="data_reuniao"
            name="data_reuniao"
            className="form-control"
            value={formData.data_reuniao}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="empresa_id">Empresa:</label>
          <select
            id="empresa_id"
            name="empresa_id"
            className="form-control"
            value={formData.empresa_id}
            onChange={handleInputChange}
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
          <label htmlFor="produto_id">Produto:</label>
          <select
            id="produto_id"
            name="produto_id"
            className="form-control"
            value={formData.produto_id}
            onChange={handleInputChange}
            disabled={!formData.empresa_id}
          >
            <option value="">Selecione um produto</option>
            {produtosFiltrados.map(produto => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="serie_id">Série/Projeto:</label>
          <select
            id="serie_id"
            name="serie_id"
            className="form-control"
            value={formData.serie_id}
            onChange={handleInputChange}
          >
            <option value="">Nenhuma série</option>
            {series.map(serie => (
              <option key={serie.id} value={serie.id}>
                {serie.nome} {serie.visivel_cliente && '(Cliente)'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            className="form-control"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="pendente">Pendente</option>
            <option value="tratada">Tratada</option>
          </select>
        </div>

        <div className="form-group">
          <label>Participantes:</label>
          
          {/* Botão para adicionar novo participante */}
          <div style={{ marginBottom: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => setShowNovoParticipante(!showNovoParticipante)}
            >
              {showNovoParticipante ? '−' : '+'} Adicionar Novo Participante
            </button>
          </div>

          {/* Formulário para novo participante */}
          {showNovoParticipante && (
            <div className="novo-participante-form" style={{ 
              padding: '1rem', 
              background: '#f9fafb', 
              border: '2px solid #d1d5db',
              marginBottom: '1rem'
            }}>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>Novo Participante</h4>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Nome do participante"
                  value={novoParticipante.nome}
                  onChange={(e) => setNovoParticipante({ ...novoParticipante, nome: e.target.value })}
                  className="form-control"
                  style={{ flex: 1 }}
                />
                <input
                  type="email"
                  placeholder="Email (opcional)"
                  value={novoParticipante.email}
                  onChange={(e) => setNovoParticipante({ ...novoParticipante, email: e.target.value })}
                  className="form-control"
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-success btn-sm"
                  onClick={criarNovoParticipante}
                >
                  Criar e Adicionar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowNovoParticipante(false)
                    setNovoParticipante({ nome: '', email: '' })
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de participantes existentes */}
          <div className="checkbox-group">
            {participantes.map(participante => (
              <div key={participante.id} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`participante-${participante.id}`}
                  checked={formData.participantes.includes(participante.id)}
                  onChange={(e) => handleParticipanteChange(participante.id, e.target.checked)}
                />
                <label htmlFor={`participante-${participante.id}`}>
                  {participante.nome} {participante.email && `(${participante.email})`}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="resumo_ultra_conciso">Resumo Ultra Conciso:</label>
          <textarea
            id="resumo_ultra_conciso"
            name="resumo_ultra_conciso"
            className="form-control"
            value={formData.resumo_ultra_conciso}
            onChange={handleInputChange}
            placeholder="Resumo ultra conciso da reunião (poucas linhas)..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="resumo_conciso">Resumo Conciso:</label>
          <textarea
            id="resumo_conciso"
            name="resumo_conciso"
            className="form-control"
            value={formData.resumo_conciso}
            onChange={handleInputChange}
            placeholder="Resumo conciso da reunião..."
            rows="5"
          />
        </div>

        <div className="form-group">
          <label htmlFor="resumo_ia">Resumo IA (Para Clientes):</label>
          <textarea
            id="resumo_ia"
            name="resumo_ia"
            className="form-control"
            value={formData.resumo_ia}
            onChange={handleInputChange}
            placeholder="Resumo gerado por IA para enviar aos clientes..."
            rows="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tarefas_guilherme">To-do Guilherme:</label>
          <textarea
            id="tarefas_guilherme"
            name="tarefas_guilherme"
            className="form-control"
            value={formData.tarefas_guilherme}
            onChange={handleInputChange}
            placeholder="Lista de tarefas do Guilherme..."
            rows="5"
          />
        </div>

        <div className="form-group">
          <label htmlFor="transcricao_completa">Transcrição Completa:</label>
          <textarea
            id="transcricao_completa"
            name="transcricao_completa"
            className="form-control large"
            value={formData.transcricao_completa}
            onChange={handleInputChange}
            placeholder="Cole aqui a transcrição completa do áudio..."
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-success"
            disabled={saving}
          >
            {saving ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')}
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ marginLeft: '1rem' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default ReuniaoForm
