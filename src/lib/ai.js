/**
 * Motor de IA — Olho de Deus v2.0
 * Integração híbrida: Groq (principal) + Gemini (fallback) + análise local (offline)
 */
 
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
 
// ─── Fetch com timeout ────────────────────────────────────────────────────────
async function fetchIA(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(tid);
    return res;
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}
 
// ─── GROQ ─────────────────────────────────────────────────────────────────────
async function queryGroq(prompt, apiKey, model = 'llama3-70b-8192', maxTokens = 1000) {
  if (!apiKey) throw new Error('Chave Groq ausente');
 
  const res = await fetchIA(GROQ_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `Você é um analista de inteligência financeira e jornalista investigativo especializado em transparência pública brasileira. 
Sempre responda em português do Brasil. 
Seja direto, técnico e factual. 
Use termos como "ALERTA VERMELHO" para inconsistências graves.
Nunca invente dados — baseie-se APENAS no que foi fornecido.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });
 
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${err.slice(0, 200)}`);
  }
 
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq retornou resposta vazia.');
  return content;
}
 
// ─── GEMINI ───────────────────────────────────────────────────────────────────
async function queryGemini(prompt, apiKey, model = 'gemini-1.5-flash') {
  if (!apiKey) throw new Error('Chave Gemini ausente');
 
  const res = await fetchIA(
    `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        ],
      }),
    }
  );
 
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${err.slice(0, 200)}`);
  }
 
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini retornou resposta vazia.');
  return text;
}
 
// ─── QUERY HÍBRIDA (Groq → Gemini → offline) ─────────────────────────────────
async function queryIA(prompt, { groqKey, geminiKey, maxTokens = 800 } = {}) {
  const gKey = groqKey || import.meta.env?.VITE_GROQ_API_KEY;
  const mKey = geminiKey || import.meta.env?.VITE_GEMINI_API_KEY;
 
  // 1. Tenta Groq
  if (gKey) {
    try {
      return { texto: await queryGroq(prompt, gKey, 'llama3-70b-8192', maxTokens), fonte: 'Groq (Llama 3 70B)' };
    } catch (e) {
      console.warn('Groq falhou, tentando Gemini...', e.message);
    }
  }
 
  // 2. Fallback: Gemini
  if (mKey) {
    try {
      return { texto: await queryGemini(prompt, mKey), fonte: 'Google Gemini 1.5 Flash' };
    } catch (e) {
      console.warn('Gemini falhou:', e.message);
    }
  }
 
  // 3. Análise offline
  return { texto: null, fonte: 'offline', erro: !gKey && !mKey ? 'nochave' : 'falha' };
}
 
// ─── RESUMO INVESTIGATIVO ─────────────────────────────────────────────────────
 
/**
 * Gera um dossiê resumido com base em dados de múltiplas fontes
 */
export async function gerarResumoInvestigativo(dados, apiKeys = {}) {
  const prompt = `
TAREFA: Análise investigativa de perfil político-econômico
 
DADOS COLETADOS DE BASES OFICIAIS:
${JSON.stringify(dados, null, 2)}
 
INSTRUÇÕES:
- Máximo de 200 palavras
- Estruture em: PERFIL / INCONSISTÊNCIAS / CONCLUSÃO
- Use "🔴 ALERTA VERMELHO" para: patrimônio incompatível, vínculos com empresas punidas, mandados de prisão, irregularidades TCU
- Use "🟡 ATENÇÃO" para: crescimento patrimonial acima da média, volume de emendas concentrado, fornecedores suspeitos
- Use "🟢 SEM INDÍCIOS" quando não há dados de risco
- Seja factual — não invente dados
- Português do Brasil, tom técnico
  `.trim();
 
  const resultado = await queryIA(prompt, apiKeys);
 
  if (resultado.texto) return resultado.texto;
 
  // Análise offline (sem API)
  return gerarResumoOffline(dados);
}
 
// ─── ANÁLISE DE GASTOS ────────────────────────────────────────────────────────
 
/**
 * Analisa padrões de gastos via IA
 */
export async function analisarGastosIA(estatisticas, pergunta, apiKeys = {}) {
  const contextoDados = `
DATASET DE GASTOS PARLAMENTARES (CEAP):
- Total de transações: ${estatisticas.n?.toLocaleString('pt-BR')}
- Total gasto: R$ ${(estatisticas.total / 1e6)?.toFixed(2)}M
- Período: ${estatisticas.periodo || '2024'}
- Top 5 gastadores: ${estatisticas.top5?.join(', ') || 'N/D'}
- Categorias mais usadas: ${estatisticas.topCats?.join(', ') || 'N/D'}
- Índice HHI médio: ${estatisticas.hhiMedio?.toFixed(0) || 'N/D'}
- % valores redondos: ${estatisticas.pctRedondos?.toFixed(1) || 'N/D'}%
${estatisticas.extra ? `- Dados adicionais: ${JSON.stringify(estatisticas.extra)}` : ''}
  `.trim();
 
  const prompt = `
${contextoDados}
 
PERGUNTA DO INVESTIGADOR:
${pergunta}
 
Responda de forma direta e técnica. Se identificar padrões suspeitos, destaque-os.
  `.trim();
 
  const resultado = await queryIA(prompt, apiKeys);
 
  if (resultado.texto) return { resposta: resultado.texto, fonte: resultado.fonte };
 
  return {
    resposta: 'Sistema de IA indisponível. Configure VITE_GROQ_API_KEY ou VITE_GEMINI_API_KEY no seu .env',
    fonte: 'offline',
    dica: resultado.erro === 'nochave'
      ? 'Obtenha chaves gratuitas: console.groq.com/keys | aistudio.google.com/app/apikey'
      : 'Verifique sua conexão e as chaves de API.',
  };
}
 
