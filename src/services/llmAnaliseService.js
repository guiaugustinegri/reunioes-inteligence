import { seriesService } from './seriesService'

/**
 * Serviço para análise LLM de séries de reuniões
 * Estrutura preparatória para futura integração com APIs LLM
 */
export const llmAnaliseService = {

  /**
   * Monta o contexto das reuniões para análise
   */
  async montarContextoSerie(reunioes, opcoes = {}) {
    try {
      const contexto = {
        total_reunioes: reunioes.length,
        periodo: {
          inicio: reunioes[0]?.data_reuniao,
          fim: reunioes[reunioes.length - 1]?.data_reuniao
        },
        reunioes: reunioes.map((reuniao, index) => ({
          numero: index + 1,
          data: reuniao.data_reuniao,
          titulo: reuniao.titulo_original,
          resumo_ultra_conciso: reuniao.resumo_ultra_conciso,
          resumo_conciso: opcoes.incluir_resumo_conciso ? reuniao.resumo_conciso : null,
          resumo_ia: opcoes.incluir_resumo_ia ? reuniao.resumo_ia : null,
          tarefas: opcoes.incluir_tarefas ? reuniao.tarefas_guilherme : null,
          transcricao: opcoes.incluir_transcricoes ? reuniao.transcricao_completa : null
        }))
      }

      return { data: contexto, error: null }
    } catch (error) {
      console.error('Erro ao montar contexto da série:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Calcula estimativa de tokens para análise
   */
  calcularTokensEstimados(contexto, opcoes = {}) {
    try {
      let tokensEstimados = 0

      // Tokens base (prompt + estrutura)
      tokensEstimados += 500

      // Tokens por reunião
      contexto.reunioes.forEach(reuniao => {
        // Resumo ultra-conciso (sempre incluído)
        tokensEstimados += this.contarTokens(reuniao.resumo_ultra_conciso || '')
        
        // Resumo conciso (se incluído)
        if (opcoes.incluir_resumo_conciso && reuniao.resumo_conciso) {
          tokensEstimados += this.contarTokens(reuniao.resumo_conciso)
        }
        
        // Resumo IA (se incluído)
        if (opcoes.incluir_resumo_ia && reuniao.resumo_ia) {
          tokensEstimados += this.contarTokens(reuniao.resumo_ia)
        }
        
        // Tarefas (se incluídas)
        if (opcoes.incluir_tarefas && reuniao.tarefas) {
          tokensEstimados += this.contarTokens(reuniao.tarefas)
        }
        
        // Transcrição (se incluída)
        if (opcoes.incluir_transcricoes && reuniao.transcricao) {
          tokensEstimados += this.contarTokens(reuniao.transcricao)
        }
      })

      // Margem de segurança (20%)
      tokensEstimados = Math.ceil(tokensEstimados * 1.2)

      return {
        entrada: tokensEstimados,
        saida: 2000, // Estimativa para resposta
        total: tokensEstimados + 2000
      }
    } catch (error) {
      console.error('Erro ao calcular tokens:', error)
      return { entrada: 0, saida: 0, total: 0 }
    }
  },

  /**
   * Conta tokens aproximados em um texto
   */
  contarTokens(texto) {
    if (!texto) return 0
    // Aproximação: 1 token ≈ 4 caracteres em português
    return Math.ceil(texto.length / 4)
  },

  /**
   * Gera prompt para análise de progressão
   */
  gerarPromptProgressao(contexto) {
    return `
Analise a progressão do projeto baseado nas seguintes reuniões:

CONTEXTO:
- Total de reuniões: ${contexto.total_reunioes}
- Período: ${contexto.periodo.inicio} a ${contexto.periodo.fim}

REUNIÕES:
${contexto.reunioes.map(r => `
Reunião #${r.numero} - ${r.data}
Título: ${r.titulo}
Resumo: ${r.resumo_ultra_conciso}
${r.resumo_conciso ? `Detalhes: ${r.resumo_conciso}` : ''}
${r.tarefas ? `Tarefas: ${r.tarefas}` : ''}
`).join('\n')}

ANÁLISE SOLICITADA:
Forneça uma análise detalhada sobre:
1. Progressão geral do projeto
2. Marcos alcançados
3. Evolução dos objetivos
4. Status atual
5. Próximos passos recomendados

Formate a resposta de forma clara e profissional, adequada para compartilhamento com stakeholders.
`
  },

  /**
   * Gera prompt para análise de pontos críticos
   */
  gerarPromptPontosCriticos(contexto) {
    return `
Identifique pontos críticos e riscos baseado nas seguintes reuniões:

CONTEXTO:
- Total de reuniões: ${contexto.total_reunioes}
- Período: ${contexto.periodo.inicio} a ${contexto.periodo.fim}

REUNIÕES:
${contexto.reunioes.map(r => `
Reunião #${r.numero} - ${r.data}
Título: ${r.titulo}
Resumo: ${r.resumo_ultra_conciso}
${r.resumo_conciso ? `Detalhes: ${r.resumo_conciso}` : ''}
${r.tarefas ? `Tarefas: ${r.tarefas}` : ''}
`).join('\n')}

ANÁLISE SOLICITADA:
Identifique e analise:
1. Pontos críticos recorrentes
2. Bloqueios identificados
3. Riscos potenciais
4. Dependências problemáticas
5. Recomendações para mitigação

Priorize por criticidade e impacto no projeto.
`
  },

  /**
   * Gera prompt para análise de pendências
   */
  gerarPromptPendencias(contexto) {
    return `
Liste e analise todas as pendências acumuladas baseado nas seguintes reuniões:

CONTEXTO:
- Total de reuniões: ${contexto.total_reunioes}
- Período: ${contexto.periodo.inicio} a ${contexto.periodo.fim}

REUNIÕES:
${contexto.reunioes.map(r => `
Reunião #${r.numero} - ${r.data}
Título: ${r.titulo}
Resumo: ${r.resumo_ultra_conciso}
${r.resumo_conciso ? `Detalhes: ${r.resumo_conciso}` : ''}
${r.tarefas ? `Tarefas: ${r.tarefas}` : ''}
`).join('\n')}

ANÁLISE SOLICITADA:
Organize as pendências por:
1. Pendências por reunião
2. Pendências acumuladas (não resolvidas)
3. Prioridade e urgência
4. Responsáveis (quando identificados)
5. Prazo estimado para resolução

Formate como uma lista de ações claras e acionáveis.
`
  },

  /**
   * Gera prompt customizado
   */
  gerarPromptCustomizado(contexto, promptCustomizado) {
    return `
${promptCustomizado}

CONTEXTO DAS REUNIÕES:
- Total de reuniões: ${contexto.total_reunioes}
- Período: ${contexto.periodo.inicio} a ${contexto.periodo.fim}

REUNIÕES:
${contexto.reunioes.map(r => `
Reunião #${r.numero} - ${r.data}
Título: ${r.titulo}
Resumo: ${r.resumo_ultra_conciso}
${r.resumo_conciso ? `Detalhes: ${r.resumo_conciso}` : ''}
${r.tarefas ? `Tarefas: ${r.tarefas}` : ''}
`).join('\n')}

Forneça uma análise detalhada e profissional baseada no contexto fornecido.
`
  },

  /**
   * Analisa série (placeholder - futura integração com API)
   */
  async analisarSerie(serieId, config) {
    try {
      // Buscar dados da série
      const { data: serieCompleta, error: serieError } = await seriesService.obterSerieComReunioes(serieId)
      
      if (serieError) throw serieError

      const { reunioes } = serieCompleta

      // Montar contexto
      const { data: contexto, error: contextoError } = await this.montarContextoSerie(reunioes, config.opcoes)
      
      if (contextoError) throw contextoError

      // Calcular tokens
      const tokens = this.calcularTokensEstimados(contexto, config.opcoes)

      // Gerar prompt baseado no tipo de análise
      let prompt = ''
      switch (config.tipo) {
        case 'progressao':
          prompt = this.gerarPromptProgressao(contexto)
          break
        case 'pontos_criticos':
          prompt = this.gerarPromptPontosCriticos(contexto)
          break
        case 'pendencias':
          prompt = this.gerarPromptPendencias(contexto)
          break
        case 'customizado':
          prompt = this.gerarPromptCustomizado(contexto, config.promptCustomizado)
          break
        default:
          throw new Error('Tipo de análise não reconhecido')
      }

      // PLACEHOLDER: Por enquanto retorna mock
      // TODO: Integrar com API LLM real (OpenAI, Anthropic, etc.)
      const resultado = await this.simularAnaliseLLM(config.tipo, contexto, tokens)

      return {
        data: {
          serie_id: serieId,
          tipo_analise: config.tipo,
          prompt_usado: prompt,
          tokens_estimados: tokens,
          resultado: resultado,
          gerado_em: new Date().toISOString()
        },
        error: null
      }
    } catch (error) {
      console.error('Erro ao analisar série:', error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Simula análise LLM (placeholder)
   */
  async simularAnaliseLLM(tipo, contexto, tokens) {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 2000))

    const simulacoes = {
      progressao: `
## ANÁLISE DE PROGRESSÃO DO PROJETO

### Status Geral
O projeto demonstra evolução consistente ao longo das ${contexto.total_reunioes} reuniões analisadas. Observa-se progressão clara nos objetivos estabelecidos.

### Marcos Alcançados
- Definição de requisitos completada
- Arquitetura inicial estabelecida
- Primeira versão funcional desenvolvida

### Evolução dos Objetivos
Os objetivos iniciais foram refinados e expandidos conforme o entendimento do projeto evoluiu. Novas funcionalidades foram identificadas e incorporadas ao escopo.

### Status Atual
O projeto encontra-se em fase de desenvolvimento ativo, com entregas regulares e feedback contínuo dos stakeholders.

### Próximos Passos Recomendados
1. Finalizar implementação das funcionalidades core
2. Realizar testes de integração
3. Preparar documentação para usuários finais
4. Planejar fase de deploy e treinamento

*Esta é uma análise simulada. Em produção, seria gerada por IA real.*
`,
      pontos_criticos: `
## ANÁLISE DE PONTOS CRÍTICOS E RISCOS

### Pontos Críticos Identificados
1. **Dependência de recursos externos** - Alto risco
2. **Complexidade técnica subestimada** - Médio risco
3. **Mudanças frequentes de escopo** - Alto risco

### Bloqueios Recorrentes
- Aprovações pendentes de stakeholders
- Definições técnicas ambíguas
- Recursos limitados para testes

### Riscos Potenciais
- Atraso no cronograma devido a dependências
- Qualidade comprometida por pressão de tempo
- Comunicação inadequada entre equipes

### Recomendações de Mitigação
1. Estabelecer processo formal de aprovações
2. Documentar decisões técnicas
3. Implementar buffer de tempo no cronograma
4. Melhorar comunicação regular

*Esta é uma análise simulada. Em produção, seria gerada por IA real.*
`,
      pendencias: `
## ANÁLISE DE PENDÊNCIAS ACUMULADAS

### Pendências por Reunião
**Reunião #1:**
- [ ] Definir arquitetura final
- [ ] Aprovar mockups de interface

**Reunião #2:**
- [ ] Resolver dependência de API externa
- [ ] Validar requisitos de segurança

**Reunião #3:**
- [ ] Implementar autenticação
- [ ] Configurar ambiente de testes

### Pendências Acumuladas (Críticas)
1. **Definição de arquitetura** - Pendente desde reunião #1
2. **Aprovação de mockups** - Bloqueando desenvolvimento
3. **Configuração de ambiente** - Impactando testes

### Priorização
**Alta Prioridade:**
- Resolver dependências de API
- Finalizar arquitetura

**Média Prioridade:**
- Configurar ambiente de testes
- Implementar autenticação

**Baixa Prioridade:**
- Documentação técnica
- Treinamento de usuários

*Esta é uma análise simulada. Em produção, seria gerada por IA real.*
`,
      customizado: `
## ANÁLISE CUSTOMIZADA

Baseado no contexto das ${contexto.total_reunioes} reuniões analisadas, aqui está a análise solicitada:

### Resumo Executivo
O projeto demonstra evolução positiva com alguns desafios identificados. A comunicação entre as partes tem sido eficaz, com progresso consistente nos objetivos estabelecidos.

### Principais Observações
- Engajamento da equipe mantido ao longo do período
- Entregas realizadas conforme cronograma
- Feedback incorporado de forma proativa

### Recomendações
1. Manter ritmo atual de reuniões
2. Documentar decisões importantes
3. Estabelecer métricas de progresso
4. Planejar revisões regulares

*Esta é uma análise simulada. Em produção, seria gerada por IA real.*
`
    }

    return simulacoes[tipo] || simulacoes.customizado
  },

  /**
   * Salva análise na série
   */
  async salvarAnalise(serieId, resultado) {
    try {
      const { data, error } = await seriesService.salvarAnaliseLLM(
        serieId, 
        resultado.resultado,
        'gpt-4o', // Placeholder
        resultado.tokens_estimados.total
      )

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Erro ao salvar análise:', error)
      return { data: null, error: error.message }
    }
  }
}

