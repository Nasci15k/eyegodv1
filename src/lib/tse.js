/**
 * TSE — Tribunal Superior Eleitoral v2.0
 * DivulgaCandContas + dados eleitorais completos
 * Via proxy Cloudflare Worker (necessário por CORS)
 */
 
import { PROXY_URL } from './cgu.js';
 
const TSE_BASE = 'https://divulgacandcontas.tse.jus.br/divulga/rest/v1';
 
// Eleições disponíveis para consulta
export const ELEICOES = {
  '2024': { id: '2045202024', ano: '2024', descricao: 'Eleições Municipais 2024' },
  '2022': { id: '2045202022', ano: '2022', descricao: 'Eleições Gerais 2022' },
  '2020': { id: '2045202020', ano: '2020', descricao: 'Eleições Municipais 2020' },
  '2018': { id: '2030402018', ano: '2018', descricao: 'Eleições Gerais 2018' },
};
 
// ─── Core fetch via proxy ─────────────────────────────────────────────────────
async function fetchTSE(path, timeoutMs = 15000) {
  const targetUrl = `${TSE_BASE}${path}`;
  const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
 
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
 
  try {
    const res = await fetch(proxyUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(tid);
 
    if (!res.ok) {
      console.warn(`TSE HTTP ${res.status} para ${path}`);
      return null;
    }
 
    const text = await res.text();
    if (!text || text.trim().length === 0) return null;
    return JSON.parse(text);
  } catch (err) {
    clearTimeout(tid);
    if (err.name !== 'AbortError') console.error(`Erro TSE [${path}]:`, err.message);
    return null;
  }
}
 
// ─── CANDIDATURAS ─────────────────────────────────────────────────────────────
 
/**
 * Busca candidaturas por nome
 * Pesquisa em múltiplas eleições automaticamente
 */
export async function fetchCandidaturasTSE(nomeBusca, anoEleicao = '2022') {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
  const primeiroNome = nomeBusca.split(' ')[0];
const q = encodeURIComponent(primeiroNome);
 
  try {
    // Tenta na eleição selecionada primeiro
    const data = await fetchTSE(`/candidatura/buscar/${eleicao.ano}/BR/${eleicao.id}/candidato/${q}`);
    const candidatos = data?.candidatos || [];
 
    // Se não encontrou, tenta em outros anos
    if (candidatos.length === 0) {
      for (const [ano, el] of Object.entries(ELEICOES)) {
        if (ano === anoEleicao) continue;
        const d2 = await fetchTSE(`/candidatura/buscar/${el.ano}/BR/${el.id}/candidato/${q}`);
        const c2 = d2?.candidatos || [];
        if (c2.length > 0) return normalizarCandidatos(c2, ano);
      }
    }
 
    return normalizarCandidatos(candidatos, anoEleicao);
  } catch (err) {
    console.error('Erro fetchCandidaturasTSE:', err);
    return [];
  }
}
 
function normalizarCandidatos(candidatos, ano) {
  return candidatos.map(c => ({
    id: c.id || c.sqCandidato,
    nome: c.nomeUrna || c.nome,
    nomeCompleto: c.nomeCompleto || c.nome,
    nomeUrna: c.nomeUrna,
    partido: c.partido?.sigla || c.siglaPartido,
    cargo: c.cargo?.nome || c.nomeCargo,
    uf: c.uf?.sigla || c.siglaUe,
    municipio: c.municipio?.nome,
    situacao: c.descricaoSituacao,
    fotoUrl: c.fotoUrl,
    cpf: c.cpf,
    anoEleicao: ano,
  }));
}
 
// ─── BENS DECLARADOS ─────────────────────────────────────────────────────────
 
/**
 * Busca bens declarados ao TSE por candidato
 */
export async function fetchBensTSE(idCandidato, anoEleicao = '2022', siglaUf = 'BR') {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
 
  const data = await fetchTSE(
    `/candidatura/buscar/${eleicao.ano}/${siglaUf}/${eleicao.id}/candidato/${idCandidato}`
  );
 
  const bens = data?.bens || [];
 
  return bens.map(b => ({
    ordem: b.ordemBem,
    tipo: b.tipoBem?.descricao || b.descricaoTipoBem,
    descricao: b.descricaoBem,
    valor: parseFloat(b.valorBem?.toString().replace(',', '.') || '0'),
    valorFormatado: b.valorBemStr,
  }));
}
 
/**
 * Calcula patrimônio total e evolução
 */
export async function fetchPatrimonioEvoluido(nome) {
  const resultados = [];
 
  for (const [ano, eleicao] of Object.entries(ELEICOES)) {
    const q = encodeURIComponent(nome);
    const data = await fetchTSE(`/candidatura/buscar/${eleicao.ano}/BR/${eleicao.id}/candidato/${q}`);
    const cands = data?.candidatos || [];
 
    if (cands.length > 0) {
      const cand = cands[0];
      const bens = await fetchBensTSE(cand.id || cand.sqCandidato, ano);
      const total = bens.reduce((s, b) => s + (b.valor || 0), 0);
      resultados.push({ ano, total, nBens: bens.length });
    }
  }
 
  return resultados.sort((a, b) => a.ano - b.ano);
}
 
// ─── PRESTAÇÃO DE CONTAS ─────────────────────────────────────────────────────
 
/** Receitas de campanha (doadores) */
export async function fetchPrestacaoContasTSE(idCandidato, anoEleicao = '2022', siglaUf = 'BR') {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
 
  const data = await fetchTSE(
    `/prestador/consulta/receitas/${eleicao.ano}/${eleicao.id}/1/${siglaUf}/${idCandidato}`
  );
 
  return data || [];
}
 
// ─── FILIADOS ────────────────────────────────────────────────────────────────
 
/**
 * Filiados a partido — requer dump no Supabase
 * Link direto para a base oficial do TSE
 */
export async function fetchFiliadosPartido(sigla, uf) {
  return {
    error: 'A base de filiados (19GB) requer importação local.',
    linkTSE: `https://filiacao.tse.jus.br/ConsultaFiliados/consulta`,
    linkDados: `https://dadosabertos.tse.jus.br/dataset/filiados-partidos`,
    instrucao: 'Baixe o arquivo do partido desejado e importe no Supabase para consulta via SQL.',
  };
}
 
// ─── RESULTADO ELEITORAL ─────────────────────────────────────────────────────
 
/** Resultado por município/cargo */
export async function fetchResultadoEleitoral(anoEleicao, uf, cargo) {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
 
  const data = await fetchTSE(
    `/eleicao/resultados/${eleicao.ano}/${uf}/${eleicao.id}/${cargo}/resultado`
  );
 
  return data?.resultados || [];
}
 
// ─── BATCH COMPLETO ───────────────────────────────────────────────────────────
/**
 * Dossiê completo TSE de um candidato
 * Retorna candidatura + bens + prestação de contas + evolução patrimonial
 */
export async function fetchDossierTSE(nome) {
  const candidatos = await fetchCandidaturasTSE(nome);
  if (!candidatos.length) return { error: 'Candidato não encontrado no TSE.', nome };
 
  const cand = candidatos[0];
  const [bens, prestacao, evolucao] = await Promise.all([
    fetchBensTSE(cand.id, cand.anoEleicao, cand.uf || 'BR'),
    fetchPrestacaoContasTSE(cand.id, cand.anoEleicao, cand.uf || 'BR'),
    fetchPatrimonioEvoluido(nome),
  ]);
 
  const patrimonioTotal = bens.reduce((s, b) => s + b.valor, 0);
 
  return {
    candidato: cand,
    bens,
    patrimonioTotal,
    prestacao,
    evolucaoPatrimonial: evolucao,
    alertas: gerarAlertasTSE(cand, bens, patrimonioTotal, evolucao),
  };
}
 
function gerarAlertasTSE(cand, bens, total, evolucao) {
  const alertas = [];
 
  if (total > 5_000_000) {
    alertas.push({ nivel: 'red', msg: `Patrimônio declarado de R$ ${(total/1e6).toFixed(1)}M — acima da média parlamentar.` });
  }
 
  if (evolucao.length >= 2) {
    const primeiro = evolucao[0].total;
    const ultimo = evolucao[evolucao.length - 1].total;
    if (ultimo > primeiro * 3) {
      alertas.push({ nivel: 'red', msg: `Patrimônio cresceu ${((ultimo/primeiro - 1)*100).toFixed(0)}% entre ${evolucao[0].ano} e ${evolucao[evolucao.length-1].ano}.` });
    }
  }
 
  return alertas;
}
 
