/**
 * TSE — Tribunal Superior Eleitoral v3.3
 * Estratégia: usa CPF vindo da API da Câmara para buscar no TSE
 * Fallback: busca por nome iterando todas as UFs
 */

import { PROXY_URL } from './cgu.js';

const TSE_BASE = 'https://divulgacandcontas.tse.jus.br/divulga/rest/v1';

export const ELEICOES = {
  '2022': { id: '2045202022', ano: '2022' },
  '2018': { id: '2030402018', ano: '2018' },
};

const UFS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

async function fetchTSE(path, timeoutMs = 8000) {
  const targetUrl = `${TSE_BASE}${path}`;
  try {
    const res = await fetch(targetUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) {
      const text = await res.text();
      if (text?.trim()) return JSON.parse(text);
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
      if (text?.trim()) return JSON.parse(text);
    }
  } catch {}
  return null;
}

function normalizar(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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

/**
 * Busca candidatura no TSE.
 * @param {string} nomeBusca
 * @param {string|null} cpf - CPF do deputado (vem de fetchDeputadoDetails da Câmara)
 * @param {string|null} ufHint - UF do mandato para priorizar a busca
 */
export async function fetchCandidaturasTSE(nomeBusca, cpf = null, ufHint = null) {
  const ufsOrdem = ufHint
    ? [ufHint, ...UFS_BR.filter(u => u !== ufHint)]
    : UFS_BR;

  // Rota 1: por CPF (mais confiável, sem ambiguidade de nome)
  if (cpf) {
    const cpfClean = cpf.replace(/\D/g, '');
    for (const [anoKey, eleicao] of Object.entries(ELEICOES)) {
      for (const uf of ufsOrdem) {
        try {
          const data = await fetchTSE(
            `/candidatura/buscar/${eleicao.ano}/${uf}/${eleicao.id}/cargo/6/candidatos?cpf=${cpfClean}`
          );
          const candidatos = data?.candidatos || data?.content || [];
          if (candidatos.length > 0) {
            console.log(`✅ TSE por CPF em ${anoKey}/${uf}`);
            return normalizarCandidatos(candidatos, anoKey);
          }
        } catch { continue; }
      }
    }
  }

  // Rota 2: por nome iterando todas as UFs
  const partes = nomeBusca.trim().split(' ').filter(Boolean);
  const tentativas = [
    nomeBusca,
    partes.slice(0, 2).join(' '),
    partes[0],
  ].filter((v, i, a) => v && v.length > 2 && a.indexOf(v) === i);

  for (const [anoKey, eleicao] of Object.entries(ELEICOES)) {
    for (const uf of ufsOrdem) {
      for (const tentativa of tentativas) {
        try {
          const q = encodeURIComponent(tentativa);
          const data = await fetchTSE(
            `/candidatura/buscar/${eleicao.ano}/${uf}/${eleicao.id}/cargo/6/candidatos?nome=${q}`
          );
          const candidatos = data?.candidatos || data?.content || [];
          if (candidatos.length > 0) {
            const match = candidatos.filter(c => {
              const nomeC = normalizar(c.nomeUrna || c.nome || '');
              return partes.filter(p => p.length > 3).some(p => nomeC.includes(normalizar(p)));
            });
            const lista = match.length > 0 ? match : candidatos;
            console.log(`✅ TSE por nome "${tentativa}" em ${anoKey}/${uf}: ${lista.length}`);
            return normalizarCandidatos(lista, anoKey);
          }
        } catch { continue; }
      }
    }
  }

  console.warn(`⚠ TSE: nenhum resultado para "${nomeBusca}"`);
  return [];
}

export async function fetchBensTSE(idCandidato, anoEleicao = '2022', siglaUf = null) {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
  const ufsOrdem = siglaUf
    ? [siglaUf, ...UFS_BR.filter(u => u !== siglaUf)]
    : UFS_BR;

  for (const uf of ufsOrdem) {
    const data = await fetchTSE(
      `/candidatura/buscar/${eleicao.ano}/${uf}/${eleicao.id}/candidato/${idCandidato}`
    );
    if (data?.bens?.length > 0) {
      return data.bens.map(b => ({
        ordem: b.ordemBem,
        tipo: b.tipoBem?.descricao || b.descricaoTipoBem || 'Bem',
        descricao: b.descricaoBem || '',
        valor: parseFloat(String(b.valorBem || '0').replace(/\./g, '').replace(',', '.')) || 0,
        valorFormatado: b.valorBemStr,
      }));
    }
  }
  return [];
}

export async function fetchPrestacaoContasTSE(idCandidato, anoEleicao = '2022', siglaUf = null) {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
  const ufsOrdem = siglaUf
    ? [siglaUf, ...UFS_BR.filter(u => u !== siglaUf)]
    : UFS_BR;

  for (const uf of ufsOrdem) {
    const data = await fetchTSE(
      `/prestador/consulta/receitas/${eleicao.ano}/${eleicao.id}/1/${uf}/${idCandidato}`
    );
    const receitas = data?.receitas || (Array.isArray(data) ? data : []);
    if (receitas.length > 0) {
      return receitas.map(r => ({
        nomeDoador: r.nomeDoador || r.nome || 'N/D',
        cpfCnpj: r.cpfCnpjDoador || '',
        valor: parseFloat(String(r.valor || '0').replace(',', '.')) || 0,
        dataRecebimento: r.dataRecebimento || '',
        origem: r.origemRecurso || '',
      }));
    }
  }
  return [];
}

export async function fetchPatrimonioEvoluido(nome, cpf = null, uf = null) {
  const cands = await fetchCandidaturasTSE(nome, cpf, uf);
  if (!cands.length) return [];
  const resultados = [];
  for (const [ano] of Object.entries(ELEICOES)) {
    try {
      const bens = await fetchBensTSE(cands[0].id, ano, cands[0].uf);
      const total = bens.reduce((s, b) => s + (b.valor || 0), 0);
      if (total > 0) resultados.push({ ano, total, nBens: bens.length });
    } catch { continue; }
  }
  return resultados.sort((a, b) => a.ano - b.ano);
}

export async function fetchDossierTSE(nome, cpf = null, uf = null) {
  const candidatos = await fetchCandidaturasTSE(nome, cpf, uf);
  if (!candidatos.length) return { error: 'Candidato não encontrado no TSE.', nome };
  const cand = candidatos[0];
  const [bens, prestacao, evolucao] = await Promise.all([
    fetchBensTSE(cand.id, cand.anoEleicao, cand.uf),
    fetchPrestacaoContasTSE(cand.id, cand.anoEleicao, cand.uf),
    fetchPatrimonioEvoluido(nome, cpf, cand.uf),
  ]);
  const patrimonioTotal = bens.reduce((s, b) => s + b.valor, 0);
  return { candidato: cand, bens, patrimonioTotal, prestacao, evolucaoPatrimonial: evolucao };
}

export async function fetchFiliadosPartido() {
  return {
    error: 'A base de filiados (19GB) requer importação local.',
    linkTSE: 'https://filiacao.tse.jus.br/ConsultaFiliados/consulta',
    linkDados: 'https://dadosabertos.tse.jus.br/dataset/filiados-partidos',
  };
}

export async function fetchResultadoEleitoral(anoEleicao, uf, cargo) {
  const eleicao = ELEICOES[anoEleicao] || ELEICOES['2022'];
  const data = await fetchTSE(`/eleicao/resultados/${eleicao.ano}/${uf}/${eleicao.id}/${cargo}/resultado`);
  return data?.resultados || [];
}
