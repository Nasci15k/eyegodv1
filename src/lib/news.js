/**
 * Módulo de Notícias & Escândalos — Olho de Deus v2.0
 * Google News RSS + fallback
 */
 
import { PROXY_URL } from './cgu.js';
 
// ─── CORE ─────────────────────────────────────────────────────────────────────
 
async function fetchRSS(url) {
  // Tenta direto primeiro (às vezes funciona sem CORS issues em RSS)
  try {
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      return parseRSS(text);
    }
  } catch {}
 
  // Fallback: proxy do worker
  try {
    const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return [];
    const text = await res.text();
    return parseRSS(text);
  } catch (err) {
    console.error('Erro RSS:', err);
    return [];
  }
}
 
function parseRSS(text) {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item'));
 
    return items.slice(0, 10).map(item => ({
      titulo: item.querySelector('title')?.textContent?.trim() || '',
      link: item.querySelector('link')?.nextSibling?.nodeValue?.trim() ||
            item.querySelector('link')?.textContent?.trim() || '',
      data: item.querySelector('pubDate')?.textContent?.trim() || '',
      fonte: item.querySelector('source')?.textContent?.trim() || '',
      descricao: item.querySelector('description')?.textContent
        ?.replace(/<[^>]*>/g, '')?.trim()?.slice(0, 200) || '',
    })).filter(i => i.titulo);
  } catch {
    return [];
  }
}
 
function buildGoogleNewsURL(query) {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}
 
// ─── BUSCA PRINCIPAL ──────────────────────────────────────────────────────────
 
/**
 * Busca escândalos e notícias de investigação sobre um nome/entidade
 */
export async function fetchEscandalos(query, opcoes = {}) {
  const {
    maxItens = 8,
    incluirPositivos = false,
    soAnosRecentes = true,
  } = opcoes;
 
  // Query principal — foco em investigações
  const termosCrime = '"investigação" OR "escândalo" OR "fraude" OR "desvio" OR "corrupção" OR "polícia federal" OR "MPF" OR "STJ" OR "TCU" OR "operação"';
  const queryCompleta = `"${query}" (${termosCrime})${soAnosRecentes ? ' after:2020-01-01' : ''}`;
 
  const noticias = await fetchRSS(buildGoogleNewsURL(queryCompleta));
 
  // Se não encontrou nada, tenta query mais simples
  if (noticias.length === 0) {
    const querySimplex = `${query} corrupção OR fraude OR investigação`;
    const noticiasSimples = await fetchRSS(buildGoogleNewsURL(querySimplex));
    return noticiasSimples.slice(0, maxItens);
  }
 
  return noticias.slice(0, maxItens);
}
 
/**
 * Busca notícias recentes sobre um parlamentar (geral, não só escândalos)
 */
export async function fetchNoticiasParlamentar(nome, opcoes = {}) {
  const { maxItens = 6 } = opcoes;
  const primeiroNome = nome.split(' ').slice(0, 2).join(' ');
 
  const [investigativas, gerais] = await Promise.all([
    fetchEscandalos(nome, { maxItens: 4 }),
    fetchRSS(buildGoogleNewsURL(`"${primeiroNome}" deputado OR senador OR parlamentar`)),
  ]);
 
  // Deduplica por URL
  const vistas = new Set();
  const todas = [...investigativas, ...gerais].filter(n => {
    if (!n.link || vistas.has(n.link)) return false;
    vistas.add(n.link);
    return true;
  });
 
  return todas.slice(0, maxItens).map(n => ({
    ...n,
    suspeita: investigativas.some(i => i.link === n.link),
  }));
}
 
/**
 * Busca notícias sobre uma empresa/CNPJ
 */
export async function fetchNoticiasEmpresa(nomeEmpresa, opcoes = {}) {
  const { maxItens = 6 } = opcoes;
  const nome = nomeEmpresa.replace(/ (LTDA|SA|S\.A\.|EPP|ME|EIRELI)\.?$/i, '').trim();
 
  return fetchEscandalos(nome, { maxItens, soAnosRecentes: false });
}
 
/**
 * Busca operações da Polícia Federal que possam envolver o nome
 */
export async function fetchOperacoesPF(query) {
  const queryOp = `"${query}" "Polícia Federal" OR "Operação" OR "MPF" OR "PGR"`;
  return fetchRSS(buildGoogleNewsURL(queryOp));
}
 
