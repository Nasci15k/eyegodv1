/**
 * TSE — Tribunal Superior Eleitoral v3.1
 * Endpoint de busca corrigido para a API atual do TSE
 */

import { PROXY_URL } from './cgu.js';

const TSE_BASE = 'https://divulgacandcontas.tse.jus.br/divulga/rest/v1';

export const ELEICOES = {
  '2024': { id: '2045202024', ano: '2024', cargo: '6' },
  '2022': { id: '2045202022', ano: '2022', cargo: '6' },
  '2020': { id: '2045202020', ano: '2020', cargo: '6' },
  '2018': { id: '2030402018', ano: '2018', cargo: '6' },
};

async function fetchTSE(path, timeoutMs = 10000) {
  const targetUrl = `${TSE_BASE}${path}`;
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

export async function fetchCandidaturasTSE(nomeBusca) {
  const partes = nomeBusca.trim().split(' ').filter(Boolean);
  const tentativas = [
    nomeBusca,
    partes.slice(0, 2).join(' '),
    partes.slice(0, 3).join(' '),
    partes[0],
    partes[partes.length - 1],
  ].filter((v, i, a) => v && v.length > 2 && a.indexOf(v) === i);

  for (const [anoKey, eleicao] of Object.entries(ELEICOES)) {
    for (const tentativa of tentativas) {
      try {
        const q = encodeURIComponent(tentativa);
        // Endpoint correto: lista de candidatos por cargo com filtro de nome
        const data = await fetchTSE(
          `/candidatura/buscar/${eleicao.ano}/BR/${eleicao.id}/cargo/${eleicao.cargo}/candidatos?nome=${q}`
        );
        const candidatos = data?.candidatos || data?.content || [];
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
    valor: parseFloat(String(b.valorBem || '0').replace(/\./g, '').replace(',', '.')) || 0,
    valorFormatado: b.valorBemStr,
  }));
}

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

export async function fetchPatrimonioEvoluido(nome) {
  const cands = await fetchCandidaturasTSE(nome);
  if (!cands.length) return [];
  const resultados = [];
  for (const [ano] of Object.entries(ELEICOES)) {
    try {
      const bens = await fetchBensTSE(cands[0].id, ano, cands[0].uf || 'BR');
      const total = bens.reduce((s, b) => s + (b.valor || 0), 0);
      if (total > 0) resultados.push({ ano, total, nBens: bens.length });
    } catch { continue; }
  }
  return resultados.sort((a, b) => a.ano - b.ano);
}

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
  return { candidato: cand, bens, patrimonioTotal, prestacao, evolucaoPatrimonial: evolucao };
}

export async function fetchFiliadosPartido(sigla, uf) {
  return {
    error: 'A base de filiados (19GB) requer importação local.',
    linkTSE: 'https://filiacao.tse.jus.br/ConsultaFiliados/consulta',
    linkDados: 'https://dadosabertos.tse.jus.br/dataset/filiados-partidos',
  };
}

export async function fetchResultadoEleitoral(anoEleicao, uf, cargo) {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
  const data = await fetchTSE(
    `/eleicao/resultados/${eleicao.ano}/${uf}/${eleicao.id}/${cargo}/resultado`
  );
  return data?.resultados || [];
}
