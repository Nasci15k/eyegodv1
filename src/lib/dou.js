// Módulo 7: Diários Oficiais (DOU e DOEs)

export async function fetchDOU(query) {
  // Busca exata no Diário Oficial da União (Imprensa Nacional)
  try {
    const q = encodeURIComponent(`"${query}"`);
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.in.gov.br/buscadou/search?q=${q}&s=todos&exactMatch=y&sortType=0`)}`;
    const res = await fetch(url);
    if (!res.ok) return { total: 0, items: [] };
    const data = await res.json();
    return {
      total: data.total || 0,
      items: (data.articles || []).slice(0, 5).map(art => ({
        titulo: art.title,
        pub: art.pubName,
        data: art.pubDate,
        url: `https://www.in.gov.br/web/dou/-/${art.urlTitle}`
      })),
      urlBusca: `https://www.in.gov.br/consulta/-/buscar/dou?q=${q}`
    };
  } catch (err) { 
    console.error("Erro DOU Search:", err);
    return { total: 0, items: [], urlBusca: `https://www.in.gov.br/consulta/-/buscar/dou?q=${encodeURIComponent(query)}` }; 
  }
}
