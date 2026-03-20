/**
 * Motor de Cruzamentos Investigativos — Olho de Deus v3.0
 * 50+ cruzamentos automáticos com explicação do raciocínio
 */
 
// ─── TIPOS DE CRUZAMENTO ──────────────────────────────────────────────────────
export const CATEGORIAS = {
  FINANCEIRO: { label: 'Financeiro', cor: '#e04545', icon: '💰' },
  SOCIETARIO: { label: 'Societário', cor: '#d4a03a', icon: '🏢' },
  TEMPORAL: { label: 'Temporal', cor: '#9b59b6', icon: '⏱' },
  GEOGRAFICO: { label: 'Geográfico', cor: '#4682b4', icon: '📍' },
  POLITICO: { label: 'Político', cor: '#e67e22', icon: '🗳' },
  JUDICIAL: { label: 'Judicial', cor: '#e04545', icon: '⚖' },
  PATRIMONIAL: { label: 'Patrimonial', cor: '#d4a03a', icon: '🏛' },
  ESTATISTICO: { label: 'Estatístico', cor: '#3d9996', icon: '📊' },
  REDE: { label: 'Rede', cor: '#9b59b6', icon: '🕸' },
};
 
export const NIVEIS = {
  CRITICO: { label: 'CRÍTICO', cor: '#e04545', peso: 4 },
  ALTO: { label: 'ALTO', cor: '#e04545', peso: 3 },
  MEDIO: { label: 'MÉDIO', cor: '#d4a03a', peso: 2 },
  BAIXO: { label: 'BAIXO', cor: '#34a853', peso: 1 },
  LIMPO: { label: 'LIMPO', cor: '#34a853', peso: 0 },
};
 
// ─── EXECUTOR DE CRUZAMENTOS ──────────────────────────────────────────────────
 
export function executarCruzamentos(ceapRows, dados) {
  const resultados = [];
 
  const add = (cruzamento) => {
    if (cruzamento) resultados.push(cruzamento);
  };
 
  // ══════════════════════════════════════════════════════
  //  BLOCO 1 — FINANCEIRO (gastos CEAP)
  // ══════════════════════════════════════════════════════
 
  add(cruzamento_01_financiadoresVsFornecedores(ceapRows, dados));
  add(cruzamento_02_emendasVsFornecedores(ceapRows, dados));
  add(cruzamento_03_patrimonioVsGastos(ceapRows, dados));
  add(cruzamento_04_crescimentoPatrimonial(dados));
  add(cruzamento_05_benford(ceapRows));
  add(cruzamento_06_valoresRedondos(ceapRows));
  add(cruzamento_07_hhiConcentracao(ceapRows));
  add(cruzamento_08_fracionamento(ceapRows));
  add(cruzamento_09_sobrepreco(ceapRows));
  add(cruzamento_10_mediaAcimaMercado(ceapRows));
 
  // ══════════════════════════════════════════════════════
  //  BLOCO 2 — SOCIETÁRIO (empresas)
  // ══════════════════════════════════════════════════════
 
  add(cruzamento_11_empresaLaranja(ceapRows, dados));
  add(cruzamento_12_socioParlamentar(ceapRows, dados));
  add(cruzamento_13_empresaSemFuncionarios(ceapRows, dados));
  add(cruzamento_14_capitalSocialIncompativel(ceapRows, dados));
  add(cruzamento_15_empresaInidoneaCGU(ceapRows, dados));
  add(cruzamento_16_empresaPunidaCNEP(ceapRows, dados));
  add(cruzamento_17_empresaIrregularTCU(ceapRows, dados));
  add(cruzamento_18_enderecoCompartilhado(ceapRows, dados));
  add(cruzamento_19_cnpjInexistente(ceapRows, dados));
  add(cruzamento_20_razaoSocialSuspeita(ceapRows));
 
  // ══════════════════════════════════════════════════════
  //  BLOCO 3 — TEMPORAL
  // ══════════════════════════════════════════════════════
 
  add(cruzamento_21_pagamentoFimDeSemana(ceapRows));
  add(cruzamento_22_pagamentoFeriado(ceapRows));
  add(cruzamento_23_concentracaoPreEleitoral(ceapRows));
  add(cruzamento_24_picoAnomalo(ceapRows));
  add(cruzamento_25_sequenciaRapida(ceapRows));
  add(cruzamento_26_dataEmissaoFutura(ceapRows));
  add(cruzamento_27_notasSemDia(ceapRows));
  add(cruzamento_28_mesmoFornecedorMesmoDia(ceapRows));
 
  // ══════════════════════════════════════════════════════
  //  BLOCO 4 — GEOGRÁFICO
  // ══════════════════════════════════════════════════════
 
  add(cruzamento_29_fornecedorForaUF(ceapRows, dados));
  add(cruzamento_30_emendasForaBaseEleitoral(ceapRows, dados));
  add(cruzamento_31_gastosForaCapital(ceapRows, dados));
  add(cruzamento_32_municipioFornecedor(ceapRows, dados));
 
  // ══════════════════════════════════════════════════════
  //  BLOCO 5 — POLÍTICO
  // ══════════════════════════════════════════════════════
 
  add(cruzamento_33_emendasExcessivas(dados));
  add(cruzamento_34_doacaoRetribuida(ceapRows, dados));
  add(cruzamento_35_fornecedorPoliticamentExposto(ceapRows, dados));
  add(cruzamento_36_gastoPorPartido(ceapRows, dados));
  add(cruzamento_37_emendasConcentradas(dados));
  add(cruzamento_38_viragensExcessivas(dados));
 
  // ══════════════════════════════════════════════════════
  //  BLOCO 6 — JUDICIAL / CADASTRAL
  // ══════════════════════════════════════════════════════
 
  add(cruzamento_39_mandadoPrisao(dados));
  add(cruzamento_40_contasIrregularesTCU(dados));
  add(cruzamento_41_mencaoNoticias(dados));
  add(cruzamento_42_mencaoDOU(dados));
  add(cruzamento_43_aeronaveDeclarada(dados));
 
  // ══════════════════════════════════════════════════════
  //  BLOCO 7 — ESTATÍSTICO / REDE
  // ══════════════════════════════════════════════════════
 
  add(cruzamento_44_redeFornecedores(ceapRows, dados));
  add(cruzamento_45_fornecedorMultiplosDeputados(ceapRows, dados));
  add(cruzamento_46_evolucaoGastosAnual(ceapRows));
  add(cruzamento_47_categoriaIncompativel(ceapRows, dados));
  add(cruzamento_48_notasSemCNPJ(ceapRows));
  add(cruzamento_49_valorMaximoCota(ceapRows));
  add(cruzamento_50_distribuicaoCategoriasAnomala(ceapRows));
 
  // Ordena por nível de suspeição (crítico primeiro)
  const ordem = { CRITICO: 0, ALTO: 1, MEDIO: 2, BAIXO: 3, LIMPO: 4 };
  resultados.sort((a, b) => (ordem[a.nivel] ?? 9) - (ordem[b.nivel] ?? 9));
 
  // Calcula score total
  const scoreTotal = resultados.reduce((s, r) => s + (NIVEIS[r.nivel]?.peso || 0), 0);
  const maxScore = resultados.length * 4;
  const scorePct = maxScore > 0 ? Math.min(100, Math.round(scoreTotal / maxScore * 100 * 2)) : 0;
 
  return {
    resultados,
    total: resultados.length,
    criticos: resultados.filter(r => r.nivel === 'CRITICO').length,
    altos: resultados.filter(r => r.nivel === 'ALTO').length,
    medios: resultados.filter(r => r.nivel === 'MEDIO').length,
    limpos: resultados.filter(r => r.nivel === 'LIMPO').length,
    score: scorePct,
  };
}
 
// ══════════════════════════════════════════════════════════════════════════════
//  IMPLEMENTAÇÃO DOS 50 CRUZAMENTOS
// ══════════════════════════════════════════════════════════════════════════════
 
// ── BLOCO 1: FINANCEIRO ───────────────────────────────────────────────────────
 
function cruzamento_01_financiadoresVsFornecedores(ceapRows, dados) {
  const financiadores = dados.financiadores || [];
  const fornecedores = new Set(ceapRows.map(r => normalizar(r.txtFornecedor)));
  const doadoresNomes = financiadores.map(f => normalizar(f.nomeDoador || ''));
  const matches = doadoresNomes.filter(d => d && [...fornecedores].some(f => f.includes(d) || d.includes(f)));
 
  return {
    id: 'C01',
    categoria: 'POLITICO',
    titulo: 'Financiadores de campanha = Fornecedores da CEAP',
    nivel: matches.length > 0 ? 'CRITICO' : 'LIMPO',
    encontrou: matches.length > 0,
    evidencias: matches.slice(0, 5),
    explicacao: 'Doadores de campanha que também recebem dinheiro via cota parlamentar configuram conflito de interesse grave. O parlamentar financia sua própria eleição com quem depois paga com verba pública.',
    metodologia: 'Cruzamento entre nomes de doadores declarados ao TSE (prestação de contas eleitoral) e nomes de fornecedores pagos pela CEAP. Similaridade de string com normalização de acentos e LTDA/SA.',
    base_legal: 'Art. 14 da Res. TSE 23.607/2019 — conflito de interesse em financiamento eleitoral.',
    impacto: matches.length > 0 ? `${matches.length} doador(es) de campanha também receberam via CEAP` : 'Nenhum cruzamento encontrado',
  };
}
 
function cruzamento_02_emendasVsFornecedores(ceapRows, dados) {
  const emendas = dados.emendas?.lista || [];
  const fornCEAP = new Set(ceapRows.map(r => normalizar(r.txtFornecedor)));
  const execEmendas = emendas.map(e => normalizar(e.beneficiario?.nome || ''));
  const matches = execEmendas.filter(e => e && [...fornCEAP].some(f => f.includes(e.split(' ')[0]) || e.includes(f.split(' ')[0])));
 
  return {
    id: 'C02',
    categoria: 'POLITICO',
    titulo: 'Executores de emendas = Fornecedores da CEAP',
    nivel: matches.length > 0 ? 'CRITICO' : 'LIMPO',
    encontrou: matches.length > 0,
    evidencias: matches.slice(0, 5),
    explicacao: 'Quando a mesma empresa recebe emendas parlamentares E pagamentos da cota do parlamentar, o círculo de beneficiários é suspeito. A empresa pode estar "capturada" pelo parlamentar para desvio em múltiplas frentes.',
    metodologia: 'Cruzamento entre beneficiários de emendas (Portal da Transparência/CGU) e fornecedores pagos pela CEAP no mesmo período.',
    base_legal: 'Lei 13.019/2014 — Art. 84: vedação de conflito de interesses em parcerias com ONGs e empresas.',
    impacto: matches.length > 0 ? `${matches.length} empresa(s) recebem emendas E cota do mesmo parlamentar` : 'Nenhum cruzamento encontrado',
  };
}
 
function cruzamento_03_patrimonioVsGastos(ceapRows, dados) {
  const totalCEAP = ceapRows.reduce((s, r) => s + r.vlrLiquido, 0);
  const totalBens = (dados.bens || []).reduce((s, b) => s + (b.valor || 0), 0);
  const ratio = totalBens > 0 ? totalCEAP / totalBens : 0;
  const suspeito = ratio > 0.5 && totalBens > 0;
 
  return {
    id: 'C03',
    categoria: 'PATRIMONIAL',
    titulo: 'Gastos CEAP acima de 50% do patrimônio declarado',
    nivel: ratio > 1 ? 'ALTO' : ratio > 0.5 ? 'MEDIO' : 'LIMPO',
    encontrou: suspeito,
    evidencias: suspeito ? [`CEAP: R$ ${(totalCEAP/1e3).toFixed(0)}K | Patrimônio: R$ ${(totalBens/1e3).toFixed(0)}K | Ratio: ${(ratio*100).toFixed(1)}%`] : [],
    explicacao: 'O patrimônio declarado ao TSE é um proxy da situação financeira. Quando os gastos com a cota superam metade do patrimônio total, levanta questão sobre a proporcionalidade e necessidade das despesas.',
    metodologia: 'Razão entre total de despesas CEAP no período e patrimônio total declarado na última eleição (TSE/DivulgaCandContas).',
    base_legal: 'Res. Câmara 55/2009 — uso da CEAP deve ser para atividade parlamentar, não pessoal.',
    impacto: totalBens > 0 ? `Gastos CEAP = ${(ratio*100).toFixed(1)}% do patrimônio declarado` : 'Patrimônio TSE não disponível para cruzamento',
  };
}
 
function cruzamento_04_crescimentoPatrimonial(dados) {
  const evolucao = dados.evolucaoPatrimonial || [];
  if (evolucao.length < 2) return {
    id: 'C04', categoria: 'PATRIMONIAL',
    titulo: 'Crescimento patrimonial incompatível com mandato',
    nivel: 'LIMPO', encontrou: false, evidencias: [],
    explicacao: 'Compara a evolução do patrimônio entre eleições. Um deputado federal ganha ~R$280K/ano bruto. Crescimento acima de 3x esse valor em um mandato merece explicação.',
    metodologia: 'Comparação do patrimônio declarado ao TSE em eleições consecutivas (2018, 2022).',
    base_legal: 'Lei 8.429/1992 (Improbidade) — Art. 9º: enriquecimento ilícito.',
    impacto: 'Dados históricos de patrimônio TSE insuficientes',
  };
 
  const primeiro = evolucao[0]?.total || 0;
  const ultimo = evolucao[evolucao.length - 1]?.total || 0;
  const crescimento = primeiro > 0 ? (ultimo / primeiro - 1) * 100 : 0;
  const anosM = evolucao.length * 4;
  const esperado = anosM * 280000 * 0.3; // 30% da renda como poupança esperada
  const suspeito = ultimo > primeiro + esperado && crescimento > 200;
 
  return {
    id: 'C04',
    categoria: 'PATRIMONIAL',
    titulo: 'Crescimento patrimonial incompatível com mandato',
    nivel: crescimento > 500 ? 'CRITICO' : crescimento > 200 ? 'ALTO' : crescimento > 100 ? 'MEDIO' : 'LIMPO',
    encontrou: suspeito,
    evidencias: evolucao.map(e => `${e.ano}: R$ ${(e.total/1e3).toFixed(0)}K`),
    explicacao: 'Um parlamentar federal ganha ~R$33.763/mês bruto (R$280K/ano). Descontados impostos e custos de vida, a poupança esperada em 4 anos é de ~R$300-500K. Crescimentos muito acima disso precisam de explicação.',
    metodologia: 'Comparação de patrimônio declarado ao TSE em eleições consecutivas, controlando pela renda esperada do cargo.',
    base_legal: 'Lei 8.429/1992 — Art. 9º: enriquecimento ilícito incompatível com a evolução patrimonial.',
    impacto: `Patrimônio cresceu ${crescimento.toFixed(0)}% entre ${evolucao[0]?.ano} e ${evolucao[evolucao.length-1]?.ano}`,
  };
}
 
function cruzamento_05_benford(ceapRows) {
  if (ceapRows.length < 30) return {
    id: 'C05', categoria: 'ESTATISTICO',
    titulo: 'Lei de Benford — distribuição dos primeiros dígitos',
    nivel: 'LIMPO', encontrou: false, evidencias: [],
    explicacao: 'A Lei de Benford prevê que em conjuntos naturais de dados financeiros, cerca de 30% dos valores começam com dígito 1, 17% com 2, etc. Desvios significativos indicam manipulação.',
    metodologia: 'Teste qui-quadrado com 8 graus de liberdade. Valor crítico p<0.05 é χ²=15.51.',
    base_legal: 'Usada pelo IRSM (IRS americano), TCU e Receita Federal em auditorias forenses.',
    impacto: 'Amostra insuficiente (mínimo 30 transações)',
  };
 
  const valores = ceapRows.map(r => r.vlrLiquido).filter(v => v > 0);
  const primeiros = valores.map(v => parseInt(String(v).replace(/\D/g,'').replace(/^0+/,'')[0])).filter(Boolean);
  const n = primeiros.length;
  const BENFORD = Array.from({length:9}, (_,i) => Math.log10(1 + 1/(i+1)));
  const obs = Array.from({length:9}, (_,i) => primeiros.filter(d => d===i+1).length);
  const chi2 = obs.reduce((s,o,i) => { const e = BENFORD[i]*n; return s + Math.pow(o-e,2)/e; }, 0);
  const suspeito = chi2 > 15.51;
  const muitoSuspeito = chi2 > 20.09;
 
  const distrib = obs.map((o,i) => `D${i+1}: ${o} obs vs ${Math.round(BENFORD[i]*n)} esp (${(BENFORD[i]*100).toFixed(1)}%)`);
 
  return {
    id: 'C05',
    categoria: 'ESTATISTICO',
    titulo: 'Lei de Benford — distribuição dos primeiros dígitos',
    nivel: muitoSuspeito ? 'CRITICO' : suspeito ? 'ALTO' : 'LIMPO',
    encontrou: suspeito,
    evidencias: suspeito ? [`χ² = ${chi2.toFixed(2)} (crítico: 15.51)`, ...distrib.slice(0,4)] : [`χ² = ${chi2.toFixed(2)} — normal`],
    explicacao: 'A Lei de Benford é usada por auditores forenses para detectar fraude em notas fiscais. Quando alguém inventa valores, tende a distribuí-los de forma "aleatória", mas isso quebra o padrão logarítmico natural dos dados reais.',
    metodologia: `Teste qui-quadrado aplicado em ${n} valores. χ²=${chi2.toFixed(2)}. Limite p<0.05 = 15.51, limite p<0.01 = 20.09.`,
    base_legal: 'TCU — Técnica de auditoria forense (Benford\'s Law). Acórdão 1.367/2011.',
    impacto: suspeito ? `Distribuição estatisticamente anômala (χ²=${chi2.toFixed(1)})` : 'Distribuição dentro do padrão natural',
  };
}
 
function cruzamento_06_valoresRedondos(ceapRows) {
  const n = ceapRows.length;
  const redondos = ceapRows.filter(r => r.vlrLiquido % 1000 < 0.01 || r.vlrLiquido % 500 < 0.01);
  const pct = n > 0 ? redondos.length / n * 100 : 0;
  const nivel = pct > 50 ? 'CRITICO' : pct > 30 ? 'ALTO' : pct > 15 ? 'MEDIO' : 'LIMPO';
 
  return {
    id: 'C06',
    categoria: 'ESTATISTICO',
    titulo: `Valores redondos suspeitos (${pct.toFixed(1)}% dos gastos)`,
    nivel,
    encontrou: pct > 15,
    evidencias: redondos.slice(0,5).map(r => `${r.txtFornecedor?.slice(0,30)} — R$ ${r.vlrLiquido.toLocaleString('pt-BR')}`),
    explicacao: 'Notas fiscais reais têm valores com centavos e variação natural. Quando a maioria dos valores é múltiplo exato de R$500 ou R$1.000, sugere que os valores foram "estimados" ou "combinados" previamente, não refletem serviços reais.',
    metodologia: 'Proporção de transações onde vlrLiquido % 1000 < 0.01 ou vlrLiquido % 500 < 0.01.',
    base_legal: 'CGU — Critério de sinalização em auditorias da cota parlamentar.',
    impacto: `${redondos.length} de ${n} transações são múltiplos exatos de R$500/1000`,
  };
}
 
function cruzamento_07_hhiConcentracao(ceapRows) {
  const total = ceapRows.reduce((s,r) => s+r.vlrLiquido, 0);
  if (total === 0) return null;
  const byForn = {};
  ceapRows.forEach(r => { byForn[r.txtFornecedor] = (byForn[r.txtFornecedor]||0)+r.vlrLiquido; });
  const top = Object.entries(byForn).sort((a,b)=>b[1]-a[1]);
  const hhi = top.reduce((s,[,v]) => s + Math.pow(v/total*100,2), 0);
  const nivel = hhi > 5000 ? 'CRITICO' : hhi > 2500 ? 'ALTO' : hhi > 1500 ? 'MEDIO' : 'LIMPO';
  const topShare = top[0] ? (top[0][1]/total*100).toFixed(1) : 0;
 
  return {
    id: 'C07',
    categoria: 'FINANCEIRO',
    titulo: `Concentração HHI = ${Math.round(hhi)} (${nivel})`,
    nivel,
    encontrou: hhi > 1500,
    evidencias: top.slice(0,5).map(([n,v]) => `${n.slice(0,35)}: ${(v/total*100).toFixed(1)}%`),
    explicacao: 'O Índice Herfindahl-Hirschman (HHI) é a mesma métrica usada pelo CADE para medir monopólios. Em cotass parlamentares, HHI > 2500 indica que poucos fornecedores dominam os gastos — típico de esquemas de direcionamento.',
    metodologia: `HHI = Σ(participação_i²). Escala: <1500 competitivo, 1500-2500 moderado, >2500 concentrado, >5000 monopolístico. Fornecedor principal: ${topShare}% dos gastos.`,
    base_legal: 'CADE — Guia de Análise de Concentrações Horizontais (2016).',
    impacto: top[0] ? `"${top[0][0].slice(0,40)}" concentra ${topShare}% de todos os gastos` : '',
  };
}
 
function cruzamento_08_fracionamento(ceapRows) {
  const grupos = {};
  ceapRows.forEach(r => {
    const k = `${r.txtCNPJCPF}-${r.numAno}-${r.numMes}`;
    if (!grupos[k]) grupos[k] = { cnpj: r.txtCNPJCPF, nome: r.txtFornecedor, ano: r.numAno, mes: r.numMes, n: 0, total: 0 };
    grupos[k].n++; grupos[k].total += r.vlrLiquido;
  });
  const suspeitos = Object.values(grupos).filter(g => g.n >= 3 || (g.n >= 2 && g.total > 15000));
  const nivel = suspeitos.length > 5 ? 'CRITICO' : suspeitos.length > 2 ? 'ALTO' : suspeitos.length > 0 ? 'MEDIO' : 'LIMPO';
 
  return {
    id: 'C08',
    categoria: 'FINANCEIRO',
    titulo: 'Potencial fracionamento de despesas',
    nivel,
    encontrou: suspeitos.length > 0,
    evidencias: suspeitos.slice(0,5).map(g => `${g.nome?.slice(0,30)} — ${g.n}x em ${g.mes}/${g.ano} = R$ ${(g.total/1e3).toFixed(0)}K`),
    explicacao: 'Fracionamento é dividir uma despesa grande em parcelas menores para fugir de licitação. Na cota parlamentar, múltiplos pagamentos ao mesmo CNPJ no mesmo mês para o mesmo tipo de serviço é padrão clássico de irregularidade.',
    metodologia: 'Agrupa pagamentos por CNPJ + mês + ano. Sinaliza grupos com ≥3 pagamentos ou ≥2 pagamentos totalizando >R$15.000 (limite de dispensa de licitação para serviços).',
    base_legal: 'Lei 8.666/1993 Art. 23 §5º — vedação ao fracionamento. Lei 14.133/2021 Art. 145.',
    impacto: suspeitos.length > 0 ? `${suspeitos.length} situação(ões) de possível fracionamento detectada(s)` : 'Nenhum fracionamento detectado',
  };
}
 
function cruzamento_09_sobrepreco(ceapRows) {
  const MEDIAS_MERCADO = {
    'PASSAGENS AÉREAS': 800,
    'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS': 3000,
    'COMBUSTÍVEIS E LUBRIFICANTES': 300,
    'HOSPEDAGEM': 500,
    'ALIMENTAÇÃO': 200,
    'TELEFONIA': 150,
    'SERVIÇOS POSTAIS': 50,
  };
  const suspeitos = [];
  ceapRows.forEach(r => {
    const media = MEDIAS_MERCADO[r.txtDescricao];
    if (media && r.vlrLiquido > media * 3) {
      suspeitos.push({ ...r, media, ratio: (r.vlrLiquido/media).toFixed(1) });
    }
  });
  const nivel = suspeitos.length > 10 ? 'ALTO' : suspeitos.length > 3 ? 'MEDIO' : suspeitos.length > 0 ? 'BAIXO' : 'LIMPO';
 
  return {
    id: 'C09',
    categoria: 'FINANCEIRO',
    titulo: 'Sobrepreço em categorias com referência de mercado',
    nivel,
    encontrou: suspeitos.length > 0,
    evidencias: suspeitos.slice(0,5).map(r => `${r.txtDescricao}: R$${r.vlrLiquido.toLocaleString('pt-BR')} (${r.ratio}x a média de R$${r.media})`),
    explicacao: 'Para categorias com valor médio de mercado conhecido, transações acima de 3x a média indicam sobrepreço. Isso pode refletir serviços superfaturados ou notas fictícias.',
    metodologia: 'Compara valor da transação com médias de mercado definidas por categoria. Threshold: valor > 3x média de mercado.',
    base_legal: 'Súmula TCU 254 — sobrepreço é ilicitude em contratação pública.',
    impacto: suspeitos.length > 0 ? `${suspeitos.length} transação(ões) com valores 3x acima da média de mercado` : 'Valores dentro do padrão de mercado',
  };
}
 
function cruzamento_10_mediaAcimaMercado(ceapRows) {
  const total = ceapRows.reduce((s,r)=>s+r.vlrLiquido,0);
  const mediaGeral = total / (ceapRows.length || 1);
  const LIMITE_RAZOAVEL = 2500;
  const alto = mediaGeral > LIMITE_RAZOAVEL;
 
  return {
    id: 'C10',
    categoria: 'FINANCEIRO',
    titulo: `Média por nota R$${mediaGeral.toFixed(0)} — ${alto ? 'acima do esperado' : 'dentro do padrão'}`,
    nivel: mediaGeral > 8000 ? 'ALTO' : mediaGeral > 4000 ? 'MEDIO' : 'LIMPO',
    encontrou: alto,
    evidencias: alto ? [`Média: R$${mediaGeral.toFixed(0)} | Referência: R$${LIMITE_RAZOAVEL} | ${(mediaGeral/LIMITE_RAZOAVEL).toFixed(1)}x acima`] : [],
    explicacao: 'A média histórica de gasto por nota dos parlamentares fica entre R$800 e R$2.500. Médias muito acima disso podem indicar concentração em serviços de alto valor sem contrapartida real.',
    metodologia: `Total CEAP / número de transações = R$${mediaGeral.toFixed(0)} por nota.`,
    base_legal: 'Resolução Câmara 55/2009 — razoabilidade e proporcionalidade dos gastos.',
    impacto: `Média de R$${mediaGeral.toFixed(0)} por nota fiscal`,
  };
}
 
// ── BLOCO 2: SOCIETÁRIO ───────────────────────────────────────────────────────
 
function cruzamento_11_empresaLaranja(ceapRows, dados) {
  const laranjas = (dados.fornecedores || []).filter(f => f.ehLaranja);
  const totalLaranja = laranjas.reduce((s, f) => s + f.total, 0);
  const total = ceapRows.reduce((s,r)=>s+r.vlrLiquido,0);
 
  return {
    id: 'C11',
    categoria: 'SOCIETARIO',
    titulo: 'Empresas abertas menos de 6 meses antes dos pagamentos',
    nivel: laranjas.length > 0 ? 'CRITICO' : 'LIMPO',
    encontrou: laranjas.length > 0,
    evidencias: laranjas.map(f => `${f.nome?.slice(0,35)} | Aberta: ${f.info?.data_inicio_atividade || f.info?.abertura} | Recebeu: R$${(f.total/1e3).toFixed(0)}K`),
    explicacao: 'Empresas abertas poucos meses antes de começarem a receber do parlamentar são o padrão clássico de "empresa laranja". Não têm histórico, experiência nem estrutura para prestar os serviços que alegam.',
    metodologia: 'Compara data de abertura (Receita Federal/BrasilAPI) com data da primeira nota fiscal paga pelo parlamentar. Threshold: < 6 meses.',
    base_legal: 'CGU — Metodologia de detecção de empresa de fachada (2020).',
    impacto: laranjas.length > 0 ? `${laranjas.length} fornecedor(es) potencialmente laranja, totalizando R$${(totalLaranja/1e3).toFixed(0)}K (${(totalLaranja/total*100).toFixed(1)}% dos gastos)` : 'Nenhuma empresa laranja detectada',
  };
}
 
function cruzamento_12_socioParlamentar(ceapRows, dados) {
  const fornecedores = dados.fornecedores || [];
  const nomeParlamentar = dados.camara?.detalhes?.nomeCivil || '';
  const matches = fornecedores.filter(f => {
    const qsa = f.info?.qsa || f.info?.socios || [];
    return qsa.some(s => {
      const nomeSocio = normalizar(s.nome || s.nome_socio || '');
      const nomePartes = normalizar(nomeParlamentar).split(' ').filter(p => p.length > 3);
      return nomePartes.filter(p => nomeSocio.includes(p)).length >= 2;
    });
  });
 
  return {
    id: 'C12',
    categoria: 'SOCIETARIO',
    titulo: 'Parlamentar identificado como sócio de fornecedor',
    nivel: matches.length > 0 ? 'CRITICO' : 'LIMPO',
    encontrou: matches.length > 0,
    evidencias: matches.map(f => `${f.nome?.slice(0,35)} — CNPJ: ${f.cnpj}`),
    explicacao: 'Se o parlamentar é sócio (QSA) de uma empresa que ele mesmo paga com a cota parlamentar, isso é conflito de interesse direto e possivelmente crime de peculato. O dinheiro público volta para o próprio político.',
    metodologia: 'Cruza nome civil do parlamentar (Câmara/TSE) com Quadro Societário (BrasilAPI/Receita) dos top fornecedores.',
    base_legal: 'Lei 8.429/1992 Art. 9º — enriquecimento ilícito. Código Penal Art. 312 — peculato.',
    impacto: matches.length > 0 ? `⚠️ GRAVÍSSIMO: ${matches.length} fornecedor(es) com parlamentar no QSA` : 'Parlamentar não identificado como sócio',
  };
}
 
function cruzamento_13_empresaSemFuncionarios(ceapRows, dados) {
  const semFuncionarios = (dados.fornecedores || []).filter(f =>
    f.info && (f.info.porte === 'MEI' || f.info.porte === 'MICRO') && f.total > 100000
  );
 
  return {
    id: 'C13',
    categoria: 'SOCIETARIO',
    titulo: 'Microempresas/MEI com volume alto de recebimentos',
    nivel: semFuncionarios.length > 0 ? 'ALTO' : 'LIMPO',
    encontrou: semFuncionarios.length > 0,
    evidencias: semFuncionarios.map(f => `${f.nome?.slice(0,35)} (${f.info.porte}) — R$${(f.total/1e3).toFixed(0)}K`),
    explicacao: 'MEIs têm limite de faturamento de R$81K/ano e não podem ter funcionários. Receber R$100K+ de um parlamentar pode violar o limite legal do MEI e sugere empresa de fachada.',
    metodologia: 'Filtra fornecedores com porte MEI/MICRO (BrasilAPI) que receberam >R$100K no período.',
    base_legal: 'LC 123/2006 Art. 18-A — limite de faturamento MEI. Resolução Câmara 55/2009.',
    impacto: semFuncionarios.length > 0 ? `${semFuncionarios.length} MEI/micro recebeu volume incompatível com seu porte` : 'Nenhuma inconsistência detectada',
  };
}
 
function cruzamento_14_capitalSocialIncompativel(ceapRows, dados) {
  const incompativeis = (dados.fornecedores || []).filter(f => {
    const capital = parseFloat(f.info?.capital_social || '0');
    return capital > 0 && capital < 1000 && f.total > 50000;
  });
 
  return {
    id: 'C14',
    categoria: 'SOCIETARIO',
    titulo: 'Capital social mínimo vs volume de contratos recebidos',
    nivel: incompativeis.length > 0 ? 'ALTO' : 'LIMPO',
    encontrou: incompativeis.length > 0,
    evidencias: incompativeis.map(f => `${f.nome?.slice(0,30)} — Capital: R$${f.info?.capital_social} | Recebeu: R$${(f.total/1e3).toFixed(0)}K`),
    explicacao: 'Empresas com capital social de R$100 ou R$1 que recebem dezenas de milhares de reais são estruturalmente incapazes de prestar serviços de valor equivalente. O capital social indica a "capacidade" da empresa.',
    metodologia: 'Compara capital_social da Receita Federal com total recebido via CEAP.',
    base_legal: 'CC Art. 1.052 — responsabilidade proporcional ao capital. RIR/2018 — adequação do capital.',
    impacto: incompativeis.length > 0 ? `${incompativeis.length} empresa(s) com capital social irrisório receberam valores elevados` : 'Capital social compatível com volume recebido',
  };
}
 
function cruzamento_15_empresaInidoneaCGU(ceapRows, dados) {
  const sancionados = (dados.fornecedores || []).filter(f => f.sancoes?.temSancao);
  const totalSancionado = sancionados.reduce((s,f) => s + f.total, 0);
  const total = ceapRows.reduce((s,r)=>s+r.vlrLiquido,0);
 
  return {
    id: 'C15',
    categoria: 'JUDICIAL',
    titulo: 'Pagamentos para empresas no CEIS (inidôneas CGU)',
    nivel: sancionados.length > 0 ? 'CRITICO' : 'LIMPO',
    encontrou: sancionados.length > 0,
    evidencias: sancionados.map(f => `${f.nome?.slice(0,35)} — ${f.sancoes.resumo}`),
    explicacao: 'O CEIS (Cadastro de Empresas Inidôneas) lista empresas que foram punidas por irregularidades em contratos públicos. Pagar com dinheiro público para empresa que está no CEIS é vedado por lei.',
    metodologia: 'Cruzamento CNPJ dos fornecedores com o CEIS via API da CGU.',
    base_legal: 'Lei 12.846/2013 (Anticorrupção) Art. 23 — CEIS. Lei 8.666 Art. 6 — inidoneidade.',
    impacto: sancionados.length > 0 ? `R$${(totalSancionado/1e3).toFixed(0)}K pagos a empresas inidôneas (${(totalSancionado/total*100).toFixed(1)}% dos gastos)` : 'Nenhum fornecedor no CEIS',
  };
}
 
function cruzamento_16_empresaPunidaCNEP(ceapRows, dados) {
  // Usando dados do CNEP se disponíveis
  const punidos = (dados.fornecedores || []).filter(f => f.cnep?.temSancao);
 
  return {
    id: 'C16',
    categoria: 'JUDICIAL',
    titulo: 'Fornecedores no CNEP (empresas punidas)',
    nivel: punidos.length > 0 ? 'CRITICO' : 'LIMPO',
    encontrou: punidos.length > 0,
    evidencias: punidos.map(f => `${f.nome?.slice(0,35)} — ${f.cnep?.resumo}`),
    explicacao: 'O CNEP (Cadastro Nacional de Empresas Punidas) registra empresas que receberam sanções administrativas no âmbito da Lei Anticorrupção. Qualquer contratação com essas empresas é vedada.',
    metodologia: 'Cruzamento CNPJ com CNEP via API da CGU.',
    base_legal: 'Lei 12.846/2013 Art. 22 — CNEP.',
    impacto: punidos.length > 0 ? `${punidos.length} fornecedor(es) no CNEP` : 'Nenhum fornecedor no CNEP',
  };
}
 
function cruzamento_17_empresaIrregularTCU(ceapRows, dados) {
  const tcu = dados.tcu;
  return {
    id: 'C17',
    categoria: 'JUDICIAL',
    titulo: 'Parlamentar com contas irregulares no TCU',
    nivel: tcu?.irregular ? 'CRITICO' : 'LIMPO',
    encontrou: tcu?.irregular || false,
    evidencias: tcu?.irregular ? [`${tcu.total} processo(s) — ${tcu.resumo}`] : [],
    explicacao: 'O TCU julga contas de gestores públicos. Contas julgadas irregulares indicam desvio, superfaturamento ou irregularidade comprovada em gestão de recursos públicos.',
    metodologia: 'Consulta ao portal "contasirregulares.tcu.gov.br" por CPF/nome.',
    base_legal: 'Lei 8.443/1992 (Lei Orgânica do TCU) Art. 16 — julgamento de contas.',
    impacto: tcu?.irregular ? `Contas irregulares no TCU: ${tcu.total} processo(s)` : 'Nenhuma irregularidade no TCU',
  };
}
 
function cruzamento_18_enderecoCompartilhado(ceapRows, dados) {
  const fornecedores = dados.fornecedores || [];
  const enderecos = fornecedores.map(f => f.info?.logradouro?.toLowerCase() + '-' + f.info?.municipio?.toLowerCase()).filter(Boolean);
  const duplicados = enderecos.filter((e, i) => enderecos.indexOf(e) !== i);
 
  return {
    id: 'C18',
    categoria: 'SOCIETARIO',
    titulo: 'Múltiplos fornecedores no mesmo endereço',
    nivel: duplicados.length > 0 ? 'ALTO' : 'LIMPO',
    encontrou: duplicados.length > 0,
    evidencias: duplicados.slice(0,3).map(e => `Endereço compartilhado: ${e}`),
    explicacao: 'Diferentes empresas que recebem do mesmo parlamentar registradas no mesmo endereço físico sugerem um esquema de empresas de fachada. Endereços de "coworking" com dezenas de CNPJs são red flags.',
    metodologia: 'Agrupa fornecedores por logradouro + município (Receita Federal). Identifica coincidências.',
    base_legal: 'IN RFB 1.863/2018 — endereço nos atos constitutivos.',
    impacto: duplicados.length > 0 ? `${duplicados.length} endereço(s) compartilhado(s) entre fornecedores` : 'Endereços distintos',
  };
}
 
function cruzamento_19_cnpjInexistente(ceapRows, dados) {
  const comErro = (dados.fornecedores || []).filter(f => f.cnpj && !f.info && f.total > 5000);
  return {
    id: 'C19',
    categoria: 'SOCIETARIO',
    titulo: 'CNPJs sem cadastro ativo na Receita Federal',
    nivel: comErro.length > 0 ? 'ALTO' : 'LIMPO',
    encontrou: comErro.length > 0,
    evidencias: comErro.map(f => `CNPJ ${f.cnpj} — R$${(f.total/1e3).toFixed(0)}K recebidos`),
    explicacao: 'Pagamentos para CNPJs que não retornam dados na Receita Federal podem indicar CNPJ inválido, empresa encerrada ou nunca existente — todos cenários graves para uso de verba pública.',
    metodologia: 'Verifica CNPJs dos fornecedores na BrasilAPI/ReceitaWS. Ausência de dados = CNPJ sem cadastro ativo.',
    base_legal: 'IN RFB 1.863/2018 — regularidade cadastral.',
    impacto: comErro.length > 0 ? `${comErro.length} CNPJ(s) sem cadastro verificável` : 'Todos os CNPJs verificados',
  };
}
 
function cruzamento_20_razaoSocialSuspeita(ceapRows) {
  const termosSuspeitos = ['PUBLICIDADE', 'COMUNICAÇÃO', 'CONSULTORIA', 'ASSESSORIA', 'SERVIÇOS GERAIS', 'SOLUÇÕES'];
  const suspeitos = [];
  const byForn = {};
  ceapRows.forEach(r => { byForn[r.txtFornecedor] = (byForn[r.txtFornecedor]||0)+r.vlrLiquido; });
  Object.entries(byForn).forEach(([nome, val]) => {
    if (termosSuspeitos.some(t => nome.toUpperCase().includes(t)) && val > 30000) {
      suspeitos.push({ nome, val });
    }
  });
 
  return {
    id: 'C20',
    categoria: 'SOCIETARIO',
    titulo: 'Razões sociais em categorias de alto risco histórico',
    nivel: suspeitos.length > 3 ? 'MEDIO' : suspeitos.length > 0 ? 'BAIXO' : 'LIMPO',
    encontrou: suspeitos.length > 0,
    evidencias: suspeitos.slice(0,5).map(f => `${f.nome.slice(0,40)} — R$${(f.val/1e3).toFixed(0)}K`),
    explicacao: 'Empresas de "Publicidade", "Consultoria" e "Assessoria" são historicamente as mais usadas em esquemas de cota parlamentar. Serviços intangíveis são difíceis de auditar e frequentemente superfaturados.',
    metodologia: 'Filtra razões sociais contendo termos de alto risco histórico (CGU) com recebimentos >R$30K.',
    base_legal: 'CGU — Relatório de auditoria da CEAP 2019/2020.',
    impacto: suspeitos.length > 0 ? `${suspeitos.length} empresa(s) em categorias historicamente problemáticas` : 'Sem razões sociais de risco identificadas',
  };
}
 
// ── BLOCO 3: TEMPORAL ─────────────────────────────────────────────────────────
 
function cruzamento_21_pagamentoFimDeSemana(ceapRows) {
  const fds = ceapRows.filter(r => r.diaSemana === 0 || r.diaSemana === 6);
  const pct = ceapRows.length > 0 ? fds.length / ceapRows.length * 100 : 0;
  const total = fds.reduce((s,r)=>s+r.vlrLiquido,0);
 
  return {
    id: 'C21',
    categoria: 'TEMPORAL',
    titulo: `${pct.toFixed(1)}% dos pagamentos em fins de semana`,
    nivel: pct > 15 ? 'ALTO' : pct > 5 ? 'MEDIO' : 'LIMPO',
    encontrou: pct > 5,
    evidencias: fds.slice(0,5).map(r => `${r.datEmissao} (${['Dom','','','','','','Sáb'][r.diaSemana]}) — ${r.txtFornecedor?.slice(0,25)} — R$${r.vlrLiquido.toLocaleString('pt-BR')}`),
    explicacao: 'Notas fiscais legítimas raramente são emitidas em sábados e domingos, especialmente para serviços parlamentares. Alta concentração de notas no FDS sugere datas retroativas ou notas fictícias.',
    metodologia: 'Verifica o dia da semana de cada datEmissao. Flags: diaSemana === 0 (domingo) ou 6 (sábado).',
    base_legal: 'Res. Câmara 55/2009 — comprovação documental das despesas.',
    impacto: pct > 5 ? `${fds.length} notas (R$${(total/1e3).toFixed(0)}K) emitidas em fins de semana` : 'Distribuição temporal normal',
  };
}
 
function cruzamento_22_pagamentoFeriado(ceapRows) {
  // Feriados nacionais fixos
  const feriados = ['01-01','21-04','01-05','07-09','12-10','02-11','15-11','25-12'];
  const emFeriado = ceapRows.filter(r => {
    if (!r.datEmissao) return false;
    const mmdd = r.datEmissao.slice(5,10);
    return feriados.includes(mmdd);
  });
 
  return {
    id: 'C22',
    categoria: 'TEMPORAL',
    titulo: 'Notas emitidas em feriados nacionais',
    nivel: emFeriado.length > 5 ? 'MEDIO' : emFeriado.length > 0 ? 'BAIXO' : 'LIMPO',
    encontrou: emFeriado.length > 0,
    evidencias: emFeriado.slice(0,5).map(r => `${r.datEmissao} — ${r.txtFornecedor?.slice(0,25)} — R$${r.vlrLiquido.toLocaleString('pt-BR')}`),
    explicacao: 'Notas emitidas no Natal, Carnaval, 7 de Setembro etc. são atípicas. Serviços parlamentares legítimos raramente ocorrem em feriados. Pode indicar data retroativa.',
    metodologia: 'Verifica se MM-DD da data de emissão coincide com os 8 feriados nacionais fixos.',
    base_legal: 'CF Art. 7º XXXI — observância de feriados. Res. Câmara 55/2009.',
    impacto: emFeriado.length > 0 ? `${emFeriado.length} nota(s) emitida(s) em feriados nacionais` : 'Nenhuma nota em feriado',
  };
}
 
function cruzamento_23_concentracaoPreEleitoral(ceapRows) {
  const anosEleitorais = [2018, 2020, 2022, 2024];
  let gastoPreEleitoral = 0; let gastoTotal = 0; let gastoAnos = {};
  ceapRows.forEach(r => {
    gastoTotal += r.vlrLiquido;
    gastoAnos[r.numAno] = (gastoAnos[r.numAno]||0) + r.vlrLiquido;
    if (anosEleitorais.includes(r.numAno) && r.numMes >= 6 && r.numMes <= 10) gastoPreEleitoral += r.vlrLiquido;
  });
  const pct = gastoTotal > 0 ? gastoPreEleitoral / gastoTotal * 100 : 0;
  const suspeito = pct > 35;
 
  return {
    id: 'C23',
    categoria: 'POLITICO',
    titulo: 'Concentração de gastos no período pré-eleitoral',
    nivel: pct > 50 ? 'ALTO' : pct > 35 ? 'MEDIO' : 'LIMPO',
    encontrou: suspeito,
    evidencias: suspeito ? [`Jun-Out de anos eleitorais: ${pct.toFixed(1)}% dos gastos totais`] : [],
    explicacao: 'Uso da cota parlamentar como ferramenta de campanha eleitoral é vedado. Picos de gastos em serviços de "divulgação", "comunicação" e "publicidade" nos meses pré-eleitorais são padrão clássico.',
    metodologia: 'Soma gastos de junho a outubro em anos eleitorais (2018, 2020, 2022, 2024) vs total geral.',
    base_legal: 'Lei 9.504/1997 Art. 24 — vedação de propaganda eleitoral com recursos públicos.',
    impacto: suspeito ? `${pct.toFixed(1)}% dos gastos concentrados em período pré-eleitoral` : 'Distribuição temporal equilibrada',
  };
}
 
function cruzamento_24_picoAnomalo(ceapRows) {
  const byMes = {};
  ceapRows.forEach(r => { const k = `${r.numAno}-${r.numMes}`; byMes[k] = (byMes[k]||0)+r.vlrLiquido; });
  const valores = Object.values(byMes);
  if (valores.length < 3) return null;
  const media = valores.reduce((s,v)=>s+v,0) / valores.length;
  const desvio = Math.sqrt(valores.reduce((s,v)=>s+Math.pow(v-media,2),0)/valores.length);
  const picos = Object.entries(byMes).filter(([,v]) => v > media + 2.5*desvio);
 
  return {
    id: 'C24',
    categoria: 'TEMPORAL',
    titulo: 'Picos mensais anômalos (>2.5σ acima da média)',
    nivel: picos.length > 2 ? 'ALTO' : picos.length > 0 ? 'MEDIO' : 'LIMPO',
    encontrou: picos.length > 0,
    evidencias: picos.map(([mes,val]) => `${mes}: R$${(val/1e3).toFixed(0)}K (${((val-media)/desvio).toFixed(1)}σ acima da média de R$${(media/1e3).toFixed(0)}K)`),
    explicacao: 'Análise de desvio padrão identifica meses com gastos estatisticamente anômalos. Mais de 2.5 desvios acima da média é evento raro em gastos legítimos e merece investigação.',
    metodologia: 'Calcula média e desvio padrão dos gastos mensais. Sinaliza meses com z-score > 2.5.',
    base_legal: 'Técnica estatística padrão em auditoria forense.',
    impacto: picos.length > 0 ? `${picos.length} mês(es) com gasto estatisticamente anômalo` : 'Distribuição mensal regular',
  };
}
 
function cruzamento_25_sequenciaRapida(ceapRows) {
  const sorted = [...ceapRows].sort((a,b) => new Date(a.datEmissao)-new Date(b.datEmissao));
  const rapidas = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i].datEmissao) - new Date(sorted[i-1].datEmissao)) / 86400000;
    if (diff < 2 && sorted[i].txtCNPJCPF === sorted[i-1].txtCNPJCPF && diff >= 0) {
      rapidas.push({ a: sorted[i-1], b: sorted[i], diff });
    }
  }
 
  return {
    id: 'C25',
    categoria: 'TEMPORAL',
    titulo: 'Múltiplas notas do mesmo CNPJ em menos de 48h',
    nivel: rapidas.length > 5 ? 'ALTO' : rapidas.length > 2 ? 'MEDIO' : rapidas.length > 0 ? 'BAIXO' : 'LIMPO',
    encontrou: rapidas.length > 0,
    evidencias: rapidas.slice(0,4).map(r => `${r.a.txtFornecedor?.slice(0,25)}: ${r.a.datEmissao} e ${r.b.datEmissao} (${r.diff.toFixed(0)}d apart) — R$${(r.a.vlrLiquido+r.b.vlrLiquido).toLocaleString('pt-BR')}`),
    explicacao: 'Sequências rápidas de notas do mesmo CNPJ podem indicar lote de notas emitidas retroativamente para justificar pagamentos já realizados.',
    metodologia: 'Ordena por data e verifica intervalos < 48h para o mesmo CNPJ.',
    base_legal: 'Res. Câmara 55/2009 — comprovação contemporânea da despesa.',
    impacto: rapidas.length > 0 ? `${rapidas.length} par(es) de notas do mesmo fornecedor com menos de 48h de intervalo` : 'Intervalos temporais normais',
  };
}
 
function cruzamento_26_dataEmissaoFutura(ceapRows) {
  const hoje = new Date();
  const futuras = ceapRows.filter(r => r.datEmissao && new Date(r.datEmissao) > hoje);
  return {
    id: 'C26',
    categoria: 'TEMPORAL',
    titulo: 'Notas com data de emissão no futuro',
    nivel: futuras.length > 0 ? 'CRITICO' : 'LIMPO',
    encontrou: futuras.length > 0,
    evidencias: futuras.slice(0,5).map(r => `${r.datEmissao} — ${r.txtFornecedor?.slice(0,25)} — R$${r.vlrLiquido.toLocaleString('pt-BR')}`),
    explicacao: 'Nota fiscal com data futura é tecnicamente impossível — indica erro de digitação grave ou manipulação de dados na prestação de contas.',
    metodologia: 'Compara datEmissao com a data atual.',
    base_legal: 'Decreto 7.212/2010 — data de emissão do documento fiscal.',
    impacto: futuras.length > 0 ? `${futuras.length} nota(s) com data impossível (futuro)` : 'Todas as datas são válidas',
  };
}
 
function cruzamento_27_notasSemDia(ceapRows) {
  const semData = ceapRows.filter(r => !r.datEmissao || r.datEmissao === '' || r.datEmissao === '0000-00-00');
  return {
    id: 'C27',
    categoria: 'TEMPORAL',
    titulo: 'Notas sem data de emissão',
    nivel: semData.length > 10 ? 'MEDIO' : semData.length > 0 ? 'BAIXO' : 'LIMPO',
    encontrou: semData.length > 0,
    evidencias: semData.slice(0,5).map(r => `${r.txtFornecedor?.slice(0,30)} — R$${r.vlrLiquido.toLocaleString('pt-BR')}`),
    explicacao: 'Notas sem data não podem ser auditadas temporalmente. A ausência de data é irregularidade formal na prestação de contas.',
    metodologia: 'Filtra registros com datEmissao nulo, vazio ou zerado.',
    base_legal: 'Res. Câmara 55/2009 — documentação obrigatória.',
    impacto: semData.length > 0 ? `${semData.length} nota(s) sem data de emissão` : 'Todas as notas têm data',
  };
}
 
function cruzamento_28_mesmoFornecedorMesmoDia(ceapRows) {
  const grupos = {};
  ceapRows.forEach(r => {
    const k = `${r.txtCNPJCPF}-${r.datEmissao}`;
    if (!grupos[k]) grupos[k] = { n:0, total:0, nome: r.txtFornecedor, data: r.datEmissao };
    grupos[k].n++; grupos[k].total += r.vlrLiquido;
  });
  const suspeitos = Object.values(grupos).filter(g => g.n >= 3);
 
  return {
    id: 'C28',
    categoria: 'TEMPORAL',
    titulo: '3+ notas do mesmo fornecedor no mesmo dia',
    nivel: suspeitos.length > 3 ? 'ALTO' : suspeitos.length > 0 ? 'MEDIO' : 'LIMPO',
    encontrou: suspeitos.length > 0,
    evidencias: suspeitos.slice(0,5).map(g => `${g.nome?.slice(0,30)} — ${g.n} notas em ${g.data} = R$${(g.total/1e3).toFixed(0)}K`),
    explicacao: 'Três ou mais notas do mesmo fornecedor no mesmo dia é padrão de emissão em lote, incompatível com serviços prestados de forma contínua ou pontual.',
    metodologia: 'Agrupa por CNPJ + data. Sinaliza grupos com ≥3 registros.',
    base_legal: 'Res. Câmara 55/2009 — adequação e necessidade dos gastos.',
    impacto: suspeitos.length > 0 ? `${suspeitos.length} dia(s) com 3+ notas do mesmo CNPJ` : 'Nenhuma emissão em lote detectada',
  };
}
 
// ── BLOCO 4: GEOGRÁFICO ───────────────────────────────────────────────────────
 
function cruzamento_29_fornecedorForaUF(ceapRows, dados) {
  const ufDeputado = dados.camara?.detalhes?.ultimoStatus?.siglaUf || ceapRows[0]?.sgUF;
  if (!ufDeputado) return null;
  const fornecedores = dados.fornecedores || [];
  const foraUF = fornecedores.filter(f => f.info?.uf && f.info.uf !== ufDeputado);
 
  return {
    id: 'C29',
    categoria: 'GEOGRAFICO',
    titulo: 'Fornecedores em estados diferentes do mandato',
    nivel: foraUF.length > 3 ? 'MEDIO' : foraUF.length > 0 ? 'BAIXO' : 'LIMPO',
    encontrou: foraUF.length > 0,
    evidencias: foraUF.map(f => `${f.nome?.slice(0,30)} — UF: ${f.info.uf} (deputado é de ${ufDeputado})`),
    explicacao: 'Deputados devem usar a cota para despesas relacionadas ao seu mandato. Fornecedores em estados distantes do mandato sem justificativa levantam dúvidas sobre a natureza do serviço.',
    metodologia: 'Compara UF do endereço do fornecedor (Receita) com UF do mandato (Câmara).',
    base_legal: 'Res. Câmara 55/2009 — pertinência ao exercício do mandato.',
    impacto: foraUF.length > 0 ? `${foraUF.length} fornecedor(es) em outros estados` : 'Fornecedores no estado do mandato',
  };
}
 
function cruzamento_30_emendasForaBaseEleitoral(ceapRows, dados) {
  const ufDeputado = ceapRows[0]?.sgUF;
  const emendas = dados.emendas?.lista || [];
  const foraBase = emendas.filter(e => e.municipio?.uf && e.municipio.uf !== ufDeputado);
  const totalFora = foraBase.reduce((s,e)=>s+(e.valorEmpenhado||0),0);
 
  return {
    id: 'C30',
    categoria: 'GEOGRAFICO',
    titulo: 'Emendas destinadas fora da base eleitoral',
    nivel: foraBase.length > 5 ? 'MEDIO' : foraBase.length > 0 ? 'BAIXO' : 'LIMPO',
    encontrou: foraBase.length > 0,
    evidencias: foraBase.slice(0,5).map(e => `${e.municipio?.nome}-${e.municipio?.uf}: R$${(e.valorEmpenhado/1e3).toFixed(0)}K`),
    explicacao: 'Emendas para municípios fora da base eleitoral podem indicar trocas políticas ou desvio de finalidade. O parlamentar deve prestar contas de por que destinou recursos para fora de sua região.',
    metodologia: 'Compara UF dos municípios beneficiados nas emendas com UF do mandato.',
    base_legal: 'CF Art. 166 §9º — destinação de emendas parlamentares.',
    impacto: foraBase.length > 0 ? `R$${(totalFora/1e3).toFixed(0)}K em emendas fora da base eleitoral` : 'Emendas dentro da base eleitoral',
  };
}
 
function cruzamento_31_gastosForaCapital(ceapRows, dados) {
  // Heurística: muitos gastos em categorias que deveriam ser locais mas o deputado gasta fora
  const hosped = ceapRows.filter(r => r.txtDescricao?.includes('HOSPEDAGEM'));
  const totalHosp = hosped.reduce((s,r)=>s+r.vlrLiquido,0);
  const mediaHosp = hosped.length > 0 ? totalHosp / hosped.length : 0;
  const suspeito = mediaHosp > 800 && hosped.length > 20;
 
  return {
    id: 'C31',
    categoria: 'GEOGRAFICO',
    titulo: 'Gastos com hospedagem acima do padrão (possível uso pessoal)',
    nivel: mediaHosp > 1500 ? 'MEDIO' : mediaHosp > 800 ? 'BAIXO' : 'LIMPO',
    encontrou: suspeito,
    evidencias: suspeito ? [`Média por diária: R$${mediaHosp.toFixed(0)} | ${hosped.length} diárias | Total: R$${(totalHosp/1e3).toFixed(0)}K`] : [],
    explicacao: 'Diárias de hospedagem acima de R$800 com frequência elevada podem indicar uso de hotéis de luxo ou estadias pessoais pagas com verba pública.',
    metodologia: 'Média do valor de hospedagem. Referência: diária de hotel 3 estrelas em Brasília ~R$300-500.',
    base_legal: 'Res. Câmara 55/2009 — vedação de uso para fins pessoais.',
    impacto: suspeito ? `Média de R$${mediaHosp.toFixed(0)} por hospedagem` : 'Hospedagem dentro do padrão',
  };
}
 
function cruzamento_32_municipioFornecedor(ceapRows, dados) {
  const fornecedores = dados.fornecedores || [];
  const capitais = ['SÃO PAULO', 'RIO DE JANEIRO', 'BRASÍLIA', 'BELO HORIZONTE'];
  const naoCapital = fornecedores.filter(f => f.info?.municipio && !capitais.some(c => f.info.municipio.toUpperCase().includes(c)));
 
  return {
    id: 'C32',
    categoria: 'GEOGRAFICO',
    titulo: 'Fornecedores em municípios pequenos/incomuns',
    nivel: naoCapital.length > 2 ? 'BAIXO' : 'LIMPO',
    encontrou: naoCapital.length > 0,
    evidencias: naoCapital.slice(0,5).map(f => `${f.nome?.slice(0,30)} — ${f.info.municipio}-${f.info.uf}`),
    explicacao: 'Serviços parlamentares de alto valor sendo prestados por empresas em pequenas cidades, sem estrutura para tanto, é inconsistência que merece verificação.',
    metodologia: 'Identifica fornecedores registrados em municípios fora das capitais e principais centros.',
    base_legal: 'Res. Câmara 55/2009 — capacidade operacional do fornecedor.',
    impacto: naoCapital.length > 0 ? `${naoCapital.length} fornecedor(es) em municípios de pequeno porte` : 'Fornecedores em centros urbanos',
  };
}
 
// ── BLOCO 5: POLÍTICO ─────────────────────────────────────────────────────────
 
function cruzamento_33_emendasExcessivas(dados) {
  const emendas = dados.emendas?.lista || [];
  const total = dados.emendas?.total || 0;
  const LIMITE_ANUAL = 25_700_000; // Limite constitucional de emendas individuais 2024
  const suspeito = total > LIMITE_ANUAL * 0.9;
 
  return {
    id: 'C33',
    categoria: 'POLITICO',
    titulo: 'Volume de emendas próximo ou acima do limite constitucional',
    nivel: total > LIMITE_ANUAL ? 'CRITICO' : suspeito ? 'ALTO' : 'LIMPO',
    encontrou: suspeito,
    evidencias: [`Total emendas: R$${(total/1e6).toFixed(1)}M | Limite 2024: R$${(LIMITE_ANUAL/1e6).toFixed(1)}M`],
    explicacao: 'A EC 105/2019 limita emendas individuais a R$25,7M/ano. Ultrapassar esse valor ou chegar perto concentra poder discricionário excessivo nas mãos de um único parlamentar.',
    metodologia: 'Soma valorEmpenhado de todas as emendas do parlamentar no ano consultado.',
    base_legal: 'CF Art. 166 §9º — EC 105/2019 — limite de emendas individuais impositivas.',
    impacto: `Total de emendas: R$${(total/1e6).toFixed(1)}M`,
  };
}
 
function cruzamento_34_doacaoRetribuida(ceapRows, dados) {
  const financiadores = dados.financiadores || [];
  const totalDoado = financiadores.reduce((s,f) => s+(f.valor||0), 0);
  const totalCEAP = ceapRows.reduce((s,r)=>s+r.vlrLiquido,0);
  const fornCEAP = new Set(ceapRows.map(r => normalizar(r.txtFornecedor)));
  const doadoresQueTambemRecebem = financiadores.filter(f =>
    [...fornCEAP].some(fn => fn.includes(normalizar(f.nomeDoador||'').split(' ')[0]))
  );
  const totalRetribuido = doadoresQueTambemRecebem.reduce((s,f) => s+(f.valor||0),0);
 
  return {
    id: 'C34',
    categoria: 'POLITICO',
    titulo: 'Possível retribuição eleitoral via CEAP',
    nivel: doadoresQueTambemRecebem.length > 0 ? 'CRITICO' : 'LIMPO',
    encontrou: doadoresQueTambemRecebem.length > 0,
    evidencias: doadoresQueTambemRecebem.slice(0,5).map(f => `${f.nomeDoador?.slice(0,30)} doou R$${(f.valor/1e3).toFixed(0)}K na campanha`),
    explicacao: 'O ciclo perverso: empresa financia campanha → parlamentar eleito → parlamentar paga empresa com cota pública. Isso é a "retribuição eleitoral" via verba parlamentar.',
    metodologia: 'Filtra financiadores de campanha (TSE) que aparecem como fornecedores CEAP.',
    base_legal: 'Lei 12.846/2013 Art. 5º — atos lesivos à administração pública. Lei 9.504/1997.',
    impacto: doadoresQueTambemRecebem.length > 0 ? `${doadoresQueTambemRecebem.length} doador(es) possivelmente retribuídos via CEAP` : 'Sem ciclo de retribuição detectado',
  };
}
 
function cruzamento_35_fornecedorPoliticamentExposto(ceapRows, dados) {
  // Heurística: empresas de "comunicação" e "divulgação" em ano eleitoral
  const anosEleitorais = [2018, 2020, 2022, 2024];
  const comunicacao = ceapRows.filter(r =>
    anosEleitorais.includes(r.numAno) &&
    (r.txtDescricao?.includes('DIVULGAÇÃO') || r.txtDescricao?.includes('PUBLICIDADE')) &&
    r.numMes >= 6 && r.numMes <= 10
  );
  const total = comunicacao.reduce((s,r)=>s+r.vlrLiquido,0);
 
  return {
    id: 'C35',
    categoria: 'POLITICO',
    titulo: 'Gastos com publicidade em período eleitoral',
    nivel: total > 100000 ? 'CRITICO' : total > 30000 ? 'ALTO' : total > 0 ? 'MEDIO' : 'LIMPO',
    encontrou: total > 0,
    evidencias: comunicacao.slice(0,5).map(r => `${r.numMes}/${r.numAno} — ${r.txtFornecedor?.slice(0,25)} — R$${r.vlrLiquido.toLocaleString('pt-BR')}`),
    explicacao: 'Gastos com "divulgação da atividade parlamentar" explodem em anos eleitorais. A linha entre publicidade parlamentar legítima e propaganda eleitoral paga com dinheiro público é tênue e frequentemente cruzada.',
    metodologia: 'Filtra gastos em categorias de comunicação/publicidade, de junho a outubro, em anos de eleição.',
    base_legal: 'Lei 9.504/1997 Art. 24 — vedação de propaganda eleitoral com recursos públicos.',
    impacto: total > 0 ? `R$${(total/1e3).toFixed(0)}K em publicidade no período pré-eleitoral` : 'Nenhum gasto de comunicação em período eleitoral',
  };
}
 
function cruzamento_36_gastoPorPartido(ceapRows, dados) {
  // Comparação com média do partido
  const partido = ceapRows[0]?.sgPartido;
  const totalDeputado = ceapRows.reduce((s,r)=>s+r.vlrLiquido,0);
  // Referência: média nacional CEAP ~R$150K/ano
  const MEDIA_NACIONAL = 150000;
  const ratio = totalDeputado / MEDIA_NACIONAL;
 
  return {
    id: 'C36',
    categoria: 'POLITICO',
    titulo: `Gasto ${ratio.toFixed(1)}x a média nacional da CEAP`,
    nivel: ratio > 3 ? 'ALTO' : ratio > 2 ? 'MEDIO' : ratio > 1.5 ? 'BAIXO' : 'LIMPO',
    encontrou: ratio > 1.5,
    evidencias: [`Gasto: R$${(totalDeputado/1e3).toFixed(0)}K | Média nacional: R$${(MEDIA_NACIONAL/1e3).toFixed(0)}K | Ratio: ${ratio.toFixed(1)}x`],
    explicacao: 'A média nacional de uso da CEAP é de ~R$150K/ano. Deputados gastando 2-3x esse valor merecem escrutínio adicional, especialmente em categorias de alto risco.',
    metodologia: 'Total CEAP do deputado vs média histórica nacional (R$150K/ano base 2024).',
    base_legal: 'Transparência e razoabilidade no uso de recursos públicos.',
    impacto: `Gasto ${ratio.toFixed(1)}x a média nacional`,
  };
}
 
