// Portal da Transparência / CGU - Bateria Completa de Inteligência
// Requer chave de API gerada gratuitamente em https://portaldatransparencia.gov.br/api-de-dados

const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';

async function fetchCGU(endpoint, apiKey) {
  if (!apiKey) return { error: 'Chave da CGU ausente. (Gere em portaldatransparencia.gov.br)' };
  
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'chave-api-dados': apiKey }
    });
    
    if (!res.ok) {
      if (res.status === 401) return { error: 'Chave da API CGU inválida.' };
      return { error: 'Falha ao conectar ao Portal da Transparência.' };
    }
    
    const data = await res.json();
    return { data }; 
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchCEIS(cnpj, apiKey) {
  const clean = cnpj.replace(/\D/g, '');
  return fetchCGU(`/ceis?cnpjSancionado=${clean}&pagina=1`, apiKey);
}

export async function fetchCNEP(cnpj, apiKey) {
  const clean = cnpj.replace(/\D/g, '');
  return fetchCGU(`/cnep?cnpjSancionado=${clean}&pagina=1`, apiKey);
}

export async function fetchCEAF(cpf, apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(`/ceaf?cpfSancionado=${clean}&pagina=1`, apiKey);
}

export async function fetchEmendasParlamentares(autor, ano, apiKey) {
  // Mapeamento de quanto o deputado despachou de emendas cruzado contra fornecedores
  return fetchCGU(`/emendas?ano=${ano}&autor=${encodeURIComponent(autor)}&pagina=1`, apiKey);
}

export async function fetchViagensGoverno(cpf, apiKey) {
  const clean = cpf.replace(/\D/g, '');
  return fetchCGU(`/viagens?ano=2024&cpfViajante=${clean}&pagina=1`, apiKey);
}