// ─── GERADOR DE HEADLINE VIRAL ────────────────────────────────────────────────
 
/**
 * Gera headline estilo jornalismo investigativo para compartilhamento
 */
export async function gerarHeadlineViral(nome, total, partido, apiKeys = {}) {
  const smMin = Math.round(total / 1412);
  const anos = (total / 33600).toFixed(1);
 
  const prompt = `
Crie uma headline viral de 15-20 palavras para redes sociais sobre:
- Deputado: ${nome} (${partido})
- Total gasto em cotas: R$ ${(total / 1000).toFixed(0)}K
- Equivale a: ${smMin} salários mínimos / ${anos} anos de salário médio brasileiro
 
Estilo: jornalismo investigativo, impactante, factual, sem exagero
Incluir: o nome, o partido, o valor em salários mínimos
Terminar com: #OlhoDeDeus #TransparênciaJá
  `.trim();
 
  const resultado = await queryIA(prompt, { ...apiKeys, maxTokens: 150 });
  if (resultado.texto) return resultado.texto.trim();
 
  // Fallback offline
  return `${nome} (${partido}) gastou ${smMin}x o salário mínimo em cotas parlamentares. Você precisaria de ${anos} anos para ganhar isso. #OlhoDeDeus #TransparênciaJá`;
}
 
// ─── CLASSIFICADOR DE RISCO ───────────────────────────────────────────────────
 
/**
 * Classifica uma transação individual como suspeita ou não
 */
export async function classificarTransacao(transacao, contexto = {}, apiKeys = {}) {
  const prompt = `
Classifique esta transação de cota parlamentar:
 
TRANSAÇÃO:
- Parlamentar: ${transacao.txNomeParlamentar}
- Fornecedor: ${transacao.txtFornecedor}
- CNPJ: ${transacao.txtCNPJCPF}
- Valor: R$ ${transacao.vlrLiquido?.toLocaleString('pt-BR')}
- Categoria: ${transacao.txtDescricao}
- Data: ${transacao.datEmissao}
${transacao.diaSemana === 0 || transacao.diaSemana === 6 ? '- ⚠️ OCORREU EM FIM DE SEMANA' : ''}
 
CONTEXTO:
- Este fornecedor recebeu ${contexto.totalFornecedor ? `R$ ${(contexto.totalFornecedor/1000).toFixed(0)}K` : 'N/D'} deste parlamentar no período
- Categoria tem score de suspeição ${contexto.scoreSuspeicao || 'N/D'}/100
 
Responda com:
RISCO: [BAIXO/MÉDIO/ALTO/CRÍTICO]
MOTIVO: [1 frase]
  `.trim();
 
  const resultado = await queryIA(prompt, { ...apiKeys, maxTokens: 100 });
  if (resultado.texto) return resultado.texto.trim();
  return 'IA indisponível para classificação.';
}
 
// ─── ANÁLISE OFFLINE (sem API) ────────────────────────────────────────────────
 
function gerarResumoOffline(dados) {
  const { politico, bens, emendas, justica, ativos } = dados;
 
  const linhas = [];
 
  if (politico?.nomeUrna || politico?.nome) {
    linhas.push(`PERFIL: ${politico.nomeUrna || politico.nome} — ${politico.partido || 'N/D'}, ${politico.cargo || 'N/D'}`);
  }
 
  const totalBens = bens?.reduce((s, b) => s + (b.valor || 0), 0) || 0;
  if (totalBens > 0) {
    const flag = totalBens > 5_000_000 ? '🔴 ALERTA VERMELHO: ' : totalBens > 1_000_000 ? '🟡 ATENÇÃO: ' : '';
    linhas.push(`${flag}Patrimônio declarado ao TSE: R$ ${(totalBens / 1e6).toFixed(2)}M`);
  }
 
  if (justica?.mandadosAbertos > 0) {
    linhas.push(`🔴 ALERTA VERMELHO: ${justica.mandadosAbertos} mandado(s) de prisão em aberto no BNMP/CNJ`);
  }
 
  if (emendas?.data?.length > 0) {
    const totalEmendas = emendas.data.reduce((s, e) => s + (parseFloat(e.valorEmpenhado) || 0), 0);
    linhas.push(`Emendas parlamentares: ${emendas.data.length} registros, total R$ ${(totalEmendas / 1e6).toFixed(1)}M`);
  }
 
  if (linhas.length === 0) {
    return '🟢 SEM INDÍCIOS — Dados insuficientes para análise ou perfil dentro dos padrões. Configure uma API key para análise mais detalhada.';
  }
 
  linhas.push('\nCONCLUSÃO: Análise offline — configure VITE_GROQ_API_KEY para análise completa via IA.');
  return linhas.join('\n');
}
 
