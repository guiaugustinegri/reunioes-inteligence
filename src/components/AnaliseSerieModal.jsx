import React, { useState, useEffect } from 'react'

function AnaliseSerieModal({ isOpen, onClose, serie, onAnaliseCompleta }) {
  const [config, setConfig] = useState({
    tipo: 'progressao',
    promptCustomizado: '',
    opcoes: {
      incluir_resumo_conciso: true,
      incluir_resumo_ia: false,
      incluir_tarefas: true,
      incluir_transcricoes: false
    }
  })

  const [reunioesSelecionadas, setReunioesSelecionadas] = useState([])
  const [tokensEstimados, setTokensEstimados] = useState({ entrada: 0, saida: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isOpen && serie) {
      carregarDadosSerie()
    }
  }, [isOpen, serie])

  const carregarDadosSerie = async () => {
    if (!serie?.reunioes) return

    // Por padrão, selecionar todas as reuniões
    const todasReunioes = serie.reunioes.map(r => r.id)
    setReunioesSelecionadas(todasReunioes)
    
    // Calcular tokens estimados
    calcularTokensEstimados()
  }

  const calcularTokensEstimados = async () => {
    if (!serie?.reunioes || reunioesSelecionadas.length === 0) {
      setTokensEstimados({ entrada: 0, saida: 0, total: 0 })
      return
    }

    try {
      const reunioesFiltradas = serie.reunioes.filter(r => 
        reunioesSelecionadas.includes(r.id)
      )

      const { data: contexto } = await llmAnaliseService.montarContextoSerie(
        reunioesFiltradas, 
        config.opcoes
      )

      if (contexto) {
        const tokens = llmAnaliseService.calcularTokensEstimados(contexto, config.opcoes)
        setTokensEstimados(tokens)
      }
    } catch (error) {
      console.error('Erro ao calcular tokens:', error)
    }
  }

  useEffect(() => {
    calcularTokensEstimados()
  }, [reunioesSelecionadas, config.opcoes])

  const handleTipoChange = (tipo) => {
    setConfig(prev => ({ ...prev, tipo }))
    setResultado(null)
  }

  const handleOpcaoChange = (opcao, value) => {
    setConfig(prev => ({
      ...prev,
      opcoes: {
        ...prev.opcoes,
        [opcao]: value
      }
    }))
    setResultado(null)
  }

  const handleReuniaoToggle = (reuniaoId, checked) => {
    if (checked) {
      setReunioesSelecionadas(prev => [...prev, reuniaoId])
    } else {
      setReunioesSelecionadas(prev => prev.filter(id => id !== reuniaoId))
    }
    setResultado(null)
  }

  const selecionarReunioesRapido = (quantidade) => {
    if (!serie?.reunioes) return

    const reunioesOrdenadas = [...serie.reunioes].sort((a, b) => 
      new Date(b.data_reuniao) - new Date(a.data_reuniao)
    )

    if (quantidade === 'todas') {
      setReunioesSelecionadas(serie.reunioes.map(r => r.id))
    } else {
      const numero = parseInt(quantidade)
      const selecionadas = reunioesOrdenadas.slice(0, numero).map(r => r.id)
      setReunioesSelecionadas(selecionadas)
    }
    setResultado(null)
  }

  const handleAnalisar = async () => {
    if (reunioesSelecionadas.length === 0) {
      setMessage('Selecione pelo menos uma reunião para análise')
      return
    }

    setAnalisando(true)
    setMessage('')
    setResultado(null)

    try {
      // Simulação de análise LLM
      await new Promise(resolve => setTimeout(resolve, 2000))

      const tiposAnalise = {
        progressao: 'Análise de Progressão e Status Atual do Projeto',
        criticos: 'Identificação de Pontos Críticos e Bloqueios',
        pendencias: 'Listagem de Todas as Pendências Acumuladas',
        customizada: 'Análise Customizada'
      }

      const resultadoSimulado = {
        tipo: tiposAnalise[config.tipo] || 'Análise Personalizada',
        prompt: config.tipo === 'customizada' ? config.promptCustomizado : `Análise do tipo: ${tiposAnalise[config.tipo]}`,
        reunioes_analisadas: reunioesSelecionadas.length,
        resultado: `Esta é uma análise simulada do tipo "${tiposAnalise[config.tipo]}" para ${reunioesSelecionadas.length} reuniões da série "${serie?.serie?.nome || serie?.nome}". 

Em uma implementação real, aqui seria exibido o resultado da análise LLM com insights sobre:
- Progressão do projeto
- Pontos críticos identificados
- Pendências acumuladas
- Recomendações estratégicas

A análise consideraria todos os resumos ultra-concisos, resumos concisos e tarefas das reuniões selecionadas.`,
        tokens_estimados: reunioesSelecionadas.length * 150,
        custo_estimado: (reunioesSelecionadas.length * 150 * 0.0001).toFixed(4),
        data_analise: new Date().toISOString()
      }

      setResultado(resultadoSimulado)
      setMessage('Análise simulada gerada com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar análise:', error)
      setMessage('Erro ao gerar análise: ' + error.message)
    } finally {
      setAnalisando(false)
    }
  }

  const handleSalvar = async () => {
    if (!resultado) return

    setLoading(true)
    try {
      // Simulação de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMessage('Análise simulada salva com sucesso!')
      setTimeout(() => {
        onAnaliseCompleta(resultado)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Erro ao salvar análise:', error)
      setMessage('Erro ao salvar análise: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatarTokens = (tokens) => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`
    }
    return tokens.toString()
  }

  const estimarCusto = () => {
    // Preços aproximados GPT-4o (por 1M tokens)
    const precoEntrada = 2.50
    const precoSaida = 10.00
    
    const custoEntrada = (tokensEstimados.entrada / 1000000) * precoEntrada
    const custoSaida = (tokensEstimados.saida / 1000000) * precoSaida
    
    return (custoEntrada + custoSaida).toFixed(4)
  }

  if (!isOpen || !serie) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>ANÁLISE LLM - {serie.nome}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {message && (
            <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {!resultado ? (
            <>
              {/* Seleção de Escopo */}
              <div className="form-section">
                <h4>ESCOPO DA ANÁLISE</h4>
                
                <div className="form-group">
                  <label>REUNIÕES PARA INCLUIR</label>
                  <div className="quick-select">
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => selecionarReunioesRapido('3')}
                    >
                      ÚLTIMAS 3
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => selecionarReunioesRapido('5')}
                    >
                      ÚLTIMAS 5
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => selecionarReunioesRapido('todas')}
                    >
                      TODAS ({serie.reunioes?.length || 0})
                    </button>
                  </div>
                </div>

                <div className="reunioes-selection">
                  {serie.reunioes?.map(reuniao => (
                    <label key={reuniao.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={reunioesSelecionadas.includes(reuniao.id)}
                        onChange={(e) => handleReuniaoToggle(reuniao.id, e.target.checked)}
                      />
                      <div className="reuniao-info">
                        <strong>{reuniao.titulo_original}</strong>
                        <small>
                          {new Date(reuniao.data_reuniao).toLocaleDateString('pt-BR')}
                        </small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tipo de Análise */}
              <div className="form-section">
                <h4>TIPO DE ANÁLISE</h4>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="tipo"
                      value="progressao"
                      checked={config.tipo === 'progressao'}
                      onChange={(e) => handleTipoChange(e.target.value)}
                    />
                    <span>PROGRESSÃO E STATUS ATUAL</span>
                    <small>Análise geral do progresso do projeto</small>
                  </label>
                  
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="tipo"
                      value="pontos_criticos"
                      checked={config.tipo === 'pontos_criticos'}
                      onChange={(e) => handleTipoChange(e.target.value)}
                    />
                    <span>PONTOS CRÍTICOS E RISCOS</span>
                    <small>Identifica bloqueios e riscos</small>
                  </label>
                  
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="tipo"
                      value="pendencias"
                      checked={config.tipo === 'pendencias'}
                      onChange={(e) => handleTipoChange(e.target.value)}
                    />
                    <span>PENDÊNCIAS ACUMULADAS</span>
                    <small>Lista todas as pendências</small>
                  </label>
                  
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="tipo"
                      value="customizado"
                      checked={config.tipo === 'customizado'}
                      onChange={(e) => handleTipoChange(e.target.value)}
                    />
                    <span>ANÁLISE CUSTOMIZADA</span>
                    <small>Prompt personalizado</small>
                  </label>
                </div>

                {config.tipo === 'customizado' && (
                  <div className="form-group">
                    <label htmlFor="promptCustomizado">PROMPT PERSONALIZADO</label>
                    <textarea
                      id="promptCustomizado"
                      value={config.promptCustomizado}
                      onChange={(e) => setConfig(prev => ({ ...prev, promptCustomizado: e.target.value }))}
                      className="form-control"
                      rows="4"
                      placeholder="Descreva o que você gostaria que a IA analise..."
                    />
                  </div>
                )}
              </div>

              {/* Opções Avançadas */}
              <div className="form-section">
                <h4>OPÇÕES AVANÇADAS</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.opcoes.incluir_resumo_conciso}
                      onChange={(e) => handleOpcaoChange('incluir_resumo_conciso', e.target.checked)}
                    />
                    <span>INCLUIR RESUMOS CONCISOS</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.opcoes.incluir_resumo_ia}
                      onChange={(e) => handleOpcaoChange('incluir_resumo_ia', e.target.checked)}
                    />
                    <span>INCLUIR RESUMOS DE IA</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.opcoes.incluir_tarefas}
                      onChange={(e) => handleOpcaoChange('incluir_tarefas', e.target.checked)}
                    />
                    <span>INCLUIR TAREFAS</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.opcoes.incluir_transcricoes}
                      onChange={(e) => handleOpcaoChange('incluir_transcricoes', e.target.checked)}
                    />
                    <span>INCLUIR TRANSCRIÇÕES COMPLETAS</span>
                    <small className="warning">⚠️ Aumenta custo significativamente</small>
                  </label>
                </div>
              </div>

              {/* Estimativa de Custo */}
              <div className="form-section">
                <h4>ESTIMATIVA DE CUSTO</h4>
                <div className="cost-estimate">
                  <div className="cost-item">
                    <span>Tokens de Entrada:</span>
                    <span>{formatarTokens(tokensEstimados.entrada)}</span>
                  </div>
                  <div className="cost-item">
                    <span>Tokens de Saída:</span>
                    <span>{formatarTokens(tokensEstimados.saida)}</span>
                  </div>
                  <div className="cost-item">
                    <span>Total de Tokens:</span>
                    <span>{formatarTokens(tokensEstimados.total)}</span>
                  </div>
                  <div className="cost-item cost-total">
                    <span>Custo Estimado:</span>
                    <span>US$ {estimarCusto()}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Resultado da Análise */
            <div className="analise-resultado">
              <h4>RESULTADO DA ANÁLISE</h4>
              <div className="resultado-meta">
                <small>
                  Tipo: {config.tipo} • 
                  Tokens: {formatarTokens(resultado.tokens_estimados.total)} • 
                  Gerado em: {new Date(resultado.gerado_em).toLocaleString('pt-BR')}
                </small>
              </div>
              <div className="resultado-texto">
                <pre>{resultado.resultado}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {resultado ? 'FECHAR' : 'CANCELAR'}
          </button>
          
          {!resultado ? (
            <button 
              type="button" 
              className="btn btn-success"
              onClick={handleAnalisar}
              disabled={analisando || reunioesSelecionadas.length === 0}
            >
              {analisando ? 'ANALISANDO...' : 'GERAR ANÁLISE'}
            </button>
          ) : (
            <button 
              type="button" 
              className="btn btn-success"
              onClick={handleSalvar}
              disabled={loading}
            >
              {loading ? 'SALVANDO...' : 'SALVAR NA SÉRIE'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnaliseSerieModal
