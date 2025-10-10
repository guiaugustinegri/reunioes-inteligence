import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import ConfigPrecos from './ConfigPrecos'

function CustosLLM() {
  const [dados, setDados] = useState([])
  const [precos, setPrecos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showConfigPrecos, setShowConfigPrecos] = useState(false)
  
  // Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroModelo, setFiltroModelo] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar dados das reuniões com requests LLM
      const { data: dadosData, error: dadosError } = await supabase
        .from('reunioes')
        .select(`
          id,
          titulo_original,
          data_reuniao,
          empresas!reunioes_empresa_id_fkey(nome),
          produtos!reunioes_produto_id_fkey(nome),
          llm_requests!llm_requests_reuniao_id_fkey(
            request_numero,
            modelo,
            tokens_entrada,
            tokens_saida
          )
        `)
        .not('llm_requests', 'is', null)
        .order('data_reuniao', { ascending: false })

      if (dadosError) throw dadosError

      // Carregar preços dos modelos
      const { data: precosData, error: precosError } = await supabase
        .from('llm_precos')
        .select('*')
        .order('modelo')

      if (precosError) throw precosError

      // Carregar empresas para filtro
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome')
        .order('nome')

      if (empresasError) throw empresasError

      setDados(dadosData || [])
      setPrecos(precosData || [])
      setEmpresas(empresasData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMessage('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const calcularCusto = (tokens_entrada, tokens_saida, modelo) => {
    const precoModelo = precos.find(p => p.modelo === modelo)
    if (!precoModelo) return 0
    
    const custo_entrada = (tokens_entrada / 1_000_000) * precoModelo.preco_entrada_por_milhao
    const custo_saida = (tokens_saida / 1_000_000) * precoModelo.preco_saida_por_milhao
    return custo_entrada + custo_saida
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(valor)
  }

  const formatarData = (data) => {
    if (!data) return '-'
    const dataObj = new Date(data)
    const dia = dataObj.getUTCDate().toString().padStart(2, '0')
    const mes = (dataObj.getUTCMonth() + 1).toString().padStart(2, '0')
    const ano = dataObj.getUTCFullYear()
    return `${dia}/${mes}/${ano}`
  }

  const formatarNumero = (numero) => {
    return new Intl.NumberFormat('pt-BR').format(numero)
  }

  // Filtrar dados
  const dadosFiltrados = dados.filter(item => {
    const matchDataInicio = !filtroDataInicio || 
      !item.data_reuniao ||
      new Date(item.data_reuniao) >= new Date(filtroDataInicio)
    
    const matchDataFim = !filtroDataFim || 
      !item.data_reuniao ||
      new Date(item.data_reuniao) <= new Date(filtroDataFim)
    
    const matchEmpresa = !filtroEmpresa || item.empresas?.nome === filtroEmpresa
    
    const matchModelo = !filtroModelo || 
      item.llm_requests?.some(req => req.modelo === filtroModelo)
    
    return matchDataInicio && matchDataFim && matchEmpresa && matchModelo
  })

  // Calcular estatísticas
  const estatisticas = dadosFiltrados.reduce((acc, item) => {
    const request1 = item.llm_requests?.find(req => req.request_numero === 1)
    const request2 = item.llm_requests?.find(req => req.request_numero === 2)
    
    const custo1 = request1 ? calcularCusto(request1.tokens_entrada, request1.tokens_saida, request1.modelo) : 0
    const custo2 = request2 ? calcularCusto(request2.tokens_entrada, request2.tokens_saida, request2.modelo) : 0
    const custoTotal = custo1 + custo2
    
    acc.totalGasto += custoTotal
    acc.numeroReunioes += 1
    
    return acc
  }, { totalGasto: 0, numeroReunioes: 0 })

  const custoMedio = estatisticas.numeroReunioes > 0 ? estatisticas.totalGasto / estatisticas.numeroReunioes : 0

  // Obter modelos únicos para filtro
  const modelosUnicos = [...new Set(dados.flatMap(item => 
    item.llm_requests?.map(req => req.modelo) || []
  ))].sort()

  if (loading) {
    return <div className="main-content">Carregando...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>Análise de Custos LLM</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setShowConfigPrecos(true)}
          >
            Configurar Preços
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('Erro') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Gasto</h3>
          <div className="stat-value">{formatarMoeda(estatisticas.totalGasto)}</div>
        </div>
        <div className="stat-card">
          <h3>Custo Médio</h3>
          <div className="stat-value">{formatarMoeda(custoMedio)}</div>
        </div>
        <div className="stat-card">
          <h3>Reuniões Processadas</h3>
          <div className="stat-value">{estatisticas.numeroReunioes}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="search-bar">
        <div className="search-filters">
          <input
            type="date"
            className="date-input"
            placeholder="Data início"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            title="Data início"
          />
          
          <input
            type="date"
            className="date-input"
            placeholder="Data fim"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            title="Data fim"
          />
          
          <select 
            className="select-filter"
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
          >
            <option value="">Todas empresas</option>
            {empresas.map(empresa => (
              <option key={empresa.id} value={empresa.nome}>
                {empresa.nome}
              </option>
            ))}
          </select>

          <select 
            className="select-filter"
            value={filtroModelo}
            onChange={(e) => setFiltroModelo(e.target.value)}
          >
            <option value="">Todos modelos</option>
            {modelosUnicos.map(modelo => (
              <option key={modelo} value={modelo}>
                {modelo}
              </option>
            ))}
          </select>

          {(filtroDataInicio || filtroDataFim || filtroEmpresa || filtroModelo) && (
            <button 
              className="clear-btn"
              onClick={() => {
                setFiltroDataInicio('')
                setFiltroDataFim('')
                setFiltroEmpresa('')
                setFiltroModelo('')
              }}
              title="Limpar todos os filtros"
            >
              Limpar
            </button>
          )}
        </div>
        
        <div className="results-count">
          {dadosFiltrados.length} {dadosFiltrados.length === 1 ? 'reunião encontrada' : 'reuniões encontradas'}
        </div>
      </div>

      {/* Tabela de Custos */}
      <div className="table-compact custos-table">
        <div className="table-header">
          <div className="col-date">Data</div>
          <div className="col-reuniao">Reunião</div>
          <div className="col-request">Request 1</div>
          <div className="col-request">Request 2</div>
          <div className="col-custo">Custo Total</div>
        </div>

        {dadosFiltrados.length === 0 ? (
          <div className="empty-row">
            Nenhuma reunião com dados LLM encontrada
          </div>
        ) : (
          dadosFiltrados.map(item => {
            const request1 = item.llm_requests?.find(req => req.request_numero === 1)
            const request2 = item.llm_requests?.find(req => req.request_numero === 2)
            
            const custo1 = request1 ? calcularCusto(request1.tokens_entrada, request1.tokens_saida, request1.modelo) : 0
            const custo2 = request2 ? calcularCusto(request2.tokens_entrada, request2.tokens_saida, request2.modelo) : 0
            const custoTotal = custo1 + custo2

            return (
              <div key={item.id} className="table-row">
                <div className="col-date">{formatarData(item.data_reuniao)}</div>
                <div className="col-reuniao">
                  <div className="reuniao-titulo">{item.titulo_original || '-'}</div>
                  <div className="reuniao-meta">
                    {item.empresas?.nome && <span>{item.empresas.nome}</span>}
                    {item.produtos?.nome && <span> • {item.produtos.nome}</span>}
                  </div>
                </div>
                <div className="col-request">
                  {request1 ? (
                    <div className="request-info">
                      <div className="request-modelo">{request1.modelo}</div>
                      <div className="request-tokens">
                        In: {formatarNumero(request1.tokens_entrada)} • 
                        Out: {formatarNumero(request1.tokens_saida)}
                      </div>
                      <div className="request-custo">{formatarMoeda(custo1)}</div>
                    </div>
                  ) : (
                    <span className="no-data">-</span>
                  )}
                </div>
                <div className="col-request">
                  {request2 ? (
                    <div className="request-info">
                      <div className="request-modelo">{request2.modelo}</div>
                      <div className="request-tokens">
                        In: {formatarNumero(request2.tokens_entrada)} • 
                        Out: {formatarNumero(request2.tokens_saida)}
                      </div>
                      <div className="request-custo">{formatarMoeda(custo2)}</div>
                    </div>
                  ) : (
                    <span className="no-data">-</span>
                  )}
                </div>
                <div className="col-custo">
                  <div className="custo-total">{formatarMoeda(custoTotal)}</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de Configuração de Preços */}
      {showConfigPrecos && (
        <ConfigPrecos 
          precos={precos}
          onClose={() => setShowConfigPrecos(false)}
          onSave={() => {
            carregarDados()
            setShowConfigPrecos(false)
          }}
        />
      )}
    </div>
  )
}

export default CustosLLM
