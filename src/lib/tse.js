/**
 * TSE — Tribunal Superior Eleitoral v3.0
 * Tenta direto primeiro (sem proxy), fallback via proxy
 */
 
import { PROXY_URL } from './cgu.js';
 
const TSE_BASE = 'https://divulgacandcontas.tse.jus.br/divulga/rest/v1';
 
export const ELEICOES = {
  '2024': { id: '2045202024', ano: '2024' },
  '2022': { id: '2045202022', ano: '2022' },
  '2020': { id: '2045202020', ano: '2020' },
  '2018': { id: '2030402018', ano: '2018' },
};
 
// ─── Core fetch — tenta direto, depois proxy ──────────────────────────────────
async function fetchTSE(path, timeoutMs = 10000) {
  const targetUrl = `${TSE_BASE}${path}`;
 
  // 1. Tenta direto (browser pode conseguir sem proxy)
  try {
    const res = await fetch(targetUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) return JSON.parse(text);
    }
  } catch {}
 
  // 2. Fallback via proxy
  try {
    const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) return JSON.parse(text);
    }
  } catch {}
 
  return null;
}
 
// ─── CANDIDATURAS ─────────────────────────────────────────────────────────────
 
/**
 * Busca candidaturas por nome — tenta múltiplas variações e eleições
 */
export async function fetchCandidaturasTSE(nomeBusca) {
 // Tenta endpoint específico de deputado federal
const data = await fetchTSE(
  `/candidatura/buscar/${eleicao.ano}/BR/${eleicao.id}/cargo/6/candidatos?nome=${q}`
);
  const partes = nomeBusca.trim().split(' ').filter(Boolean);
  const tentativas = [
    nomeBusca,
    partes.slice(0, 2).join(' '),
    partes.slice(0, 3).join(' '),
    partes[0],
    partes[partes.length - 1],
    partes.slice(0, 1).concat(partes.slice(-1)).join(' '),
  ].filter((v, i, a) => v && a.indexOf(v) === i);
 
  for (const [anoKey, eleicao] of Object.entries(ELEICOES)) {
    for (const tentativa of tentativas) {
      try {
        const q = encodeURIComponent(tentativa);
        const data = await fetchTSE(
          `/candidatura/buscar/${eleicao.ano}/BR/${eleicao.id}/candidato/${q}`
        );
        const candidatos = data?.candidatos || [];
        if (candidatos.length > 0) {
          console.log(`✅ TSE encontrou "${tentativa}" em ${anoKey}`);
          return normalizarCandidatos(candidatos, anoKey);
        }
      } catch { continue; }
    }
  }
 
  console.warn(`⚠ TSE: nenhum resultado para "${nomeBusca}"`);
  return [];
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
    tipo: b.tipoBem?.descricao || b.descricaoTipoBem || 'Bem',
    descricao: b.descricaoBem || '',
    valor: parseFloat(
      String(b.valorBem || '0').replace(/\./g, '').replace(',', '.')
    ) || 0,
    valorFormatado: b.valorBemStr,
  }));
}
 
// ─── PRESTAÇÃO DE CONTAS (financiadores) ─────────────────────────────────────
 
/**
 * Receitas de campanha (doadores)
 */
export async function fetchPrestacaoContasTSE(idCandidato, anoEleicao = '2022', siglaUf = 'BR') {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
 
  const data = await fetchTSE(
    `/prestador/consulta/receitas/${eleicao.ano}/${eleicao.id}/1/${siglaUf}/${idCandidato}`
  );
 
  if (!data) return [];
  const receitas = data?.receitas || data || [];
  if (!Array.isArray(receitas)) return [];
 
  return receitas.map(r => ({
    nomeDoador: r.nomeDoador || r.nome || 'N/D',
    cpfCnpj: r.cpfCnpjDoador || '',
    valor: parseFloat(String(r.valor || '0').replace(',', '.')) || 0,
    dataRecebimento: r.dataRecebimento || '',
    origem: r.origemRecurso || '',
  }));
}
 
// ─── RESULTADO ELEITORAL ─────────────────────────────────────────────────────
 
/**
 * Resultado por município/cargo
 */
export async function fetchResultadoEleitoral(anoEleicao, uf, cargo) {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
  const data = await fetchTSE(
    `/eleicao/resultados/${eleicao.ano}/${uf}/${eleicao.id}/${cargo}/resultado`
  );
  return data?.resultados || [];
}
 
// ─── EVOLUÇÃO PATRIMONIAL ─────────────────────────────────────────────────────
 
/**
 * Busca patrimônio em múltiplas eleições para calcular evolução
 */
export async function fetchPatrimonioEvoluido(nome) {
  const resultados = [];
  const cands = await fetchCandidaturasTSE(nome);
  if (!cands.length) return [];
 
  for (const [ano] of Object.entries(ELEICOES)) {
    try {
      const bens = await fetchBensTSE(cands[0].id, ano, cands[0].uf || 'BR');
      const total = bens.reduce((s, b) => s + (b.valor || 0), 0);
      if (total > 0) resultados.push({ ano, total, nBens: bens.length });
    } catch { continue; }
  }
 
  return resultados.sort((a, b) => a.ano - b.ano);
}
 
// ─── DOSSIÊ COMPLETO ─────────────────────────────────────────────────────────
 
/**
 * Dossiê completo TSE de um candidato
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
  const alertas = gerarAlertasTSE(cand, bens, patrimonioTotal, evolucao);
 
  return { candidato: cand, bens, patrimonioTotal, prestacao, evolucaoPatrimonial: evolucao, alertas };
}
 
function gerarAlertasTSE(cand, bens, total, evolucao) {
  const alertas = [];
  if (total > 5_000_000) {
    alertas.push({ nivel: 'red', msg: `Patrimônio declarado de R$ ${(total/1e6).toFixed(1)}M — acima da média parlamentar.` });
  }
  if (evolucao.length >= 2) {
    const primeiro = evolucao[0].total;
    const ultimo = evolucao[evolucao.length - 1].total;
    if (ultimo > primeiro * 3 && primeiro > 0) {
      alertas.push({ nivel: 'red', msg: `Patrimônio cresceu ${((ultimo/primeiro - 1)*100).toFixed(0)}% entre ${evolucao[0].ano} e ${evolucao[evolucao.length-1].ano}.` });
    }
  }
  return alertas;
}
 
// ─── FILIADOS ────────────────────────────────────────────────────────────────
 
export async function fetchFiliadosPartido(sigla, uf) {
  return {
    error: 'A base de filiados (19GB) requer importação local.',
    linkTSE: `https://filiacao.tse.jus.br/ConsultaFiliados/consulta`,
    linkDados: `https://dadosabertos.tse.jus.br/dataset/filiados-partidos`,
    instrucao: 'Baixe o arquivo do partido desejado e importe no Supabase para consulta via SQL.',
  };
}
 
