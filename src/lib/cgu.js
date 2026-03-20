/**
 * Portal da Transparência / CGU — Bateria Completa v2.0
 * Requer chave gratuita em: https://portaldatransparencia.gov.br/api-de-dados
 * Proxy: Seu Cloudflare Worker (atualizar PROXY_URL abaixo)
 */

const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';
export const PROXY_URL = 'https://exposedgovbr.black-spectra-suporte.workers.dev';

// ─── Core fetch com retry e fallback ─────────────────────────────────────────
async function fetchCGU(endpoint, apiKey, method = 'GET', bodyData = null) {
  if (!apiKey) return { error: 'Chave da CGU ausente. Gere em portaldatransparencia.gov.br/api-de-dados' };

  const targetUrl = `${BASE_URL}${endpoint}`;
  const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;

  const options = {
    method,
    headers: {
      'chave-api-dados': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (bodyData && method !== 'GET') {
    options.body = JSON.stringify(bodyData);
  }

  // Tenta 2x antes de desistir
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(proxyUrl, options);

      if (res.status === 401) return { error: 'Chave da API CGU inválida ou expirada.' };
      if (res.status === 403) return { error: 'Acesso negado. Verifique as permissões da sua chave CGU.' };
      if (res.status === 404) return { data: [], total: 0 };
      if (res.status === 429) {
        // Rate limit — espera 1s e tenta de novo
        if (attempt < 2) { await sleep(1000); continue; }
        return { error: 'Rate limit atingido na API CGU. Aguarde alguns segundos.' };
      }
      if (!res.ok) return { error: `Erro API CGU: HTTP ${res.status}` };

      const text = await res.text();
      if (!text || text.trim().length === 0) return { data: [], total: 0 };

      try {
        const data = JSON.parse(text);
        // A CGU pode retornar array direto ou objeto com paginação
        if (Array.isArray(data)) return { data, total: data.length };
        return { data: data.data || data.content || data.registros || data, total: data.total || data.totalRegistros || 0 };
      } catch {
        return { error: 'Resposta da CGU não é JSON válido.' };
      }
    } catch (err) {
      if (attempt < 2) { await sleep(500); continue; }
      console.error(`Erro fetch CGU [${endpoint}]:`, err);
      return { error: err.message };
    }
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── SANÇÕES ─────────────────────────────────────────────────────────────────

/** CEIS — Cadastro de Empresas Inidôneas e Suspensas */
export async function fetchCEIS(cnpjRef, apiKey) {
  const clean = cnpjRef.replace(/\D/g, '');
  const result = await fetchCGU(`/ceis?codigoSancionado=${clean}&pagina=1`, apiKey);
  return enrichSancao(result, 'CEIS');
}

/** CNEP — Cadastro Nacional de Empresas Punidas */
export async function fetchCNEP(cnpjRef, apiKey) {
  const clean = cnpjRef.replace(/\D/g, '');
  const result = await fetchCGU(`/cnep?codigoSancionado=${clean}&pagina=1`, apiKey);
  return enrichSancao(result, 'CNEP');
}

/** CEAF — Cadastro de Expulsões da Administração Federal (servidores) */
export async function fetchCEAF(cpfRef, apiKey) {
  const clean = cpfRef.replace(/\D/g, '');
  const result = await fetchCGU(`/ceaf?cpfSancionado=${clean}&pagina=1`, apiKey);
  return enrichSancao(result, 'CEAF');
}

/** CEPIM — Entidades privadas sem fins lucrativos impedidas */
export async function fetchCEPIM(cnpjRef, apiKey) {
  const clean = cnpjRef.replace(/\D/g, '');
  const result = await fetchCGU(`/cepim?cnpjSancionado=${clean}&pagina=1`, apiKey);
  return enrichSancao(result, 'CEPIM');
}

function enrichSancao(result, tipo) {
  if (result.error) return result;
  const data = result.data || [];
  return {
    ...result,
    temSancao: data.length > 0,
    tipo,
    resumo: data.length > 0
      ? `${data.length} registro(s) de ${tipo} encontrado(s)`
      : `Nada consta no ${tipo}`,
  };
}

// ─── EMENDAS PARLAMENTARES ───────────────────────────────────────────────────

/** Emendas parlamentares por autor e ano */
export async function fetchEmendasParlamentares(autor, ano, apiKey) {
  return fetchCGU(
    `/emendas?ano=${ano}&autor=${encodeURIComponent(autor)}&pagina=1&tamanhoPagina=50`,
    apiKey
  );
}

/** Emendas impositivas (pix-parlamentar) */
export async function fetchEmendasImpositivas(cpf, ano = 2024, apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(
    `/emendas?ano=${ano}&cpf=${clean}&pagina=1&tamanhoPagina=50`,
    apiKey
  );
}

// ─── VIAGENS ─────────────────────────────────────────────────────────────────

/** Viagens a serviço de servidores/parlamentares */
export async function fetchViagensGoverno(cpf, apiKey, ano = 2024) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(
    `/viagens?ano=${ano}&cpfViajante=${clean}&pagina=1&tamanhoPagina=50`,
    apiKey
  );
}

// ─── CONTRATOS E LICITAÇÕES ──────────────────────────────────────────────────

/** Contratos do governo com determinado CNPJ */
export async function fetchContratos(cnpj, apiKey) {
  const clean = cnpj.replace(/\D/g, '');
  return fetchCGU(
    `/contratos?cnpjFornecedor=${clean}&pagina=1&tamanhoPagina=50`,
    apiKey
  );
}

/** Licitações por município IBGE */
export async function fetchLicitacoes(municipioIBGE, apiKey) {
  return fetchCGU(
    `/licitacoes?codigoMunicipio=${municipioIBGE}&pagina=1&tamanhoPagina=50`,
    apiKey
  );
}

// ─── PROGRAMAS SOCIAIS ────────────────────────────────────────────────────────

/** Bolsa Família por CPF/NIS */
export async function fetchBolsaFamilia(cpf, mesAno = '202401', apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(
    `/bolsa-familia-por-cpf-ou-nis?codigo=${clean}&mesAno=${mesAno}&pagina=1`,
    apiKey
  );
}

/** Auxílio Brasil / PETI */
export async function fetchPETI(cpf, mesAno = '202401', apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(
    `/peti-por-cpf-ou-nis?codigo=${clean}&mesAno=${mesAno}&pagina=1`,
    apiKey
  );
}

/** Seguro Defeso */
export async function fetchSeguroDefeso(cpf, mesAno = '202401', apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(
    `/seguro-defeso-por-cpf-ou-nis?codigo=${clean}&mesAno=${mesAno}&pagina=1`,
    apiKey
  );
}

// ─── SERVIDORES ───────────────────────────────────────────────────────────────

/** Verifica se CPF é servidor público federal */
export async function fetchServidores(cpf, apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(
    `/servidores?cpf=${clean}&pagina=1`,
    apiKey
  );
}

// ─── DESPESAS GOVERNO ─────────────────────────────────────────────────────────

/** Despesas do Poder Executivo por ano */
export async function fetchDespesasPoderExecutivo(ano, apiKey) {
  return fetchCGU(
    `/despesas/recursos-recebidos?ano=${ano}&pagina=1&tamanhoPagina=50`,
    apiKey
  );
}

// ─── CONVÊNIOS ────────────────────────────────────────────────────────────────

/** Convênios e transferências voluntárias */
export async function fetchConvenios(filtros = {}, apiKey) {
  const params = new URLSearchParams({ pagina: 1, tamanhoPagina: 50 });
  if (filtros.cnpj) params.set('cnpjConcedente', filtros.cnpj.replace(/\D/g, ''));
  if (filtros.cnpjBeneficiario) params.set('cnpjBeneficiario', filtros.cnpjBeneficiario.replace(/\D/g, ''));
  if (filtros.ano) params.set('ano', filtros.ano);
  if (filtros.situacao) params.set('situacao', filtros.situacao);
  return fetchCGU(`/convenios?${params.toString()}`, apiKey);
}

// ─── BATCH: Varredura completa de CNPJ ────────────────────────────────────────
/**
 * Executa CEIS + CNEP + CEPIM de uma vez
 * Retorna um objeto consolidado com score de risco
 */
export async function fetchVarreduraCNPJ(cnpj, apiKey) {
  const [ceis, cnep, cepim] = await Promise.all([
    fetchCEIS(cnpj, apiKey),
    fetchCNEP(cnpj, apiKey),
    fetchCEPIM(cnpj, apiKey),
  ]);

  const temSancao = ceis.temSancao || cnep.temSancao || cepim.temSancao;
  const totalSancoes = (ceis.data?.length || 0) + (cnep.data?.length || 0) + (cepim.data?.length || 0);

  return {
    ceis,
    cnep,
    cepim,
    temSancao,
    totalSancoes,
    scoreRisco: temSancao ? Math.min(35 + totalSancoes * 10, 70) : 0,
    resumo: temSancao
      ? `⚠️ ${totalSancoes} sanção(ões) encontrada(s) nas bases CGU`
      : '✅ Nada consta nas bases de sanções CGU',
  };
}
