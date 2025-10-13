import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import SerieModal from './SerieModal'
import AnaliseSerieModal from './AnaliseSerieModal'

function SeriesReunioes() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [series, setSeries] = useState([])
  const [serieSelecionada, setSerieSelecionada] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  
  // Estados dos modais
  const [showSerieModal, setShowSerieModal] = useState(false)
  const [showAnaliseModal, setShowAnaliseModal] = useState(false)
  const [serieParaEditar, setSerieParaEditar] = useState(null)
  
  // Controles da interface
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [visualizacao, setVisualizacao] = useState({
    mostrarResumoUltraConciso: true,
    mostrarResumoConciso: false,
    mostrarResumoIA: false,
    mostrarTarefas: true,
    ordenacao: 'data_asc' // data_asc, data_desc, titulo
  })
  
  // Filtros
  const [filtros, setFiltros] = useState({
    empresa_id: '',
    produto_id: '',
    busca: ''
  })

  useEffect(() => {
    inicializarSeriesAutomaticas()
  }, [])

  const inicializarSeriesAutomaticas = async () => {
    try {
      // Verificar se já inicializou séries nesta sessão
      const seriesInicializadas = sessionStorage.getItem('series_auto_inicializadas')
      const ultimaInicializacao = sessionStorage.getItem('series_auto_timestamp')
      const agora = Date.now()
      const INTERVALO_MINIMO = 5 * 60 * 1000 // 5 minutos

      // Só criar séries automáticas se:
      // 1. Nunca foi inicializado nesta sessão, OU
      // 2. Passou mais de 5 minutos desde a última inicialização
      const deveInicializar = !seriesInicializadas || 
                              !ultimaInicializacao || 
                              (agora - parseInt(ultimaInicializacao)) > INTERVALO_MINIMO

      if (deveInicializar) {
        console.log('Inicializando séries automáticas...')
        await criarSeriesAutomaticasSilenciosamente()
        sessionStorage.setItem('series_auto_inicializadas', 'true')
        sessionStorage.setItem('series_auto_timestamp', agora.toString())
      } else {
        console.log('Séries já inicializadas recentemente, pulando...')
      }
      
      // Sempre carregar dados
      await carregarDados()
    } catch (error) {
      console.error('Erro ao inicializar:', error)
      // Mesmo com erro, tentar carregar dados
      carregarDados()
    }
  }

  const limparSeriesDuplicadas = async () => {
    try {
      // Buscar todas as séries automáticas
      const { data: seriesAuto, error: seriesError } = await supabase
        .from('series_reunioes')
        .select('*')
        .eq('tipo_agrupamento', 'auto_produto')
        .order('created_at', { ascending: true })

      if (seriesError) throw seriesError

      // Agrupar por empresa + produto
      const grupos = {}
      const duplicatasParaExcluir = []

      seriesAuto.forEach(serie => {
        const key = `${serie.empresa_id}-${serie.produto_id}`
        
        if (!grupos[key]) {
          // Primeira série deste grupo - manter
          grupos[key] = serie
        } else {
          // Duplicata - marcar para exclusão
          duplicatasParaExcluir.push(serie.id)
        }
      })

      // Excluir duplicatas
      if (duplicatasParaExcluir.length > 0) {
        console.log(`Removendo ${duplicatasParaExcluir.length} séries duplicadas...`)
        
        for (const serieId of duplicatasParaExcluir) {
          // Desassociar reuniões antes de excluir
          await supabase
            .from('reunioes')
            .update({ serie_id: null })
            .eq('serie_id', serieId)

          // Excluir série duplicada
          await supabase
            .from('series_reunioes')
            .delete()
            .eq('id', serieId)
        }
        
        console.log(`${duplicatasParaExcluir.length} séries duplicadas removidas!`)
      }

      return grupos // Retornar grupos únicos
    } catch (error) {
      console.error('Erro ao limpar duplicatas:', error)
      return {}
    }
  }

  const criarSeriesAutomaticasSilenciosamente = async () => {
    try {
      // 1. Primeiro limpar duplicatas existentes
      await limparSeriesDuplicadas()

      // 2. Buscar todas as séries automáticas existentes em uma única query
      const { data: seriesExistentes, error: seriesError } = await supabase
        .from('series_reunioes')
        .select('id, empresa_id, produto_id')
        .eq('tipo_agrupamento', 'auto_produto')

      if (seriesError) throw seriesError

      // Criar mapa de séries existentes para verificação rápida
      const seriesMap = {}
      seriesExistentes.forEach(serie => {
        const key = `${serie.empresa_id}-${serie.produto_id}`
        seriesMap[key] = serie.id
      })

      // 3. Buscar combinações únicas de empresa + produto que têm reuniões
      const { data: combinacoes, error: combinacoesError } = await supabase
        .from('reunioes')
        .select(`
          empresa_id,
          produto_id,
          empresas!reunioes_empresa_id_fkey(nome),
          produtos!reunioes_produto_id_fkey(nome)
        `)
        .not('empresa_id', 'is', null)
        .not('produto_id', 'is', null)

      if (combinacoesError) throw combinacoesError

      // 4. Agrupar por empresa + produto
      const grupos = {}
      combinacoes.forEach(reuniao => {
        const key = `${reuniao.empresa_id}-${reuniao.produto_id}`
        if (!grupos[key]) {
          grupos[key] = {
            empresa_id: reuniao.empresa_id,
            produto_id: reuniao.produto_id,
            empresa_nome: reuniao.empresas?.nome,
            produto_nome: reuniao.produtos?.nome
          }
        }
      })

      // 5. Criar apenas as séries que não existem
      for (const [key, grupo] of Object.entries(grupos)) {
        let serieId = seriesMap[key]
        
        if (!serieId) {
          // Série não existe, criar
          const nomeSerie = `${grupo.produto_nome} - ${grupo.empresa_nome}`
          
          const { data: novaSerie, error: erroCriacao } = await supabase
            .from('series_reunioes')
            .insert([{
              nome: nomeSerie,
              descricao: `Série automática para o produto ${grupo.produto_nome} da empresa ${grupo.empresa_nome}`,
              empresa_id: grupo.empresa_id,
              produto_id: grupo.produto_id,
              tipo_agrupamento: 'auto_produto',
              visivel_cliente: false
            }])
            .select()
            .single()

          if (erroCriacao) {
            console.error('Erro ao criar série:', erroCriacao)
            continue
          }
          
          serieId = novaSerie.id
          console.log(`Série criada: ${nomeSerie}`)
        }

        // 6. Associar reuniões sem série à série correta
        await supabase
          .from('reunioes')
          .update({ serie_id: serieId })
          .eq('empresa_id', grupo.empresa_id)
          .eq('produto_id', grupo.produto_id)
          .is('serie_id', null)
      }
    } catch (error) {
      console.error('Erro ao criar séries automáticas silenciosamente:', error)
    }
  }

  useEffect(() => {
    if (id && series.length > 0) {
      const serie = series.find(s => s.id === id)
      if (serie) {
        setSerieSelecionada(serie)
        carregarSerieCompleta(serie.id)
      }
    }
  }, [id, series])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar séries com contagem de reuniões
      const { data: seriesData, error: seriesError } = await supabase
        .from('series_reunioes')
        .select(`
          *,
          empresas!series_reunioes_empresa_id_fkey(nome),
          produtos!series_reunioes_produto_id_fkey(nome)
        `)
        .order('updated_at', { ascending: false })

      if (seriesError) throw seriesError

      // Para cada série, contar quantas reuniões tem
      const seriesComContagem = await Promise.all(
        (seriesData || []).map(async (serie) => {
          const { count } = await supabase
            .from('reunioes')
            .select('id', { count: 'exact', head: true })
            .eq('serie_id', serie.id)
          
          return {
            ...serie,
            total_reunioes: count || 0
          }
        })
      )

      // Filtrar apenas séries que têm reuniões e ordenar (não-ignoradas primeiro)
      const seriesComReunioes = seriesComContagem
        .filter(serie => serie.total_reunioes > 0)
        .sort((a, b) => {
          // Não-ignoradas primeiro
          if (a.ignorada && !b.ignorada) return 1
          if (!a.ignorada && b.ignorada) return -1
          // Dentro de cada grupo, por data de atualização
          return new Date(b.updated_at) - new Date(a.updated_at)
        })

      // Carregar empresas para filtro
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome')
        .order('nome')

      if (empresasError) throw empresasError

      // Carregar produtos para filtro
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, empresa_id')
        .order('nome')

      if (produtosError) throw produtosError

      setSeries(seriesComReunioes)
      setEmpresas(empresasData || [])
      setProdutos(produtosData || [])

      // Se não há série selecionada e há séries com reuniões, selecionar a primeira
      if (!serieSelecionada && seriesComReunioes && seriesComReunioes.length > 0) {
        setSerieSelecionada(seriesComReunioes[0])
        carregarSerieCompleta(seriesComReunioes[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMessage('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const carregarSerieCompleta = async (serieId) => {
    try {
      // Buscar dados da série
      const { data: serieData, error: serieError } = await supabase
        .from('series_reunioes')
        .select(`
          *,
          empresas!series_reunioes_empresa_id_fkey(nome),
          produtos!series_reunioes_produto_id_fkey(nome)
        `)
        .eq('id', serieId)
        .single()

      if (serieError) throw serieError

      // Buscar reuniões da série ordenadas por data
      const { data: reunioesData, error: reunioesError } = await supabase
        .from('reunioes')
        .select(`
          id,
          titulo_original,
          data_reuniao,
          resumo_ultra_conciso,
          resumo_conciso,
          resumo_ia,
          tarefas_guilherme,
          status,
          ignorada,
          created_at
        `)
        .eq('serie_id', serieId)
        .order('data_reuniao', { ascending: true })

      if (reunioesError) throw reunioesError

      setSerieSelecionada({
        serie: serieData,
        reunioes: reunioesData || []
      })
    } catch (error) {
      console.error('Erro ao carregar série completa:', error)
      setMessage('Erro ao carregar série: ' + error.message)
    }
  }

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const aplicarFiltros = () => {
    carregarDados()
  }

  const limparFiltros = () => {
    setFiltros({
      empresa_id: '',
      produto_id: '',
      busca: ''
    })
  }

  const handleSerieClick = (serie) => {
    setSerieSelecionada(serie)
    carregarSerieCompleta(serie.id)
    navigate(`/series/${serie.id}`)
  }

  const handleNovaSerie = () => {
    setSerieParaEditar(null)
    setShowSerieModal(true)
  }

  const handleEditarSerie = (serie) => {
    setSerieParaEditar(serie)
    setShowSerieModal(true)
  }

  const handleExcluirSerie = async (serie) => {
    if (!confirm(`Tem certeza que deseja excluir a série "${serie.nome}"?`)) {
      return
    }

    try {
      // Primeiro, desassociar todas as reuniões da série
      await supabase
        .from('reunioes')
        .update({ serie_id: null })
        .eq('serie_id', serie.id)

      // Depois excluir a série
      const { error } = await supabase
        .from('series_reunioes')
        .delete()
        .eq('id', serie.id)

      if (error) throw error

      setMessage('Série excluída com sucesso!')
      carregarDados()
      
      // Se era a série selecionada, limpar seleção
      if (serieSelecionada?.serie?.id === serie.id) {
        setSerieSelecionada(null)
        navigate('/series')
      }
    } catch (error) {
      console.error('Erro ao excluir série:', error)
      setMessage('Erro ao excluir série: ' + error.message)
    }
  }

  const handleCriarSeriesAutomaticas = async () => {
    try {
      setLoading(true)
      setMessage('Processando séries automáticas...')
      
      // 1. Primeiro limpar duplicatas
      await limparSeriesDuplicadas()

      // 2. Buscar todas as séries automáticas existentes
      const { data: seriesExistentes, error: seriesError } = await supabase
        .from('series_reunioes')
        .select('id, empresa_id, produto_id')
        .eq('tipo_agrupamento', 'auto_produto')

      if (seriesError) throw seriesError

      // Criar mapa de séries existentes
      const seriesMap = {}
      seriesExistentes.forEach(serie => {
        const key = `${serie.empresa_id}-${serie.produto_id}`
        seriesMap[key] = serie.id
      })
      
      // 3. Buscar combinações únicas de empresa + produto que têm reuniões
      const { data: combinacoes, error: combinacoesError } = await supabase
        .from('reunioes')
        .select(`
          empresa_id,
          produto_id,
          empresas!reunioes_empresa_id_fkey(nome),
          produtos!reunioes_produto_id_fkey(nome)
        `)
        .not('empresa_id', 'is', null)
        .not('produto_id', 'is', null)

      if (combinacoesError) throw combinacoesError

      // 4. Agrupar por empresa + produto
      const grupos = {}
      combinacoes.forEach(reuniao => {
        const key = `${reuniao.empresa_id}-${reuniao.produto_id}`
        if (!grupos[key]) {
          grupos[key] = {
            empresa_id: reuniao.empresa_id,
            produto_id: reuniao.produto_id,
            empresa_nome: reuniao.empresas?.nome,
            produto_nome: reuniao.produtos?.nome
          }
        }
      })

      const seriesCriadas = []
      const seriesAtualizadas = []

      // 5. Criar apenas séries que não existem
      for (const [key, grupo] of Object.entries(grupos)) {
        let serieId = seriesMap[key]
        
        if (!serieId) {
          // Série não existe, criar
          const nomeSerie = `${grupo.produto_nome} - ${grupo.empresa_nome}`
          
          const { data: novaSerie, error: erroCriacao } = await supabase
            .from('series_reunioes')
            .insert([{
              nome: nomeSerie,
              descricao: `Série automática para o produto ${grupo.produto_nome} da empresa ${grupo.empresa_nome}`,
              empresa_id: grupo.empresa_id,
              produto_id: grupo.produto_id,
              tipo_agrupamento: 'auto_produto',
              visivel_cliente: false
            }])
            .select()
            .single()

          if (erroCriacao) {
            console.error('Erro ao criar série automática:', erroCriacao)
            continue
          }
          
          serieId = novaSerie.id
          seriesCriadas.push(novaSerie)
        } else {
          seriesAtualizadas.push(serieId)
        }

        // 6. Associar reuniões sem série
        await supabase
          .from('reunioes')
          .update({ serie_id: serieId })
          .eq('empresa_id', grupo.empresa_id)
          .eq('produto_id', grupo.produto_id)
          .is('serie_id', null)
      }

      const totalGrupos = Object.keys(grupos).length
      
      if (seriesCriadas.length > 0) {
        setMessage(`✅ ${seriesCriadas.length} nova(s) série(s) criada(s)! Total: ${totalGrupos} série(s) ativa(s).`)
      } else if (totalGrupos > 0) {
        setMessage(`✅ ${totalGrupos} série(s) automática(s) já existem. Reuniões associadas.`)
      } else {
        setMessage('ℹ️ Nenhuma combinação empresa+produto encontrada com reuniões.')
      }
      
      carregarDados()
    } catch (error) {
      console.error('Erro ao criar séries automáticas:', error)
      setMessage('❌ Erro ao criar séries automáticas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSerieSalva = (serieId) => {
    setShowSerieModal(false)
    carregarDados()
    
    // Se foi criada uma nova série, selecionar ela
    if (serieId) {
      setTimeout(() => {
        const novaSerie = series.find(s => s.id === serieId)
        if (novaSerie) {
          setSerieSelecionada(novaSerie)
          carregarSerieCompleta(serieId)
          navigate(`/series/${serieId}`)
        }
      }, 1000) // Aguardar carregarDados terminar
    }
  }

  const handleAnaliseCompleta = (resultado) => {
    setShowAnaliseModal(false)
    carregarDados() // Recarregar para atualizar última análise
  }

  const handleIgnorarSerie = async (serie, event) => {
    event.stopPropagation() // Não selecionar série ao clicar
    
    try {
      const novoEstado = !serie.ignorada
      
      const { error } = await supabase
        .from('series_reunioes')
        .update({ ignorada: novoEstado })
        .eq('id', serie.id)
      
      if (error) throw error
      
      setMessage(novoEstado 
        ? `Série "${serie.nome}" movida para final da lista` 
        : `Série "${serie.nome}" restaurada para prioridade normal`
      )
      carregarDados()
    } catch (error) {
      console.error('Erro ao ignorar/restaurar série:', error)
      setMessage('Erro ao atualizar série: ' + error.message)
    }
  }

  const toggleVisualizacao = (campo) => {
    setVisualizacao(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }))
  }

  const handleOrdenacaoChange = (novaOrdenacao) => {
    setVisualizacao(prev => ({
      ...prev,
      ordenacao: novaOrdenacao
    }))
  }

  const ordenarReunioes = (reunioes) => {
    if (!reunioes) return []
    
    const reunioesOrdenadas = [...reunioes]
    
    // Primeiro ordenar pelo critério escolhido
    let reunioesComOrdenacao = []
    switch (visualizacao.ordenacao) {
      case 'data_asc':
        reunioesComOrdenacao = reunioesOrdenadas.sort((a, b) => 
          new Date(a.data_reuniao) - new Date(b.data_reuniao)
        )
        break
      case 'data_desc':
        reunioesComOrdenacao = reunioesOrdenadas.sort((a, b) => 
          new Date(b.data_reuniao) - new Date(a.data_reuniao)
        )
        break
      case 'titulo':
        reunioesComOrdenacao = reunioesOrdenadas.sort((a, b) => 
          (a.titulo_original || '').localeCompare(b.titulo_original || '')
        )
        break
      default:
        reunioesComOrdenacao = reunioesOrdenadas
    }
    
    // Depois separar ignoradas e não-ignoradas
    return reunioesComOrdenacao.sort((a, b) => {
      if (a.ignorada && !b.ignorada) return 1
      if (!a.ignorada && b.ignorada) return -1
      return 0
    })
  }

  const handleIgnorarReuniao = async (reuniao, event) => {
    event.stopPropagation() // Não navegar para reunião ao clicar
    
    try {
      const novoEstado = !reuniao.ignorada
      
      const { error } = await supabase
        .from('reunioes')
        .update({ ignorada: novoEstado })
        .eq('id', reuniao.id)
      
      if (error) throw error
      
      setMessage(novoEstado 
        ? 'Reunião movida para final da lista' 
        : 'Reunião restaurada para ordem normal'
      )
      
      // Recarregar série completa para atualizar
      if (serieSelecionada?.serie?.id || serieSelecionada?.id) {
        carregarSerieCompleta(serieSelecionada.serie?.id || serieSelecionada.id)
      }
    } catch (error) {
      console.error('Erro ao ignorar/restaurar reunião:', error)
      setMessage('Erro ao atualizar reunião: ' + error.message)
    }
  }

  const produtosFiltrados = produtos.filter(produto => 
    !filtros.empresa_id || produto.empresa_id === filtros.empresa_id
  )

  if (loading && series.length === 0) {
    return (
      <div className="main-content">
        <div className="loading">Carregando séries...</div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className={`series-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Botão de Toggle do Sidebar */}
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expandir sidebar' : 'Retrair sidebar'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>

        {/* Sidebar - Lista de Séries */}
        <div className={`series-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h2>SÉRIES DE REUNIÕES</h2>
            <div className="sidebar-actions">
              <button 
                className="btn btn-success btn-sm"
                onClick={handleNovaSerie}
              >
                NOVA SÉRIE
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  setLoading(true)
                  setMessage('Limpando duplicatas...')
                  const grupos = await limparSeriesDuplicadas()
                  const total = Object.keys(grupos).length
                  setMessage(`✅ Limpeza concluída! ${total} série(s) única(s) mantida(s).`)
                  carregarDados()
                  setLoading(false)
                }}
                title="Remover séries duplicadas"
              >
                🧹 LIMPAR
              </button>
            </div>
          </div>

          {/* Filtros Minimalistas */}
          {!sidebarCollapsed && (
            <div className="sidebar-filters-minimal">
              <input
                type="text"
                placeholder="🔍 Buscar..."
                value={filtros.busca}
                onChange={(e) => handleFiltroChange('busca', e.target.value)}
                className="filter-input-minimal"
              />
              
              {(filtros.busca || filtros.empresa_id || filtros.produto_id) && (
                <button 
                  className="filter-clear-btn"
                  onClick={limparFiltros}
                  title="Limpar filtros"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Lista de Séries */}
          <div className="series-list">
            {series.length === 0 ? (
              <div className="no-series">
                <p>Nenhuma série encontrada</p>
                <button 
                  className="btn btn-success"
                  onClick={handleNovaSerie}
                >
                  CRIAR PRIMEIRA SÉRIE
                </button>
              </div>
            ) : (
              series.map(serie => (
                <div 
                  key={serie.id}
                  className={`serie-card ${serieSelecionada?.id === serie.id ? 'active' : ''} ${serie.ignorada ? 'ignorada' : ''}`}
                  onClick={() => handleSerieClick(serie)}
                >
                  <div className="serie-header">
                    <h4>{serie.nome}</h4>
                    <div className="serie-badges">
                      {serie.visivel_cliente && (
                        <span className="badge badge-cliente">CLIENTE</span>
                      )}
                      {serie.ignorada && (
                        <span className="badge badge-ignorada">IGNORADA</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="serie-meta">
                    <span className="reunioes-count">
                      {serie.total_reunioes} reuniões
                    </span>
                    {serie.ultima_reuniao_data && (
                      <span className="ultima-reuniao">
                        Última: {new Date(serie.ultima_reuniao_data).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="serie-actions">
                    <button 
                      className="btn btn-secondary btn-xs"
                      onClick={(e) => handleIgnorarSerie(serie, e)}
                      title={serie.ignorada ? 'Restaurar para prioridade normal' : 'Mover para final da lista'}
                    >
                      {serie.ignorada ? '↑ RESTAURAR' : '↓ IGNORAR'}
                    </button>
                    <button 
                      className="btn btn-primary btn-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditarSerie(serie)
                      }}
                    >
                      EDITAR
                    </button>
                    <button 
                      className="btn btn-danger btn-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExcluirSerie(serie)
                      }}
                    >
                      EXCLUIR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Área Principal - Ata Contínua */}
        <div className="series-main">
          {serieSelecionada ? (
            <>
              {/* Header da Série */}
              <div className="serie-header-main">
                <div className="serie-title">
                  <h1>ATA CONTÍNUA</h1>
                  <h2>{serieSelecionada.serie?.nome || serieSelecionada.nome}</h2>
                </div>
                
                <div className="serie-info">
                  {serieSelecionada.serie?.empresa_nome && (
                    <span>Empresa: {serieSelecionada.serie.empresa_nome}</span>
                  )}
                  {serieSelecionada.serie?.produto_nome && (
                    <span>Produto: {serieSelecionada.serie.produto_nome}</span>
                  )}
                  <span>Total: {serieSelecionada.reunioes?.length || 0} reuniões</span>
                  {serieSelecionada.serie?.periodo && (
                    <span>
                      Período: {new Date(serieSelecionada.serie.periodo.inicio).toLocaleDateString('pt-BR')} - 
                      {new Date(serieSelecionada.serie.periodo.fim).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                <div className="serie-actions-main">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleEditarSerie(serieSelecionada.serie || serieSelecionada)}
                  >
                    EDITAR SÉRIE
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={() => setShowAnaliseModal(true)}
                  >
                    ANÁLISE LLM
                  </button>
                  {serieSelecionada.serie?.visivel_cliente && (
                    <button className="btn btn-primary">
                      COMPARTILHAR
                    </button>
                  )}
                </div>
              </div>

              {/* Controles de Visualização */}
              <div className="ata-controles">
                <div className="controles-section">
                  <h4>O QUE MOSTRAR:</h4>
                  <div className="controles-checkboxes">
                    <label className="checkbox-inline">
                      <input
                        type="checkbox"
                        checked={visualizacao.mostrarResumoUltraConciso}
                        onChange={() => toggleVisualizacao('mostrarResumoUltraConciso')}
                      />
                      <span>Resumo Ultra-Conciso</span>
                    </label>
                    <label className="checkbox-inline">
                      <input
                        type="checkbox"
                        checked={visualizacao.mostrarResumoConciso}
                        onChange={() => toggleVisualizacao('mostrarResumoConciso')}
                      />
                      <span>Resumo Conciso</span>
                    </label>
                    <label className="checkbox-inline">
                      <input
                        type="checkbox"
                        checked={visualizacao.mostrarResumoIA}
                        onChange={() => toggleVisualizacao('mostrarResumoIA')}
                      />
                      <span>Resumo IA</span>
                    </label>
                    <label className="checkbox-inline">
                      <input
                        type="checkbox"
                        checked={visualizacao.mostrarTarefas}
                        onChange={() => toggleVisualizacao('mostrarTarefas')}
                      />
                      <span>Tarefas/Pendências</span>
                    </label>
                  </div>
                </div>

                <div className="controles-section">
                  <h4>ORDENAR POR:</h4>
                  <div className="controles-radios">
                    <label className="radio-inline">
                      <input
                        type="radio"
                        name="ordenacao"
                        value="data_asc"
                        checked={visualizacao.ordenacao === 'data_asc'}
                        onChange={() => handleOrdenacaoChange('data_asc')}
                      />
                      <span>Data (Mais Antiga → Mais Recente)</span>
                    </label>
                    <label className="radio-inline">
                      <input
                        type="radio"
                        name="ordenacao"
                        value="data_desc"
                        checked={visualizacao.ordenacao === 'data_desc'}
                        onChange={() => handleOrdenacaoChange('data_desc')}
                      />
                      <span>Data (Mais Recente → Mais Antiga)</span>
                    </label>
                    <label className="radio-inline">
                      <input
                        type="radio"
                        name="ordenacao"
                        value="titulo"
                        checked={visualizacao.ordenacao === 'titulo'}
                        onChange={() => handleOrdenacaoChange('titulo')}
                      />
                      <span>Título (A-Z)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Timeline de Reuniões */}
              <div className="timeline-reunioes">
                {serieSelecionada.reunioes?.length === 0 ? (
                  <div className="no-reunioes">
                    <p>Nenhuma reunião nesta série</p>
                  </div>
                ) : (
                  ordenarReunioes(serieSelecionada.reunioes).map((reuniao, index) => {
                    const empresaNome = serieSelecionada.serie?.empresas?.nome || 'Sem empresa'
                    const produtoNome = serieSelecionada.serie?.produtos?.nome || 'Sem projeto'
                    const dataFormatada = new Date(reuniao.data_reuniao).toLocaleDateString('pt-BR')
                    
                    return (
                    <div 
                      key={reuniao.id} 
                      className={`timeline-item timeline-item-clickable ${reuniao.ignorada ? 'ignorada' : ''}`}
                      onClick={() => navigate(`/reuniao/detalhes/${reuniao.id}`)}
                      title="Clique para ver reunião completa"
                    >
                      <div className="timeline-header">
                        <div className="timeline-header-content">
                          <h3>{empresaNome} - {produtoNome} - {dataFormatada}</h3>
                          {reuniao.ignorada && <span className="badge badge-ignorada">IGNORADA</span>}
                        </div>
                        <div className="timeline-header-actions">
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={(e) => handleIgnorarReuniao(reuniao, e)}
                            title={reuniao.ignorada ? 'Restaurar' : 'Ignorar'}
                          >
                            {reuniao.ignorada ? '↑' : '↓'}
                          </button>
                          <span className="reuniao-status">{reuniao.status}</span>
                        </div>
                      </div>
                      
                      <div className="timeline-content">
                        {visualizacao.mostrarResumoUltraConciso && reuniao.resumo_ultra_conciso && (
                          <div className="resumo-section">
                            <strong>RESUMO ULTRA-CONCISO:</strong>
                            <p>{reuniao.resumo_ultra_conciso}</p>
                          </div>
                        )}

                        {visualizacao.mostrarResumoConciso && reuniao.resumo_conciso && (
                          <div className="resumo-section">
                            <strong>RESUMO CONCISO:</strong>
                            <p>{reuniao.resumo_conciso}</p>
                          </div>
                        )}

                        {visualizacao.mostrarResumoIA && reuniao.resumo_ia && (
                          <div className="resumo-section resumo-ia-html">
                            <strong>RESUMO IA:</strong>
                            <div dangerouslySetInnerHTML={{ __html: reuniao.resumo_ia }} />
                          </div>
                        )}

                        {visualizacao.mostrarTarefas && reuniao.tarefas_guilherme && (
                          <div className="resumo-section tarefas-section">
                            <strong>TAREFAS/PENDÊNCIAS:</strong>
                            <p>{reuniao.tarefas_guilherme}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                  })
                )}
              </div>

              {/* Seção de Análise LLM */}
              {serieSelecionada.serie?.ultima_analise_llm && (
                <div className="analise-section">
                  <h3>ÚLTIMA ANÁLISE LLM</h3>
                  <div className="analise-meta">
                    <small>
                      Gerada em: {new Date(serieSelecionada.serie.ultima_analise_data).toLocaleString('pt-BR')}
                    </small>
                  </div>
                  <div className="analise-content">
                    <pre>{serieSelecionada.serie.ultima_analise_llm}</pre>
                  </div>
                  <button 
                    className="btn btn-success"
                    onClick={() => setShowAnaliseModal(true)}
                  >
                    NOVA ANÁLISE
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-serie-selected">
              <h2>Selecione uma série para visualizar</h2>
              <p>Escolha uma série na barra lateral para ver a ata contínua</p>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <SerieModal
        isOpen={showSerieModal}
        onClose={() => setShowSerieModal(false)}
        serie={serieParaEditar}
        onSave={handleSerieSalva}
      />

      <AnaliseSerieModal
        isOpen={showAnaliseModal}
        onClose={() => setShowAnaliseModal(false)}
        serie={serieSelecionada}
        onAnaliseCompleta={handleAnaliseCompleta}
      />

      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default SeriesReunioes
