// Portal da Transparência / CGU - Bateria Completa de Inteligência
// Requer chave de API gerada gratuitamente em https://portaldatransparencia.gov.br/api-de-dados

const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';
const PROXY_URL = 'https://exposedgovbr.black-spectra-suporte.workers.dev/';

async function fetchCGU(endpoint, apiKey) {
  if (!apiKey) return { error: 'Chave da CGU ausente.' };
  
  try {
    const targetUrl = `${BASE_URL}${endpoint}`;
    // Usando o proxy dedicado no Cloudflare que suporta o header 'chave-api-dados'
    const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
    
    const res = await fetch(proxyUrl, {
      headers: { 'chave-api-dados': apiKey }
    });
    
    if (!res.ok) {
      if (res.status === 401) return { error: 'Chave da API CGU inválida.' };
      return { error: `Erro API CGU: ${res.status}` };
    }
    
    const text = await res.text();
    if (!text || text.trim().length === 0) return { data: [] };
    
    try {
      const data = JSON.parse(text);
      return { data };
    } catch (parseErr) {
      console.error("Erro parse CGU:", parseErr);
      return { error: 'Resposta da CGU não é um JSON válido.' };
    }
  } catch (err) {
    console.error("Erro fetch CGU:", err);
    return { error: err.message };
  }
}

export async function fetchCEIS(cnpjRef, apiKey) {
  const clean = cnpjRef.replace(/\D/g, '');
  return fetchCGU(`/ceis?codigoSancionado=${clean}&pagina=1`, apiKey);
}

export async function fetchCNEP(cnpjRef, apiKey) {
  const clean = cnpjRef.replace(/\D/g, '');
  return fetchCGU(`/cnep?codigoSancionado=${clean}&pagina=1`, apiKey);
}

export async function fetchCEAF(cpfRef, apiKey) {
  const clean = cpfRef.replace(/\D/g, '');
  return fetchCGU(`/ceaf?cpfSancionado=${clean}&pagina=1`, apiKey);
}

export async function fetchCEPIM(cnpjRef, apiKey) {
  const clean = cnpjRef.replace(/\D/g, '');
  return fetchCGU(`/cepim?cnpjSancionado=${clean}&pagina=1`, apiKey);
}

export async function fetchEmendasParlamentares(autor, ano, apiKey) {
  return fetchCGU(`/emendas?ano=${ano}&autor=${encodeURIComponent(autor)}&pagina=1`, apiKey);
}

export async function fetchViagensGoverno(cpf, apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(`/viagens?ano=2024&cpfViajante=${clean}&pagina=1`, apiKey);
}

export async function fetchContratos(cnpj, apiKey) {
  const clean = cnpj.replace(/\D/g, '');
  return fetchCGU(`/contratos?cnpjSancionado=${clean}&pagina=1`, apiKey);
}

export async function fetchConvenios(autor, apiKey) {
  return fetchCGU(`/convenios?tipoConsulta=0&pagina=1`, apiKey); 
}

// NOVAS CONSULTAS SOLICITADAS
export async function fetchBolsaFamilia(cpf, mesAno = '202401', apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(`/bolsa-familia-por-cpf-ou-nis?codigo=${clean}&mesAno=${mesAno}&pagina=1`, apiKey);
}

export async function fetchPETI(cpf, mesAno = '202401', apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(`/peti-por-cpf-ou-nis?codigo=${clean}&mesAno=${mesAno}&pagina=1`, apiKey);
}

export async function fetchSeguroDefeso(cpf, mesAno = '202401', apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(`/seguro-defeso-por-cpf-ou-nis?codigo=${clean}&mesAno=${mesAno}&pagina=1`, apiKey);
}

export async function fetchGarantiaSafra(cpf, mesAno = '202401', apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(`/garantia-safra-por-cpf-ou-nis?codigo=${clean}&mesAno=${mesAno}&pagina=1`, apiKey);
}

export async function fetchServidores(cpf, apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(`/servidores?cpf=${clean}&pagina=1`, apiKey);
}

export async function fetchLicitacoes(municipioIBGE, apiKey) {
  // A API de licitações é vasta, aqui filtramos por município se disponível ou geral
  return fetchCGU(`/licitacoes?codigoMunicipio=${municipioIBGE}&pagina=1`, apiKey);
}

export async function fetchNotasFiscais(cnpjEmitente, cnpjDestinatario, apiKey) {
  let query = '';
  if (cnpjEmitente) query += `&cnpjEmitente=${cnpjEmitente.replace(/\D/g,'')}`;
  if (cnpjDestinatario) query += `&cnpjDestinatario=${cnpjDestinatario.replace(/\D/g,'')}`;
  return fetchCGU(`/notas-fiscais?pagina=1${query}`, apiKey);
}

export async function fetchDespesasPoderExecutivo(ano, apiKey) {
  return fetchCGU(`/despesas/recursos-recebidos?ano=${ano}&pagina=1`, apiKey);
}
