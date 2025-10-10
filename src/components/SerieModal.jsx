import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

function SerieModal({ isOpen, onClose, serie = null, onSave }) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo_agrupamento: 'manual',
    empresa_id: '',
    produto_id: '',
    visivel_cliente: false
  })

  const [empresas, setEmpresas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [reunioesDisponiveis, setReunioesDisponiveis] = useState([])
  const [reunioesSelecionadas, setReunioesSelecionadas] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const isEdit = Boolean(serie)

  useEffect(() => {
    if (isOpen) {
      carregarDados()
      if (isEdit) {
        carregarDadosSerie()
      } else {
        resetForm()
      }
    }
  }, [isOpen, serie])

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

      // Carregar reuniões disponíveis (sem série)
      const { data: reunioesData, error: reunioesError } = await supabase
        .from('reunioes')
        .select(`
          id,
          titulo_original,
          data_reuniao,
          empresas!reunioes_empresa_id_fkey(nome),
          produtos!reunioes_produto_id_fkey(nome)
        `)
        .is('serie_id', null)
        .order('data_reuniao', { ascending: false })

      if (reunioesError) throw reunioesError

      setEmpresas(empresasData || [])
      setProdutos(produtosData || [])
      setReunioesDisponiveis(reunioesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMessage('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const carregarDadosSerie = async () => {
    if (serie) {
      setFormData({
        nome: serie.nome || '',
        descricao: serie.descricao || '',
        tipo_agrupamento: serie.tipo_agrupamento || 'manual',
        empresa_id: serie.empresa_id || '',
        produto_id: serie.produto_id || '',
        visivel_cliente: serie.visivel_cliente || false
      })

      // Carregar reuniões que já pertencem a esta série
      try {
        const { data: reunioesDaSerie, error } = await supabase
          .from('reunioes')
          .select('id')
          .eq('serie_id', serie.id)
        
        if (!error && reunioesDaSerie) {
          setReunioesSelecionadas(reunioesDaSerie.map(r => r.id))
        }

        // Também carregar as reuniões da série para exibir na lista
        const { data: reunioesData, error: reunioesError } = await supabase
          .from('reunioes')
          .select(`
            id,
            titulo_original,
            data_reuniao,
            empresas!reunioes_empresa_id_fkey(nome),
            produtos!reunioes_produto_id_fkey(nome)
          `)
          .or(`serie_id.is.null,serie_id.eq.${serie.id}`)
          .order('data_reuniao', { ascending: false })

        if (!reunioesError) {
          setReunioesDisponiveis(reunioesData || [])
        }
      } catch (error) {
        console.error('Erro ao carregar reuniões da série:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      tipo_agrupamento: 'manual',
      empresa_id: '',
      produto_id: '',
      visivel_cliente: false
    })
    setReunioesSelecionadas([])
    setMessage('')
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

  const handleReuniaoToggle = (reuniaoId, checked) => {
    if (checked) {
      setReunioesSelecionadas(prev => [...prev, reuniaoId])
    } else {
      setReunioesSelecionadas(prev => prev.filter(id => id !== reuniaoId))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      let serieId

      if (isEdit) {
        // Atualizar série existente
        const { data, error } = await supabase
          .from('series_reunioes')
          .update({
            nome: formData.nome,
            descricao: formData.descricao || null,
            empresa_id: formData.empresa_id || null,
            produto_id: formData.produto_id || null,
            tipo_agrupamento: formData.tipo_agrupamento,
            visivel_cliente: formData.visivel_cliente || false,
            updated_at: new Date().toISOString()
          })
          .eq('id', serie.id)
          .select()
          .single()

        if (error) throw error
        serieId = data.id

        // Atualizar associações de reuniões (apenas para séries manuais)
        if (formData.tipo_agrupamento === 'manual') {
          // Primeiro, desassociar todas as reuniões antigas
          await supabase
            .from('reunioes')
            .update({ serie_id: null })
            .eq('serie_id', serie.id)

          // Depois, associar as reuniões selecionadas
          if (reunioesSelecionadas.length > 0) {
            for (const reuniaoId of reunioesSelecionadas) {
              await supabase
                .from('reunioes')
                .update({ serie_id: serieId })
                .eq('id', reuniaoId)
            }
          }
        }
      } else {
        // Criar nova série
        const { data, error } = await supabase
          .from('series_reunioes')
          .insert([{
            nome: formData.nome,
            descricao: formData.descricao || null,
            empresa_id: formData.empresa_id || null,
            produto_id: formData.produto_id || null,
            tipo_agrupamento: formData.tipo_agrupamento || 'manual',
            visivel_cliente: formData.visivel_cliente || false
          }])
          .select()
          .single()

        if (error) throw error
        serieId = data.id

        // Associar reuniões selecionadas (apenas para séries manuais)
        if (formData.tipo_agrupamento === 'manual' && reunioesSelecionadas.length > 0) {
          for (const reuniaoId of reunioesSelecionadas) {
            await supabase
              .from('reunioes')
              .update({ serie_id: serieId })
              .eq('id', reuniaoId)
          }
        }
      }

      setMessage('Série salva com sucesso!')
      setTimeout(() => {
        onSave(serieId)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Erro ao salvar série:', error)
      setMessage('Erro ao salvar série: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const produtosFiltrados = produtos.filter(produto => 
    !formData.empresa_id || produto.empresa_id === formData.empresa_id
  )

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isEdit ? 'EDITAR SÉRIE' : 'NOVA SÉRIE'}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {message && (
              <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="nome">NOME DA SÉRIE *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Ex: Projeto Alpha - Cliente XYZ"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="descricao">DESCRIÇÃO</label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                className="form-control"
                rows="3"
                placeholder="Contexto do projeto, objetivos, etc."
              />
            </div>

            <div className="form-group">
              <label>TIPO DE AGRUPAMENTO</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="tipo_agrupamento"
                    value="manual"
                    checked={formData.tipo_agrupamento === 'manual'}
                    onChange={handleInputChange}
                  />
                  <span>MANUAL</span>
                  <small>Você seleciona as reuniões</small>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="tipo_agrupamento"
                    value="auto_produto"
                    checked={formData.tipo_agrupamento === 'auto_produto'}
                    onChange={handleInputChange}
                  />
                  <span>AUTO POR PRODUTO</span>
                  <small>Agrupa automaticamente por empresa + produto</small>
                </label>
              </div>
            </div>

            {formData.tipo_agrupamento === 'auto_produto' && (
              <>
                <div className="form-group">
                  <label htmlFor="empresa_id">EMPRESA</label>
                  <select
                    id="empresa_id"
                    name="empresa_id"
                    value={formData.empresa_id}
                    onChange={handleInputChange}
                    className="select-filter"
                  >
                    <option value="">Selecione uma empresa...</option>
                    {empresas.map(empresa => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="produto_id">PRODUTO</label>
                  <select
                    id="produto_id"
                    name="produto_id"
                    value={formData.produto_id}
                    onChange={handleInputChange}
                    className="select-filter"
                    disabled={!formData.empresa_id}
                  >
                    <option value="">Selecione um produto...</option>
                    {produtosFiltrados.map(produto => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {formData.tipo_agrupamento === 'manual' && (
              <div className="form-group">
                <label>REUNIÕES PARA INCLUIR</label>
                <div className="reunioes-selection">
                  {reunioesDisponiveis.length === 0 ? (
                    <p className="no-reunioes">Nenhuma reunião disponível (todas já estão em séries)</p>
                  ) : (
                    reunioesDisponiveis.map(reuniao => (
                      <label key={reuniao.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={reunioesSelecionadas.includes(reuniao.id)}
                          onChange={(e) => handleReuniaoToggle(reuniao.id, e.target.checked)}
                        />
                        <div className="reuniao-info">
                          <strong>{reuniao.titulo_original}</strong>
                          <small>
                            {new Date(reuniao.data_reuniao).toLocaleDateString('pt-BR')} • 
                            {reuniao.empresas?.nome} • {reuniao.produtos?.nome}
                          </small>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="visivel_cliente"
                  checked={formData.visivel_cliente}
                  onChange={handleInputChange}
                />
                <span>VISÍVEL PARA CLIENTE</span>
                <small>Permite compartilhamento futuro com clientes</small>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              CANCELAR
            </button>
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'SALVANDO...' : (isEdit ? 'ATUALIZAR' : 'CRIAR SÉRIE')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SerieModal
