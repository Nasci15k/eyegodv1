/**
 * CNJ, TCU, CVM, ANAC, DOU, IBGE, Tesouro — Olho de Deus v2.0
 * Todos os módulos de dados externos consolidados
 */

import { PROXY_URL } from './cgu.js';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, { ...options, headers: { 'Accept': 'application/json', ...(options.headers || {}) } });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.trim().length === 0) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function proxyFetch(targetUrl, options = {}) {
  const url = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
  return safeFetch(url, options);
}

// ─── CNJ / BNMP ───────────────────────────────────────────────────────────────

/**
 * Banco Nacional de Mandados de Prisão (BNMP 3.0)
 * O endpoint real requer CAPTCHA — retornamos link direto + tentativa de busca
 */
export async function fetchMandadosPrisao(nomeOuCpf) {
  const isCpf = /^[\d.\-]+$/.test(nomeOuCpf.trim()) && nomeOuCpf.replace(/\D/g, '').length === 11;
  const linkConsulta = 'https://portalbnmp.cnj.jus.br/#/pesquisa-peca';

  // O BNMP exige reCAPTCHA v3 — busca direta via proxy não é possível
  // Retornamos estrutura informativa com link de consulta manual
  return {
    mandadosAbertos: 0,
    itens: [],
    linkConsulta,
    instrucao: `Acesse ${linkConsulta} e busque por: ${nomeOuCpf}`,
    aviso: 'O BNMP requer verificação humana (CAPTCHA). Consulta manual necessária.',
    acessoAutomatico: false,
  };
}

/**
 * DataJud — Processos judiciais
 * Requer API Key do CNJ para acesso automatizado
 * Retorna link de consulta via Escavador (público)
 */
export async function fetchDataJud(nomeOuCpfCNPJ) {
  const q = encodeURIComponent(nomeOuCpfCNPJ);

  // Tenta busca pública no Escavador
  const escavadorLink = `https://www.escavador.com/busca?q=${q}`;
  const jusbLink = `https://www.jusbrasil.com.br/busca?q=${q}`;

  return {
    link: escavadorLink,
    linkJusbrasil: jusbLink,
    linkDataJud: `https://datajud-wiki.cnj.jus.br/`,
    instrucao: 'Use o Escavador ou JusBrasil para busca pública de processos judiciais.',
    apiKey: 'Solicitação de API key do DataJud em: https://datajud-wiki.cnj.jus.br/api-publica/acesso',
  };
}

/**
 * SISBAJUD — Bloqueio de ativos (sigiloso por natureza)
 */
export async function fetchSisbajud() {
  return {
    sigilo: true,
    mensagem: 'Bloqueios e penhoras online são sigilosos por natureza judicial.',
    acesso: 'Requer clearance de Magistrado ou Delegado com autorização judicial específica.',
  };
}

// ─── TCU ─────────────────────────────────────────────────────────────────────

/**
 * TCU — Lista de Responsáveis com Contas Irregulares
 * Endpoint público: contasirregulares.tcu.gov.br
 */
export async function fetchTCUIrregularidades(cpfOuCnpj) {
  const clean = cpfOuCnpj.replace(/\D/g, '');
  if (!clean) return { irregular: false, total: 0, processos: [] };

  // Tenta via proxy (o endpoint pode ter CORS)
  const targetUrl = `https://contasirregulares.tcu.gov.br/integra/rest/publico/v1/responsaveis/${clean}`;
  const data = await proxyFetch(targetUrl);

  if (!data) {
    return {
      irregular: false,
      total: 0,
      processos: [],
      linkConsulta: `https://contasirregulares.tcu.gov.br/`,
      aviso: 'Consulta automática falhou — verifique manualmente no portal do TCU.',
    };
  }

  const processos = data.itens || data.items || (Array.isArray(data) ? data : []);
  const total = data.total || processos.length;

  return {
    irregular: total > 0,
    total,
    processos: processos.slice(0, 10),
    linkConsulta: `https://contasirregulares.tcu.gov.br/`,
    resumo: total > 0 ? `${total} processo(s) com contas irregulares no TCU` : 'Nada consta no TCU',
  };
}

// ─── CVM ─────────────────────────────────────────────────────────────────────

/**
 * CVM — Comissão de Valores Mobiliários
 * Verifica se CNPJ é companhia aberta registrada na CVM
 */
export async function fetchCVMInfo(cnpj) {
  const clean = cnpj.replace(/\D/g, '');

  // Busca na base de dados abertos da CVM (CSV público)
  const linkCVM = `https://cvmweb.cvm.gov.br/SWB/Sistemas/SCW/CPublico/CiaAb/ResultPesqCiaAb.aspx?CNPJ_Cia=${clean}`;

  // Tenta busca via API de dados abertos da CVM
  const targetUrl = `https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv`;

  return {
    isCompanhiaAberta: false, // Requer parse do CSV de 50MB — faça no backend
    linkCVM,
    linkDadosAbertos: 'https://dados.cvm.gov.br/dataset/cia_aberta',
    mensagem: 'Verifique manualmente no portal da CVM se o CNPJ é companhia aberta.',
    processosCVM: 0,
  };
}

// ─── ANAC / RAB ───────────────────────────────────────────────────────────────

/**
 * ANAC — Registro Aeronáutico Brasileiro
 * Consulta de aeronaves registradas em CPF/CNPJ
 */
export async function fetchANACRAB(cpfOuCnpj) {
  const clean = cpfOuCnpj.replace(/\D/g, '');

  // O RAB tem busca pública mas sem API estruturada — retorna links
  return {
    aeronaves: [],
    linkRAB: `https://sistemas.anac.gov.br/aeronaves/cons_rab.asp`,
    linkCertidao: `https://sistemas.anac.gov.br/cnpa/Certidao?cpfCnpj=${clean}`,
    instrucao: `Acesse o link acima e busque o CPF/CNPJ: ${clean}`,
    mensagem: 'O RAB (Registro Aeronáutico Brasileiro) da ANAC permite consulta pública de aeronaves por proprietário.',
  };
}

/**
 * DETRAN — Veículos (protegido por LGPD/SERPRO)
 */
export async function fetchDetranVeiculos(cpfOuCnpj) {
  return {
    error: 'Acesso restrito por LGPD e convênio SERPRO',
    instrucao: 'Consulta de frota de veículos requer autenticação no Gov.br ou convênio institucional com o SERPRO.',
    linkGovBr: 'https://www.gov.br/pt-br',
  };
}

// ─── DIÁRIO OFICIAL DA UNIÃO (DOU) ────────────────────────────────────────────

/**
 * Busca no DOU via Imprensa Nacional
 * API disponível em: inlabs.in.gov.br
 */
export async function fetchDOU(query, opcoes = {}) {
  const { maxItens = 5, dataInicio, dataFim } = opcoes;
  const q = encodeURIComponent(`"${query}"`);

  // Tenta API da Imprensa Nacional
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const inicio = dataInicio || '2020-01-01';
    const url = `https://www.in.gov.br/buscadou/search?q=${q}&s=todos&exactMatch=y&sortType=0&publishedSince=${inicio}&publishedTo=${dataFim || hoje}`;
    const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;

    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        total: data.total || 0,
        items: (data.articles || []).slice(0, maxItens).map(art => ({
          titulo: art.title,
          secao: art.pubName,
          data: art.pubDate,
          url: `https://www.in.gov.br/web/dou/-/${art.urlTitle}`,
          resumo: art.content?.slice(0, 200),
        })),
        urlBusca: `https://www.in.gov.br/consulta/-/buscar/dou?q=${q}`,
      };
    }
  } catch (err) {
    console.warn('DOU API falhou:', err.message);
  }

  // Fallback: retorna link de busca manual
  return {
    total: 0,
    items: [],
    urlBusca: `https://www.in.gov.br/consulta/-/buscar/dou?q=${q}`,
    instrucao: `Busque manualmente no DOU: ${query}`,
  };
}

// ─── IBGE ─────────────────────────────────────────────────────────────────────

/**
 * Converte nome de município + UF em código IBGE
 */
export async function fetchLocalidadeIBGE(municipioNome, ufSigla) {
  try {
    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSigla}/municipios`;
    const muns = await safeFetch(url);
    if (!muns) return null;

    // Normaliza para comparação
    const normalizar = (s) => s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '').trim();

    const nomeLimpo = normalizar(municipioNome);
    const match = muns.find(m =>
      normalizar(m.nome) === nomeLimpo ||
      normalizar(m.nome).includes(nomeLimpo) ||
      nomeLimpo.includes(normalizar(m.nome))
    );

    return match?.id || null;
  } catch {
    return null;
  }
}

/**
 * PIB Municipal (Agregado IBGE 5938)
 */
export async function fetchPIBMunicipal(codIbge) {
  try {
    const url = `https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2021/variaveis/37?localidades=N6[${codIbge}]`;
    const data = await safeFetch(url);
    if (!data?.[0]) return null;
    return data[0].resultados?.[0]?.series?.[0]?.serie?.['2021'] || null;
  } catch {
    return null;
  }
}

/**
 * IPCA acumulado (Agregado IBGE 1737)
 */
export async function fetchCorrecaoIPCA(periodo = '-1') {
  try {
    const url = `https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/${periodo}/variaveis/63?localidades=N1[all]`;
    const data = await safeFetch(url);
    if (!data?.[0]) return 1.05;
    const v = Object.values(data[0].resultados?.[0]?.series?.[0]?.serie || {})[0];
    return v ? (1 + parseFloat(v) / 100) : 1.05;
  } catch {
    return 1.05;
  }
}

// ─── TESOURO NACIONAL / SICONFI ──────────────────────────────────────────────

/**
 * Despesas declaradas pelo município no SICONFI
 */
export async function fetchSiconfiDespesas(codIbgeMunicipal, ano = 2022) {
  try {
    const url = `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/despesas?an_exercicio=${ano}&id_ente=${codIbgeMunicipal}`;
    const data = await safeFetch(url);
    return data?.items || [];
  } catch (err) {
    console.error('Erro Tesouro SICONFI:', err);
    return [];
  }
}

/**
 * Repasses do FPM (Fundo de Participação dos Municípios)
 */
export async function fetchRepassesFPM(codIbgeMunicipal, ano = 2024) {
  try {
    const url = `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=${ano}&id_ente=${codIbgeMunicipal}&nr_periodo=6`;
    const data = await safeFetch(url);
    return data?.items || [];
  } catch {
    return [];
  }
}