function cruzamento_37_emendasConcentradas(dados) {
  const emendas = dados.emendas?.lista || [];
  if (emendas.length < 3) return null;
  const byBeneficiario = {};
  emendas.forEach(e => {
    const k = e.beneficiario?.nome || 'N/A';
    byBeneficiario[k] = (byBeneficiario[k]||0) + (e.valorEmpenhado||0);
  });
  const top = Object.entries(byBeneficiario).sort((a,b)=>b[1]-a[1]);
  const totalEmendas = top.reduce((s,[,v])=>s+v,0);
  const pctTop = totalEmendas > 0 ? top[0]?.[1]/totalEmendas*100 : 0;
 
  return {
    id: 'C37',
    categoria: 'POLITICO',
    titulo: 'Emendas concentradas em poucos beneficiários',
    nivel: pctTop > 60 ? 'ALTO' : pctTop > 40 ? 'MEDIO' : 'LIMPO',
    encontrou: pctTop > 40,
    evidencias: top.slice(0,5).map(([n,v]) => `${n.slice(0,35)}: R$${(v/1e3).toFixed(0)}K (${(v/totalEmendas*100).toFixed(1)}%)`),
    explicacao: 'Emendas concentradas em poucas entidades — especialmente ONGs ou prefeituras específicas — podem indicar direcionamento a aliados políticos ou entidades com vínculos com o parlamentar.',
    metodologia: 'HHI das emendas por beneficiário. Sinaliza quando o principal beneficiário recebe >40% do total.',
    base_legal: 'CF Art. 37 — impessoalidade na administração pública.',
    impacto: pctTop > 0 ? `"${top[0]?.[0]?.slice(0,30)}" recebe ${pctTop.toFixed(1)}% das emendas` : '',
  };
}
 
function cruzamento_38_viragensExcessivas(dados) {
  const viagens = dados.emendas?.viagens || [];
  const totalViagens = viagens.length;
  const LIMITE_RAZOAVEL = 20;
 
  return {
    id: 'C38',
    categoria: 'POLITICO',
    titulo: `${totalViagens} viagens a serviço registradas`,
    nivel: totalViagens > 50 ? 'MEDIO' : totalViagens > LIMITE_RAZOAVEL ? 'BAIXO' : 'LIMPO',
    encontrou: totalViagens > LIMITE_RAZOAVEL,
    evidencias: viagens.slice(0,5).map(v => `${v.destino || 'N/D'} — ${v.dataPartida || ''}`),
    explicacao: 'Volume muito alto de viagens a serviço pode indicar uso indevido da verba de passagens. Cada viagem deve ter justificativa clara de atividade parlamentar.',
    metodologia: 'Contagem de viagens a serviço registradas na CGU no período consultado.',
    base_legal: 'Decreto 5.992/2006 — diárias e passagens para servidores.',
    impacto: `${totalViagens} viagens registradas no período`,
  };
}
 
// ── BLOCO 6: JUDICIAL ─────────────────────────────────────────────────────────
 
function cruzamento_39_mandadoPrisao(dados) {
  const mandados = dados.mandados;
  return {
    id: 'C39',
    categoria: 'JUDICIAL',
    titulo: 'Mandado de prisão ativo (BNMP/CNJ)',
    nivel: mandados?.mandadosAbertos > 0 ? 'CRITICO' : 'LIMPO',
    encontrou: mandados?.mandadosAbertos > 0,
    evidencias: mandados?.mandadosAbertos > 0 ? [`${mandados.mandadosAbertos} mandado(s) em aberto — consulte: ${mandados.linkConsulta}`] : [],
    explicacao: 'Mandados de prisão em aberto indicam condenação judicial ou prisão preventiva. Parlamentares com mandado ativo exercem o mandato sob grave nuvem judicial.',
    metodologia: 'Consulta ao BNMP 3.0 (CNJ). Nota: requer verificação manual por CAPTCHA.',
    base_legal: 'CPP Art. 282 — medidas cautelares.',
    impacto: mandados?.mandadosAbertos > 0 ? `⚠️ URGENTE: ${mandados.mandadosAbertos} mandado(s) de prisão em aberto` : 'Nenhum mandado de prisão encontrado',
  };
}
 
function cruzamento_40_contasIrregularesTCU(dados) {
  const tcu = dados.tcu;
  return {
    id: 'C40',
    categoria: 'JUDICIAL',
    titulo: 'Contas julgadas irregulares pelo TCU',
    nivel: tcu?.irregular ? 'CRITICO' : 'LIMPO',
    encontrou: tcu?.irregular || false,
    evidencias: tcu?.processos?.slice(0,3).map(p => JSON.stringify(p).slice(0,80)) || [],
    explicacao: 'O TCU julga gestores de recursos públicos. Contas irregulares indicam que houve dano ao erário comprovado por auditoria do principal órgão de controle externo do Brasil.',
    metodologia: 'Consulta à API pública do TCU (contasirregulares.tcu.gov.br).',
    base_legal: 'Lei 8.443/1992 Art. 19 — débito e multa em contas irregulares.',
    impacto: tcu?.irregular ? `Contas irregulares: ${tcu.total} processo(s)` : 'Nenhuma irregularidade no TCU',
  };
}
 
function cruzamento_41_mencaoNoticias(dados) {
  const noticias = dados.noticias || [];
  const termosCrime = ['preso', 'condenado', 'investigado', 'operação', 'denunciado', 'fraude', 'desvio', 'corrupção', 'mpf', 'pf'];
  const graves = noticias.filter(n => termosCrime.some(t => (n.titulo||'').toLowerCase().includes(t)));
 
  return {
    id: 'C41',
    categoria: 'JUDICIAL',
    titulo: `${noticias.length} notícias investigativas — ${graves.length} de alta gravidade`,
    nivel: graves.length > 3 ? 'ALTO' : graves.length > 0 ? 'MEDIO' : noticias.length > 5 ? 'BAIXO' : 'LIMPO',
    encontrou: noticias.length > 0,
    evidencias: graves.slice(0,5).map(n => n.titulo?.slice(0,70)),
    explicacao: 'Presença de notícias sobre investigações, operações policiais ou condenações é indicador de reputação judicial negativa. Não é prova jurídica, mas é sinal de investigação.',
    metodologia: 'Busca no Google News RSS com termos "investigação OR fraude OR operação OR condenado". Filtra por termos de alta gravidade.',
    base_legal: 'Transparência pública — livre acesso à informação jornalística.',
    impacto: noticias.length > 0 ? `${noticias.length} notícia(s), sendo ${graves.length} de alta gravidade` : 'Nenhuma notícia investigativa encontrada',
  };
}
 
function cruzamento_42_mencaoDOU(dados) {
  const dou = dados.dou;
  return {
    id: 'C42',
    categoria: 'JUDICIAL',
    titulo: `${dou?.total || 0} menções no Diário Oficial da União`,
    nivel: dou?.total > 50 ? 'BAIXO' : 'LIMPO',
    encontrou: (dou?.total || 0) > 0,
    evidencias: (dou?.items || []).slice(0,5).map(i => `${i.data} — ${i.titulo?.slice(0,60)}`),
    explicacao: 'Menções no DOU podem indicar nomeações, condenações, punições administrativas ou atos normativos. Alto volume ou menções em Seções de punição são sinais de alerta.',
    metodologia: 'Busca na API da Imprensa Nacional (in.gov.br) pelo nome do parlamentar.',
    base_legal: 'Lei 12.527/2011 (LAI) — acesso a publicações oficiais.',
    impacto: dou?.total > 0 ? `${dou.total} menção(ões) no DOU` : 'Nenhuma menção no Diário Oficial',
  };
}
 
function cruzamento_43_aeronaveDeclarada(dados) {
  const anac = dados.anac;
  const bens = dados.bens || [];
  const aeronavesTSE = bens.filter(b => b.tipo?.toLowerCase().includes('aeronave') || b.descricao?.toLowerCase().includes('avião') || b.descricao?.toLowerCase().includes('helicóptero'));
 
  return {
    id: 'C43',
    categoria: 'PATRIMONIAL',
    titulo: 'Cruzamento aeronaves ANAC vs declaração TSE',
    nivel: aeronavesTSE.length > 0 ? 'BAIXO' : 'LIMPO',
    encontrou: aeronavesTSE.length > 0,
    evidencias: [
      ...aeronavesTSE.map(b => `TSE: ${b.descricao?.slice(0,40)} — R$${(b.valor/1e3).toFixed(0)}K`),
      anac?.linkRAB ? `ANAC RAB: ${anac.linkRAB}` : '',
    ].filter(Boolean),
    explicacao: 'Parlamentar com aeronave declarada ao TSE deve ter o registro correspondente no RAB (ANAC). Inconsistências entre declaração e registro real são irregularidade grave.',
    metodologia: 'Verifica bens com categoria "aeronave" no TSE e cruza com link de consulta ao RAB/ANAC.',
    base_legal: 'RBAC 45 — Registro Aeronáutico Brasileiro. Lei 7.565/1986.',
    impacto: aeronavesTSE.length > 0 ? `${aeronavesTSE.length} aeronave(s) declarada(s) ao TSE` : 'Nenhuma aeronave no TSE',
  };
}
 
// ── BLOCO 7: ESTATÍSTICO / REDE ───────────────────────────────────────────────
 
function cruzamento_44_redeFornecedores(ceapRows, dados) {
  const byForn = {};
  ceapRows.forEach(r => {
    if (!byForn[r.txtCNPJCPF]) byForn[r.txtCNPJCPF] = { nome: r.txtFornecedor, cnpj: r.txtCNPJCPF, n: 0, total: 0 };
    byForn[r.txtCNPJCPF].n++; byForn[r.txtCNPJCPF].total += r.vlrLiquido;
  });
  const top = Object.values(byForn).sort((a,b) => b.total-a.total).slice(0,5);
  const totalGeral = ceapRows.reduce((s,r)=>s+r.vlrLiquido,0);
  const topPct = top.reduce((s,f)=>s+f.total,0) / totalGeral * 100;
 
  return {
    id: 'C44',
    categoria: 'REDE',
    titulo: `Top 5 fornecedores concentram ${topPct.toFixed(1)}% dos gastos`,
    nivel: topPct > 80 ? 'CRITICO' : topPct > 60 ? 'ALTO' : topPct > 40 ? 'MEDIO' : 'LIMPO',
    encontrou: topPct > 40,
    evidencias: top.map(f => `${f.nome?.slice(0,30)}: ${(f.total/totalGeral*100).toFixed(1)}% (${f.n} notas)`),
    explicacao: 'Quando 5 empresas dominam 60-80% dos gastos de um parlamentar, a rede de fornecimento é artificialmente pequena — indicativo de direcionamento e não de concorrência real.',
    metodologia: 'Soma do percentual acumulado dos 5 maiores fornecedores.',
    base_legal: 'Res. Câmara 55/2009 — diversificação e razoabilidade dos gastos.',
    impacto: `5 fornecedores respondem por ${topPct.toFixed(1)}% de todos os gastos`,
  };
}
 
function cruzamento_45_fornecedorMultiplosDeputados(ceapRows, dados) {
  // Fornecedores que aparecem pagando múltiplos deputados (dado da rede geral)
  // Aqui usamos o campo fornDiasAbertura como proxy de "suspeita de rede"
  const suspeitos = ceapRows.filter(r => r.fornDiasAbertura && r.fornDiasAbertura < 180);
  const byForn = {};
  suspeitos.forEach(r => { byForn[r.txtFornecedor] = (byForn[r.txtFornecedor]||0)+r.vlrLiquido; });
  const lista = Object.entries(byForn).sort((a,b)=>b[1]-a[1]);
 
  return {
    id: 'C45',
    categoria: 'REDE',
    titulo: 'Fornecedores com abertura recente e múltiplas notas',
    nivel: lista.length > 3 ? 'ALTO' : lista.length > 0 ? 'MEDIO' : 'LIMPO',
    encontrou: lista.length > 0,
    evidencias: lista.slice(0,5).map(([n,v]) => `${n.slice(0,35)} — R$${(v/1e3).toFixed(0)}K (empresa nova)`),
    explicacao: 'Empresas recém-abertas que já têm alto volume de notas para um parlamentar formam padrão típico de rede organizada de empresas de fachada.',
    metodologia: 'Filtra fornecedores onde fornDiasAbertura < 180 (abertura recente) e agrupa por volume.',
    base_legal: 'CGU — Metodologia de detecção de rede de laranjas.',
    impacto: lista.length > 0 ? `${lista.length} fornecedor(es) recente(s) com alto volume` : 'Rede de fornecedores sem sinalização',
  };
}
 
function cruzamento_46_evolucaoGastosAnual(ceapRows) {
  const byAno = {};
  ceapRows.forEach(r => { byAno[r.numAno] = (byAno[r.numAno]||0)+r.vlrLiquido; });
  const anos = Object.entries(byAno).sort((a,b)=>a[0]-b[0]);
  if (anos.length < 2) return null;
  const crescimentos = anos.slice(1).map(([ano,val],i) => {
    const prev = anos[i][1];
    return { ano, crescimento: prev > 0 ? (val/prev-1)*100 : 0 };
  });
  const maxCresc = Math.max(...crescimentos.map(c => c.crescimento));
  const anomalo = crescimentos.filter(c => c.crescimento > 100);
 
  return {
    id: 'C46',
    categoria: 'TEMPORAL',
    titulo: 'Crescimento anual dos gastos CEAP',
    nivel: maxCresc > 200 ? 'ALTO' : maxCresc > 100 ? 'MEDIO' : 'LIMPO',
    encontrou: anomalo.length > 0,
    evidencias: [
      ...anos.map(([ano,val]) => `${ano}: R$${(val/1e3).toFixed(0)}K`),
      ...anomalo.map(c => `${c.ano}: +${c.crescimento.toFixed(0)}% vs ano anterior`)
    ],
    explicacao: 'Crescimento acima de 100% em um único ano pode indicar mudança de comportamento — início de um esquema ou período de campanha eleitoral.',
    metodologia: 'Variação percentual do total de gastos CEAP entre anos consecutivos.',
    base_legal: 'Razoabilidade e proporcionalidade no uso da cota.',
    impacto: anomalo.length > 0 ? `Crescimento anômalo detectado em ${anomalo.map(c=>c.ano).join(', ')}` : 'Crescimento dentro do padrão histórico',
  };
}
 
function cruzamento_47_categoriaIncompativel(ceapRows, dados) {
  const uf = ceapRows[0]?.sgUF;
  // Heurística: muito gasto em combustível para deputado de estado distante
  const comb = ceapRows.filter(r => r.txtDescricao?.includes('COMBUSTÍVEL'));
  const totalComb = comb.reduce((s,r)=>s+r.vlrLiquido,0);
  const ESTADOS_DISTANTES = ['AM', 'PA', 'RO', 'AC', 'RR', 'AP', 'MA'];
  const suspeito = ESTADOS_DISTANTES.includes(uf) && totalComb > 30000;
 
  return {
    id: 'C47',
    categoria: 'GEOGRAFICO',
    titulo: 'Gastos em combustível para deputado de estado distante',
    nivel: suspeito ? 'MEDIO' : 'LIMPO',
    encontrou: suspeito,
    evidencias: suspeito ? [`R$${(totalComb/1e3).toFixed(0)}K em combustível — deputado de ${uf}`] : [],
    explicacao: 'Deputados de estados do Norte/Nordeste longe de Brasília geralmente viajam de avião. Alto gasto com combustível terrestre pode indicar reembolso indevido de veículos particulares.',
    metodologia: 'Filtra gastos com "COMBUSTÍVEL" para deputados de estados geograficamente distantes de Brasília.',
    base_legal: 'Res. Câmara 55/2009 — pertinência ao exercício do mandato.',
    impacto: suspeito ? `R$${(totalComb/1e3).toFixed(0)}K em combustível para estado que requer deslocamento aéreo` : 'Sem inconsistência geográfica',
  };
}
 
function cruzamento_48_notasSemCNPJ(ceapRows) {
  const semCNPJ = ceapRows.filter(r => !r.txtCNPJCPF || r.txtCNPJCPF.replace(/\D/g,'').length < 11);
  const pct = ceapRows.length > 0 ? semCNPJ.length / ceapRows.length * 100 : 0;
 
  return {
    id: 'C48',
    categoria: 'FINANCEIRO',
    titulo: `${pct.toFixed(1)}% das notas sem CNPJ/CPF válido`,
    nivel: pct > 20 ? 'ALTO' : pct > 5 ? 'MEDIO' : 'LIMPO',
    encontrou: pct > 5,
    evidencias: semCNPJ.slice(0,5).map(r => `${r.txtFornecedor?.slice(0,30)} — R$${r.vlrLiquido.toLocaleString('pt-BR')}`),
    explicacao: 'Notas sem CNPJ/CPF identificado não podem ser rastreadas na Receita Federal. Impossibilidade de rastreamento é em si uma irregularidade formal.',
    metodologia: 'Verifica se txtCNPJCPF tem ao menos 11 dígitos numéricos (CPF mínimo).',
    base_legal: 'Res. Câmara 55/2009 — identificação obrigatória do fornecedor.',
    impacto: pct > 5 ? `${semCNPJ.length} nota(s) sem identificação fiscal válida` : 'Todos os fornecedores identificados',
  };
}
 
function cruzamento_49_valorMaximoCota(ceapRows) {
  const LIMITE_MENSAL = 45612; // Limite CEAP 2024 (varia por UF, maior é DF)
  const byMes = {};
  ceapRows.forEach(r => {
    const k = `${r.numAno}-${r.numMes}`;
    byMes[k] = (byMes[k]||0)+r.vlrLiquido;
  });
  const acima = Object.entries(byMes).filter(([,v]) => v > LIMITE_MENSAL);
 
  return {
    id: 'C49',
    categoria: 'FINANCEIRO',
    titulo: 'Meses com gasto acima do limite legal da cota',
    nivel: acima.length > 2 ? 'CRITICO' : acima.length > 0 ? 'ALTO' : 'LIMPO',
    encontrou: acima.length > 0,
    evidencias: acima.map(([mes,val]) => `${mes}: R$${(val/1e3).toFixed(0)}K (limite: R$${(LIMITE_MENSAL/1e3).toFixed(0)}K)`),
    explicacao: 'A CEAP tem limite mensal definido por UF (maior é DF: ~R$45.612). Ultrapassar esse limite é irregularidade direta que exige devolução.',
    metodologia: 'Soma os gastos mensais e compara com o limite máximo da CEAP.',
    base_legal: 'Res. Câmara 55/2009 Art. 4º — limites mensais por estado.',
    impacto: acima.length > 0 ? `${acima.length} mês(es) com gasto acima do teto legal` : 'Todos os meses dentro do limite',
  };
}
 
function cruzamento_50_distribuicaoCategoriasAnomala(ceapRows) {
  const bycat = {};
  const total = ceapRows.reduce((s,r)=>s+r.vlrLiquido,0);
  ceapRows.forEach(r => { bycat[r.txtDescricao] = (bycat[r.txtDescricao]||0)+r.vlrLiquido; });
  const topCat = Object.entries(bycat).sort((a,b)=>b[1]-a[1])[0];
  const pctTop = topCat && total > 0 ? topCat[1]/total*100 : 0;
  const CATS_RISCO = ['LOCAÇÃO OU FRETAMENTO DE VEÍCULOS', 'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR', 'CONSULTORIAS'];
  const ehRisco = topCat && CATS_RISCO.some(c => (topCat[0]||'').includes(c.split(' ')[0]));
 
  return {
    id: 'C50',
    categoria: 'FINANCEIRO',
    titulo: `Categoria dominante: "${topCat?.[0]?.slice(0,30)}" (${pctTop.toFixed(1)}%)`,
    nivel: (pctTop > 60 && ehRisco) ? 'CRITICO' : (pctTop > 50 && ehRisco) ? 'ALTO' : pctTop > 70 ? 'MEDIO' : 'LIMPO',
    encontrou: pctTop > 50,
    evidencias: Object.entries(bycat).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cat,val]) => `${cat.slice(0,35)}: ${(val/total*100).toFixed(1)}%`),
    explicacao: 'Concentração excessiva em uma única categoria — especialmente as históricamente problemáticas (veículos, publicidade, consultoria) — indica possível foco nos setores mais fáceis de fraudar.',
    metodologia: 'Calcula percentual de cada categoria no total. Cruza com lista de categorias de alto risco histórico (SECTOR_SUSPICION).',
    base_legal: 'CGU — categorias de maior risco em auditorias da CEAP 2019-2024.',
    impacto: `${topCat?.[0]?.slice(0,35)} representa ${pctTop.toFixed(1)}% de todos os gastos`,
  };
}
 
// ─── HELPER ───────────────────────────────────────────────────────────────────
function normalizar(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+(ltda|sa|s\.a\.|epp|me|eireli|ss|filial)\.?/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim();
}
 
