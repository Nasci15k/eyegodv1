// Wrapper de Acesso ao TSE (Tribunal Superior Eleitoral)
// API pública via DivulgaCandContas (Usado via proxy de CORS para acesso root no navegador)

const TSE_URL = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";

export async function fetchCandidaturasTSE(nomeBusca) {
  try {
    const q = encodeURIComponent(nomeBusca);
    // Proxy utilizado preventivamente pois o WAF do TSE bloqueia headers complexos do React
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${TSE_URL}/candidatura/buscar/2022/BR/2045202022/candidato/${q}`)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.candidatos || [];
  } catch (err) {
    console.error("Erro TSE Candidaturas:", err);
    return [];
  }
}

export async function fetchBensTSE(idCandidato, idEleicao = '2045202022', siglaUf = 'BR') {
  try {
     // Para pegar os bens o ID oficial gerado pela busca anterior é mandatório
     const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${TSE_URL}/candidatura/buscar/2022/${siglaUf}/${idEleicao}/candidato/${idCandidato}`)}`;
     const res = await fetch(proxy);
     const data = await res.json();
     return data.bens || [];
  } catch (e) {
    console.error("Erro TSE Bens:", e);
    return [];
  }
}

export async function fetchPrestacaoContasTSE(idCandidato, idEleicao = '2045202022', siglaUf = 'BR') {
  try {
     // Pegando doações (receitas) declaradas no DivulgaCandContas
     // proxying para evitar WAF
     const urlOficial = `${TSE_URL}/prestador/consulta/receitas/2022/${idEleicao}/1/${siglaUf}/${idCandidato}`;
     const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlOficial)}`;
     const res = await fetch(proxyUrl);
     return await res.json();
  } catch (e) {
    console.error("Erro TSE Prestação de Contas (Doadores Laranjas):", e);
    return [];
  }
}

export async function fetchFiliadosPartido(sigla, uf) {
  // A base de filiados oficial é distribuída em ZIPs gigantes (19GB+)
  // Para UI web, vamos retornar mock de conexão ou um endpoint backend que o dev crie futuro
  console.log(`Base de Filiados do ${sigla}-${uf} requer o dump SQL no Supabase.`);
  return { error: 'Desativado: Requer carga da base local de filiados no Supabase' };
}
