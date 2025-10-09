import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import emailjs from '@emailjs/browser'
import { EMAILJS_CONFIG } from '../config/emailjs'

function ReuniaoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [reuniao, setReuniao] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isEditingIA, setIsEditingIA] = useState(false)
  const [editedIA, setEditedIA] = useState('')
  const [saving, setSaving] = useState(false)
  const [emailData, setEmailData] = useState({
    destinatario: '',
    assunto: '',
    showEmailForm: false
  })

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
      setEditedIA(reuniaoData.resumo_ia || '')

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

  const salvarResumoIA = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('reunioes')
        .update({ resumo_ia: editedIA })
        .eq('id', id)

      if (error) throw error

      setMessage('Resumo IA salvo com sucesso!')
      setIsEditingIA(false)
      setReuniao({ ...reuniao, resumo_ia: editedIA })
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMessage('Erro ao salvar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const exportarPDF = () => {
    const conteudo = document.getElementById('resumo-ia-content').innerHTML
    const janelaImpressao = window.open('', '', 'width=800,height=600')
    
    janelaImpressao.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resumo da Reunião - ${reuniao.titulo_original || 'Sem título'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              color: #333;
            }
            h1, h2, h3, h4, h5, h6 {
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }
            p {
              margin-bottom: 1rem;
            }
            ul, ol {
              margin-bottom: 1rem;
              padding-left: 2rem;
            }
            .header {
              border-bottom: 2px solid #000;
              padding-bottom: 1rem;
              margin-bottom: 2rem;
            }
            .meta {
              color: #666;
              font-size: 0.875rem;
              margin-bottom: 0.5rem;
            }
            @media print {
              body {
                padding: 1rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reuniao.titulo_original || 'Reunião'}</h1>
            ${reuniao.empresas?.nome ? `<div class="meta"><strong>Empresa:</strong> ${reuniao.empresas.nome}</div>` : ''}
            ${reuniao.produtos?.nome ? `<div class="meta"><strong>Produto:</strong> ${reuniao.produtos.nome}</div>` : ''}
            ${reuniao.data_reuniao ? `<div class="meta"><strong>Data:</strong> ${new Date(reuniao.data_reuniao).toLocaleDateString('pt-BR')}</div>` : ''}
          </div>
          ${conteudo}
        </body>
      </html>
    `)
    
    janelaImpressao.document.close()
    janelaImpressao.focus()
    
    setTimeout(() => {
      janelaImpressao.print()
    }, 250)
  }

  const enviarEmail = async () => {
    try {
      setSaving(true)
      setMessage('Enviando e-mail...')

      const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG

      const templateParams = {
        to_email: emailData.destinatario,
        subject: emailData.assunto || `Resumo da Reunião: ${reuniao.titulo_original || 'Reunião'}`,
        message: document.getElementById('resumo-ia-content').innerHTML,
        from_name: 'Sistema de Reuniões'
      }

      const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      
      setMessage('E-mail enviado com sucesso!')
      setEmailData({ ...emailData, showEmailForm: false, destinatario: '', assunto: '' })
      
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error)
      setMessage('Erro ao enviar e-mail: ' + (error.text || 'Tente novamente.'))
    } finally {
      setSaving(false)
    }
  }

  const copiarParaAreaTransferencia = async () => {
    try {
      const conteudo = document.getElementById('resumo-ia-content').innerHTML
      
      // Cria um elemento temporário para converter HTML para texto formatado
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = conteudo
      
      // Converte HTML para texto mantendo formatação básica
      let textoFormatado = tempDiv.innerText || tempDiv.textContent || ''
      
      // Adiciona cabeçalho com informações da reunião
      const cabecalho = `# ${reuniao.titulo_original || 'Reunião'}\n\n`
      const metaInfo = [
        reuniao.empresas?.nome && `**Empresa:** ${reuniao.empresas.nome}`,
        reuniao.produtos?.nome && `**Produto:** ${reuniao.produtos.nome}`,
        reuniao.data_reuniao && `**Data:** ${new Date(reuniao.data_reuniao).toLocaleDateString('pt-BR')}`
      ].filter(Boolean).join('\n')
      
      const conteudoCompleto = cabecalho + (metaInfo ? metaInfo + '\n\n' : '') + textoFormatado
      
      // Usa a API moderna de clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(conteudoCompleto)
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea')
        textArea.value = conteudoCompleto
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      
      setMessage('Conteúdo copiado para a área de transferência!')
      
      // Remove a mensagem após 3 segundos
      setTimeout(() => {
        setMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Erro ao copiar:', error)
      setMessage('Erro ao copiar conteúdo: ' + error.message)
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

        {/* Card de Resumo IA - Movido para o topo */}
        {reuniao.resumo_ia && (
          <div className="detalhes-card resumo-ia-card">
            <div className="detalhes-header">
              <h3>Resumo IA (Para Clientes)</h3>
              <div className="resumo-ia-actions">
                {!isEditingIA ? (
                  <>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsEditingIA(true)}
                      title="Editar Resumo IA"
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={exportarPDF}
                      title="Exportar PDF"
                    >
                      PDF
                    </button>
                    <button 
                      className="btn btn-info btn-sm"
                      onClick={copiarParaAreaTransferencia}
                      title="Copiar para área de transferência"
                    >
                      Copiar
                    </button>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => setEmailData({ ...emailData, showEmailForm: true })}
                      title="Enviar Email"
                    >
                      Email
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={salvarResumoIA}
                      disabled={saving}
                      title="Salvar Resumo IA"
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setIsEditingIA(false)
                        setEditedIA(reuniao.resumo_ia || '')
                      }}
                      title="Cancelar Edição"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>

            {emailData.showEmailForm && (
              <div className="email-form">
                <h4>Enviar Resumo por E-mail</h4>
                <div className="form-group">
                  <label htmlFor="destinatario">E-mail do destinatário:</label>
                  <input
                    type="email"
                    id="destinatario"
                    className="form-control"
                    value={emailData.destinatario}
                    onChange={(e) => setEmailData({ ...emailData, destinatario: e.target.value })}
                    placeholder="cliente@exemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="assunto">Assunto:</label>
                  <input
                    type="text"
                    id="assunto"
                    className="form-control"
                    value={emailData.assunto}
                    onChange={(e) => setEmailData({ ...emailData, assunto: e.target.value })}
                    placeholder={`Resumo da Reunião: ${reuniao.titulo_original || 'Reunião'}`}
                  />
                </div>
                <div className="form-actions">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={enviarEmail}
                    disabled={!emailData.destinatario || saving}
                  >
                    {saving ? 'Enviando...' : 'Enviar'}
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setEmailData({ ...emailData, showEmailForm: false })}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {isEditingIA ? (
              <div className="editor-container">
                <textarea
                  className="html-editor"
                  value={editedIA}
                  onChange={(e) => setEditedIA(e.target.value)}
                  placeholder="Cole ou escreva o HTML do resumo aqui..."
                />
                <div className="editor-preview">
                  <h4>Pré-visualização:</h4>
                  <div 
                    id="resumo-ia-content"
                    className="resumo-html-preview"
                    dangerouslySetInnerHTML={{ __html: editedIA }}
                  />
                </div>
              </div>
            ) : (
              <div 
                id="resumo-ia-content"
                className="detalhe-texto resumo-ia-html" 
                dangerouslySetInnerHTML={{ __html: reuniao.resumo_ia }}
              />
            )}
          </div>
        )}

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

        {/* Card de Transcrição */}
        {reuniao.transcricao_completa && (
          <div className="detalhes-card">
            <h3>Transcrição Completa</h3>
            <div className="detalhe-texto transcricao">{reuniao.transcricao_completa}</div>
          </div>
        )}

        {/* Botões de Ação - Apenas para dados gerais (não IA) */}
        <div className="detalhes-actions">
          <Link to={`/reuniao/${reuniao.id}`} className="btn btn-primary">
            Editar Dados Gerais
          </Link>
          <button onClick={excluirReuniao} className="btn btn-danger">
            Excluir Reunião
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReuniaoDetalhes

