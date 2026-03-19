// Módulo 6: Tesouro Nacional - SIAFI e SICONFI (Finanças do Brasil)
// Extrato de repasses e despesas de municípios para cruzar o rastreio do dinheiro público com o recebedor privado

export async function fetchSiconfiDespesas(codIbgeMunicipal) {
  // Retorna as despesas declaradas pelo municipio no último ano base consolidado
  try {
    const url = `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/despesas?an_exercicio=2022&id_ente=${codIbgeMunicipal}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("Erro Tesouro SICONFI:", err);
    return [];
  }
}

export async function fetchBancoCentralPixInfo() {
  // Transações Pix agregadas (Base de dados abertos BCB) - Usado para cruzar volume contra capital social
  // Módulo de infraestrutura futuro.
  return { error: 'Requer proxy de raspagem do portal de dados abertos do BCB.' };
}
