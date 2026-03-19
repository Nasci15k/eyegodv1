export async function fetchCNPJ(cnpj) {
  if (!cnpj) return null;
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return null;
  
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Erro ao buscar CNPJ na BrasilAPI:", err);
    return null;
  }
}

export async function fetchCEP(cep) {
  try {
    const clean = cep.replace(/\D/g, '');
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const d = await r.json();
    if (d.erro) return null;
    return d;
  } catch {
    return null;
  }
}
