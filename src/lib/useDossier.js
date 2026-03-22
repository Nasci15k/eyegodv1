/**
 * useDossier — Hook central que dispara TODAS as APIs automaticamente
 * ao selecionar um parlamentar pelo nome
 */

import { useState, useEffect } from 'react';
import { fetchCandidaturasTSE, fetchBensTSE, fetchPrestacaoContasTSE } from './tse.js';
import { fetchEmendasParlamentares, fetchContratos, fetchViagensGoverno, fetchCEIS, fetchCNEP, fetchCEPIM, fetchBolsaFamilia, fetchServidores } from './cgu.js';
import { fetchMandadosPrisao, fetchDataJud, fetchTCUIrregularidades } from './cnj.js';
import { fetchDOU } from './dou.js';
import { fetchLocalidadeIBGE, fetchPIBMunicipal } from './ibge.js';
import { fetchSiconfiDespesas } from './tesouro.js';
import { fetchCVMInfo } from './cvm_tcu.js';
import { fetchANACRAB } from './ativos.js';
import { fetchEscandalos } from './news.js';
import { fetchCNPJ } from './brasilapi.js';
import { fetchReceitaWS } from './receitaws.js';
import { fetchDeputadoDetails, fetchVotacoesDeputado } from './camara.js';
import { calcularScoreSuspeicao, detectarLaranja, detectarFracionamento, detectarSocioParlamentar, analiseBenford, calcularHHI } from './intelligence.js';

const CGUKEY = () => localStorage.getItem('cguKey') || import.meta.env?.VITE_CGU_KEY || '';

// Status de cada fonte
const STATUS = { idle: 'idle', loading: 'loading', done: 'done', error: 'error' };

