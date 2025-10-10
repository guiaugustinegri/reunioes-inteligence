import React, { useState } from 'react'
import { supabase } from '../services/supabase'

function ConfigPrecos({ precos, onClose, onSave }) {
  const [precosEditaveis, setPrecosEditaveis] = useState([...precos])
  const [novoModelo, setNovoModelo] = useState({ modelo: '', preco_entrada: '', preco_saida: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handlePrecoChange = (id, campo, valor) => {
    setPrecosEditaveis(prev => 
      prev.map(preco => 
        preco.id === id 
          ? { ...preco, [campo]: valor }
          : preco
      )
    )
  }

  const adicionarModelo = () => {
    if (!novoModelo.modelo || !novoModelo.preco_entrada || !novoModelo.preco_saida) {
      setMessage('Preencha todos os campos do novo modelo')
      return
    }

    const novoPreco = {
      id: `temp-${Date.now()}`,
      modelo: novoModelo.modelo,
      preco_entrada_por_milhao: parseFloat(novoModelo.preco_entrada),
      preco_saida_por_milhao: parseFloat(novoModelo.preco_saida),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setPrecosEditaveis(prev => [...prev, novoPreco])
    setNovoModelo({ modelo: '', preco_entrada: '', preco_saida: '' })
    setMessage('')
  }

  const removerModelo = (id) => {
    setPrecosEditaveis(prev => prev.filter(preco => preco.id !== id))
  }

  const salvarPrecos = async () => {
    try {
      setSaving(true)
      setMessage('Salvando preços...')

      // Separar preços existentes dos novos
      const precosExistentes = precosEditaveis.filter(p => !p.id.toString().startsWith('temp-'))
      const precosNovos = precosEditaveis.filter(p => p.id.toString().startsWith('temp-'))

      // Atualizar preços existentes
      for (const preco of precosExistentes) {
        const { error } = await supabase
          .from('llm_precos')
          .update({
            preco_entrada_por_milhao: preco.preco_entrada_por_milhao,
            preco_saida_por_milhao: preco.preco_saida_por_milhao,
            updated_at: new Date().toISOString()
          })
          .eq('id', preco.id)

        if (error) throw error
      }

      // Inserir novos preços
      if (precosNovos.length > 0) {
        const novosPrecos = precosNovos.map(p => ({
          modelo: p.modelo,
          preco_entrada_por_milhao: p.preco_entrada_por_milhao,
          preco_saida_por_milhao: p.preco_saida_por_milhao
        }))

        const { error } = await supabase
          .from('llm_precos')
          .insert(novosPrecos)

        if (error) throw error
      }

      setMessage('Preços salvos com sucesso!')
      setTimeout(() => {
        onSave()
      }, 1000)

    } catch (error) {
      console.error('Erro ao salvar preços:', error)
      setMessage('Erro ao salvar preços: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content config-precos-modal">
        <div className="modal-header">
          <h3>Configurar Preços dos Modelos LLM</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {message && (
          <div className={`message ${message.includes('Erro') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="modal-body">
          <div className="precos-section">
            <h4>Modelos Existentes</h4>
            <div className="precos-list">
              {precosEditaveis.map(preco => (
                <div key={preco.id} className="preco-item">
                  <div className="preco-modelo">
                    <input
                      type="text"
                      value={preco.modelo}
                      onChange={(e) => handlePrecoChange(preco.id, 'modelo', e.target.value)}
                      className="form-control"
                      disabled={!preco.id.toString().startsWith('temp-')}
                    />
                  </div>
                  <div className="preco-entrada">
                    <label>Entrada ($/1M tokens)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={preco.preco_entrada_por_milhao}
                      onChange={(e) => handlePrecoChange(preco.id, 'preco_entrada_por_milhao', parseFloat(e.target.value) || 0)}
                      className="form-control"
                    />
                  </div>
                  <div className="preco-saida">
                    <label>Saída ($/1M tokens)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={preco.preco_saida_por_milhao}
                      onChange={(e) => handlePrecoChange(preco.id, 'preco_saida_por_milhao', parseFloat(e.target.value) || 0)}
                      className="form-control"
                    />
                  </div>
                  <div className="preco-actions">
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => removerModelo(preco.id)}
                      title="Remover modelo"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="novo-modelo-section">
            <h4>Adicionar Novo Modelo</h4>
            <div className="novo-modelo-form">
              <div className="form-group">
                <label>Modelo:</label>
                <input
                  type="text"
                  value={novoModelo.modelo}
                  onChange={(e) => setNovoModelo(prev => ({ ...prev, modelo: e.target.value }))}
                  className="form-control"
                  placeholder="Ex: gpt-4o, gpt-3.5-turbo"
                />
              </div>
              <div className="form-group">
                <label>Preço Entrada ($/1M tokens):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={novoModelo.preco_entrada}
                  onChange={(e) => setNovoModelo(prev => ({ ...prev, preco_entrada: e.target.value }))}
                  className="form-control"
                  placeholder="0.0000"
                />
              </div>
              <div className="form-group">
                <label>Preço Saída ($/1M tokens):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={novoModelo.preco_saida}
                  onChange={(e) => setNovoModelo(prev => ({ ...prev, preco_saida: e.target.value }))}
                  className="form-control"
                  placeholder="0.0000"
                />
              </div>
              <button 
                className="btn btn-primary"
                onClick={adicionarModelo}
              >
                Adicionar Modelo
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-success"
            onClick={salvarPrecos}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Preços'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={onClose}
            style={{ marginLeft: '1rem' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfigPrecos
