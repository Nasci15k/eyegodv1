// Módulo 5: Justiça e Polícia (CNJ / SINESP)

export async function fetchMandadosPrisao(nomeOuCpf) {
  // Conexão real com o Banco Nacional de Mandados de Prisão (BNMP 3.0) do CNJ
  try {
    const isCpf = /^[0-9.-]+$/.test(nomeOuCpf);
    const body = isCpf 
      ? { cpf: nomeOuCpf.replace(/\D/g,'') }
      : { nomeDevedor: nomeOuCpf, tipoBusca: "NOME" };

    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://portalbnmp.cnj.jus.br/mpp/rest/publico/mandados/buscar`)}`;
    
    // Tentativa de busca real via POST no proxy
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    // Se o portal do CNJ bloquear o proxy ou exigir captcha, retornamos o link de consulta
    if (!res.ok) throw new Error("Portal CNJ Offline/Captcha Required");
    
    const data = await res.json();
    return { 
      mandadosAbertos: data.totalElements || 0, 
      itens: data.content || [],
      link: `https://portalbnmp.cnj.jus.br/#/pesquisa-peca`
    };
  } catch (err) {
    return { 
      mandadosAbertos: 0, 
      error: true,
      link: `https://portalbnmp.cnj.jus.br/#/pesquisa-peca`
    };
  }
}

export async function fetchDataJud(nomeOuCpfCNPJ) {
  // O DataJud exige token de API (API Key) do CNJ. 
  // Na ausência do token do usuário, usamos a busca via Escavador como fallback dinâmico (Real).
  return { 
    acessoLiberto: true,
    link: `https://www.escavador.com/busca?q=${encodeURIComponent(nomeOuCpfCNPJ)}`
  };
}

export async function fetchSisbajud() {
  // Sistema de Busca de Ativos do Judiciário (Antigo BacenJud)
  // Estrutamente sigiloso e não possui endpoint de "consulta pública de bloqueios" por questões judiciais.
  return { sigilo: true, mensagem: 'O bloqueio ativo e penhora online requer clearance de Nível Judicial (Magistrado).' };
}
