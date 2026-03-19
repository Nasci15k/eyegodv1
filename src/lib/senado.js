export async function fetchSenadores() {
  try {
    const res = await fetch("https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json");
    if (!res.ok) return [];
    
    const data = await res.json();
    const lista = data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
    
    return lista.map(s => ({
      nome: s.IdentificacaoParlamentar.NomeParlamentar,
      partido: s.IdentificacaoParlamentar.SiglaPartidoParlamentar,
      uf: s.IdentificacaoParlamentar.UfParlamentar,
      foto: s.IdentificacaoParlamentar.UrlFotoParlamentar,
      id: s.IdentificacaoParlamentar.CodigoParlamentar
    }));
  } catch (err) {
    console.error("Erro ao buscar senadores:", err);
    return [];
  }
}
