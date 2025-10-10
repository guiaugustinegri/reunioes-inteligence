import { supabase } from './supabase'

/**
 * Serviço para gerenciar séries de reuniões (atas contínuas)
 */
export const seriesService = {
  
  /**
   * Lista todas as séries com contagem de reuniões
   */
  async listarSeries() {
    try {
      const { data, error } = await supabase
        .from('series_com_contagem')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Erro ao listar séries:', error)
      return { data: [], error: error.message }
    }
  },

  /**
   * Lista séries com informações completas (empresa, produto)
   */
  async listarSeriesCompletas() {
    try {
      const { data, error } = await supabase
        .from('series_completa')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Erro ao listar séries completas:', error)
      return { data: [], error: error.message }
    }
  },

  /**
   * Cria uma nova série
   */
  async criarSerie(dados) {
    try {
      const { data, error } = await supabase
        .from('series_reunioes')
        .insert([{
          nome: dados.nome,
          descricao: dados.descricao || null,
          empresa_id: dados.empresa_id || null,
          produto_id: dados.produto_id || null,
          tipo_agrupamento: dados.tipo_agrupamento || 'manual',
          visivel_cliente: dados.visivel_cliente || false
        }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Erro ao criar série:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Atualiza uma série existente
   */
  async atualizarSerie(id, dados) {
    try {
      const { data, error } = await supabase
        .from('series_reunioes')
        .update({
          nome: dados.nome,
          descricao: dados.descricao || null,
          empresa_id: dados.empresa_id || null,
          produto_id: dados.produto_id || null,
          tipo_agrupamento: dados.tipo_agrupamento,
          visivel_cliente: dados.visivel_cliente || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Erro ao atualizar série:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Exclui uma série
   */
  async excluirSerie(id) {
    try {
      // Primeiro, desassociar todas as reuniões da série
      await supabase
        .from('reunioes')
        .update({ serie_id: null })
        .eq('serie_id', id)

      // Depois excluir a série
      const { error } = await supabase
        .from('series_reunioes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: true, error: null }
    } catch (error) {
      console.error('Erro ao excluir série:', error)
      return { data: false, error: error.message }
    }
  },

  /**
   * Obtém uma série específica com todas as reuniões
   */
  async obterSerieComReunioes(id) {
    try {
      // Buscar dados da série
      const { data: serieData, error: serieError } = await supabase
        .from('series_completa')
        .select('*')
        .eq('id', id)
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
          created_at
        `)
        .eq('serie_id', id)
        .order('data_reuniao', { ascending: true })

      if (reunioesError) throw reunioesError

      return { 
        data: {
          serie: serieData,
          reunioes: reunioesData || []
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Erro ao obter série com reuniões:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Associa uma reunião a uma série
   */
  async associarReuniaoSerie(reuniaoId, serieId) {
    try {
      const { data, error } = await supabase
        .from('reunioes')
        .update({ serie_id: serieId })
        .eq('id', reuniaoId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Erro ao associar reunião à série:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Remove uma reunião de uma série
   */
  async desassociarReuniaoSerie(reuniaoId) {
    try {
      const { data, error } = await supabase
        .from('reunioes')
        .update({ serie_id: null })
        .eq('id', reuniaoId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Erro ao desassociar reunião da série:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Cria séries automáticas baseadas em empresa + produto
   */
  async criarSeriesAutomaticas() {
    try {
      // Buscar combinações únicas de empresa + produto que têm reuniões
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

      // Agrupar por empresa + produto
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

      // Criar série para cada grupo que não tenha série automática
      for (const grupo of Object.values(grupos)) {
        // Verificar se já existe série automática para esta combinação
        const { data: serieExistente } = await supabase
          .from('series_reunioes')
          .select('id')
          .eq('empresa_id', grupo.empresa_id)
          .eq('produto_id', grupo.produto_id)
          .eq('tipo_agrupamento', 'auto_produto')
          .single()

        if (!serieExistente) {
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
          } else {
            seriesCriadas.push(novaSerie)
          }
        }
      }

      return { data: seriesCriadas, error: null }
    } catch (error) {
      console.error('Erro ao criar séries automáticas:', error)
      return { data: [], error: error.message }
    }
  },

  /**
   * Gera documento consolidado da série (ata contínua)
   */
  async gerarAtaContinua(serieId) {
    try {
      const { data: serieCompleta, error } = await this.obterSerieComReunioes(serieId)
      
      if (error) throw error

      const { serie, reunioes } = serieCompleta

      // Montar documento da ata contínua
      const ataContinua = {
        serie: {
          id: serie.id,
          nome: serie.nome,
          descricao: serie.descricao,
          empresa_nome: serie.empresa_nome,
          produto_nome: serie.produto_nome,
          total_reunioes: reunioes.length,
          periodo: reunioes.length > 0 ? {
            inicio: reunioes[0]?.data_reuniao,
            fim: reunioes[reunioes.length - 1]?.data_reuniao
          } : null
        },
        reunioes: reunioes.map((reuniao, index) => ({
          numero: index + 1,
          id: reuniao.id,
          titulo: reuniao.titulo_original,
          data: reuniao.data_reuniao,
          resumo_ultra_conciso: reuniao.resumo_ultra_conciso,
          resumo_conciso: reuniao.resumo_conciso,
          resumo_ia: reuniao.resumo_ia,
          tarefas: reuniao.tarefas_guilherme,
          status: reuniao.status
        })),
        gerado_em: new Date().toISOString()
      }

      return { data: ataContinua, error: null }
    } catch (error) {
      console.error('Erro ao gerar ata contínua:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Salva análise LLM na série
   */
  async salvarAnaliseLLM(serieId, analise, modelo, tokens) {
    try {
      const { data, error } = await supabase
        .from('series_reunioes')
        .update({
          ultima_analise_llm: analise,
          ultima_analise_data: new Date().toISOString()
        })
        .eq('id', serieId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Erro ao salvar análise LLM:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Busca séries por filtros
   */
  async buscarSeries(filtros = {}) {
    try {
      let query = supabase
        .from('series_completa')
        .select('*')

      if (filtros.empresa_id) {
        query = query.eq('empresa_id', filtros.empresa_id)
      }

      if (filtros.produto_id) {
        query = query.eq('produto_id', filtros.produto_id)
      }

      if (filtros.tipo_agrupamento) {
        query = query.eq('tipo_agrupamento', filtros.tipo_agrupamento)
      }

      if (filtros.visivel_cliente !== undefined) {
        query = query.eq('visivel_cliente', filtros.visivel_cliente)
      }

      if (filtros.busca) {
        query = query.ilike('nome', `%${filtros.busca}%`)
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Erro ao buscar séries:', error)
      return { data: [], error: error.message }
    }
  }
}

