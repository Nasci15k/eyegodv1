// Módulo 6: IBGE - API de Agregados e Localidades
// Utilizado para enriquecimento de dados e deflação/inflação de corrupção histórica

export async function fetchLocalidadeIBGE(municipioNome, ufSigla) {
  // Transforma nomes de cidades em chaves universais do IBGE para o Tesouro e CNPJ
  try {
     const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSigla}/municipios`;
     const res = await fetch(url);
     const muns = await res.json();
     // Busca exata desconsiderando caixa
     const match = muns.find(m => m.nome.toLowerCase() === municipioNome.toLowerCase());
     return match ? match.id : null;
  } catch { return null; }
}

export async function fetchPIBMunicipal(codIbge) {
  // O Produto Interno Bruto dos Municípios (Agregado 5938)
  try {
     const url = `https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2021/variaveis/37?localidades=N6[${codIbge}]`;
     const res = await fetch(url);
     const data = await res.json();
     if(data[0]) {
       // Retorna string com o PIB na base do IBGE
       return data[0].resultados[0].series[0].serie['2021']; 
     }
     return null;
  } catch { return null; }
}

export async function fetchCorrecaoIPCA() {
  // Agregado 1737 - IPCA (Índice Nacional de Preços ao Consumidor Amplo) - IBGE SIDRA
  try {
    // Pegamos o último índice disponível (acumulado)
    const url = `https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-1/variaveis/63?localidades=N1[all]`;
    const res = await fetch(url);
    const data = await res.json();
    if (data[0]) {
      const v = data[0].resultados[0].series[0].serie;
      const t = Object.values(v)[0];
      return parseFloat(t) / 100; // Retorna o fator decimal (ex: 0.045 para 4.5%)
    }
    return 1.05; // Fallback realista (5%)
  } catch { return 1.05; }
}
