// ReceitaWS - Fallback para consulta pública de CNPJs quando BrasilAPI falha
// CORS restringe requests de front-end, proxy via allorigins

export async function fetchReceitaWS(cnpj) {
  try {
    const clean = cnpj.replace(/\D/g, '');
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.receitaws.com.br/v1/cnpj/${clean}`)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status === 'ERROR') return null;
    
    return data;
  } catch (err) {
    console.error("Erro no ReceitaWS:", err);
    return null;
  }
}
