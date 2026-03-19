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
