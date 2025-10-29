import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { listarTags } from '../services/tagsService'

function ReunioesLista() {
  const navigate = useNavigate()
  const [reunioes, setReunioes] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [tags, setTags] = useState([])
  const [reunioesTags, setReunioesTags] = useState({})
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroProduto, setFiltroProduto] = useState('')
  const [filtroTags, setFiltroTags] = useState([])
  const [filtroTag, setFiltroTag] = useState('')
  const [buscaLivre, setBuscaLivre] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [modoSelecao, setModoSelecao] = useState(false)
  const [reunioesSelecionadas, setReunioesSelecionadas] = useState([])

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar reuniões com joins
      const { data: reunioesData, error: reunioesError } = await supabase
        .from('reunioes')
        .select(`
          *,
          empresas!reunioes_empresa_id_fkey(nome),
          produtos!reunioes_produto_id_fkey(nome)
        `)
        .order('data_reuniao', { ascending: false })

      if (reunioesError) throw reunioesError

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

      // Carregar tags
      const { data: tagsData, error: tagsError } = await listarTags()
      if (tagsError) throw tagsError

      // Carregar tags de todas as reuniões
      const { data: reunioesTagsData, error: reunioesTagsError } = await supabase
        .from('reuniao_tags')
        .select(`
          reuniao_id,
          tag_id,
          tags (*)
        `)

      if (reunioesTagsError) throw reunioesTagsError

      // Organizar tags por reunião
      const tagsMap = {}
      reunioesTagsData?.forEach(rt => {
        if (!tagsMap[rt.reuniao_id]) {
          tagsMap[rt.reuniao_id] = []
        }
        tagsMap[rt.reuniao_id].push(rt.tags)
      })

      setReunioes(reunioesData || [])
      setEmpresas(empresasData || [])
      setProdutos(produtosData || [])
      setTags(tagsData || [])
      setReunioesTags(tagsMap)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMessage('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }


  const toggleSelecao = (id) => {
    if (reunioesSelecionadas.includes(id)) {
      setReunioesSelecionadas(reunioesSelecionadas.filter(reuniaoId => reuniaoId !== id))
    } else {
      setReunioesSelecionadas([...reunioesSelecionadas, id])
    }
  }

  const selecionarTodas = () => {
    if (reunioesSelecionadas.length === reunioesFiltradas.length) {
      setReunioesSelecionadas([])
    } else {
      setReunioesSelecionadas(reunioesFiltradas.map(r => r.id))
    }
  }

  const cancelarSelecao = () => {
    setModoSelecao(false)
    setReunioesSelecionadas([])
  }

  const excluirSelecionadas = async () => {
    if (reunioesSelecionadas.length === 0) {
      setMessage('Nenhuma reunião selecionada')
      return
    }

    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir ${reunioesSelecionadas.length} ${reunioesSelecionadas.length === 1 ? 'reunião' : 'reuniões'}?`
    )

    if (!confirmacao) return

    try {
      setLoading(true)

      // Primeiro excluir os participantes das reuniões
      const { error: errorParticipantes } = await supabase
        .from('reuniao_participantes')
        .delete()
        .in('reuniao_id', reunioesSelecionadas)

      if (errorParticipantes) throw errorParticipantes

      // Depois excluir as reuniões
      const { error } = await supabase
        .from('reunioes')
        .delete()
        .in('id', reunioesSelecionadas)

      if (error) throw error

      setMessage(`${reunioesSelecionadas.length} ${reunioesSelecionadas.length === 1 ? 'reunião excluída' : 'reuniões excluídas'} com sucesso!`)
      setReunioesSelecionadas([])
      setModoSelecao(false)
      carregarDados()
    } catch (error) {
      console.error('Erro ao excluir reuniões:', error)
      setMessage('Erro ao excluir reuniões: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoTratada = async (id, statusAtual) => {
    const novoStatus = statusAtual === 'tratada' ? 'pendente' : 'tratada'
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('reunioes')
        .update({ status: novoStatus })
        .eq('id', id)

      if (error) throw error

      setMessage(`Reunião marcada como ${novoStatus === 'tratada' ? 'tratada' : 'pendente'}!`)
      carregarDados()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setMessage('Erro ao atualizar status: ' + error.message)
    } finally {
      setLoading(false)
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
    return `${dia}/${mes}/${ano}`
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


  const reunioesFiltradas = reunioes.filter(reuniao => {
    // Filtro por empresa
    const matchEmpresa = !filtroEmpresa || reuniao.empresa_id === filtroEmpresa
    
    // Filtro por produto
    const matchProduto = !filtroProduto || reuniao.produto_id === filtroProduto
    
    // Busca livre (busca em título, empresa, produto, resumo e todo)
    const matchBusca = !buscaLivre || 
      (reuniao.titulo_original?.toLowerCase().includes(buscaLivre.toLowerCase())) ||
      (reuniao.empresas?.nome?.toLowerCase().includes(buscaLivre.toLowerCase())) ||
      (reuniao.produtos?.nome?.toLowerCase().includes(buscaLivre.toLowerCase())) ||
      (reuniao.resumo_ultra_conciso?.toLowerCase().includes(buscaLivre.toLowerCase())) ||
      (reuniao.tarefas_guilherme?.toLowerCase().includes(buscaLivre.toLowerCase())) ||
      (reuniao.todo_cliente?.toLowerCase().includes(buscaLivre.toLowerCase()))
    
    // Filtro por data de início
    const matchDataInicio = !dataInicio || 
      !reuniao.data_reuniao ||
      new Date(reuniao.data_reuniao) >= new Date(dataInicio)
    
    // Filtro por data fim
    const matchDataFim = !dataFim || 
      !reuniao.data_reuniao ||
      new Date(reuniao.data_reuniao) <= new Date(dataFim)
    
    // Filtro por status
    const matchStatus = !filtroStatus || reuniao.status === filtroStatus
    
    // Filtro por tag (filtrar ou excluir)
    let matchTag = true
    if (filtroTag) {
      if (filtroTag.startsWith('excluir-')) {
        // Excluir: reunião NÃO deve ter esta tag
        const tagId = filtroTag.replace('excluir-', '')
        matchTag = !reunioesTags[reuniao.id] || 
          !reunioesTags[reuniao.id].some(tag => tag.id === tagId)
      } else {
        // Filtrar: reunião deve ter esta tag
        matchTag = reunioesTags[reuniao.id] && 
          reunioesTags[reuniao.id].some(tag => tag.id === filtroTag)
      }
    }
    
    return matchEmpresa && matchProduto && matchBusca && matchDataInicio && matchDataFim && matchStatus && matchTag
  })

  const produtosFiltrados = filtroEmpresa 
    ? produtos.filter(produto => produto.empresa_id === filtroEmpresa)
    : produtos

  if (loading) {
    return <div className="main-content">Carregando...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>Reuniões</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!modoSelecao ? (
            <>
              <button 
                onClick={() => setModoSelecao(true)} 
                className="btn btn-primary"
                disabled={reunioesFiltradas.length === 0}
              >
                Selecionar em Massa
              </button>
              <Link to="/reuniao/nova" className="btn btn-success">
                Nova Reunião
              </Link>
            </>
          ) : (
            <>
              <button 
                onClick={selecionarTodas} 
                className="btn btn-primary"
              >
                {reunioesSelecionadas.length === reunioesFiltradas.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </button>
              <button 
                onClick={excluirSelecionadas} 
                className="btn btn-danger"
                disabled={reunioesSelecionadas.length === 0}
              >
                Excluir ({reunioesSelecionadas.length})
              </button>
              <button 
                onClick={cancelarSelecao} 
                className="btn btn-primary"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('Erro') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar em reuniões (título, empresa, produto, resumo, tarefas, todo cliente...)"
          value={buscaLivre}
          onChange={(e) => setBuscaLivre(e.target.value)}
        />
        
        <div className="search-filters">
          <input
            type="date"
            className="date-input"
            placeholder="Data início"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            title="Data início"
          />
          
          <input
            type="date"
            className="date-input"
            placeholder="Data fim"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            title="Data fim"
          />
          
          <select 
            className="select-filter"
            value={filtroEmpresa}
            onChange={(e) => {
              setFiltroEmpresa(e.target.value)
              setFiltroProduto('')
            }}
          >
            <option value="">Todas empresas</option>
            {empresas.map(empresa => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </option>
            ))}
          </select>

          <select 
            className="select-filter"
            value={filtroProduto}
            onChange={(e) => setFiltroProduto(e.target.value)}
            disabled={!filtroEmpresa}
          >
            <option value="">Todos produtos</option>
            {produtosFiltrados.map(produto => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
              </option>
            ))}
          </select>

          <select 
            className="select-filter"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos status</option>
            <option value="pendente">Pendente</option>
            <option value="tratada">Tratada</option>
          </select>

          <select 
            className="select-filter"
            value={filtroTag}
            onChange={(e) => setFiltroTag(e.target.value)}
          >
            <option value="">Todas as tags</option>
            <optgroup label="Filtrar por tag:">
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.nome}
                </option>
              ))}
            </optgroup>
            <optgroup label="Excluir tag:">
              {tags.map(tag => (
                <option key={`excluir-${tag.id}`} value={`excluir-${tag.id}`}>
                  Excluir: {tag.nome}
                </option>
              ))}
            </optgroup>
          </select>

          {(buscaLivre || dataInicio || dataFim || filtroEmpresa || filtroProduto || filtroStatus || filtroTag) && (
            <button 
              className="clear-btn"
              onClick={() => {
                setBuscaLivre('')
                setDataInicio('')
                setDataFim('')
                setFiltroEmpresa('')
                setFiltroProduto('')
                setFiltroStatus('')
                setFiltroTags([])
                setFiltroTag('')
              }}
              title="Limpar todos os filtros"
            >
              Limpar
            </button>
          )}
        </div>

        
        <div className="results-count">
          {reunioesFiltradas.length} {reunioesFiltradas.length === 1 ? 'reunião encontrada' : 'reuniões encontradas'}
        </div>
      </div>

      <div className="table-compact">
        <div className="table-header">
          {modoSelecao && <div className="col-checkbox"></div>}
          <div className="col-date">Data</div>
          <div className="col-empresa">Empresa</div>
          <div className="col-produto">Produto</div>
          <div className="col-status">Status</div>
          <div className="col-resumo">Resumo Ultra Conciso</div>
          <div className="col-todo">Meus Todos</div>
        </div>

        {reunioesFiltradas.length === 0 ? (
          <div className="empty-row">
            Nenhuma reunião encontrada
          </div>
        ) : (
          reunioesFiltradas.map(reuniao => (
            <div 
              key={reuniao.id} 
              className={`table-row ${!modoSelecao ? 'table-row-clickable' : ''} ${reunioesSelecionadas.includes(reuniao.id) ? 'table-row-selected' : ''}`}
              onClick={() => !modoSelecao && navigate(`/reuniao/detalhes/${reuniao.id}`)}
            >
              {modoSelecao && (
                <div className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={reunioesSelecionadas.includes(reuniao.id)}
                    onChange={() => toggleSelecao(reuniao.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="col-date">{formatarData(reuniao.data_reuniao)}</div>
              <div className="col-empresa">{reuniao.empresas?.nome || '-'}</div>
              <div className="col-produto">{reuniao.produtos?.nome || '-'}</div>
              <div className="col-status">
                <button 
                  className={`status-badge status-clickable ${reuniao.status === 'tratada' ? 'status-tratada' : 'status-pendente'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    marcarComoTratada(reuniao.id, reuniao.status)
                  }}
                  title={`Clique para marcar como ${reuniao.status === 'tratada' ? 'pendente' : 'tratada'}`}
                >
                  {reuniao.status === 'tratada' ? 'Tratada' : 'Pendente'}
                </button>
              </div>
              <div className="col-resumo">{reuniao.resumo_ultra_conciso || '-'}</div>
              <div className="col-todo">{reuniao.tarefas_guilherme || '-'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ReunioesLista