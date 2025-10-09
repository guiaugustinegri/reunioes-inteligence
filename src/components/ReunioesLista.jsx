import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'

function ReunioesLista() {
  const [reunioes, setReunioes] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroProduto, setFiltroProduto] = useState('')
  const [buscaLivre, setBuscaLivre] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

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

      setReunioes(reunioesData || [])
      setEmpresas(empresasData || [])
      setProdutos(produtosData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMessage('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const excluirReuniao = async (id) => {
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
      carregarDados()
    } catch (error) {
      console.error('Erro ao excluir reunião:', error)
      setMessage('Erro ao excluir reunião: ' + error.message)
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
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
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
      (reuniao.tarefas_guilherme?.toLowerCase().includes(buscaLivre.toLowerCase()))
    
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
    
    return matchEmpresa && matchProduto && matchBusca && matchDataInicio && matchDataFim && matchStatus
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
        <Link to="/reuniao/nova" className="btn btn-success">
          Nova Reunião
        </Link>
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
          placeholder="Buscar em reuniões (título, empresa, produto, resumo, tarefas...)"
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

          {(buscaLivre || dataInicio || dataFim || filtroEmpresa || filtroProduto || filtroStatus) && (
            <button 
              className="clear-btn"
              onClick={() => {
                setBuscaLivre('')
                setDataInicio('')
                setDataFim('')
                setFiltroEmpresa('')
                setFiltroProduto('')
                setFiltroStatus('')
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
          <div className="col-date">Data</div>
          <div className="col-title">Título</div>
          <div className="col-empresa">Empresa</div>
          <div className="col-produto">Produto</div>
          <div className="col-status">Status</div>
          <div className="col-resumo">Resumo Ultra Conciso</div>
          <div className="col-todo">To-do Guilherme</div>
          <div className="col-actions">Ações</div>
        </div>

        {reunioesFiltradas.length === 0 ? (
          <div className="empty-row">
            Nenhuma reunião encontrada
          </div>
        ) : (
          reunioesFiltradas.map(reuniao => (
            <div key={reuniao.id} className="table-row">
              <div className="col-date">{formatarData(reuniao.data_reuniao)}</div>
              <div className="col-title">{reuniao.titulo_original || 'Sem título'}</div>
              <div className="col-empresa">{reuniao.empresas?.nome || '-'}</div>
              <div className="col-produto">{reuniao.produtos?.nome || '-'}</div>
              <div className="col-status">
                <button 
                  className={`status-badge status-clickable ${reuniao.status === 'tratada' ? 'status-tratada' : 'status-pendente'}`}
                  onClick={() => marcarComoTratada(reuniao.id, reuniao.status)}
                  title={`Clique para marcar como ${reuniao.status === 'tratada' ? 'pendente' : 'tratada'}`}
                >
                  {reuniao.status === 'tratada' ? 'Tratada' : 'Pendente'}
                </button>
              </div>
              <div className="col-resumo">{reuniao.resumo_ultra_conciso || '-'}</div>
              <div className="col-todo">{reuniao.tarefas_guilherme || '-'}</div>
              <div className="col-actions">
                <Link to={`/resumo-ia/${reuniao.id}`} className="btn-compact btn-resumo" title="Ver Resumo IA">
                  Resumo IA
                </Link>
                <Link to={`/reuniao/${reuniao.id}`} className="btn-compact btn-edit">
                  Editar
                </Link>
                <button onClick={() => excluirReuniao(reuniao.id)} className="btn-compact btn-delete">
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ReunioesLista