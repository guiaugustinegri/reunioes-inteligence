import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { obterTagsReuniao, listarTags, atualizarTagsReuniao } from '../services/tagsService'
import emailjs from '@emailjs/browser'
import { EMAILJS_CONFIG } from '../config/emailjs'

function ReuniaoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [reuniao, setReuniao] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [tags, setTags] = useState([])
  const [todasTags, setTodasTags] = useState([])
  const [editandoTags, setEditandoTags] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isEditingIA, setIsEditingIA] = useState(false)
  const [editedIA, setEditedIA] = useState('')
  const [saving, setSaving] = useState(false)
  const [emailData, setEmailData] = useState({
    destinatario: '',
    assunto: '',
    showEmailForm: false,
    incluirResumoConciso: false
  })
  const [participantesEmpresa, setParticipantesEmpresa] = useState([])
  const [emailsDestinatarios, setEmailsDestinatarios] = useState([]) // Array de strings de emails
  const [historicoEmails, setHistoricoEmails] = useState([]) // Histórico de envios
  const [transcricaoExpandida, setTranscricaoExpandida] = useState(false) // Estado para controlar expansão da transcrição

  useEffect(() => {
    carregarReuniao()
    carregarHistoricoEmails()
  }, [id])

  const carregarHistoricoEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('email_envios')
        .select('*')
        .eq('reuniao_id', id)
        .order('enviado_em', { ascending: false })

      if (error) throw error
      setHistoricoEmails(data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico de emails:', error)
    }
  }

  const carregarReuniao = async () => {
    try {
      setLoading(true)

      // Carregar reunião com joins
      const { data: reuniaoData, error: reuniaoError } = await supabase
        .from('reunioes')
        .select(`
          *,
          empresas!reunioes_empresa_id_fkey(id, nome),
          produtos!reunioes_produto_id_fkey(nome),
          series_reunioes!reunioes_serie_id_fkey(id, nome, visivel_cliente)
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

      const participantesReuniao = participantesData?.map(p => p.participantes) || []
      setParticipantes(participantesReuniao)

      // Carregar tags da reunião
      const { data: tagsData, error: tagsError } = await obterTagsReuniao(id)
      if (tagsError) {
        console.error('Erro ao carregar tags:', tagsError)
      } else {
        setTags(tagsData || [])
      }

      // Carregar todas as tags disponíveis
      const { data: todasTagsData, error: todasTagsError } = await listarTags()
      if (todasTagsError) {
        console.error('Erro ao carregar todas as tags:', todasTagsError)
      } else {
        setTodasTags(todasTagsData || [])
      }

      // Carregar participantes do produto (se houver)
      if (reuniaoData.produto_id) {
        const { data: produtoParticipantesData, error: produtoError } = await supabase
          .from('produto_participantes')
          .select(`
            participantes!produto_participantes_participante_id_fkey(id, nome, email)
          `)
          .eq('produto_id', reuniaoData.produto_id)

        if (produtoError) {
          console.error('Erro ao carregar participantes do produto:', produtoError)
        } else {
          const participantesProd = produtoParticipantesData?.map(p => p.participantes) || []
          setParticipantesEmpresa(participantesProd)
        }
      }
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

  const salvarTags = async (novasTags) => {
    try {
      setSaving(true)
      
      const { error } = await atualizarTagsReuniao(id, novasTags)
      if (error) throw error

      // Recarregar tags da reunião
      const { data: tagsData, error: tagsError } = await obterTagsReuniao(id)
      if (tagsError) throw tagsError

      setTags(tagsData || [])
      setEditandoTags(false)
      setMessage('Tags atualizadas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar tags:', error)
      setMessage('Erro ao salvar tags: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const getContrastColor = (hexColor) => {
    if (!hexColor) return '#000'
    const color = hexColor.replace('#', '')
    const r = parseInt(color.substr(0, 2), 16)
    const g = parseInt(color.substr(2, 2), 16)
    const b = parseInt(color.substr(4, 2), 16)
    const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminosity > 0.5 ? '#000' : '#fff'
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

  const adicionarEmail = (email) => {
    if (!email || !email.trim()) return
    const emailLimpo = email.trim().toLowerCase()
    
    // Validação básica de email
    if (!emailLimpo.includes('@')) {
      setMessage('Email inválido!')
      return
    }
    
    // Não adicionar duplicados
    if (emailsDestinatarios.includes(emailLimpo)) {
      setMessage('Email já está na lista!')
      return
    }
    
    setEmailsDestinatarios([...emailsDestinatarios, emailLimpo])
    setEmailData({ ...emailData, destinatario: '' }) // Limpar campo
  }

  const removerEmail = (email) => {
    setEmailsDestinatarios(emailsDestinatarios.filter(e => e !== email))
  }

  const adicionarParticipantesReuniao = () => {
    const emailsParticipantes = participantes
      .filter(p => p.email && !p.nome.toLowerCase().includes('guilherme'))
      .map(p => p.email.toLowerCase())
    
    const novosEmails = [...new Set([...emailsDestinatarios, ...emailsParticipantes])]
    setEmailsDestinatarios(novosEmails)
    setMessage(`${emailsParticipantes.length} email(s) adicionado(s) dos participantes da reunião!`)
  }

  const adicionarParticipantesEmpresa = () => {
    const emailsProduto = participantesEmpresa
      .filter(p => p.email && !p.nome.toLowerCase().includes('guilherme'))
      .map(p => p.email.toLowerCase())
    
    const novosEmails = [...new Set([...emailsDestinatarios, ...emailsProduto])]
    setEmailsDestinatarios(novosEmails)
    setMessage(`${emailsProduto.length} email(s) adicionado(s) dos participantes do produto!`)
  }

  const enviarEmail = async () => {
    try {
      if (emailsDestinatarios.length === 0) {
        setMessage('Adicione pelo menos um destinatário!')
        return
      }

      // Verificar se já foi enviado antes
      if (historicoEmails.length > 0) {
        const ultimoEnvio = historicoEmails[0]
        const dataEnvio = new Date(ultimoEnvio.enviado_em).toLocaleString('pt-BR')
        
        const confirmar = window.confirm(
          `⚠️ ATENÇÃO: Email já foi enviado anteriormente!\n\n` +
          `Último envio: ${dataEnvio}\n` +
          `Destinatários: ${ultimoEnvio.destinatarios.length} pessoa(s)\n\n` +
          `Deseja realmente REENVIAR o email?`
        )
        
        if (!confirmar) {
          setMessage('Envio cancelado.')
          return
        }
      }

      setSaving(true)
      setMessage('Enviando e-mails...')

      const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG
      let conteudoHTML = document.getElementById('resumo-ia-content').innerHTML
      
      // Se o checkbox estiver marcado, adicionar o resumo conciso no início
      if (emailData.incluirResumoConciso && reuniao.resumo_conciso) {
        const resumoConcisoHTML = `
          <div style="background-color: #f9fafb; border: 2px solid #000; padding: 1rem; margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.5rem 0; text-transform: uppercase; letter-spacing: 2px; color: #000;">RESUMO CONCISO</h3>
            <p style="margin: 0; color: #111827; font-family: 'Courier New', 'Consolas', monospace;">${reuniao.resumo_conciso}</p>
          </div>
        `
        conteudoHTML = resumoConcisoHTML + conteudoHTML
      }
      
      const assuntoEmail = emailData.assunto || `Resumo da Reunião: ${reuniao.titulo_original || 'Reunião'}`

      // Enviar para cada destinatário
      let enviados = 0
      let erros = 0

      for (const email of emailsDestinatarios) {
        try {
          const templateParams = {
            to_email: email,
            subject: assuntoEmail,
            message: conteudoHTML,
            from_name: 'Sistema de Reuniões'
          }

          console.log('📧 Enviando email para:', email)
          console.log('📋 Template params:', templateParams)

          await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
          console.log('✅ Email enviado com sucesso para:', email)
          enviados++
          
          // Pequeno delay entre envios para não sobrecarregar o serviço
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Erro ao enviar para ${email}:`, error)
          erros++
        }
      }
      
      // Registrar envio no banco de dados
      if (enviados > 0) {
        try {
          const { error: dbError } = await supabase
            .from('email_envios')
            .insert({
              reuniao_id: id,
              destinatarios: emailsDestinatarios,
              assunto: assuntoEmail,
              enviado_por: 'Sistema'
            })

          if (dbError) {
            console.error('Erro ao registrar envio:', dbError)
          } else {
            // Recarregar histórico
            carregarHistoricoEmails()
          }
        } catch (error) {
          console.error('Erro ao registrar no banco:', error)
        }
      }
      
      if (erros === 0) {
        setMessage(`✅ E-mails enviados com sucesso para ${enviados} destinatário(s)!`)
      } else {
        setMessage(`⚠️ ${enviados} e-mail(s) enviado(s) com sucesso. ${erros} erro(s).`)
      }
      
      setEmailData({ ...emailData, showEmailForm: false, assunto: '' })
      setEmailsDestinatarios([]) // Limpar lista
      
    } catch (error) {
      console.error('Erro ao enviar e-mails:', error)
      setMessage('Erro ao enviar e-mails: ' + (error.text || 'Tente novamente.'))
    } finally {
      setSaving(false)
    }
  }

  const copiarParaAreaTransferencia = async () => {
    try {
      const conteudo = document.getElementById('resumo-ia-content').innerHTML
      
      // Função para converter HTML para Markdown compatível com Notion
      const htmlToMarkdown = (html) => {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = html
        
        // Remove scripts e styles
        const scripts = tempDiv.querySelectorAll('script, style')
        scripts.forEach(el => el.remove())
        
        let markdown = ''
        
        // Processa cada elemento
        const processElement = (element) => {
          if (element.nodeType === Node.TEXT_NODE) {
            return element.textContent || ''
          }
          
          if (element.nodeType !== Node.ELEMENT_NODE) {
            return ''
          }
          
          const tagName = element.tagName.toLowerCase()
          const text = Array.from(element.childNodes).map(processElement).join('')
          
          switch (tagName) {
            case 'h1':
              return `# ${text}\n\n`
            case 'h2':
              return `## ${text}\n\n`
            case 'h3':
              return `### ${text}\n\n`
            case 'h4':
              return `#### ${text}\n\n`
            case 'h5':
              return `##### ${text}\n\n`
            case 'h6':
              return `###### ${text}\n\n`
            case 'p':
              return `${text}\n\n`
            case 'strong':
            case 'b':
              return `**${text}**`
            case 'em':
            case 'i':
              return `*${text}*`
            case 'ul':
              return `${text}\n`
            case 'ol':
              return `${text}\n`
            case 'li':
              const parent = element.parentElement
              if (parent && parent.tagName.toLowerCase() === 'ol') {
                const index = Array.from(parent.children).indexOf(element) + 1
                return `${index}. ${text}\n`
              } else {
                return `• ${text}\n`
              }
            case 'br':
              return '\n'
            case 'hr':
              return '---\n\n'
            case 'blockquote':
              return `> ${text}\n\n`
            case 'code':
              return `\`${text}\``
            case 'pre':
              return `\`\`\`\n${text}\n\`\`\`\n\n`
            case 'a':
              const href = element.getAttribute('href')
              return href ? `[${text}](${href})` : text
            case 'img':
              const src = element.getAttribute('src')
              const alt = element.getAttribute('alt') || ''
              return src ? `![${alt}](${src})` : ''
            default:
              return text
          }
        }
        
        return processElement(tempDiv).trim()
      }
      
      // Converte HTML para Markdown
      const markdownContent = htmlToMarkdown(conteudo)
      
      // Adiciona cabeçalho com informações da reunião
      const cabecalho = `# ${reuniao.titulo_original || 'Reunião'}\n\n`
      const metaInfo = [
        reuniao.empresas?.nome && `**Empresa:** ${reuniao.empresas.nome}`,
        reuniao.produtos?.nome && `**Produto:** ${reuniao.produtos.nome}`,
        reuniao.data_reuniao && `**Data:** ${new Date(reuniao.data_reuniao).toLocaleDateString('pt-BR')}`
      ].filter(Boolean).join('\n')
      
      const conteudoCompleto = cabecalho + (metaInfo ? metaInfo + '\n\n' : '') + markdownContent
      
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
      
      setMessage('Conteúdo copiado em formato Markdown para Notion!')
      
      // Remove a mensagem após 3 segundos
      setTimeout(() => {
        setMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Erro ao copiar:', error)
      setMessage('Erro ao copiar conteúdo: ' + error.message)
    }
  }

  const copiarTranscricao = async () => {
    try {
      const transcricao = reuniao.transcricao_completa
      
      // Usa a API moderna de clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(transcricao)
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea')
        textArea.value = transcricao
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      
      setMessage('Transcrição copiada para área de transferência!')
      
      // Remove a mensagem após 3 segundos
      setTimeout(() => {
        setMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Erro ao copiar transcrição:', error)
      setMessage('Erro ao copiar transcrição: ' + error.message)
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
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Tags */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {tags.map(tag => (
                    <span
                      key={tag.id}
                      className="tag-badge"
                      style={{
                        backgroundColor: tag.cor,
                        color: getContrastColor(tag.cor),
                        border: `2px solid ${tag.cor}`,
                        marginTop: `2px`,
                        borderTop: `4px solid ${tag.cor}`
                      }}
                    >
                      {tag.nome}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Botão para editar tags */}
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setEditandoTags(!editandoTags)}
                style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
              >
                {editandoTags ? '✕' : '🏷️'} Tags
              </button>
              
              {/* Status */}
              <button 
                className={`status-badge status-clickable ${reuniao.status === 'tratada' ? 'status-tratada' : 'status-pendente'}`}
                onClick={marcarComoTratada}
                title={`Clique para marcar como ${reuniao.status === 'tratada' ? 'pendente' : 'tratada'}`}
              >
                {reuniao.status === 'tratada' ? 'Tratada' : 'Pendente'}
              </button>
            </div>
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
            {reuniao.series_reunioes && (
              <div className="detalhe-item">
                <label>Série/Projeto:</label>
                <div className="detalhe-valor">
                  <Link 
                    to={`/series/${reuniao.serie_id}`}
                    className="serie-badge serie-link"
                  >
                    📋 {reuniao.series_reunioes.nome}
                    {reuniao.series_reunioes.visivel_cliente && ' (Cliente)'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Edição de Tags */}
        {editandoTags && (
          <div className="detalhes-card" style={{ marginTop: '1rem' }}>
            <div className="detalhes-header">
              <h3>Editar Tags da Reunião</h3>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setEditandoTags(false)}
              >
                ✕ Fechar
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {todasTags.map(tag => {
                  const isSelected = tags.some(t => t.id === tag.id)
                  return (
                    <div 
                      key={tag.id} 
                      className={`tag-checkbox-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        const newTags = isSelected
                          ? tags.filter(t => t.id !== tag.id)
                          : [...tags, tag]
                        salvarTags(newTags.map(t => t.id))
                      }}
                      style={{
                        backgroundColor: isSelected ? tag.cor : '#fff',
                        color: isSelected ? getContrastColor(tag.cor) : '#000',
                        border: `2px solid ${isSelected ? tag.cor : '#d1d5db'}`,
                        cursor: 'pointer',
                        padding: '0.75rem 1rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`tag-${tag.id}`}
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <label htmlFor={`tag-${tag.id}`} style={{ cursor: 'pointer', fontWeight: '600' }}>
                        {tag.nome}
                      </label>
                    </div>
                  )
                })}
              </div>
              {todasTags.length === 0 && (
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '0.875rem', 
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '2rem'
                }}>
                  Nenhuma tag cadastrada. Vá em Gerenciar → Tags para criar novas tags.
                </p>
              )}
            </div>
          </div>
        )}

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
                      Editar Resumo IA
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
                      onClick={() => {
                        // Criar assunto no formato solicitado
                        const empresa = reuniao.empresas?.nome || ''
                        const produto = reuniao.produtos?.nome || ''
                        const data = reuniao.data_reuniao ? formatarData(reuniao.data_reuniao) : ''
                        const assuntoPadrao = `Ata Reunião ${empresa}${produto ? ' - ' + produto : ''}${data ? ' - ' + data : ''}`
                        
                        setEmailData({ 
                          destinatario: '', 
                          assunto: assuntoPadrao, 
                          showEmailForm: true 
                        })
                        setEmailsDestinatarios([]) // Começar com lista vazia
                      }}
                      title={historicoEmails.length > 0 ? `Email já enviado ${historicoEmails.length}x` : "Enviar Email"}
                      style={{ position: 'relative' }}
                    >
                      Email
                      {historicoEmails.length > 0 && (
                        <span className="email-badge-enviado">
                          ✓ {historicoEmails.length}
                        </span>
                      )}
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

                {/* Opção de incluir Resumo Conciso */}
                <div className="form-group">
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="incluir-resumo-conciso"
                      checked={emailData.incluirResumoConciso}
                      onChange={(e) => setEmailData({ ...emailData, incluirResumoConciso: e.target.checked })}
                    />
                    <label htmlFor="incluir-resumo-conciso">
                      Incluir Resumo Conciso acima do template
                    </label>
                  </div>
                </div>

                {/* Histórico de Envios */}
                {historicoEmails.length > 0 && (
                  <div className="email-historico-alert">
                    <strong>⚠️ Email já foi enviado anteriormente!</strong>
                    <div className="email-historico-resumo">
                      Último envio: {new Date(historicoEmails[0].enviado_em).toLocaleString('pt-BR')} 
                      {' '}para {historicoEmails[0].destinatarios.length} pessoa(s)
                      {historicoEmails.length > 1 && ` • Total de ${historicoEmails.length} envios`}
                    </div>
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: '#6b7280' }}>
                        Ver histórico completo
                      </summary>
                      <div className="email-historico-lista">
                        {historicoEmails.map((envio, index) => (
                          <div key={envio.id} className="email-historico-item">
                            <div className="historico-numero">#{historicoEmails.length - index}</div>
                            <div className="historico-info">
                              <div className="historico-data">
                                {new Date(envio.enviado_em).toLocaleString('pt-BR')}
                              </div>
                              <div className="historico-assunto">{envio.assunto}</div>
                              <div className="historico-destinatarios">
                                Para: {envio.destinatarios.join(', ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
                
                {/* Botões de Ação Rápida */}
                <div className="email-quick-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={adicionarParticipantesReuniao}
                    disabled={participantes.filter(p => p.email && !p.nome.toLowerCase().includes('guilherme')).length === 0}
                    title={participantes.filter(p => p.email).length > 0 
                      ? "Adicionar todos os participantes da reunião (exceto Guilherme)" 
                      : "Nenhum participante com email cadastrado na reunião"
                    }
                  >
                    + Emails da Reunião ({participantes.filter(p => p.email && !p.nome.toLowerCase().includes('guilherme')).length})
                  </button>
                  
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={adicionarParticipantesEmpresa}
                    disabled={participantesEmpresa.filter(p => p.email && !p.nome.toLowerCase().includes('guilherme')).length === 0}
                    title={participantesEmpresa.filter(p => p.email).length > 0 
                      ? "Adicionar todos os participantes do produto (exceto Guilherme)" 
                      : "Nenhum participante cadastrado no produto"
                    }
                  >
                    + Emails do Produto ({participantesEmpresa.filter(p => p.email && !p.nome.toLowerCase().includes('guilherme')).length})
                  </button>
                </div>
                
                {participantes.filter(p => p.email).length === 0 && (
                  <div style={{ 
                    padding: '0.75rem', 
                    background: '#f9fafb', 
                    border: '2px solid #d1d5db',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '1rem'
                  }}>
                    <strong style={{ color: '#000', display: 'block', marginBottom: '0.25rem' }}>
                      💡 Dica: Nenhum participante associado à reunião
                    </strong>
                    Vá em "Editar Dados Gerais" para associar participantes à reunião,
                    ou adicione emails manualmente abaixo.
                  </div>
                )}

                {/* Campo para adicionar email manualmente */}
                <div className="form-group">
                  <label htmlFor="destinatario">Adicionar E-mail:</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="email"
                      id="destinatario"
                      className="form-control"
                      value={emailData.destinatario}
                      onChange={(e) => setEmailData({ ...emailData, destinatario: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          adicionarEmail(emailData.destinatario)
                        }
                      }}
                      placeholder="nome@exemplo.com"
                    />
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => adicionarEmail(emailData.destinatario)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Lista de emails adicionados */}
                {emailsDestinatarios.length > 0 && (
                  <div className="emails-lista-container">
                    <strong>Destinatários ({emailsDestinatarios.length}):</strong>
                    <div className="emails-lista">
                      {emailsDestinatarios.map((email, index) => (
                        <div key={index} className="email-tag">
                          <span>{email}</span>
                          <button 
                            className="email-tag-remove"
                            onClick={() => removerEmail(email)}
                            title="Remover"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assunto */}
                <div className="form-group">
                  <label htmlFor="assunto">Assunto:</label>
                  <input
                    type="text"
                    id="assunto"
                    className="form-control"
                    value={emailData.assunto}
                    onChange={(e) => setEmailData({ ...emailData, assunto: e.target.value })}
                    placeholder={`Ata Reunião...`}
                  />
                </div>

                {/* Botões de ação */}
                <div className="form-actions">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={enviarEmail}
                    disabled={emailsDestinatarios.length === 0 || saving}
                  >
                    {saving ? 'Enviando...' : `Enviar para ${emailsDestinatarios.length} pessoa(s)`}
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEmailData({ ...emailData, showEmailForm: false })
                      setEmailsDestinatarios([])
                    }}
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

        {/* Card de To-do Cliente */}
        {reuniao.todo_cliente && (
          <div className="detalhes-card">
            <h3>To-do Cliente</h3>
            <div className="detalhe-texto">{reuniao.todo_cliente}</div>
          </div>
        )}

        {/* Card de Transcrição - Expansível */}
        {reuniao.transcricao_completa && (
          <div className="detalhes-card">
            <div className="detalhes-header">
              <h3>Transcrição Completa</h3>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setTranscricaoExpandida(!transcricaoExpandida)}
                  title={transcricaoExpandida ? "Minimizar transcrição" : "Expandir transcrição"}
                >
                  {transcricaoExpandida ? '▼ Minimizar' : '▶ Expandir'}
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={copiarTranscricao}
                  title="Copiar transcrição para área de transferência"
                >
                  Copiar
                </button>
              </div>
            </div>
            {transcricaoExpandida && (
              <div className="detalhe-texto transcricao">{reuniao.transcricao_completa}</div>
            )}
            {!transcricaoExpandida && (
              <div style={{ 
                padding: '0.75rem', 
                background: '#f9fafb', 
                border: '2px solid #d1d5db',
                fontSize: '0.875rem',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Transcrição disponível - clique em "Expandir" para visualizar
              </div>
            )}
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

