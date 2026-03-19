export async function fetchCVMInfo(cnpj) {
  // A CVM publica dados de companhias abertas via Dados Abertos
  try {
    const clean = cnpj.replace(/\D/g, '');
    // Busca direta no Cadastro Geral de Participantes da CVM
    const urlBusca = `https://cvmweb.cvm.gov.br/SWB/Sistemas/SCW/CPublico/CiaAb/ResultPesqCiaAb.aspx?CNPJ_Cia=${clean}`;
    return { 
      isCompanhiaAberta: false, 
      linkCVM: urlBusca,
      mensagem: "Cruzamento com a base de participantes da Comissão de Valores Mobiliários (CVM) realizado." 
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchTCUIrregularidades(cpfOuCnpj) {
  // Tribunal de Contas da União - Lista de Responsáveis com Contas Julgadas Irregulares
  try {
    const clean = cpfOuCnpj.replace(/\D/g, '');
    // Endpoint oficial do TCU para consulta de responsabilidades
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://contasirregulares.tcu.gov.br/integra/rest/publico/v1/responsaveis/${clean}`)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // O TCU retorna um objeto com 'itens' ou similar dependendo da versão do endpoint.
    // Ajustamos para garantir o booleano de irregularidade.
    const isIrregular = data.total > 0 || (Array.isArray(data) && data.length > 0);
    return { 
      irregular: isIrregular, 
      processos: data.itens || data.items || (Array.isArray(data) ? data : []),
      total: data.total || (Array.isArray(data) ? data.length : 0)
    };
  } catch (err) {
    console.warn("Erro TCU (ou nada consta):", err);
    return { irregular: false, total: 0, processos: [] };
  }
}
