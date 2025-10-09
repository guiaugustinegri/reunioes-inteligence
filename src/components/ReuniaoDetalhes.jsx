import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'

function ReuniaoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [reuniao, setReuniao] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    carregarReuniao()
  }, [id])

  const carregarReuniao = async () => {
    try {
      setLoading(true)

      // Carregar reunião com joins
      const { data: reuniaoData, error: reuniaoError } = await supabase
        .from('reunioes')
        .select(`
          *,
          empresas!reunioes_empresa_id_fkey(nome),
          produtos!reunioes_produto_id_fkey(nome)
        `)
        .eq('id', id)
        .single()

      if (reuniaoError) throw reuniaoError

      setReuniao(reuniaoData)

      // Carregar participantes da reunião
      const { data: participantesData, error: participantesError } = await supabase
        .from('reuniao_participantes')
        .select(`
          participantes!reuniao_participantes_participante_id_fkey(id, nome, email)
        `)
        .eq('reuniao_id', id)

      if (participantesError) throw participantesError

      setParticipantes(participantesData?.map(p => p.participantes) || [])
    } catch (error) {
      console.error('Erro ao carregar reunião:', error)
      setMessage('Erro ao carregar reunião: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const excluirReuniao = async () => {
    if (!confirm('Tem certeza que deseja excluir esta reunião?')) {
      return
    }

    try {
      // Primeiro excluir relacionamentos
      await supabase
        .from('reuniao_participantes')
        .delete()
        .eq('reuniao_id', id)

      // Depois excluir a reunião
      const { error } = await supabase
        .from('reunioes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage('Reunião excluída com sucesso!')
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (error) {
      console.error('Erro ao excluir reunião:', error)
      setMessage('Erro ao excluir reunião: ' + error.message)
    }
  }

  const marcarComoTratada = async () => {
    const novoStatus = reuniao.status === 'tratada' ? 'pendente' : 'tratada'
    
    try {
      const { error } = await supabase
        .from('reunioes')
        .update({ status: novoStatus })
        .eq('id', id)

      if (error) throw error

      setMessage(`Reunião marcada como ${novoStatus === 'tratada' ? 'tratada' : 'pendente'}!`)
      carregarReuniao()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setMessage('Erro ao atualizar status: ' + error.message)
    }
  }

  const formatarData = (data) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return <div className="main-content">Carregando...</div>
  }

  if (!reuniao) {
    return (
      <div className="main-content">
        <div className="message error">Reunião não encontrada</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Detalhes da Reunião</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Voltar
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('Erro') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="reuniao-detalhes">
        {/* Card de Informações Básicas */}
        <div className="detalhes-card">
          <div className="detalhes-header">
            <h3>Informações Básicas</h3>
            <button 
              className={`status-badge status-clickable ${reuniao.status === 'tratada' ? 'status-tratada' : 'status-pendente'}`}
              onClick={marcarComoTratada}
              title={`Clique para marcar como ${reuniao.status === 'tratada' ? 'pendente' : 'tratada'}`}
            >
              {reuniao.status === 'tratada' ? 'Tratada' : 'Pendente'}
            </button>
          </div>
          <div className="detalhes-grid">
            <div className="detalhe-item">
              <label>Título:</label>
              <div className="detalhe-valor">{reuniao.titulo_original || '-'}</div>
            </div>
            <div className="detalhe-item">
              <label>Data:</label>
              <div className="detalhe-valor">{formatarData(reuniao.data_reuniao)}</div>
            </div>
            <div className="detalhe-item">
              <label>Empresa:</label>
              <div className="detalhe-valor">{reuniao.empresas?.nome || '-'}</div>
            </div>
            <div className="detalhe-item">
              <label>Produto:</label>
              <div className="detalhe-valor">{reuniao.produtos?.nome || '-'}</div>
            </div>
          </div>
        </div>

        {/* Card de Participantes */}
        {participantes.length > 0 && (
          <div className="detalhes-card">
            <h3>Participantes</h3>
            <div className="participantes-list">
              {participantes.map(participante => (
                <div key={participante.id} className="participante-item">
                  {participante.nome}
                  {participante.email && <span className="participante-email"> ({participante.email})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card de Resumo Ultra Conciso */}
        {reuniao.resumo_ultra_conciso && (
          <div className="detalhes-card">
            <h3>Resumo Ultra Conciso</h3>
            <div className="detalhe-texto">{reuniao.resumo_ultra_conciso}</div>
          </div>
        )}

        {/* Card de Resumo Conciso */}
        {reuniao.resumo_conciso && (
          <div className="detalhes-card">
            <h3>Resumo Conciso</h3>
            <div className="detalhe-texto">{reuniao.resumo_conciso}</div>
          </div>
        )}

        {/* Card de To-do Guilherme */}
        {reuniao.tarefas_guilherme && (
          <div className="detalhes-card">
            <h3>To-do Guilherme</h3>
            <div className="detalhe-texto">{reuniao.tarefas_guilherme}</div>
          </div>
        )}

        {/* Card de Resumo IA */}
        {reuniao.resumo_ia && (
          <div className="detalhes-card">
            <div className="detalhes-header">
              <h3>Resumo IA (Para Clientes)</h3>
              <div className="resumo-ia-actions">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => window.open(`/resumo-ia/${reuniao.id}`, '_blank')}
                  title="Gerar PDF"
                >
                  PDF
                </button>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => window.open(`/resumo-ia/${reuniao.id}`, '_blank')}
                  title="Enviar Email"
                >
                  Email
                </button>
              </div>
            </div>
            <div 
              className="detalhe-texto resumo-ia-html" 
              dangerouslySetInnerHTML={{ __html: reuniao.resumo_ia }}
            />
          </div>
        )}

        {/* Card de Transcrição */}
        {reuniao.transcricao_completa && (
          <div className="detalhes-card">
            <h3>Transcrição Completa</h3>
            <div className="detalhe-texto transcricao">{reuniao.transcricao_completa}</div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="detalhes-actions">
          <Link to={`/resumo-ia/${reuniao.id}`} className="btn btn-success">
            Ver Resumo IA
          </Link>
          <Link to={`/reuniao/${reuniao.id}`} className="btn btn-primary">
            Editar
          </Link>
          <button onClick={excluirReuniao} className="btn btn-danger">
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReuniaoDetalhes

