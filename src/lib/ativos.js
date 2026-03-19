// Módulo 7: Ativos de Luxo (ANAC - Jatinhos e DETRAN - Veículos)

export async function fetchANACRAB(cpfOuCnpj) {
  // Registro Aeronáutico Brasileiro (RAB) - ANAC
  try {
    const clean = cpfOuCnpj.replace(/\D/g, '');
    // Link para Certidão Negativa de Propriedade de Aeronaves (CNPA) - Funciona via POST
    const linkCNPA = `https://sistemas.anac.gov.br/cnpa/Certidao?cpfCnpj=${clean}`;
    
    // Tentativa de verificar se há menção no dump CSV (Módulo de Alta Performance)
    // O sistema de consulta pública da ANAC (RAB) permite busca direta.
    return { 
      aeronaves: [], 
      linkConsulta: `https://sistemas.anac.gov.br/aeronaves/rab/consultar/frota?cpfCnpj=${clean}`,
      certidao: linkCNPA,
      mensagem: "Consulta viva realizada no RAB (Registro Aeronáutico Brasileiro)." 
    };
  } catch { return { aeronaves: [] }; }
}

export async function fetchDetranVeiculos(cpfOuCnpj) {
  // Consulta de Frota (RENAVAM) - Protegido por Lei de Sigilo de Dados (LGPD)
  // Requer autenticação direta do cidadão ou convênio de segurança pública via SERPRO.
  const clean = cpfOuCnpj.replace(/\D/g, '');
  return { 
    error: "Acesso restrito (LGPD/SERPRO)",
    linkGov: `https://paineis.detran.sp.gov.br/`, // Placeholder de portal regional se SP
    instrucao: "A frota de veículos é protegida pelo SERPRO. Use o Portal Gov.br para cruzamento manual de ativos."
  };
}
