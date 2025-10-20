import { supabase } from './supabase'

/**
 * Service para gerenciamento de tags
 */

/**
 * Listar todas as tags ordenadas por nome
 */
export const listarTags = async () => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('nome')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao listar tags:', error)
    return { data: null, error }
  }
}

/**
 * Criar nova tag
 */
export const criarTag = async (nome, cor) => {
  try {
    // Validação básica
    if (!nome || !cor) {
      throw new Error('Nome e cor são obrigatórios')
    }

    // Garantir que a cor está no formato correto
    const corFormatada = cor.startsWith('#') ? cor : `#${cor}`

    const { data, error } = await supabase
      .from('tags')
      .insert({ nome: nome.trim(), cor: corFormatada })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao criar tag:', error)
    return { data: null, error }
  }
}

/**
 * Atualizar tag existente
 */
export const atualizarTag = async (id, nome, cor) => {
  try {
    if (!id || !nome || !cor) {
      throw new Error('ID, nome e cor são obrigatórios')
    }

    const corFormatada = cor.startsWith('#') ? cor : `#${cor}`

    const { data, error } = await supabase
      .from('tags')
      .update({ nome: nome.trim(), cor: corFormatada })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao atualizar tag:', error)
    return { data: null, error }
  }
}

/**
 * Excluir tag
 */
export const excluirTag = async (id) => {
  try {
    if (!id) {
      throw new Error('ID é obrigatório')
    }

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Erro ao excluir tag:', error)
    return { error }
  }
}

/**
 * Obter tags de uma reunião específica
 */
export const obterTagsReuniao = async (reuniaoId) => {
  try {
    if (!reuniaoId) {
      throw new Error('ID da reunião é obrigatório')
    }

    const { data, error } = await supabase
      .from('reuniao_tags')
      .select(`
        tag_id,
        tags (*)
      `)
      .eq('reuniao_id', reuniaoId)

    if (error) throw error

    // Extrair apenas os objetos de tags
    const tags = data?.map(item => item.tags) || []
    return { data: tags, error: null }
  } catch (error) {
    console.error('Erro ao obter tags da reunião:', error)
    return { data: null, error }
  }
}

/**
 * Associar tag a uma reunião
 */
export const associarTagReuniao = async (reuniaoId, tagId) => {
  try {
    if (!reuniaoId || !tagId) {
      throw new Error('ID da reunião e da tag são obrigatórios')
    }

    const { data, error } = await supabase
      .from('reuniao_tags')
      .insert({ reuniao_id: reuniaoId, tag_id: tagId })
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao associar tag à reunião:', error)
    return { data: null, error }
  }
}

/**
 * Desassociar tag de uma reunião
 */
export const desassociarTagReuniao = async (reuniaoId, tagId) => {
  try {
    if (!reuniaoId || !tagId) {
      throw new Error('ID da reunião e da tag são obrigatórios')
    }

    const { error } = await supabase
      .from('reuniao_tags')
      .delete()
      .eq('reuniao_id', reuniaoId)
      .eq('tag_id', tagId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Erro ao desassociar tag da reunião:', error)
    return { error }
  }
}

/**
 * Obter contagem de reuniões por tag
 */
export const obterContagemReunioesPorTag = async () => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select(`
        id,
        nome,
        cor,
        reuniao_tags (count)
      `)
      .order('nome')

    if (error) throw error

    // Transformar a resposta para ter um formato mais simples
    const tagsComContagem = data?.map(tag => ({
      ...tag,
      contagem_reunioes: tag.reuniao_tags?.[0]?.count || 0
    })) || []

    return { data: tagsComContagem, error: null }
  } catch (error) {
    console.error('Erro ao obter contagem de reuniões por tag:', error)
    return { data: null, error }
  }
}

/**
 * Atualizar tags de uma reunião (remove todas e adiciona as novas)
 */
export const atualizarTagsReuniao = async (reuniaoId, tagIds) => {
  try {
    if (!reuniaoId) {
      throw new Error('ID da reunião é obrigatório')
    }

    // Primeiro, remover todas as tags existentes
    const { error: deleteError } = await supabase
      .from('reuniao_tags')
      .delete()
      .eq('reuniao_id', reuniaoId)

    if (deleteError) throw deleteError

    // Se não há tags para adicionar, retornar sucesso
    if (!tagIds || tagIds.length === 0) {
      return { error: null }
    }

    // Adicionar as novas tags
    const inserts = tagIds.map(tagId => ({
      reuniao_id: reuniaoId,
      tag_id: tagId
    }))

    const { error: insertError } = await supabase
      .from('reuniao_tags')
      .insert(inserts)

    if (insertError) throw insertError
    return { error: null }
  } catch (error) {
    console.error('Erro ao atualizar tags da reunião:', error)
    return { error }
  }
}

