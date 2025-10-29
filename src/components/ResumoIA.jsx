import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import emailjs from '@emailjs/browser'
import { EMAILJS_CONFIG } from '../config/emailjs'

function ResumoIA() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [reuniao, setReuniao] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
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
      const { data, error } = await supabase
        .from('reunioes')
        .select(`
          *,
          empresas!reunioes_empresa_id_fkey(nome),
          produtos!reunioes_produto_id_fkey(nome)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      setReuniao(data)
      setEditedContent(data.resumo_ia || '')
    } catch (error) {
      console.error('Erro ao carregar reunião:', error)
      setMessage('Erro ao carregar reunião: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const salvarResumo = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('reunioes')
        .update({ resumo_ia: editedContent })
        .eq('id', id)

      if (error) throw error

      setMessage('Resumo salvo com sucesso!')
      setIsEditing(false)
      setReuniao({ ...reuniao, resumo_ia: editedContent })
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMessage('Erro ao salvar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const formatarData = (data) => {
    if (!data) return '-'
    // Criar a data considerando apenas a parte da data, ignorando timezone
    const dataObj = new Date(data)
    // Usar UTC para evitar problemas de timezone
    const dia = dataObj.getUTCDate().toString().padStart(2, '0')
    const mes = (dataObj.getUTCMonth() + 1).toString().padStart(2, '0')
    const ano = dataObj.getUTCFullYear()
    return `${dia}-${mes}-${ano}`
  }

  const exportarPDF = () => {
    // Cria uma janela de impressão que permite salvar como PDF
    const conteudo = document.getElementById('resumo-content').innerHTML
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
              padding: 3rem;
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
                padding: 2rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reuniao.titulo_original || 'Reunião'}</h1>
            ${reuniao.empresas?.nome ? `<div class="meta"><strong>Empresa:</strong> ${reuniao.empresas.nome}</div>` : ''}
            ${reuniao.produtos?.nome ? `<div class="meta"><strong>Produto:</strong> ${reuniao.produtos.nome}</div>` : ''}
            ${reuniao.data_reuniao ? `<div class="meta"><strong>Data:</strong> ${formatarData(reuniao.data_reuniao)}</div>` : ''}
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

      // Configuração do EmailJS
      const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG

      // Prepara os dados do template (usando nomes mais simples)
      const templateParams = {
        to_email: emailData.destinatario,
        subject: emailData.assunto || `Resumo da Reunião: ${reuniao.titulo_original || 'Reunião'}`,
        message: document.getElementById('resumo-content').innerHTML,
        from_name: 'Powered by Traction Resumer v0.1'
      }

      console.log('Enviando e-mail com parâmetros:', templateParams)

      // Envia o e-mail
      const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      
      console.log('E-mail enviado com sucesso:', result)
      setMessage('E-mail enviado com sucesso!')
      setEmailData({ ...emailData, showEmailForm: false, destinatario: '', assunto: '' })
      
    } catch (error) {
      console.error('Erro detalhado ao enviar e-mail:', error)
      console.error('Status:', error.status)
      console.error('Text:', error.text)
      
      let errorMessage = 'Erro ao enviar e-mail. '
      
      if (error.status === 400) {
        errorMessage += 'Verifique se o template está configurado corretamente no EmailJS.'
      } else if (error.status === 401) {
        errorMessage += 'Chave pública inválida.'
      } else if (error.status === 403) {
        errorMessage += 'Serviço não autorizado.'
      } else {
        errorMessage += `Erro ${error.status}: ${error.text || 'Tente novamente.'}`
      }
      
      setMessage(errorMessage)
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return <div className="main-content">Carregando...</div>
  }

  if (!reuniao) {
    return (
      <div className="main-content">
        <div className="message error">Reunião não encontrada</div>
        <Link to="/" className="btn btn-primary">Voltar</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Resumo IA - {reuniao.titulo_original || 'Sem título'}</h2>
        <Link to="/" className="btn btn-primary">Voltar</Link>
      </div>

      {message && (
        <div className={`message ${message.includes('Erro') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="resumo-ia-container">
        <div className="resumo-header">
          <div className="reuniao-meta">
            {reuniao.empresas?.nome && (
              <span className="meta-badge">Empresa: {reuniao.empresas.nome}</span>
            )}
            {reuniao.produtos?.nome && (
              <span className="meta-badge">Produto: {reuniao.produtos.nome}</span>
            )}
            {reuniao.data_reuniao && (
              <span className="meta-badge">Data: {formatarData(reuniao.data_reuniao)}</span>
            )}
          </div>

          <div className="action-buttons">
            {!isEditing ? (
              <>
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Editar
                </button>
                <button 
                  className="btn btn-success"
                  onClick={exportarPDF}
                >
                  Exportar PDF
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={() => setEmailData({ ...emailData, showEmailForm: true })}
                >
                  Enviar E-mail
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn btn-success"
                  onClick={salvarResumo}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedContent(reuniao.resumo_ia || '')
                  }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {emailData.showEmailForm && (
          <div className="email-form">
            <h3>Enviar Resumo por E-mail</h3>
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
                className="btn btn-success"
                onClick={enviarEmail}
                disabled={!emailData.destinatario}
              >
                Enviar
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setEmailData({ ...emailData, showEmailForm: false })}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="resumo-content-wrapper">
          {isEditing ? (
            <div className="editor-container">
              <textarea
                className="html-editor"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Cole ou escreva o HTML do resumo aqui..."
              />
              <div className="editor-preview">
                <h4>Pré-visualização:</h4>
                <div 
                  id="resumo-content"
                  className="resumo-html-preview"
                  dangerouslySetInnerHTML={{ __html: editedContent }}
                />
              </div>
            </div>
          ) : (
            <div 
              id="resumo-content"
              className="resumo-html-display"
              dangerouslySetInnerHTML={{ __html: reuniao.resumo_ia || '<p style="color: #999; font-style: italic;">Nenhum resumo disponível</p>' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumoIA
