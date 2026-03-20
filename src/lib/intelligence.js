/**
 * Motor de Inteligência Analítica — Olho de Deus v3.0
 * Algoritmos de detecção de anomalias, scoring de risco e análise estatística
 */
 
// ─── SCORE DE SUSPEIÇÃO ───────────────────────────────────────────────────────
 
/**
 * Calcula score de suspeição 0-100 com base em múltiplas fontes
 * Retorna: { total, flags, nivel, detalhes }
 */
export function calcularScoreSuspeicao(dados) {
  const flags = [];
  const detalhes = [];
  let score = 0;
 
  // ── 1. ANTECEDENTES JUDICIAIS/ADMINISTRATIVOS ────────────────────────────
  if (dados.cnj?.mandadosAbertos > 0) {
    const pts = Math.min(40 + dados.cnj.mandadosAbertos * 5, 55);
    score += pts;
    flags.push('MANDADO DE PRISÃO ATIVO (BNMP)');
    detalhes.push({ categoria: 'Justiça', fonte: 'CNJ/BNMP', peso: pts, desc: `${dados.cnj.mandadosAbertos} mandado(s) de prisão em aberto.` });
  }
 
  if (dados.tcu?.irregular || dados.tcu?.total > 0) {
    const pts = 30;
    score += pts;
    flags.push('CONTAS IRREGULARES TCU');
    detalhes.push({ categoria: 'Controle', fonte: 'TCU', peso: pts, desc: `${dados.tcu.total || 1} processo(s) com contas irregulares no TCU.` });
  }
 
  if (dados.cgu?.ceis?.temSancao) {
    const pts = 35;
    score += pts;
    flags.push('EMPRESA INIDÔNEA (CEIS/CGU)');
    detalhes.push({ categoria: 'Sanção', fonte: 'CGU/CEIS', peso: pts, desc: dados.cgu.ceis.resumo });
  }
 
  if (dados.cgu?.cnep?.temSancao) {
    const pts = 30;
    score += pts;
    flags.push('EMPRESA PUNIDA (CNEP/CGU)');
    detalhes.push({ categoria: 'Sanção', fonte: 'CGU/CNEP', peso: pts, desc: dados.cgu.cnep.resumo });
  }
 
  if (dados.cgu?.cepim?.temSancao) {
    const pts = 25;
    score += pts;
    flags.push('ENTIDADE IMPEDIDA (CEPIM/CGU)');
    detalhes.push({ categoria: 'Sanção', fonte: 'CGU/CEPIM', peso: pts, desc: dados.cgu.cepim.resumo });
  }
 
  // ── 2. CADASTRO / EMPRESA SUSPEITA ──────────────────────────────────────
  if (dados.empresaNova) {
    const pts = 25;
    score += pts;
    flags.push('EMPRESA ABERTA RECENTEMENTE (< 6 MESES)');
    detalhes.push({ categoria: 'Cadastro', fonte: 'Receita Federal', peso: pts, desc: 'Abertura da empresa ocorreu menos de 6 meses antes do primeiro pagamento público.' });
  }
 
  if (dados.capitalSocialBaixo && dados.volumeGastoAlto) {
    const pts = 20;
    score += pts;
    flags.push('CAPITAL SOCIAL INCOMPATÍVEL COM VOLUME');
    detalhes.push({ categoria: 'Cadastro', fonte: 'Receita Federal', peso: pts, desc: `Capital social insuficiente para o volume de contratos recebidos.` });
  }
 
  if (dados.semFuncionarios && dados.volumeGastoAlto) {
    const pts = 20;
    score += pts;
    flags.push('EMPRESA SEM FUNCIONÁRIOS COM ALTO VOLUME');
    detalhes.push({ categoria: 'Cadastro', fonte: 'Receita/MTE', peso: pts, desc: 'Empresa não possui vínculos empregatícios registrados apesar do alto volume de recebimentos.' });
  }
 
  if (dados.enderecoCompartilhado) {
    const pts = 15;
    score += pts;
    flags.push('ENDEREÇO COMPARTILHADO COM OUTRAS EMPRESAS SUSPEITAS');
    detalhes.push({ categoria: 'Cadastro', fonte: 'Receita Federal', peso: pts, desc: 'Mesmo endereço cadastrado em múltiplas empresas — padrão de laranja em série.' });
  }
 
  // ── 3. ANOMALIAS FINANCEIRAS ─────────────────────────────────────────────
  if (dados.benfordAlert) {
    const pts = 20;
    score += pts;
    flags.push('DESVIO ESTATÍSTICO (LEI DE BENFORD)');
    detalhes.push({ categoria: 'Financeiro', fonte: 'Análise Estatística', peso: pts, desc: `χ² = ${dados.benfordChi2?.toFixed(1) || '?'} > 15.5. Distribuição dos primeiros dígitos não segue o padrão natural de Benford.` });
  }
 
  if (dados.fracionamento) {
    const pts = 20;
    score += pts;
    flags.push('POTENCIAL FRACIONAMENTO DE DESPESA');
    detalhes.push({ categoria: 'Financeiro', fonte: 'Padrão de Pagamentos', peso: pts, desc: '3 ou mais pagamentos ao mesmo CNPJ no mesmo mês — possível fracionamento para fugir de licitação.' });
  }
 
  if (dados.valoresRedondos > 30) {
    const pts = Math.min(10 + Math.floor((dados.valoresRedondos - 30) / 10) * 5, 20);
    score += pts;
    flags.push(`EXCESSO DE VALORES REDONDOS (${dados.valoresRedondos.toFixed(0)}%)`);
    detalhes.push({ categoria: 'Financeiro', fonte: 'Padrão de Valores', peso: pts, desc: `${dados.valoresRedondos.toFixed(1)}% dos valores são múltiplos exatos de R$500/1000 — típico de estimativas ao invés de notas reais.` });
  }
 
  if (dados.hhi > 5000) {
    const pts = 25;
    score += pts;
    flags.push('CONCENTRAÇÃO EXTREMA DE FORNECEDOR (HHI > 5000)');
    detalhes.push({ categoria: 'Financeiro', fonte: 'Índice HHI', peso: pts, desc: `HHI = ${Math.round(dados.hhi)}. Equivalente a monopólio total — mais de 70% dos gastos em 1-2 fornecedores.` });
  } else if (dados.hhi > 2500) {
    const pts = 15;
    score += pts;
    flags.push('ALTA CONCENTRAÇÃO DE FORNECEDOR (HHI > 2500)');
    detalhes.push({ categoria: 'Financeiro', fonte: 'Índice HHI', peso: pts, desc: `HHI = ${Math.round(dados.hhi)}. Concentração preocupante — semelhante a oligopólio.` });
  }
 
  if (dados.pagamentoFDS) {
    const pts = 15;
    score += pts;
    flags.push('PAGAMENTOS EM FIM DE SEMANA');
    detalhes.push({ categoria: 'Temporal', fonte: 'Análise Temporal', peso: pts, desc: `${dados.pctFDS?.toFixed(1) || '?'}% dos pagamentos ocorrem em sábados ou domingos — atípico para despesas legítimas.` });
  }
 
  // ── 4. POLÍTICO / TSE ────────────────────────────────────────────────────
  if (dados.socioParlamentar) {
    const pts = 50;
    score += pts;
    flags.push('PARLAMENTAR IDENTIFICADO COMO SÓCIO/QSA');
    detalhes.push({ categoria: 'Político', fonte: 'Receita/TSE', peso: pts, desc: 'Nome do parlamentar ou familiar identificado no quadro societário da empresa fornecedora.' });
  }
 
  if (dados.patrimonioIncompativel) {
    const pts = 30;
    score += pts;
    flags.push('PATRIMÔNIO INCOMPATÍVEL COM RENDA DECLARADA');
    detalhes.push({ categoria: 'Político', fonte: 'TSE/Receita', peso: pts, desc: 'Crescimento patrimonial declarado ao TSE superior ao esperado para o cargo exercido.' });
  }
 
  if (dados.emendasExcessivas) {
    const pts = 15;
    score += pts;
    flags.push('VOLUME ANORMAL DE EMENDAS PARA MUNICÍPIOS ESPECÍFICOS');
    detalhes.push({ categoria: 'Político', fonte: 'CGU/Emendas', peso: pts, desc: 'Concentração suspeita de emendas parlamentares para municípios com vínculos políticos/eleitorais.' });
  }
 
  // ── 5. CVM / MERCADO DE CAPITAIS ─────────────────────────────────────────
  if (dados.extra?.cvm?.isCompanhiaAberta && dados.extra?.cvm?.processosCVM > 0) {
    const pts = 20;
    score += pts;
    flags.push('PROCESSOS NA CVM');
    detalhes.push({ categoria: 'Mercado', fonte: 'CVM', peso: pts, desc: 'Empresa com processos administrativos na Comissão de Valores Mobiliários.' });
  }
 
  const total = Math.min(score, 100);
 
  return {
    total,
    flags,
    detalhes,
    nivel: total >= 70 ? 'CRÍTICO' : total >= 50 ? 'ALTO' : total >= 25 ? 'MÉDIO' : total >= 10 ? 'BAIXO' : 'LIMPO',
    cor: total >= 70 ? '#e04545' : total >= 50 ? '#d4a03a' : total >= 25 ? '#d4a03a' : '#34a853',
    recomendacao: gerarRecomendacao(total, flags),
  };
}
 
function gerarRecomendacao(score, flags) {
  if (score >= 70) return 'ENCAMINHAR PARA APURAÇÃO IMEDIATA — Múltiplos indicadores críticos detectados.';
  if (score >= 50) return 'APROFUNDAR INVESTIGAÇÃO — Inconsistências graves que merecem análise manual detalhada.';
  if (score >= 25) return 'MONITORAR — Indicadores moderados presentes. Acompanhar próximas transações.';
  if (score >= 10) return 'ATENÇÃO — Anomalia pontual. Verificar contexto específico.';
  return 'SEM INDÍCIOS — Perfil dentro dos padrões esperados para o período.';
}
 
// ─── ANÁLISE DE BENFORD ───────────────────────────────────────────────────────
 
/**
 * Aplica a Lei de Benford nos valores e retorna estatísticas completas
 * A Lei de Benford prevê que em dados financeiros naturais, o dígito 1 aparece ~30% das vezes
 */
export function analiseBenford(valores) {
  if (!valores || valores.length < 30) {
    return { valido: false, motivo: 'Amostra insuficiente (mínimo 30 valores)', suspeito: false };
  }
 
  // Filtra zeros e valores negativos
  const valoresFiltrados = valores.filter(v => v > 0);
 
  const primeirosDigitos = valoresFiltrados.map(v => {
    const s = String(Math.abs(v)).replace(/[^0-9]/g, '').replace(/^0+/, '');
    return s[0] ? parseInt(s[0]) : null;
  }).filter(Boolean);
 
  if (primeirosDigitos.length < 30) {
    return { valido: false, motivo: 'Valores positivos insuficientes', suspeito: false };
  }
 
  const n = primeirosDigitos.length;
  const BENFORD_ESPERADO = Array.from({ length: 9 }, (_, i) => Math.log10(1 + 1 / (i + 1)));
 
  const observado = Array.from({ length: 9 }, (_, i) =>
    primeirosDigitos.filter(d => d === i + 1).length
  );
 
  const chi2 = observado.reduce((s, obs, i) => {
    const esp = BENFORD_ESPERADO[i] * n;
    return s + Math.pow(obs - esp, 2) / esp;
  }, 0);
 
  // p-value crítico com 8 graus de liberdade:
  // 15.51 → p < 0.05 (suspeito)
  // 20.09 → p < 0.01 (muito suspeito)
  // 26.12 → p < 0.001 (extremamente suspeito)
  const suspeito = chi2 > 15.51;
  const muitoSuspeito = chi2 > 20.09;
 
  const distribuicao = Array.from({ length: 9 }, (_, i) => ({
    digito: i + 1,
    observado: observado[i],
    esperado: Math.round(BENFORD_ESPERADO[i] * n),
    pctObservado: (observado[i] / n * 100).toFixed(1),
    pctEsperado: (BENFORD_ESPERADO[i] * 100).toFixed(1),
    desvio: Math.abs(observado[i] / n - BENFORD_ESPERADO[i]),
  }));
 
  return {
    valido: true,
    n,
    chi2: parseFloat(chi2.toFixed(2)),
    suspeito,
    muitoSuspeito,
    nivel: muitoSuspeito ? 'MUITO SUSPEITO' : suspeito ? 'SUSPEITO' : 'NORMAL',
    distribuicao,
    interpretacao: muitoSuspeito
      ? `χ² = ${chi2.toFixed(1)} (p < 0.01) — Desvio estatístico extremo. Forte evidência de manipulação nos valores.`
      : suspeito
        ? `χ² = ${chi2.toFixed(1)} (p < 0.05) — Distribuição de primeiros dígitos anômala. Merece investigação.`
        : `χ² = ${chi2.toFixed(1)} — Distribuição natural. Sem anomalia estatística detectada.`,
  };
}
 
// ─── DETECÇÃO DE EMPRESA LARANJA ─────────────────────────────────────────────
 
/**
 * Detecta se uma empresa foi criada recentemente antes de começar a receber
 * pagamentos públicos (padrão clássico de empresa laranja)
 */
export function detectarLaranja(dataAbertura, dataPrimeiroPagamento, mesesLimite = 6) {
  if (!dataAbertura || !dataPrimeiroPagamento) return false;
 
  // Aceita múltiplos formatos de data
  const parseDate = (s) => {
    if (!s) return null;
    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [d, m, y] = s.split('/');
      return new Date(`${y}-${m}-${d}`);
    }
    return new Date(s);
  };
 
  const abertura = parseDate(dataAbertura);
  const pagamento = parseDate(dataPrimeiroPagamento);
 
  if (!abertura || !pagamento || isNaN(abertura) || isNaN(pagamento)) return false;
 
  const diffMeses = (pagamento - abertura) / (1000 * 60 * 60 * 24 * 30.44);
  return diffMeses < mesesLimite;
}
 
// ─── DETECÇÃO DE FRACIONAMENTO ────────────────────────────────────────────────
 
/**
 * Detecta possível fracionamento de despesas (Art. 24 da Lei 8.666)
 * Limites de dispensa de licitação: R$17.600 (bens/serviços) / R$33.000 (obras)
 */
export function detectarFracionamento(pagamentos, limiteDispensa = 17600) {
  if (!pagamentos || pagamentos.length < 3) return false;
 
  // Agrupa por CNPJ + mês
  const grupos = {};
  pagamentos.forEach(p => {
    const key = `${p.txtCNPJCPF}-${p.numAno}-${p.numMes}`;
    if (!grupos[key]) grupos[key] = { count: 0, total: 0, valores: [] };
    grupos[key].count++;
    grupos[key].total += p.vlrLiquido;
    grupos[key].valores.push(p.vlrLiquido);
  });
 
  return Object.values(grupos).some(g => {
    // 3+ pagamentos no mesmo mês para o mesmo CNPJ
    if (g.count >= 3) return true;
    // Total mensal próximo ou acima do limite de dispensa mas parcelado
    if (g.total > limiteDispensa * 0.8 && g.count >= 2) return true;
    // Valores muito próximos entre si (suspeita de fatiamento)
    if (g.valores.length >= 2) {
      const media = g.total / g.valores.length;
      const todosParecidos = g.valores.every(v => Math.abs(v - media) / media < 0.1);
      if (todosParecidos && g.count >= 2) return true;
    }
    return false;
  });
}
 
// ─── DETECÇÃO DE SÓCIO PARLAMENTAR ───────────────────────────────────────────
 
/**
 * Verifica se algum sócio da empresa tem nome que corresponde a parlamentares
 * Usa similaridade de string para capturar nomes parciais
 */
export function detectarSocioParlamentar(qsa, nomeParlamentar) {
  if (!qsa || !nomeParlamentar) return false;
 
  const nomeLimpo = normalizarNome(nomeParlamentar);
  const partes = nomeLimpo.split(' ').filter(p => p.length > 3);
 
  return qsa.some(socio => {
    const nomeSocio = normalizarNome(socio.nome || socio.nome_socio || '');
    // Match exato
    if (nomeSocio.includes(nomeLimpo) || nomeLimpo.includes(nomeSocio)) return true;
    // Match por partes do nome (pelo menos 2 partes principais)
    const matches = partes.filter(p => nomeSocio.includes(p));
    return matches.length >= 2;
  });
}
 
function normalizarNome(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z\s]/g, '')
    .trim();
}
 
// ─── ANÁLISE HHI (ÍNDICE DE HERFINDAHL-HIRSCHMAN) ────────────────────────────
 
/**
 * Calcula o HHI — métrica de concentração de mercado usada pelo CADE
 * HHI < 1500: Mercado competitivo
 * 1500-2500:  Moderadamente concentrado
 * > 2500:     Altamente concentrado (suspeito)
 * > 5000:     Monopolístico (muito suspeito)
 */
export function calcularHHI(pagamentos) {
  if (!pagamentos || pagamentos.length === 0) return 0;
 
  const total = pagamentos.reduce((s, r) => s + r.vlrLiquido, 0);
  if (total === 0) return 0;
 
  const byForn = {};
  pagamentos.forEach(r => {
    const k = r.txtCNPJCPF || r.txtFornecedor;
    byForn[k] = (byForn[k] || 0) + r.vlrLiquido;
  });
 
  const hhi = Object.values(byForn).reduce((s, v) => {
    const share = v / total * 100;
    return s + share * share;
  }, 0);
 
  return {
    valor: Math.round(hhi),
    nivel: hhi < 1500 ? 'COMPETITIVO' : hhi < 2500 ? 'MODERADO' : hhi < 5000 ? 'CONCENTRADO' : 'MONOPOLÍSTICO',
    cor: hhi < 1500 ? '#34a853' : hhi < 2500 ? '#d4a03a' : '#e04545',
    topFornecedores: Object.entries(byForn)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, valor]) => ({ nome, valor, share: (valor / total * 100).toFixed(1) })),
  };
}
 
// ─── ANÁLISE DE VALORES REDONDOS ──────────────────────────────────────────────
 
/**
 * Detecta proporção anormal de valores "redondos" (múltiplos de 500 ou 1000)
 * Valores redondos > 30% são estatisticamente atípicos em notas reais
 */
export function analisarValoresRedondos(pagamentos) {
  if (!pagamentos || pagamentos.length === 0) return { pct: 0, suspeito: false };
 
  const redondos = pagamentos.filter(p => {
    const v = p.vlrLiquido;
    return v > 0 && (v % 1000 < 0.01 || v % 500 < 0.01);
  });
 
  const pct = redondos.length / pagamentos.length * 100;
 
  return {
    total: pagamentos.length,
    nRedondos: redondos.length,
    pct: parseFloat(pct.toFixed(1)),
    suspeito: pct > 30,
    muitoSuspeito: pct > 50,
    interpretacao: pct > 50
      ? `${pct.toFixed(1)}% de valores redondos — padrão extremamente atípico.`
      : pct > 30
        ? `${pct.toFixed(1)}% de valores redondos — suspeita de estimativa ao invés de nota real.`
        : `${pct.toFixed(1)}% de valores redondos — dentro do normal.`,
  };
}
 
// ─── ANÁLISE TEMPORAL ─────────────────────────────────────────────────────────
 
/**
 * Detecta padrões temporais suspeitos:
 * - Pagamentos em fim de semana
 * - Concentração em período pré-eleitoral
 * - Picos anômalos em determinados meses
 */
export function analisarPadraoTemporal(pagamentos) {
  if (!pagamentos || pagamentos.length === 0) return {};
 
  const total = pagamentos.reduce((s, r) => s + r.vlrLiquido, 0);
 
  // Fim de semana
  const fds = pagamentos.filter(p => p.diaSemana === 0 || p.diaSemana === 6);
  const pctFDS = fds.length / pagamentos.length * 100;
 
  // Por mês
  const byMes = {};
  pagamentos.forEach(p => {
    byMes[p.numMes] = (byMes[p.numMes] || 0) + p.vlrLiquido;
  });
 
  const medMensal = total / 12;
  const mesesAnomalo = Object.entries(byMes)
    .filter(([, v]) => v > medMensal * 2.5)
    .map(([mes]) => parseInt(mes));
 
  // Período eleitoral (anos eleitorais: meses 6-10)
  const anoAtual = new Date().getFullYear();
  const anoEleitoral = anoAtual % 2 === 0;
  const pagamentosPreEleitorais = anoEleitoral
    ? pagamentos.filter(p => p.numAno === anoAtual && p.numMes >= 6 && p.numMes <= 10)
    : [];
  const totalPreEleitoral = pagamentosPreEleitorais.reduce((s, r) => s + r.vlrLiquido, 0);
 
  return {
    fds: {
      count: fds.length,
      pct: parseFloat(pctFDS.toFixed(1)),
      suspeito: pctFDS > 10,
    },
    mesesAnomalo,
    periodoEleitoral: {
      suspeito: totalPreEleitoral > total * 0.4,
      total: totalPreEleitoral,
      pct: total > 0 ? (totalPreEleitoral / total * 100).toFixed(1) : 0,
    },
  };
}
 
// ─── RETORNO SOCIAL ───────────────────────────────────────────────────────────
 
/**
 * Calcula % do gasto parlamentar em relação ao PIB do município
 * para contextualizar o impacto
 */
export function calcularRetornoSocial(valorTotal, pibMunicipal) {
  if (!valorTotal || !pibMunicipal || pibMunicipal === 0) return null;
  const pib = parseFloat(pibMunicipal) * 1000; // IBGE retorna em mil reais
  return {
    pct: (valorTotal / pib * 100).toFixed(4),
    interpretacao: valorTotal > pib * 0.01
      ? 'Gasto equivale a mais de 1% do PIB municipal — impacto econômico relevante.'
      : 'Gasto abaixo de 1% do PIB municipal.',
  };
}
 
/**
 * Detecta sobrepreço comparando com a média do setor
 * threshold: 2.5x a média = 150% acima (padrão MPF)
 */
export function detectarSobrepreco(valor, mediaSetor, threshold = 2.5) {
  if (!valor || !mediaSetor || mediaSetor === 0) return { suspeito: false };
  const ratio = valor / mediaSetor;
  return {
    suspeito: ratio > threshold,
    ratio: parseFloat(ratio.toFixed(2)),
    pctAcimaDaMedia: parseFloat(((ratio - 1) * 100).toFixed(1)),
    interpretacao: ratio > threshold
      ? `Valor ${ratio.toFixed(1)}x acima da média do setor (${((ratio-1)*100).toFixed(0)}% de sobrepreço potencial).`
      : `Valor dentro da faixa normal (${ratio.toFixed(1)}x a média).`,
  };
}
 
// ─── ANÁLISE COMPLETA ─────────────────────────────────────────────────────────
 
/**
 * Roda análise completa num conjunto de pagamentos de um deputado/senador
 * e retorna todos os indicadores em um único objeto
 */
export function analisarParlamentar(pagamentos) {
  if (!pagamentos || pagamentos.length === 0) {
    return { erro: 'Sem dados para análise.' };
  }
 
  const total = pagamentos.reduce((s, r) => s + r.vlrLiquido, 0);
  const n = pagamentos.length;
 
  const benford = analiseBenford(pagamentos.map(p => p.vlrLiquido));
  const hhi = calcularHHI(pagamentos);
  const redondos = analisarValoresRedondos(pagamentos);
  const temporal = analisarPadraoTemporal(pagamentos);
  const fracionamento = detectarFracionamento(pagamentos);
 
  // Score geral
  const scoreDados = {
    benfordAlert: benford.suspeito,
    benfordChi2: benford.chi2,
    fracionamento,
    valoresRedondos: redondos.pct,
    hhi: hhi.valor,
    pagamentoFDS: temporal.fds?.suspeito,
    pctFDS: temporal.fds?.pct,
  };
 
  const score = calcularScoreSuspeicao(scoreDados);
 
  return {
    total,
    n,
    benford,
    hhi,
    redondos,
    temporal,
    fracionamento,
    score,
    alertas: [
      ...(benford.suspeito ? [{ tipo: 'LEI DE BENFORD', nivel: 'red', msg: benford.interpretacao }] : []),
      ...(hhi.valor > 2500 ? [{ tipo: 'CONCENTRAÇÃO HHI', nivel: 'red', msg: `HHI = ${hhi.valor} (${hhi.nivel})` }] : []),
      ...(redondos.suspeito ? [{ tipo: 'VALORES REDONDOS', nivel: 'amber', msg: redondos.interpretacao }] : []),
      ...(fracionamento ? [{ tipo: 'FRACIONAMENTO', nivel: 'amber', msg: 'Múltiplos pagamentos ao mesmo CNPJ no mesmo mês.' }] : []),
      ...(temporal.fds?.suspeito ? [{ tipo: 'PAGAMENTOS FDS', nivel: 'amber', msg: `${temporal.fds.pct}% dos pagamentos em fins de semana.` }] : []),
    ],
  };
}
 
