// Funções para acessar a API de Dados Abertos da Câmara

const BASE_URL = "https://dadosabertos.camara.leg.br/api/v2";

export async function fetchDeputados() {
  try {
    const r = await fetch(`${BASE_URL}/deputados?pagina=1&itens=100&ordem=ASC&ordenarPor=nome`);
    const d = await r.json();
    return d.dados || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Para histórico pesado nós usaremos a leitura do ZIP no cliente. (Será implementado à parte usando zip.js e papaparse)
export async function downloadCEAPZip(ano) {
  const url = `https://www.camara.leg.br/cotas/Ano-${ano}.csv.zip`;
  // Para contornar CORS, um proxy simples gratuito
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Erro de download CEAP");
    return await response.blob();
  } catch (err) {
    console.error("Falha ao baixar CEAP via proxy:", err);
    return null;
  }
}

export async function fetchVotacoesDeputado(depId) {
  try {
    const r = await fetch(`${BASE_URL}/deputados/${depId}/votacoes?pagina=1&itens=15&ordem=DESC&ordenarPor=dataHoraRegistro`);
    const d = await r.json();
    return d.dados || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchDeputadoDetails(depId) {
  try {
    const r = await fetch(`${BASE_URL}/deputados/${depId}`);
    const d = await r.json();
    return d.dados || null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function fetchDeputadoDespesas(depId) {
  try {
    const r = await fetch(`${BASE_URL}/deputados/${depId}/despesas?ordem=DESC&ordenarPor=ano`);
    const d = await r.json();
    return d.dados || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchDeputadoDiscursos(depId) {
  try {
    const r = await fetch(`${BASE_URL}/deputados/${depId}/discursos?ordem=DESC&ordenarPor=dataHoraInicio`);
    const d = await r.json();
    return d.dados || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchProposicoes(siglaTipo = "", numero = "", ano = "") {
  try {
    let url = `${BASE_URL}/proposicoes?ordem=DESC&ordenarPor=id`;
    if (siglaTipo) url += `&siglaTipo=${siglaTipo}`;
    if (numero) url += `&numero=${numero}`;
    if (ano) url += `&ano=${ano}`;
    const r = await fetch(url);
    const d = await r.json();
    return d.dados || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchProposicaoDetails(propId) {
  try {
    const r = await fetch(`${BASE_URL}/proposicoes/${propId}`);
    const d = await r.json();
    return d.dados || null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function fetchPartidos() {
  try {
    const r = await fetch(`${BASE_URL}/partidos?ordem=ASC&ordenarPor=sigla&itens=100`);
    const d = await r.json();
    return d.dados || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchEventos() {
  try {
    const r = await fetch(`${BASE_URL}/eventos?ordem=DESC&ordenarPor=dataHoraInicio`);
    const d = await r.json();
    return d.dados || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}