export function useDossier(nome, ceapRows = []) {
  const [status, setStatus] = useState({});
  const [dados, setDados] = useState({});
  const [score, setScore] = useState(null);
  const [alertas, setAlertas] = useState([]);

  const set = (key, value, st = STATUS.done) => {
    setDados(prev => ({ ...prev, [key]: value }));
    setStatus(prev => ({ ...prev, [key]: st }));
  };

  const setLoading = (key) => setStatus(prev => ({ ...prev, [key]: STATUS.loading }));

  useEffect(() => {
    if (!nome) {
      setDados({});
      setStatus({});
      setScore(null);
      setAlertas([]);
      return;
    }

    // Reseta
    setDados({});
    setScore(null);
    setAlertas([]);
    setStatus({
      camara: STATUS.loading, tse: STATUS.loading, bens: STATUS.loading,
      financiadores: STATUS.loading, emendas: STATUS.loading, noticias: STATUS.loading,
      mandados: STATUS.loading, dou: STATUS.loading, tcu: STATUS.loading,
      anac: STATUS.loading, ibge: STATUS.loading, votacoes: STATUS.loading,
    });

    async function run() {
      // ── 1. CÂMARA (ID + detalhes + votações) ─────────────────────────────
      let deputadoId = null;
      let deputadoDetalhe = null;
      try {
        const deps = await fetch('https://dadosabertos.camara.leg.br/api/v2/deputados?pagina=1&itens=100&ordem=ASC&ordenarPor=nome')
          .then(r => r.json()).then(d => d.dados || []).catch(() => []);
        const found = deps.find(d => {
  const nomeApi = d.nome?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const nomeBusca = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return nomeBusca.split(' ').filter(p => p.length > 3).every(p => nomeApi.includes(p));
});
        if (found) {
          deputadoId = found.id;
          const [det, vots] = await Promise.all([
            fetchDeputadoDetails(found.id),
            fetchVotacoesDeputado(found.id),
          ]);
          deputadoDetalhe = det;
          set('camara', { deputado: found, detalhes: det, votacoes: vots || [] });
        } else {
          set('camara', { votacoes: [] });
        }
      } catch { set('camara', { votacoes: [] }, STATUS.error); }

      // ── 2. TSE (candidatura + bens + financiadores) ───────────────────────
      let candidato = null;
      try {
        const cands = await fetchCandidaturasTSE(nome);
        candidato = cands?.[0] || null;
        set('tse', { candidato, candidatos: cands });

        if (candidato?.id) {
          // Bens e financiadores em paralelo
          const [bens, fin] = await Promise.all([
            fetchBensTSE(candidato.id, candidato.anoEleicao || '2022', candidato.uf || 'BR'),
            fetchPrestacaoContasTSE(candidato.id, candidato.anoEleicao || '2022', candidato.uf || 'BR'),
          ]);
          set('bens', bens || []);
          set('financiadores', fin || []);
        } else {
          set('bens', []);
          set('financiadores', []);
        }
      } catch {
        set('tse', {}, STATUS.error);
        set('bens', []);
        set('financiadores', []);
      }

      // ── 3. CGU (emendas + viagens) ────────────────────────────────────────
      try {
        const apiKey = CGUKEY();
        const [emendas, viagens] = await Promise.all([
          fetchEmendasParlamentares(deputadoId, '2024', apiKey),
          fetchViagensGoverno(candidato?.cpf || '', apiKey),
        ]);
        set('emendas', {
          lista: emendas?.data || [],
          total: (emendas?.data || []).reduce((s, e) => s + (parseFloat(e.valorEmpenhado) || 0), 0),
          viagens: viagens?.data || [],
        });
      } catch { set('emendas', { lista: [], total: 0, viagens: [] }, STATUS.error); }

      // ── 4. NOTÍCIAS (Google News RSS) ─────────────────────────────────────
      try {
        const noticias = await fetchEscandalos(nome);
        set('noticias', noticias || []);
      } catch { set('noticias', [], STATUS.error); }

      // ── 5. CNJ (mandados de prisão + DataJud) ─────────────────────────────
      try {
        const [mandados, datajud] = await Promise.all([
          fetchMandadosPrisao(nome),
          fetchDataJud(nome),
        ]);
        set('mandados', { ...mandados, datajud });
      } catch { set('mandados', { mandadosAbertos: 0 }, STATUS.error); }

      // ── 6. TCU ────────────────────────────────────────────────────────────
      try {
        const tcu = await fetchTCUIrregularidades(candidato?.cpf || nome);
        set('tcu', tcu);
      } catch { set('tcu', { irregular: false }, STATUS.error); }

      // ── 7. DOU ────────────────────────────────────────────────────────────
      try {
        const dou = await fetchDOU(nome);
        set('dou', dou);
      } catch { set('dou', { total: 0, items: [] }, STATUS.error); }

      // ── 8. ANAC (aeronaves) ───────────────────────────────────────────────
      try {
        const anac = await fetchANACRAB(candidato?.cpf || '');
        set('anac', anac);
      } catch { set('anac', {}, STATUS.error); }

      // ── 9. IBGE + Tesouro (município do deputado) ─────────────────────────
      try {
        const municipio = deputadoDetalhe?.ultimoStatus?.nomeMunicipio;
        const uf = deputadoDetalhe?.ultimoStatus?.siglaUf;
        if (municipio && uf) {
          const codIbge = await fetchLocalidadeIBGE(municipio, uf);
          if (codIbge) {
            const [pib, despesas] = await Promise.all([
              fetchPIBMunicipal(codIbge),
              fetchSiconfiDespesas(codIbge),
            ]);
            set('ibge', { municipio, uf, codIbge, pib, despesas: despesas || [] });
          } else {
            set('ibge', { municipio, uf });
          }
        } else {
          set('ibge', {});
        }
      } catch { set('ibge', {}, STATUS.error); }

      // ── 10. ANÁLISE DOS FORNECEDORES CEAP (BrasilAPI + sanções CGU) ───────
      if (ceapRows.length > 0) {
        // Top 3 fornecedores — busca CNPJ + sanções
        const byForn = {};
        ceapRows.forEach(r => {
          const k = r.txtCNPJCPF;
          if (!byForn[k]) byForn[k] = { cnpj: k, nome: r.txtFornecedor, total: 0 };
          byForn[k].total += r.vlrLiquido;
        });
        const top3 = Object.values(byForn)
          .sort((a, b) => b.total - a.total)
          .slice(0, 3)
          .filter(f => f.cnpj?.replace(/\D/g, '').length === 14);

        const fornDetalhes = await Promise.all(
          top3.map(async f => {
            const clean = f.cnpj.replace(/\D/g, '');
            const [info, sancoes] = await Promise.all([
              fetchCNPJ(clean).catch(() => null) || fetchReceitaWS(clean).catch(() => null),
              CGUKEY() ? fetchCEIS(clean, CGUKEY()).catch(() => null) : null,
            ]);
            const ehLaranja = info ? detectarLaranja(
              info.data_inicio_atividade || info.abertura,
              ceapRows.filter(r => r.txtCNPJCPF === f.cnpj).slice(-1)[0]?.datEmissao
            ) : false;
            return { ...f, info, sancoes, ehLaranja };
          })
        );
        set('fornecedores', fornDetalhes);
      }

      // ── 11. SCORE FINAL ───────────────────────────────────────────────────
      setDados(prev => {
        const dadosAtuais = prev;

        // Análise CEAP
        const benford = ceapRows.length > 30 ? analiseBenford(ceapRows.map(r => r.vlrLiquido)) : { suspeito: false };
        const hhi = calcularHHI(ceapRows);
        const redondos = ceapRows.length > 0
          ? ceapRows.filter(r => r.vlrLiquido % 1000 < 0.01 || r.vlrLiquido % 500 < 0.01).length / ceapRows.length * 100
          : 0;
        const fracionamento = detectarFracionamento(ceapRows);

        const scoreDados = {
          cnj: dadosAtuais.mandados,
          tcu: dadosAtuais.tcu,
          cgu: {
            ceis: dadosAtuais.fornecedores?.find(f => f.sancoes?.temSancao),
            cnep: null,
          },
          benfordAlert: benford.suspeito,
          benfordChi2: benford.chi2,
          fracionamento,
          valoresRedondos: redondos,
          hhi: hhi?.valor || 0,
          empresaNova: dadosAtuais.fornecedores?.some(f => f.ehLaranja),
        };

        const scoreResult = calcularScoreSuspeicao(scoreDados);
        setScore(scoreResult);

        // Monta alertas consolidados
        const novosAlertas = [];
        if (dadosAtuais.mandados?.mandadosAbertos > 0)
          novosAlertas.push({ nivel: 'red', fonte: 'CNJ/BNMP', msg: `${dadosAtuais.mandados.mandadosAbertos} mandado(s) de prisão em aberto.` });
        if (dadosAtuais.tcu?.irregular)
          novosAlertas.push({ nivel: 'red', fonte: 'TCU', msg: dadosAtuais.tcu.resumo });
        if (benford.suspeito)
          novosAlertas.push({ nivel: 'red', fonte: 'Benford', msg: benford.interpretacao });
        if (hhi?.valor > 2500)
          novosAlertas.push({ nivel: 'amber', fonte: 'HHI', msg: `Concentração de fornecedores HHI = ${hhi.valor} (${hhi.nivel})` });
        if (redondos > 30)
          novosAlertas.push({ nivel: 'amber', fonte: 'Valores', msg: `${redondos.toFixed(1)}% dos valores são redondos suspeitos.` });
        if (dadosAtuais.fornecedores?.some(f => f.ehLaranja))
          novosAlertas.push({ nivel: 'red', fonte: 'Receita', msg: 'Fornecedor principal aberto menos de 6 meses antes dos pagamentos.' });
        if (dadosAtuais.noticias?.length > 3)
          novosAlertas.push({ nivel: 'amber', fonte: 'Notícias', msg: `${dadosAtuais.noticias.length} notícias investigativas encontradas.` });
        if (dadosAtuais.dou?.total > 0)
          novosAlertas.push({ nivel: 'teal', fonte: 'DOU', msg: `${dadosAtuais.dou.total} menções no Diário Oficial da União.` });

        setAlertas(novosAlertas);
        return prev;
      });
    }

    run();
  }, [nome]);

  const isLoading = Object.values(status).some(s => s === STATUS.loading);
  const progress = Object.values(status).length > 0
    ? Math.round(Object.values(status).filter(s => s !== STATUS.loading).length / Object.values(status).length * 100)
    : 0;

  return { dados, status, score, alertas, isLoading, progress };
}
