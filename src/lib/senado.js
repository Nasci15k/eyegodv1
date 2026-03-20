/**
 * Senado Federal — API Completa v2.0
 * Base: legis.senado.leg.br/dadosabertos/v3
 * Pública, sem autenticação, Accept: application/json
 */
 
const SENADO_BASE = 'https://legis.senado.leg.br/dadosabertos';
 
async function fetchSenado(path) {
  try {
    const res = await fetch(`${SENADO_BASE}${path}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      console.warn(`Senado HTTP ${res.status} para ${path}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Erro Senado [${path}]:`, err.message);
    return null;
  }
}
 
// ─── SENADORES ────────────────────────────────────────────────────────────────
 
/** Lista todos os senadores em exercício */
export async function fetchSenadores() {
  const data = await fetchSenado('/senador/lista/atual.json');
  const lista = data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
 
  return lista.map(s => ({
    id: s.IdentificacaoParlamentar.CodigoParlamentar,
    nome: s.IdentificacaoParlamentar.NomeParlamentar,
    nomeCompleto: s.IdentificacaoParlamentar.NomeCompletoParlamentar,
    partido: s.IdentificacaoParlamentar.SiglaPartidoParlamentar,
    uf: s.IdentificacaoParlamentar.UfParlamentar,
    foto: s.IdentificacaoParlamentar.UrlFotoParlamentar,
    email: s.IdentificacaoParlamentar.EmailParlamentar,
    urlPagina: s.IdentificacaoParlamentar.UrlPaginaParlamentar,
    sexo: s.IdentificacaoParlamentar.SexoParlamentar,
    formaTratamento: s.IdentificacaoParlamentar.FormaTratamento,
  }));
}
 
/** Detalhes completos de um senador */
export async function fetchSenadorDetalhes(codigoParlamentar) {
  const data = await fetchSenado(`/senador/${codigoParlamentar}.json`);
  return data?.DetalheParlamentar?.Parlamentar || null;
}
 
/** Cargos ocupados pelo senador */
export async function fetchSenadorCargos(codigoParlamentar) {
  const data = await fetchSenado(`/senador/${codigoParlamentar}/cargos.json`);
  const cargos = data?.CargoParlamentar?.Parlamentar?.Cargos?.Cargo || [];
  return Array.isArray(cargos) ? cargos : [cargos];
}
 
/** Comissões do senador */
export async function fetchSenadorComissoes(codigoParlamentar) {
  const data = await fetchSenado(`/senador/${codigoParlamentar}/comissoes.json`);
  const comissoes = data?.MembroComissaoParlamentar?.Parlamentar?.MembroComissoes?.Comissao || [];
  return (Array.isArray(comissoes) ? comissoes : [comissoes]).map(c => ({
    sigla: c.IdentificacaoComissao?.SiglaComissao,
    nome: c.IdentificacaoComissao?.NomeComissao,
    casa: c.IdentificacaoComissao?.SiglaCasaComissao,
    cargo: c.DescricaoParticipacao,
    dataInicio: c.DataInicio,
    dataFim: c.DataFim,
  }));
}
 
/** Mandatos do senador */
export async function fetchSenadorMandatos(codigoParlamentar) {
  const data = await fetchSenado(`/senador/${codigoParlamentar}/mandatos.json`);
  const mandatos = data?.MandatoParlamentar?.Parlamentar?.Mandatos?.Mandato || [];
  return Array.isArray(mandatos) ? mandatos : [mandatos];
}
 
/** Filiações partidárias históricas */
export async function fetchSenadorFiliacoes(codigoParlamentar) {
  const data = await fetchSenado(`/senador/${codigoParlamentar}/filiacoes.json`);
  const filiacoes = data?.FiliacaoPartidaria?.Parlamentar?.Filiacoes?.Filiacao || [];
  return (Array.isArray(filiacoes) ? filiacoes : [filiacoes]).map(f => ({
    partido: f.Partido?.SiglaPartido,
    nomePartido: f.Partido?.NomePartido,
    dataFiliacao: f.DataFiliacao,
    dataDesfiliacao: f.DataDesfiliacao,
  }));
}
 
/** Histórico acadêmico do senador */
export async function fetchSenadorAcademico(codigoParlamentar) {
  const data = await fetchSenado(`/senador/${codigoParlamentar}/historicoAcademico.json`);
  const cursos = data?.HistoricoAcademicoParlamentar?.Parlamentar?.historicoAcademico?.curso || [];
  return Array.isArray(cursos) ? cursos : [cursos];
}
 
/** Profissões do senador */
export async function fetchSenadorProfissoes(codigoParlamentar) {
  const data = await fetchSenado(`/senador/${codigoParlamentar}/profissao.json`);
  const profissoes = data?.ProfissaoParlamentar?.Parlamentar?.Profissoes?.Profissao || [];
  return Array.isArray(profissoes) ? profissoes : [profissoes];
}
 
// ─── DISCURSOS ────────────────────────────────────────────────────────────────
 
/** Discursos recentes de um senador */
export async function fetchSenadorDiscursos(codigoParlamentar, dataInicio, dataFim) {
  // Formato datas: YYYYMMDD
  const hoje = new Date();
  const fim = dataFim || formatarData(hoje);
  const inicio = dataInicio || formatarData(new Date(hoje - 30 * 86400000)); // último mês
 
  const data = await fetchSenado(
    `/plenario/lista/discursos/${inicio}/${fim}.json`
  );
 
  const discursos = data?.ListaDiscursos?.Discursos?.Discurso || [];
  const lista = Array.isArray(discursos) ? discursos : [discursos];
 
  // Filtra pelo código do parlamentar se fornecido
  return lista
    .filter(d => !codigoParlamentar || d.Parlamentar?.CodigoParlamentar == codigoParlamentar)
    .map(d => ({
      codigo: d.CodigoDiscurso,
      data: d.DataSessao || d.DataUsoWord,
      hora: d.HoraInicioUsoWord,
      sessao: d.CodigoSessao,
      tipoSessao: d.SiglaTipoSessao,
      parlamentar: d.Parlamentar?.NomeParlamentar,
      partido: d.Parlamentar?.SiglaPartido,
      uf: d.Parlamentar?.UfParlamentar,
      resumo: d.TextoResumo,
      urlAudio: d.UrlAudio,
      urlVideo: d.UrlVideo,
      urlTexto: d.UrlTexto,
    }));
}
 
/** Texto integral de um pronunciamento */
export async function fetchTextoDiscurso(codigoPronunciamento) {
  const data = await fetchSenado(`/discurso/texto-integral/${codigoPronunciamento}`);
  return data;
}
 
// ─── VOTAÇÕES ────────────────────────────────────────────────────────────────
 
/** Votações nominais em determinado período */
export async function fetchVotacoesNominais(dataInicio, dataFim) {
  const hoje = new Date();
  const fim = dataFim || formatarData(hoje);
  const inicio = dataInicio || formatarData(new Date(hoje - 30 * 86400000));
 
  const data = await fetchSenado(`/votacao?dataInicio=${inicio}&dataFim=${fim}.json`);
  const votacoes = data?.VotacaoParlamentar?.Votacoes?.Votacao || [];
  const lista = Array.isArray(votacoes) ? votacoes : [votacoes];
 
  return lista.map(v => ({
    codigo: v.CodigoSessaoVotacao,
    data: v.DataSessao,
    descricao: v.DescricaoVotacao,
    resultado: v.DescricaoResultado,
    totalSim: v.TotalVotosSim,
    totalNao: v.TotalVotosNao,
    totalAbstencao: v.TotalVotosAbstencao,
    materia: v.IdentificacaoMateria,
    ementa: v.EmentaMateria,
  }));
}
 
/** Votos de um senador específico */
export async function fetchVotosSenador(codigoParlamentar, dataInicio, dataFim) {
  const hoje = new Date();
  const fim = dataFim || formatarData(hoje);
  const inicio = dataInicio || formatarData(new Date(hoje - 180 * 86400000)); // 6 meses
 
  const data = await fetchSenado(
    `/votacao?codigoParlamentar=${codigoParlamentar}&dataInicio=${inicio}&dataFim=${fim}.json`
  );
 
  const votos = data?.VotacaoParlamentar?.Parlamentar?.Votacoes?.Votacao || [];
  const lista = Array.isArray(votos) ? votos : [votos];
 
  const contagem = { sim: 0, nao: 0, abstencao: 0, ausente: 0, total: 0 };
  const votacoes = lista.map(v => {
    const voto = v.SiglaVoto?.toUpperCase();
    if (voto === 'SIM') contagem.sim++;
    else if (voto === 'NÃO' || voto === 'NAO') contagem.nao++;
    else if (voto === 'ABS') contagem.abstencao++;
    else contagem.ausente++;
    contagem.total++;
 
    return {
      data: v.DataSessao,
      descricao: v.DescricaoVotacao,
      voto: v.SiglaVoto,
      resultado: v.DescricaoResultado,
      materia: v.IdentificacaoMateria,
    };
  });
 
  return {
    votacoes,
    estatisticas: {
      ...contagem,
      pctPresenca: contagem.total > 0
        ? ((contagem.sim + contagem.nao + contagem.abstencao) / contagem.total * 100).toFixed(1)
        : 0,
      pctSim: contagem.total > 0 ? (contagem.sim / contagem.total * 100).toFixed(1) : 0,
    },
  };
}
 
/** Orientação de bancada nas votações */
export async function fetchOrientacaoBancada(dataInicio, dataFim) {
  const hoje = new Date();
  const fim = dataFim || formatarData(hoje);
  const inicio = dataInicio || formatarData(new Date(hoje - 30 * 86400000));
 
  const data = await fetchSenado(
    `/plenario/votacao/orientacaoBancada/${inicio}/${fim}.json`
  );
  return data?.OrientacaoBancadaVotacao || [];
}
 
// ─── AGENDA ───────────────────────────────────────────────────────────────────
 
/** Agenda do plenário do mês atual */
export async function fetchAgendaPlenario() {
  const mesAtual = new Date().toISOString().slice(0, 7).replace('-', '');
  const data = await fetchSenado(`/plenario/agenda/mes/${mesAtual}.json`);
  const sessoes = data?.AgendaReunião?.Sessoes?.Sessao || [];
  return Array.isArray(sessoes) ? sessoes : [sessoes];
}
 
/** Agenda das comissões */
export async function fetchAgendaComissoes(dataInicio, dataFim) {
  const hoje = new Date();
  const fim = dataFim || formatarData(hoje);
  const inicio = dataInicio || formatarData(hoje);
  const data = await fetchSenado(`/comissao/agenda/${inicio}/${fim}.json`);
  return data?.AgendaReunião?.Reunioes?.Reuniao || [];
}
 
// ─── PROCESSOS LEGISLATIVOS ───────────────────────────────────────────────────
 
/** Busca processos/matérias legislativas */
export async function fetchProcessos(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.sigla) params.set('sigla', filtros.sigla);
  if (filtros.numero) params.set('numero', filtros.numero);
  if (filtros.ano) params.set('ano', filtros.ano);
  if (filtros.autor) params.set('autor', filtros.autor);
  if (filtros.tramitando) params.set('tramitando', filtros.tramitando);
  params.set('pagina', filtros.pagina || 1);
 
  const data = await fetchSenado(`/processo?${params.toString()}`);
  const processos = data?.ListaProcessos?.Processos?.Processo || [];
  return Array.isArray(processos) ? processos : [processos];
}
 
/** Detalhes de um processo específico */
export async function fetchProcessoDetalhes(id) {
  const data = await fetchSenado(`/processo/${id}.json`);
  return data?.DetalheProcesso?.Processo || null;
}
 
/** Emendas de um processo */
export async function fetchEmendasProcesso(id) {
  const data = await fetchSenado(`/processo/emenda?idProcesso=${id}`);
  return data?.EmendaProcesso?.Emendas?.Emenda || [];
}
 
// ─── COMISSÕES ────────────────────────────────────────────────────────────────
 
/** Lista de comissões ativas */
export async function fetchComissoes() {
  const data = await fetchSenado('/comissao/lista/colegiados.json');
  const lista = data?.ListaComissoesEmAtividade?.Comissoes?.Comissao || [];
  return (Array.isArray(lista) ? lista : [lista]).map(c => ({
    codigo: c.CodigoColegiado,
    sigla: c.SiglaColegiado,
    nome: c.NomeColegiado,
    casa: c.SiglaCasa,
    tipo: c.SiglaTipoColegiado,
    descricaoTipo: c.DescricaoTipoColegiado,
  }));
}
 
/** Composição atual de uma comissão */
export async function fetchComissaoComposicao(codigo) {
  const data = await fetchSenado(`/composicao/comissao/${codigo}.json`);
  const membros = data?.ComposicaoComissao?.Comissao?.MembroAtual?.Membro || [];
  return (Array.isArray(membros) ? membros : [membros]).map(m => ({
    codigo: m.Parlamentar?.CodigoParlamentar,
    nome: m.Parlamentar?.NomeParlamentar,
    partido: m.Parlamentar?.SiglaPartido,
    uf: m.Parlamentar?.UfParlamentar,
    cargo: m.DescricaoParticipacao,
    foto: m.Parlamentar?.UrlFotoParlamentar,
  }));
}
 
// ─── GASTOS CEAPS ────────────────────────────────────────────────────────────
 
/**
 * Download da planilha CEAPS do Senado
 * Arquivo CSV oficial em: senado.leg.br/transparencia/LAI/verba/
 * CORS free — download direto do portal
 */
export async function fetchCEAPSSenado(ano = 2024) {
  try {
    // O Senado disponibiliza CSV direto (sem CORS) via URL pública
    const url = `https://www.senado.leg.br/transparencia/LAI/verba/ceaps_${ano}.csv`;
    const res = await fetch(url);
 
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
 
    return parsarCSVSenado(text, ano);
  } catch (err) {
    console.error(`Erro CEAPS ${ano}:`, err);
    return {
      error: err.message,
      linkDownload: `https://www.senado.leg.br/transparencia/LAI/verba/`,
      instrucao: `Baixe o arquivo ceaps_${ano}.csv manualmente no link acima.`,
    };
  }
}
 
function parsarCSVSenado(csvText, ano) {
  const linhas = csvText.split('\n').filter(l => l.trim());
  if (linhas.length < 2) return { data: [], total: 0 };
 
  // Detecta separador (CSV pode usar ; ou ,)
  const sep = linhas[0].includes(';') ? ';' : ',';
  const headers = linhas[0].split(sep).map(h => h.trim().replace(/"/g, '').toLowerCase());
 
  const rows = linhas.slice(1).map(linha => {
    const cols = linha.split(sep).map(c => c.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
 
    // Normaliza campos para o mesmo padrão da Câmara
    return {
      txNomeParlamentar: obj['senador'] || obj['nome'] || obj['parlamentar'] || '',
      sgPartido: obj['partido'] || '',
      sgUF: obj['uf'] || '',
      txtDescricao: obj['tipo_despesa'] || obj['tipodespesa'] || obj['tipo'] || '',
      txtFornecedor: obj['fornecedor'] || obj['beneficiario'] || '',
      txtCNPJCPF: obj['cnpj_cpf'] || obj['cnpj'] || obj['cpf'] || '',
      vlrLiquido: parseFloat((obj['valor_reembolsado'] || obj['valor'] || '0').replace(',', '.')) || 0,
      numMes: parseInt(obj['mes'] || obj['month'] || '1'),
      numAno: parseInt(obj['ano'] || String(ano)),
      datEmissao: obj['data'] || `${ano}-01-01`,
      casa: 'SF', // Senado Federal
    };
  }).filter(r => r.txNomeParlamentar && r.vlrLiquido > 0);
 
  const total = rows.reduce((s, r) => s + r.vlrLiquido, 0);
 
  return {
    data: rows,
    total: rows.length,
    totalGasto: total,
    ano,
  };
}
 
// ─── BATCH COMPLETO SENADOR ───────────────────────────────────────────────────
 
/**
 * Dossiê completo de um senador
 * Retorna: dados pessoais + comissões + mandatos + votos recentes + discursos recentes
 */
export async function fetchDossierSenador(codigoParlamentar) {
  const [detalhes, cargos, comissoes, mandatos, filiacoes, profissoes, votos, discursos] =
    await Promise.all([
      fetchSenadorDetalhes(codigoParlamentar),
      fetchSenadorCargos(codigoParlamentar),
      fetchSenadorComissoes(codigoParlamentar),
      fetchSenadorMandatos(codigoParlamentar),
      fetchSenadorFiliacoes(codigoParlamentar),
      fetchSenadorProfissoes(codigoParlamentar),
      fetchVotosSenador(codigoParlamentar),
      fetchSenadorDiscursos(codigoParlamentar),
    ]);
 
  return {
    detalhes,
    cargos,
    comissoes,
    mandatos,
    filiacoes,
    profissoes,
    votos,
    discursos: discursos.slice(0, 10),
    totalComissoes: comissoes.length,
    totalMandatos: Array.isArray(mandatos) ? mandatos.length : 0,
  };
}
 
// ─── LIDERANÇAS ───────────────────────────────────────────────────────────────
 
/** Lista lideranças atuais (SF + CN + CD) */
export async function fetchLiderancas() {
  const data = await fetchSenado('/composicao/lideranca.json');
  const liderancas = data?.ListaLiderancas?.Liderancas?.Lideranca || [];
  return Array.isArray(liderancas) ? liderancas : [liderancas];
}
 
// ─── HELPERS ─────────────────────────────────────────────────────────────────
 
function formatarData(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}
 
