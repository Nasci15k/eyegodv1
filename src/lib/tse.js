// Wrapper de Acesso ao TSE (Tribunal Superior Eleitoral)
// API pública via DivulgaCandContas (Usado via proxy de CORS para acesso root no navegador)

const TSE_URL = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";
const PROXY_URL = 'https://exposedgovbr.black-spectra-suporte.workers.dev/';

async function safeFetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.trim().length === 0) return null;
    return JSON.parse(text);
  } catch (err) {
    console.error("Fetch/JSON Error:", err);
    return null;
  }
}

export async function fetchCandidaturasTSE(nomeBusca) {
  try {
    const q = encodeURIComponent(nomeBusca);
    const targetUrl = `${TSE_URL}/candidatura/buscar/2022/BR/2045202022/candidato/${q}`;
    const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
    const data = await safeFetchJson(proxyUrl);
    return data?.candidatos || [];
  } catch (err) {
    console.error("Erro TSE Candidaturas:", err);
    return [];
  }
}

export async function fetchBensTSE(idCandidato, idEleicao = '2045202022', siglaUf = 'BR') {
  try {
     const targetUrl = `${TSE_URL}/candidatura/buscar/2022/${siglaUf}/${idEleicao}/candidato/${idCandidato}`;
     const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
     const data = await safeFetchJson(proxyUrl);
     return data?.bens || [];
  } catch (e) {
    console.error("Erro TSE Bens:", e);
    return [];
  }
}

export async function fetchPrestacaoContasTSE(idCandidato, idEleicao = '2045202022', siglaUf = 'BR') {
  try {
     const targetUrl = `${TSE_URL}/prestador/consulta/receitas/2022/${idEleicao}/1/${siglaUf}/${idCandidato}`;
     const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
     const data = await safeFetchJson(proxyUrl);
     return data || [];
  } catch (e) {
    console.error("Erro TSE Prestação de Contas:", e);
    return [];
  }
}

export async function fetchFiliadosPartido(sigla, uf) {
  // A base de filiados oficial é distribuída em ZIPs gigantes (19GB+)
  // Para UI web, vamos retornar mock de conexão ou um endpoint backend que o dev crie futuro
  console.log(`Base de Filiados do ${sigla}-${uf} requer o dump SQL no Supabase.`);
  return { error: 'Desativado: Requer carga da base local de filiados no Supabase' };
}
