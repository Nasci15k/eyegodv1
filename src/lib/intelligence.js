// Motor de Inteligência Analítica - Olho de Deus
// Responsável por calcular scores de risco e detectar anomalias avançadas

export function calcularScoreSuspeicao(dados) {
  let score = 0;
  const flags = [];

  // 1. ANTECEDENTES (CNJ/TCU/CGU)
  if (dados.cnj?.mandadosAbertos > 0) {
    score += 40;
    flags.push("MANDADO DE PRISÃO ATIVO (BNMP)");
  }
  if (dados.tcu?.irregular) {
    score += 30;
    flags.push("CONTAS IRREGULARES TCU");
  }
  if (dados.cgu?.ceis || dados.cgu?.cnep) {
    score += 35;
    flags.push("EMPRESA INIDÔNEA/PUNIDA (CGU)");
  }

  // 2. CADASTRO & LARANJAS (RECEITA)
  if (dados.empresaNova) {
    score += 25;
    flags.push("EMPRESA ABERTA RECENTEMENTE (< 6 MESES)");
  }
  if (dados.capitalSocialBaixo && dados.volumeGastoAlto) {
    score += 20;
    flags.push("CAPITAL SOCIAL INCOMPATÍVEL COM VOLUME");
  }

  // 3. ANOMALIAS FINANCEIRAS (BENFORD / FRACIONAMENTO)
  if (dados.benfordAlert) {
    score += 15;
    flags.push("DESVIO ESTATÍSTICO (BENFORD)");
  }
  if (dados.fracionamento) {
    score += 20;
    flags.push("POTENCIAL FRACIONAMENTO DE DESPESA");
  }
  if (dados.valoresRedondos > 3) {
    score += 10;
    flags.push("EXCESSO DE VALORES REDONDOS");
  }

  // 4. POLÍTICO (TSE/QSA)
  if (dados.socioParlamentar) {
    score += 50;
    flags.push("PARLAMENTAR IDENTIFICADO COMO SÓCIO/QSA");
  }

  return {
    total: Math.min(score, 100),
    flags,
    nivel: score > 70 ? 'CRÍTICO' : score > 40 ? 'ALTO' : score > 20 ? 'MÉDIO' : 'BAIXO'
  };
}

export function analiseBenford(valores) {
  if (!valores || valores.length < 10) return false;
  const primeirosDigitos = valores.map(v => String(v)[0]);
  const freq = primeirosDigitos.reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const freq1 = (freq['1'] || 0) / valores.length;
  return freq1 < 0.15 || freq1 > 0.45;
}

export function detectarLaranja(dataAbertura, dataPrimeiroPagamento) {
  if (!dataAbertura || !dataPrimeiroPagamento) return false;
  const abertura = new Date(dataAbertura);
  const pagamento = new Date(dataPrimeiroPagamento);
  const diffMeses = (pagamento - abertura) / (1000 * 60 * 60 * 24 * 30);
  return diffMeses < 6;
}

export function detectarFracionamento(pagamentos) {
  // Detecta se há muitos pagamentos para o mesmo CNPJ no mesmo mês
  // próximos ao limite de dispensa de licitação ou apenas repetitivos.
  if (!pagamentos || pagamentos.length < 3) return false;
  const meses = {};
  pagamentos.forEach(p => {
    const mes = `${p.numAno}-${p.numMes}`;
    if (!meses[mes]) meses[mes] = 0;
    meses[mes]++;
  });
  return Object.values(meses).some(count => count >= 3);
}

export function detectarSocioParlamentar(qsa, nomeParlamentar) {
  if (!qsa || !nomeParlamentar) return false;
  const nomeLimpo = nomeParlamentar.toLowerCase().trim();
  return qsa.some(socio => socio.nome?.toLowerCase().includes(nomeLimpo) || socio.nome_socio?.toLowerCase().includes(nomeLimpo));
}

export function calcularRetornoSocial(valorTotal, pibMunicipal) {
  // Índice experimental: % do gasto em relação ao pib da cidade
  if (!valorTotal || !pibMunicipal) return 0;
  return (valorTotal / pibMunicipal) * 100;
}

export function detectarSobrepreco(valor, mediaSetor) {
  if (!valor || !mediaSetor) return false;
  return valor > mediaSetor * 2.5; // Regra: 150% acima da média
}
