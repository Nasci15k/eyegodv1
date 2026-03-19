// Busca por notícias judiciais e escândalos via Google News RSS
// Usamos um parser proxy allorigins para bypass CORS

export async function fetchEscandalos(query) {
  try {
    // Termos de busca ancorados para investigações
    const searchQuery = `${query} "investigação" OR "escândalo" OR "fraude" OR "desvio" OR "corrupção" OR "polícia federal"`;
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    
    // Proxy para contornar CORS no navegador
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) return [];
    
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    
    const items = Array.from(xml.querySelectorAll("item")).slice(0, 6);
    return items.map(item => ({
      title: item.querySelector("title")?.textContent,
      link: item.querySelector("link")?.textContent,
      pubDate: item.querySelector("pubDate")?.textContent,
      source: item.querySelector("source")?.textContent
    }));
  } catch (err) {
    console.error("Erro na busca de notícias:", err);
    return [];
  }
}
