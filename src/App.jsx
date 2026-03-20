import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from './lib/supabase.js';
import { fetchCEP, fetchCNPJ } from './lib/brasilapi.js';
import { fetchSenadores } from './lib/senado.js';
import { fetchCEIS, fetchCNEP, fetchCEAF, fetchEmendasParlamentares, fetchViagensGoverno, fetchContratos, fetchConvenios, fetchBolsaFamilia, fetchServidores, fetchLicitacoes, fetchCEPIM } from './lib/cgu.js';
import { fetchEscandalos } from './lib/news.js';
import { fetchCandidaturasTSE, fetchBensTSE, fetchPrestacaoContasTSE, fetchFiliadosPartido } from './lib/tse.js';
import { fetchVotacoesDeputado, fetchDeputadoDetails } from './lib/camara.js';
import { fetchReceitaWS } from './lib/receitaws.js';
import { fetchMandadosPrisao, fetchDataJud } from './lib/cnj.js';
import { fetchSiconfiDespesas } from './lib/tesouro.js';
import { fetchLocalidadeIBGE, fetchPIBMunicipal } from './lib/ibge.js';
import { fetchCVMInfo, fetchTCUIrregularidades } from './lib/cvm_tcu.js';
import { fetchANACRAB, fetchDetranVeiculos } from './lib/ativos.js';
import { fetchDOU } from './lib/dou.js';
import { calcularScoreSuspeicao, analiseBenford, detectarLaranja } from './lib/intelligence.js';
import { gerarResumoInvestigativo } from './lib/ai.js';
// ─── DESIGN TOKENS (extraídos do CSS original) ───────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-primary: #0a0a0c;
  --bg-secondary: #111114;
  --bg-tertiary: #1a1a1f;
  --bg-card: rgba(17,17,20,0.9);
  --bg-card-solid: #141417;
  --accent-red: #e04545;
  --accent-amber: #d4a03a;
  --accent-teal: #3d9996;
  --accent-blue: #4682b4;
  --accent-purple: #9b59b6;
  --text-primary: #f5f5f3;
  --text-secondary: #9a9ca8;
  --text-muted: #7a7c88;
  --status-low: #34a853;
  --border: #232328;
  --border-hover: #35353d;
  --font-display: 'Bebas Neue', 'Oswald', sans-serif;
  --font-body: 'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

html, body {
  font-family: var(--font-body);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.01em;
  overflow-x: hidden;
}

body {
  background-image:
    radial-gradient(80% 50% at 50% -20%, rgba(61,153,150,0.08), transparent),
    radial-gradient(60% 40% at 100% 100%, rgba(70,130,180,0.05), transparent);
  background-attachment: fixed;
  min-height: 100vh;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-secondary); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-hover); }
::selection { background: var(--accent-teal); color: var(--bg-primary); }

/* LAYOUT */
.app { display: flex; min-height: 100vh; }

/* SIDEBAR */
.sidebar {
  width: 256px; flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 30;
  overflow-y: auto;
}
.sidebar-brand {
  padding: 24px;
  border-bottom: 1px solid var(--border);
}
.sidebar-logo {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 0.15em;
  color: var(--accent-teal);
}
.sidebar-tagline {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 4px;
}
.sidebar-section {
  padding: 16px 16px 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 16px;
  border-radius: 6px;
  margin: 1px 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.15s;
  border: 1px solid transparent;
  text-decoration: none;
}
.nav-item:hover { background: rgba(61,153,150,0.08); color: var(--text-primary); border-color: rgba(61,153,150,0.15); }
.nav-item.active { background: rgba(61,153,150,0.12); color: var(--accent-teal); border-color: rgba(61,153,150,0.2); }
.nav-item .nav-icon { font-size: 16px; flex-shrink: 0; }
.nav-badge {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(61,153,150,0.15);
  color: var(--accent-teal);
  border: 1px solid rgba(61,153,150,0.2);
}
.nav-badge.red { background: rgba(224,69,69,0.12); color: var(--accent-red); border-color: rgba(224,69,69,0.2); }
.sidebar-footer {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
}

/* MAIN CONTENT */
.main {
  margin-left: 256px;
  flex: 1;
  min-height: 100vh;
  display: flex; flex-direction: column;
}

/* TOP BAR */
.topbar {
  position: sticky; top: 0; z-index: 20;
  background: rgba(17,17,20,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 12px 24px;
  display: flex; align-items: center; gap: 16px;
}
.topbar-title {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.08em;
  flex: 1;
}
.topbar-source {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
}
.topbar-live {
  display: flex; align-items: center; gap: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--status-low);
}
.live-dot {
  width: 6px; height: 6px;
  background: var(--status-low);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* PAGE */
.page { padding: 24px; flex: 1; }
.page-header { margin-bottom: 20px; }
.page-title {
  font-family: var(--font-display);
  font-size: 32px;
  letter-spacing: 0.06em;
  line-height: 1;
}
.page-desc { color: var(--text-secondary); font-size: 13px; margin-top: 4px; }

/* GLASS CARD */
.glass-card {
  backdrop-filter: blur(16px);
  background: linear-gradient(145deg, rgba(17,17,20,0.9), rgba(17,17,20,0.75));
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 16px;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 24px -4px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.02);
}
.glass-card:hover {
  border-color: rgba(61,153,150,0.15);
  box-shadow: 0 8px 32px -8px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(61,153,150,0.08);
}

/* STAT CARD */
.stat-card {
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent-color, transparent);
  border-radius: 16px 16px 0 0;
  opacity: 0.6;
}
.stat-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}
.stat-value {
  font-family: var(--font-display);
  font-size: 2.4rem;
  line-height: 1;
  letter-spacing: 0.02em;
}
.stat-sub {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 6px;
}
.stat-icon {
  position: absolute; top: 16px; right: 16px;
  font-size: 24px; opacity: 0.12;
}

/* SECTION HEADER */
.section-header {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.06em;
  margin-bottom: 14px;
  margin-top: 6px;
}
.section-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--accent-red);
  flex-shrink: 0;
}
.section-dot.teal { background: var(--accent-teal); }
.section-dot.amber { background: var(--accent-amber); }

/* GRID LAYOUTS */
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }

/* TABLE */
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-weight: 500;
}
.data-table td { padding: 10px 12px; border-bottom: 1px solid rgba(35,35,40,0.5); }
.data-table tr:hover td { background: rgba(61,153,150,0.04); }
.data-table tr:last-child td { border-bottom: none; }

/* RANK NUMBER */
.rank {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  width: 28px; text-align: center;
}
.rank.top { color: var(--accent-amber); font-weight: 500; }

/* MONEY VALUES */
.money {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
}
.money.big { color: var(--accent-red); font-size: 14px; }
.money.mid { color: var(--accent-amber); }

/* BADGE */
.badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 3px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  white-space: nowrap;
}
.badge-red { background: rgba(224,69,69,0.12); color: var(--accent-red); border: 1px solid rgba(224,69,69,0.25); }
.badge-amber { background: rgba(212,160,58,0.12); color: var(--accent-amber); border: 1px solid rgba(212,160,58,0.25); }
.badge-teal { background: rgba(61,153,150,0.12); color: var(--accent-teal); border: 1px solid rgba(61,153,150,0.25); }
.badge-green { background: rgba(52,168,83,0.12); color: var(--status-low); border: 1px solid rgba(52,168,83,0.25); }
.badge-purple { background: rgba(155,89,182,0.12); color: var(--accent-purple); border: 1px solid rgba(155,89,182,0.25); }

/* BAR CHART */
.bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.bar-label { font-size: 11px; color: var(--text-secondary); width: 180px; flex-shrink: 0; truncate: true; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { flex: 1; height: 6px; background: rgba(255,255,255,0.04); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 3px; transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }
.bar-val { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); width: 70px; text-align: right; flex-shrink: 0; }

/* ALERT CARD */
.alert-card {
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 10px;
  border-left-width: 3px;
  border-left-style: solid;
}
.alert-card.red { background: rgba(224,69,69,0.06); border-color: var(--accent-red); }
.alert-card.amber { background: rgba(212,160,58,0.06); border-color: var(--accent-amber); }
.alert-card.teal { background: rgba(61,153,150,0.06); border-color: var(--accent-teal); }
.alert-title { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500; margin-bottom: 4px; }
.alert-body { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

/* SEARCH INPUT */
.search-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}
.search-input:focus { border-color: var(--accent-teal); }
.search-input::placeholder { color: var(--text-muted); }

/* SELECT */
.select-input {
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}
.select-input:focus { border-color: var(--accent-teal); }

/* BUTTON */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  border-radius: 7px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.btn:hover { border-color: var(--accent-teal); color: var(--accent-teal); background: rgba(61,153,150,0.06); }
.btn-primary {
  background: var(--accent-teal);
  color: var(--bg-primary);
  border-color: var(--accent-teal);
  font-weight: 700;
}
.btn-primary:hover { background: rgba(61,153,150,0.85); color: var(--bg-primary); }
.btn-danger { background: rgba(224,69,69,0.1); border-color: rgba(224,69,69,0.3); color: var(--accent-red); }
.btn-danger:hover { background: rgba(224,69,69,0.2); }

/* TABS */
.tabs { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 20px; gap: 0; }
.tab-item {
  padding: 10px 18px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
}
.tab-item:hover { color: var(--text-primary); }
.tab-item.active { color: var(--text-primary); border-bottom-color: var(--accent-red); }

/* PROGRESS BAR for loading */
.loading-bar { position: fixed; top: 0; left: 0; right: 0; height: 2px; background: transparent; z-index: 9999; }
.loading-bar-fill { height: 100%; background: var(--accent-teal); transition: width 0.3s; }

/* TOOLTIP-like info row */
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(35,35,40,0.6); }
.info-row:last-child { border-bottom: none; }
.info-key { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.info-val { font-size: 13px; color: var(--text-primary); }

/* CHART BARS */
.chart-bars { display: flex; align-items: flex-end; gap: 3px; height: 80px; }
.chart-bar { flex: 1; background: var(--accent-teal); border-radius: 2px 2px 0 0; opacity: 0.7; transition: opacity 0.2s; min-width: 4px; }
.chart-bar:hover { opacity: 1; }

/* ANOMALY SCORE */
.score-ring {
  width: 64px; height: 64px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-size: 22px;
  border: 3px solid;
  flex-shrink: 0;
}

/* COMPARE */
.compare-split { display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; }
.compare-label { font-family: var(--font-mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); text-align: center; }
.vs-badge { font-family: var(--font-display); font-size: 28px; color: var(--text-muted); text-align: center; letter-spacing: 0.1em; }

/* FADE IN */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: 0.35s ease-out fadeInUp; }
.fade-in-delay-1 { animation: 0.35s 0.05s ease-out both fadeInUp; }
.fade-in-delay-2 { animation: 0.35s 0.1s ease-out both fadeInUp; }
.fade-in-delay-3 { animation: 0.35s 0.15s ease-out both fadeInUp; }

/* SCANDAL PULSE */
@keyframes scandalPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(224,69,69,0); border-color: rgba(224,69,69,0.3); }
  50% { box-shadow: 0 0 20px 4px rgba(224,69,69,0.25); border-color: rgba(224,69,69,0.7); }
}
.scandal-card { animation: scandalPulse 2s ease-in-out infinite; }

/* STORIES */
.stories-container { display: flex; gap: 10px; overflow-x: auto; padding: 4px 0 12px; scrollbar-width: thin; }
.story-pill {
  flex-shrink: 0; width: 140px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 12px; padding: 12px;
  cursor: pointer; transition: all 0.2s;
  position: relative; overflow: hidden;
}
.story-pill:hover { border-color: var(--accent-teal); transform: translateY(-2px); }
.story-pill.active { border-color: var(--accent-red); background: rgba(224,69,69,0.06); }
.story-pill::before { content:''; position:absolute; top:0;left:0;right:0; height:3px; background: var(--story-color, var(--accent-teal)); }
.story-month { font-family: var(--font-display); font-size: 22px; letter-spacing: 0.05em; line-height:1; }
.story-val { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); margin-top:4px; }
.story-flag { font-size:9px; margin-top:6px; }

/* MAP BRAZIL */
.map-container { position: relative; width: 100%; }
.map-state { cursor: pointer; transition: opacity 0.2s, stroke-width 0.2s; stroke: #232328; stroke-width: 0.5; }
.map-state:hover { opacity: 0.8; stroke-width: 1.5; stroke: #f5f5f3; }
.map-tooltip {
  position: absolute; pointer-events: none; z-index: 100;
  background: var(--bg-card-solid); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 14px; font-size: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4); white-space: nowrap;
}

/* NETWORK GRAPH */
.network-node { cursor: pointer; }
.network-node circle { transition: r 0.2s, fill 0.2s; }
.network-node:hover circle { r: 12; }
.network-link { stroke: rgba(61,153,150,0.3); stroke-width: 1; }
.network-link.suspect { stroke: rgba(224,69,69,0.4); stroke-width: 1.5; stroke-dasharray: 4; }

/* VIRAL CARD */
.viral-card {
  background: linear-gradient(135deg, #0a0a0c, #1a1a1f);
  border: 1px solid var(--border);
  border-radius: 16px; padding: 24px;
  text-align: center; position: relative; overflow: hidden;
}
.viral-card::before {
  content:''; position:absolute; top:-40px; left:-40px; right:-40px;
  height:120px; background: radial-gradient(ellipse, rgba(224,69,69,0.15), transparent);
}
.viral-number { font-family: var(--font-display); font-size: 56px; letter-spacing:0.05em; color: var(--accent-red); line-height:1; }
.viral-label { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); text-transform:uppercase; letter-spacing:0.1em; margin-top:6px; }

/* HALL */
.hall-card {
  border-radius: 12px; padding: 16px;
  display: flex; align-items: center; gap: 14px;
  border: 1px solid var(--border);
  transition: all 0.2s;
}
.hall-card:hover { transform: translateX(4px); }
.hall-card.shame { background: rgba(224,69,69,0.05); border-color: rgba(224,69,69,0.2); }
.hall-card.honor { background: rgba(52,168,83,0.05); border-color: rgba(52,168,83,0.2); }
.hall-rank { font-family: var(--font-display); font-size: 32px; letter-spacing:0.05em; width:48px; flex-shrink:0; text-align:center; }

/* CEP SEARCH */
.cep-result {
  background: rgba(61,153,150,0.06);
  border: 1px solid rgba(61,153,150,0.2);
  border-radius: 12px; padding: 20px; margin-top: 16px;
}

/* AI CHAT */
.ai-chat { display:flex; flex-direction:column; gap:12px; }
.ai-msg { max-width:85%; padding:12px 16px; border-radius:12px; font-size:13px; line-height:1.6; }
.ai-msg.user { align-self:flex-end; background:rgba(61,153,150,0.15); border:1px solid rgba(61,153,150,0.25); color:var(--text-primary); border-radius:12px 12px 2px 12px; }
.ai-msg.assistant { align-self:flex-start; background:var(--bg-tertiary); border:1px solid var(--border); color:var(--text-secondary); border-radius:12px 12px 12px 2px; }
.ai-msg.assistant.loading { color:var(--text-muted); font-style:italic; }
.ai-input-row { display:flex; gap:8px; margin-top:8px; }

/* HEATMAP */
.heatmap-cell { width:28px;height:28px;border-radius:4px;cursor:pointer;transition:opacity 0.2s; }
.heatmap-cell:hover { opacity:0.7; }

/* SANKEY */
.sankey-node { cursor:pointer; }
.sankey-link { fill:none; opacity:0.4; transition:opacity 0.2s; }
.sankey-link:hover { opacity:0.7; }

/* TIMELINE */
.timeline-item { display:flex; gap:16px; padding:12px 0; border-bottom:1px solid rgba(35,35,40,0.5); }
.timeline-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px; }
.timeline-line { width:1px;background:var(--border);flex-shrink:0;margin:14px 0 0 4px; }

/* SECTOR INDEX */
.sector-row { display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(35,35,40,0.4); }
.sector-bar { flex:1;height:8px;background:rgba(255,255,255,0.04);border-radius:4px;overflow:hidden; }
.sector-fill { height:100%;border-radius:4px;transition:width 0.8s cubic-bezier(0.22,1,0.36,1); }

/* INFLUENCE MAP */
.influence-node { display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-family:var(--font-mono);font-weight:500;cursor:pointer;transition:all 0.2s;border:2px solid; }
.influence-node:hover { transform:scale(1.1); }

/* TABS dentro de página */
.page-tabs { display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:20px; }
.page-tab { padding:9px 16px;font-family:var(--font-body);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.15s; }
.page-tab:hover { color:var(--text-primary); }
.page-tab.active { color:var(--text-primary);border-bottom-color:var(--accent-red); }

/* COUNTER ANIMADO */
@keyframes countUp { from { opacity:0;transform:translateY(10px); } to { opacity:1;transform:translateY(0); } }
.counter-anim { animation: 0.5s ease-out countUp; }

/* TOOLTIP */
.tooltip-wrap { position:relative;display:inline-block; }
.tooltip-box { position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:var(--bg-card-solid);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:11px;color:var(--text-secondary);white-space:nowrap;z-index:100;pointer-events:none;opacity:0;transition:opacity 0.15s; }
.tooltip-wrap:hover .tooltip-box { opacity:1; }


/* RESPONSIVE */
@media (max-width: 1024px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-5 { grid-template-columns: repeat(3, 1fr); }
}

/* UTIL */
.text-red { color: var(--accent-red); }
.text-amber { color: var(--accent-amber); }
.text-teal { color: var(--accent-teal); }
.text-muted { color: var(--text-muted); }
.text-secondary { color: var(--text-secondary); }
.font-mono { font-family: var(--font-mono); }
.font-display { font-family: var(--font-display); }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.space-y-3 > * + * { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mt-6 { margin-top: 24px; }
.mb-4 { margin-bottom: 16px; }
.mb-2 { margin-bottom: 8px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.flex-1 { flex: 1; }
.w-full { width: 100%; }

/* DOSSIER MODE */
.dossier-active {
  position: relative;
}
.dossier-active::after {
  content: '';
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  border: 2px solid var(--accent-red);
  border-radius: 18px;
  pointer-events: none;
  animation: borderPulse 2s infinite;
  z-index: 10;
}
@keyframes borderPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
.dossier-badge {
  background: var(--accent-red);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  margin-left: 8px;
}
.dossier-alert {
  background: rgba(224,69,69,0.1);
  border: 1px solid rgba(224,69,69,0.3);
  border-radius: 8px;
  padding: 10px;
  margin-top: 10px;
  font-size: 11px;
  color: var(--accent-red);
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

/* TOGGLE SWITCH */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--bg-tertiary);
  transition: .4s;
  border-radius: 22px;
  border: 1px solid var(--border);
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px; width: 16px;
  left: 3px; bottom: 2px;
  background-color: var(--text-muted);
  transition: .4s;
  border-radius: 50%;
}
input:checked + .toggle-slider { background-color: rgba(224,69,69,0.2); border-color: var(--accent-red); }
input:checked + .toggle-slider:before { transform: translateX(22px); background-color: var(--accent-red); }

`;

// ─── DOSSIER BLOCK ────────────────────────────────────────────────────────────
function DossierBlock({ title, icon, children, alerts = [], active = false }) {
  return (
    <div className={`glass-card fade-in ${active ? 'dossier-active' : ''}`} style={{ padding: 20, position: 'relative' }}>
      <div className="section-header">
        <span className={`section-dot ${active ? '' : 'teal'}`} />
        <span>{title}</span>
        {active && <span className="dossier-badge">DOSSIÊ ATIVO</span>}
      </div>
      <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 20, opacity: 0.1 }}>{icon}</div>
      {children}
      {active && alerts.length > 0 && (
        <div className="space-y-2 mt-4">
          {alerts.map((a, i) => (
            <div key={i} className="dossier-alert">
              <span>⚠</span>
              <div>{a}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (!v && v !== 0) return "R$ 0";
  if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(0)}K`;
  return `R$ ${v.toFixed(0)}`;
};
const fmtFull = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtN = (v) => (v || 0).toLocaleString('pt-BR');
const colors = ['#e04545', '#d4a03a', '#3d9996', '#4682b4', '#9b59b6', '#34a853', '#e67e22', '#1abc9c', '#e74c3c', '#f39c12'];





async function fetchDeputados() {
  try {
    const r = await fetch("https://dadosabertos.camara.leg.br/api/v2/deputados?pagina=1&itens=100&ordem=ASC&ordenarPor=nome");
    const d = await r.json();
    return d.dados || [];
  } catch { return []; }
}

async function fetchVotacoes() {
  try {
    const r = await fetch("https://dadosabertos.camara.leg.br/api/v2/votacoes?pagina=1&itens=15&ordem=DESC&ordenarPor=dataHoraRegistro");
    const d = await r.json();
    return d.dados || [];
  } catch { return []; }
}

async function fetchProposicoes() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const mes = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
    const r = await fetch(`https://dadosabertos.camara.leg.br/api/v2/proposicoes?dataInicio=${mes}&dataFim=${hoje}&pagina=1&itens=15`);
    const d = await r.json();
    return d.dados || [];
  } catch { return []; }
}

// ─── NOVAS APIs ────────────────────────────────────────────────────────────────

async function fetchDeputadosPorUF(uf) {
  try {
    const r = await fetch(`https://dadosabertos.camara.leg.br/api/v2/deputados?siglaUf=${uf}&pagina=1&itens=50`);
    const d = await r.json();
    return d.dados || [];
  } catch { return []; }
}


async function fetchIBGE(uf) {
  try {
    const estados = {
      'AC': 12, 'AL': 27, 'AP': 16, 'AM': 13, 'BA': 29, 'CE': 23, 'DF': 53, 'ES': 32, 'GO': 52,
      'MA': 21, 'MT': 51, 'MS': 50, 'MG': 31, 'PA': 15, 'PB': 25, 'PR': 41, 'PE': 26, 'PI': 22,
      'RJ': 33, 'RN': 24, 'RS': 43, 'RO': 11, 'RR': 14, 'SC': 42, 'SP': 35, 'SE': 28, 'TO': 17
    };
    const cod = estados[uf];
    if (!cod) return null;
    const r = await fetch(`https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2021/variaveis/37?localidades=N3[${cod}]`);
    const d = await r.json();
    return d[0]?.resultados?.[0]?.series?.[0]?.serie?.['2021'] || null;
  } catch { return null; }
}

async function fetchNoticiasDeputado(nome) {
  try {
    const query = encodeURIComponent(`"${nome.split(' ').slice(0, 2).join(' ')}" deputado`);
    const r = await fetch(`https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt`);
    const text = await r.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = [...xml.querySelectorAll('item')].slice(0, 6).map(item => ({
      title: item.querySelector('title')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      pubDate: item.querySelector('pubDate')?.textContent || '',
      source: item.querySelector('source')?.textContent || '',
    }));
    return items;
  } catch { return []; }
}


async function fetchEmendas(cpf) {
  try {
    const r = await fetch(`https://api.portaldatransparencia.gov.br/api-de-dados/emendas?codigoFuncional=${cpf}&pagina=1&tamanhoPagina=10`, {
      headers: { 'chave-api-dados': 'demo' }
    });
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

// ─── IPCA CORREÇÃO ────────────────────────────────────────────────────────────
const IPCA = { 2008: 5.9, 2009: 4.31, 2010: 5.91, 2011: 6.5, 2012: 5.84, 2013: 5.91, 2014: 6.41, 2015: 10.67, 2016: 6.29, 2017: 2.95, 2018: 3.75, 2019: 4.31, 2020: 4.52, 2021: 10.06, 2022: 5.79, 2023: 4.62, 2024: 4.83 };
function corrigirIPCA(valor, anoOrigem, anoAlvo = 2024) {
  let v = valor;
  for (let a = anoOrigem; a < anoAlvo; a++) { v *= 1 + (IPCA[a] || 4.5) / 100; }
  return v;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const SECTOR_SUSPICION = {
  'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS': { score: 92, reason: 'Historicamente o setor mais explorado. Alta concentração em poucos fornecedores.' },
  'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR': { score: 85, reason: 'Valores frequentemente acima do mercado. Difícil auditoria do serviço entregue.' },
  'CONSULTORIAS E TRABALHOS TÉCNICOS': { score: 78, reason: 'Serviços intangíveis de difícil verificação. Empresas frequentemente recém-abertas.' },
  'COMBUSTÍVEIS E LUBRIFICANTES': { score: 45, reason: 'Valores unitários baixos mas volume alto. Notas em estados onde deputado não atua.' },
  'PASSAGENS AÉREAS': { score: 38, reason: 'Controlado pela emissão de bilhetes. Risco moderado de uso pessoal.' },
  'MANUTENÇÃO DE ESCRITÓRIO': { score: 55, reason: 'Ampla margem para sobrepreço em serviços de manutenção.' },
  'TELEFONIA': { score: 30, reason: 'Valores padronizados pelas operadoras. Baixo risco de manipulação.' },
  'ALIMENTAÇÃO': { score: 42, reason: 'Notas em restaurantes de luxo. Difícil separar uso pessoal de profissional.' },
  'HOSPEDAGEM': { score: 48, reason: 'Valores acima do mercado em cidades-sede do Congresso.' },
  'SERVIÇOS POSTAIS': { score: 22, reason: 'Rastreável. Baixo risco histórico.' },
  'ASSINATURA DE PUBLICAÇÕES': { score: 35, reason: 'Publicações inexistentes ou irrelevantes.' },
  'SERVIÇOS GRÁFICOS': { score: 60, reason: 'Material eleitoral disfarçado de material parlamentar.' },
};

function generateMockData() {
  const partidos = ['PL', 'PT', 'UNIÃO', 'PP', 'MDB', 'PSD', 'REPUBLICANOS', 'PDT', 'PSDB', 'PODE', 'PSB', 'SOLIDARIEDADE', 'AVANTE', 'PRD', 'PSOL', 'NOVO', 'CIDADANIA', 'PCdoB'];
  const ufs = ['SP', 'MG', 'RJ', 'BA', 'RS', 'PR', 'PE', 'CE', 'PA', 'MA', 'SC', 'GO', 'AM', 'PB', 'RN', 'ES', 'AL', 'PI', 'MT', 'MS', 'DF', 'RO', 'SE', 'TO', 'AC', 'AP', 'RR'];
  const categorias = Object.keys(SECTOR_SUSPICION);

  const nomes = [
    'ARTHUR LIRA', 'NIKOLAS FERREIRA', 'CARLA ZAMBELLI', 'ANDRE JANONES', 'REGINALDO LOPES',
    'ALEXIS FONTEYNE', 'PATRUS ANANIAS', 'DANIELA DO WAGUINHO', 'CESAR DA MATA', 'MARCOS PEREIRA',
    'AGUINALDO RIBEIRO', 'FERNANDO TORRES', 'ELMAR NASCIMENTO', 'EFRAIM FILHO', 'HUGO LEAL',
    'BALEIA ROSSI', 'LUCIO MOSQUINI', 'ROGÉRIO CORREIA', 'BACELAR', 'ANTONIO BRITO',
    'SORAYA THRONICKE', 'FELIPE CARRERAS', 'SAMUEL MOREIRA', 'MARIA DO ROSARIO', 'LINDBERGH FARIAS',
    'PAULO PIMENTA', 'GLAUBER BRAGA', 'TALÍRIA PETRONE', 'FERNANDA MELCHIONNA', 'TIAGO MITRAUD',
    'KIM KATAGUIRI', 'TABATA AMARAL', 'PEDRO CAMPOS', 'TÉRCIO GOMES', 'ABÍLIO BRUNINI',
    'ANA PAULA LIMA', 'CHRISTINO AUREO', 'DUDA SALABERT', 'EROS BIONDINI', 'FLÁVIO RICH',
    'JÚLIA ZANATTA', 'MARCON', 'NILTO TATTO', 'ORLANDO SILVA', 'PROFESSOR ISRAEL',
    'SANDERSON', 'TÚLIO GADÊLHA', 'WALDEMAR COSTA NETO', 'ZÉ VITOR', 'ALEXANDRE RAMAGEM',
  ];

  const rows = [];
  nomes.forEach((nome, i) => {
    const partido = partidos[i % partidos.length];
    const uf = ufs[i % ufs.length];
    const numTransacoes = 80 + Math.floor(Math.random() * 350);
    const cnpjBase = Math.floor(Math.random() * 90000000 + 10000000);

    // Simula fornecedores — alguns deputados concentram em poucos
    const nForn = i < 8 ? 3 + Math.floor(Math.random() * 4) : 8 + Math.floor(Math.random() * 20);
    const fornecedores = Array.from({ length: nForn }, (_, j) => ({
      nome: `${['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'SIGMA', 'OMEGA', 'VERTEX', 'PRIME'][j % 8]} SERVIÇOS ${Math.floor(Math.random() * 999)} LTDA`,
      cnpj: `${cnpjBase + j}.0001-${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`,
      // Simula empresa laranja para primeiros deputados
      diasAberturaAntesPagamento: i < 5 ? 30 + Math.floor(Math.random() * 100) : 500 + Math.floor(Math.random() * 2000),
    }));

    for (let t = 0; t < numTransacoes; t++) {
      const cat = categorias[Math.floor(Math.random() * categorias.length)];
      const mes = 1 + Math.floor(Math.random() * 12);
      const ano = [2023, 2024, 2024, 2024, 2025][Math.floor(Math.random() * 5)];
      const forn = fornecedores[Math.floor(Math.random() * fornecedores.length)];
      const diaSemana = Math.floor(Math.random() * 7);

      let valor = cat === 'PASSAGENS AÉREAS' ? 300 + Math.random() * 2700
        : cat === 'COMBUSTÍVEIS E LUBRIFICANTES' ? 100 + Math.random() * 400
          : cat === 'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR' ? 1000 + Math.random() * 49000
            : cat === 'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS' ? 2000 + Math.random() * 15000
              : 200 + Math.random() * 3000;

      // Valores redondos suspeitos
      if (i < 5 && Math.random() < 0.45) valor = Math.ceil(valor / 1000) * 1000;
      else valor = Math.round(valor * 100) / 100;

      rows.push({
        txNomeParlamentar: nome,
        sgPartido: partido,
        sgUF: uf,
        txtDescricao: cat,
        txtFornecedor: forn.nome,
        txtCNPJCPF: forn.cnpj,
        fornDiasAbertura: forn.diasAberturaAntesPagamento,
        vlrLiquido: valor,
        numMes: mes,
        numAno: ano,
        diaSemana,
        datEmissao: `${ano}-${String(mes).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
      });
    }
  });
  return rows;
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
function analyzeDeputado(rows) {
  if (!rows.length) return null;
  const total = rows.reduce((s, r) => s + r.vlrLiquido, 0);
  const n = rows.length;

  // HHI
  const byForn = {};
  rows.forEach(r => { byForn[r.txtFornecedor] = (byForn[r.txtFornecedor] || 0) + r.vlrLiquido; });
  const fornArr = Object.entries(byForn).sort((a, b) => b[1] - a[1]);
  const hhi = fornArr.reduce((s, [, v]) => s + Math.pow(v / total * 100, 2), 0);
  const hhiLevel = hhi < 1500 ? 'BAIXO' : hhi < 2500 ? 'MODERADO' : hhi < 5000 ? 'ALTO' : 'MUITO ALTO';
  const hhiColor = hhi < 1500 ? 'teal' : hhi < 2500 ? 'amber' : 'red';

  // Valores redondos
  const redondos = rows.filter(r => r.vlrLiquido % 1000 < 0.01 || r.vlrLiquido % 500 < 0.01).length;
  const pctRed = redondos / n * 100;

  // Benford
  const primeiros = rows.map(r => {
    const s = String(Math.abs(r.vlrLiquido)).replace('.', '').replace(',', '').replace(/^0+/, '');
    return s[0] ? parseInt(s[0]) : null;
  }).filter(Boolean);
  const benfordEsp = Array.from({ length: 9 }, (_, i) => Math.log10(1 + 1 / (i + 1)));
  const total_b = primeiros.length;
  const obs = Array.from({ length: 9 }, (_, i) => primeiros.filter(d => d === i + 1).length);
  const chi2 = obs.reduce((s, o, i) => { const e = benfordEsp[i] * total_b; return s + Math.pow(o - e, 2) / e; }, 0);
  const benfordSuspect = chi2 > 15.5; // p < 0.05 com 8 gl

  // Por categoria
  const byCat = {};
  rows.forEach(r => { byCat[r.txtDescricao] = (byCat[r.txtDescricao] || 0) + r.vlrLiquido; });

  // Por mês
  const byMes = {};
  rows.forEach(r => { byMes[r.numMes] = (byMes[r.numMes] || 0) + r.vlrLiquido; });

  const alertas = [];
  if (pctRed > 30) alertas.push({ tipo: 'VALORES REDONDOS', nivel: 'amber', msg: `${pctRed.toFixed(1)}% dos gastos são múltiplos de R$500/1000 — padrão atípico em ${redondos} transações.` });
  if (hhi > 2500) alertas.push({ tipo: 'CONCENTRAÇÃO (HHI)', nivel: 'red', msg: `HHI = ${hhi.toFixed(0)} (${hhiLevel}). "${fornArr[0][0].slice(0, 40)}" recebe ${(fornArr[0][1] / total * 100).toFixed(1)}% dos gastos.` });
  if (benfordSuspect) alertas.push({ tipo: 'LEI DE BENFORD', nivel: 'red', msg: `Desvio estatístico detectado (χ² = ${chi2.toFixed(1)} > 15.5). Distribuição dos primeiros dígitos não segue padrão natural.` });

  const score = Math.min(100, Math.round((pctRed > 30 ? 25 : 0) + (hhi > 5000 ? 40 : hhi > 2500 ? 25 : 0) + (benfordSuspect ? 35 : 0)));

  return { total, n, hhi, hhiLevel, hhiColor, pctRed, benfordSuspect, chi2, fornArr, byCat, byMes, alertas, score };
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name }) => {
  const icons = {
    overview: '◈', deputies: '◉', search: '⊙', compare: '◫', anomaly: '⚠', live: '◎',
    eye: '👁', chart: '▣', shield: '⬡', dollar: '◈', party: '◆', map: '◉',
    alert: '!', check: '✓', arrow: '→', filter: '⊟', refresh: '↻', external: '↗'
  };
  return <span style={{ fontSize: '14px', lineHeight: 1 }}>{icons[name] || '·'}</span>;
};

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'var(--text-primary)', accentColor, icon }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="glass-card stat-card fade-in" style={{ '--accent-color': accentColor }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {icon && <div className="stat-icon">{icon}</div>}
    </div>
  );
}

function BarChart({ data, color = 'var(--accent-teal)', maxItems = 10 }) {
  if (!data || data.length === 0) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Sem dados para exibir.</div>;
  const slice = data.slice(0, maxItems);
  const max = Math.max(...slice.map(d => d.value)) || 1;
  return (
    <div style={{ padding: '4px 0' }}>
      {slice.map((d, i) => (
        <div key={i} className="bar-row">
          <div className="bar-label" title={d.label}>{d.label}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.value / max * 100)}%`, background: color }} />
          </div>
          <div className="bar-val">{d.fmt || fmt(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

function MiniSparkline({ data, color = '#3d9996' }) {
  if (!data?.length) return null;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120; const h = 32;
  const pts = data.map((v, i) => `${i / (data.length - 1) * w},${h - (v - min) / range * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

function OverviewPage({ data }) {
  const total = useMemo(() => data.reduce((s, r) => s + r.vlrLiquido, 0), [data]);
  const ndeps = useMemo(() => new Set(data.map(r => r.txNomeParlamentar)).size, [data]);
  const ntrans = data.length;
  const nforn = useMemo(() => new Set(data.map(r => r.txtFornecedor)).size, [data]);

  const byPartido = useMemo(() => {
    const m = {}; data.forEach(r => { m[r.sgPartido] = (m[r.sgPartido] || 0) + r.vlrLiquido; });
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  const byCat = useMemo(() => {
    const m = {}; data.forEach(r => { m[r.txtDescricao] = (m[r.txtDescricao] || 0) + r.vlrLiquido; });
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  const byUF = useMemo(() => {
    const m = {}; data.forEach(r => { m[r.sgUF] = (m[r.sgUF] || 0) + r.vlrLiquido; });
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  const byMes = useMemo(() => {
    const m = {}; data.forEach(r => { const k = r.numMes; m[k] = (m[k] || 0) + r.vlrLiquido; });
    return Array.from({ length: 12 }, (_, i) => m[i + 1] || 0);
  }, [data]);

  const topDeps = useMemo(() => {
    const m = {}; data.forEach(r => { if (!m[r.txNomeParlamentar]) m[r.txNomeParlamentar] = { nome: r.txNomeParlamentar, partido: r.sgPartido, uf: r.sgUF, total: 0, n: 0 }; m[r.txNomeParlamentar].total += r.vlrLiquido; m[r.txNomeParlamentar].n++; });
    return Object.values(m).sort((a, b) => b.total - a.total).slice(0, 20);
  }, [data]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">VISÃO GERAL</div>
        <div className="page-desc">CEAP 2024 · {fmtN(ntrans)} transações · dados abertos da Câmara dos Deputados</div>
      </div>

      {/* KPI ROW */}
      <div className="grid-4 mb-4" style={{ marginBottom: 16 }}>
        <StatCard label="Total Gasto" value={`R$ ${(total / 1e9).toFixed(2)}B`} sub="bilhões de reais" color="var(--accent-red)" accentColor="var(--accent-red)" icon="💰" />
        <StatCard label="Deputados" value={fmtN(ndeps)} sub="com gastos registrados" color="var(--text-primary)" accentColor="var(--accent-teal)" />
        <StatCard label="Transações" value={fmtN(ntrans)} sub="notas fiscais e recibos" color="var(--accent-amber)" accentColor="var(--accent-amber)" icon="📄" />
        <StatCard label="Fornecedores" value={fmtN(nforn)} sub="CNPJs e CPFs únicos" color="var(--accent-teal)" accentColor="var(--accent-teal)" />
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot" /><span>CATEGORIAS DE GASTO</span></div>
          <BarChart data={byCat.slice(0, 10)} color="var(--accent-red)" />
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot teal" /><span>EVOLUÇÃO MENSAL</span></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140, padding: '8px 0' }}>
            {byMes.map((v, i) => {
              const max = Math.max(...byMes);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                    <div style={{ width: '100%', background: 'var(--accent-teal)', opacity: 0.75, borderRadius: '3px 3px 0 0', height: `${(v / max * 100)}%`, minHeight: 4, transition: 'height 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>JAN 2024</span><span>DEZ 2024</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot amber" /><span>GASTOS POR PARTIDO</span></div>
          <BarChart data={byPartido.slice(0, 10)} color="var(--accent-amber)" />
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot teal" /><span>GASTOS POR ESTADO (UF)</span></div>
          <BarChart data={byUF.slice(0, 10)} color="var(--accent-blue)" />
        </div>
      </div>

      {/* TOP DEPUTIES */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div className="section-header"><span className="section-dot" /><span>TOP 20 MAIORES GASTADORES</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Deputado</th><th>Partido</th><th>UF</th>
                <th style={{ textAlign: 'right' }}>Total Gasto</th>
                <th style={{ textAlign: 'right' }}>Nº Notas</th>
                <th style={{ textAlign: 'right' }}>Média/Nota</th>
              </tr>
            </thead>
            <tbody>
              {topDeps.map((d, i) => (
                <tr key={i}>
                  <td><span className={`rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.nome}</td>
                  <td><span className="badge badge-teal">{d.partido}</span></td>
                  <td><span className="font-mono text-muted" style={{ fontSize: 11 }}>{d.uf}</span></td>
                  <td style={{ textAlign: 'right' }}><span className={`money ${i < 3 ? 'big' : i < 10 ? 'mid' : ''}`}>{fmt(d.total)}</span></td>
                  <td style={{ textAlign: 'right' }}><span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtN(d.n)}</span></td>
                  <td style={{ textAlign: 'right' }}><span className="money">{fmt(d.total / d.n)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DeputadosPage({ data }) {
  const [filtro, setFiltro] = useState('');
  const [partido, setPartido] = useState('');
  const [uf, setUf] = useState('');
  const [sortBy, setSortBy] = useState('total');

  const partidos = useMemo(() => [...new Set(data.map(r => r.sgPartido))].sort(), [data]);
  const ufs = useMemo(() => [...new Set(data.map(r => r.sgUF))].sort(), [data]);

  const ranking = useMemo(() => {
    const m = {};
    data.forEach(r => {
      if (!m[r.txNomeParlamentar]) m[r.txNomeParlamentar] = { nome: r.txNomeParlamentar, partido: r.sgPartido, uf: r.sgUF, total: 0, n: 0, forn: new Set() };
      m[r.txNomeParlamentar].total += r.vlrLiquido;
      m[r.txNomeParlamentar].n++;
      m[r.txNomeParlamentar].forn.add(r.txtFornecedor);
    });
    return Object.values(m).map(d => ({ ...d, forn: d.forn.size }));
  }, [data]);

  const filtered = useMemo(() => ranking
    .filter(d => (!filtro || d.nome.toLowerCase().includes(filtro.toLowerCase())))
    .filter(d => (!partido || d.partido === partido))
    .filter(d => (!uf || d.uf === uf))
    .sort((a, b) => sortBy === 'total' ? b.total - a.total : sortBy === 'n' ? b.n - a.n : b.forn - a.forn)
    , [ranking, filtro, partido, uf, sortBy]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">DEPUTADOS</div>
        <div className="page-desc">Ranking completo · {fmtN(filtered.length)} deputados</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="search-input" placeholder="Buscar deputado..." value={filtro} onChange={e => setFiltro(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <select className="select-input" value={partido} onChange={e => setPartido(e.target.value)}>
          <option value="">Todos os partidos</option>
          {partidos.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="select-input" value={uf} onChange={e => setUf(e.target.value)}>
          <option value="">Todos os estados</option>
          {ufs.map(u => <option key={u}>{u}</option>)}
        </select>
        <select className="select-input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="total">Ordenar: Total</option>
          <option value="n">Ordenar: Nº Notas</option>
          <option value="forn">Ordenar: Fornecedores</option>
        </select>
      </div>

      <div className="glass-card">
        <div style={{ overflowX: 'auto', maxHeight: 600, overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 5 }}>
              <tr>
                <th>#</th><th>Deputado</th><th>Partido</th><th>UF</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Notas</th>
                <th style={{ textAlign: 'right' }}>Fornecedores</th>
                <th style={{ textAlign: 'right' }}>Média/Nota</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={i}>
                  <td><span className={`rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200 }} className="truncate">{d.nome}</td>
                  <td><span className="badge badge-teal">{d.partido}</span></td>
                  <td><span className="font-mono text-muted" style={{ fontSize: 11 }}>{d.uf}</span></td>
                  <td style={{ textAlign: 'right' }}><span className={`money ${i < 3 ? 'big' : ''}`}>{fmt(d.total)}</span></td>
                  <td style={{ textAlign: 'right' }}><span className="font-mono text-secondary" style={{ fontSize: 12 }}>{fmtN(d.n)}</span></td>
                  <td style={{ textAlign: 'right' }}><span className="font-mono text-muted" style={{ fontSize: 12 }}>{d.forn}</span></td>
                  <td style={{ textAlign: 'right' }}><span className="money">{fmt(d.total / d.n)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BuscarPage({ data }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [dossierMode, setDossierMode] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Estados do Dossiê
  const [dossierData, setDossierData] = useState({
    details: null,
    bens: [],
    financiadores: [],
    emendas: [],
    convenios: [],
    votacoes: [],
    municipio: null
  });

  const nomes = useMemo(() => [...new Set(data.map(r => r.txNomeParlamentar))].sort(), [data]);

  useEffect(() => {
    if (search.length < 2) { setSuggestions([]); return; }
    setSuggestions(nomes.filter(n => n.toLowerCase().includes(search.toLowerCase())).slice(0, 6));
  }, [search, nomes]);

  // Carregar dados extras quando um deputado é selecionado
  useEffect(() => {
    if (!selected) return;

    async function loadFullDossier() {
      setLoadingExtra(true);
      try {
        // 1. Achar o ID da Câmara pelo nome
        const deps = await fetchDeputados();
        const found = deps.find(d => d.nome.toLowerCase().includes(selected.toLowerCase()));

        if (found) {
          const depId = found.id;
          const [details, votacoes, candidaturas] = await Promise.all([
            fetchDeputadoDetails(depId),
            fetchVotacoesDeputado(depId),
            fetchCandidaturasTSE(selected)
          ]);

          setDossierData(prev => ({ ...prev, details, votacoes, detailsRaw: found }));

          // 2. Com o CPF/ID do TSE, buscar bens e financiadores
          if (candidaturas.length > 0) {
            const cand = candidaturas[0];
            const [bens, financiadores] = await Promise.all([
              fetchBensTSE(cand.id),
              fetchPrestacaoContasTSE(cand.id)
            ]);
            setDossierData(prev => ({ ...prev, bens, financiadores }));
          }

          // 3. Emendas, Município e Convênios (Obras)
          if (details) {
            const [emendas, convenios, codIbge] = await Promise.all([
              fetchEmendasParlamentares(selected, '2024', localStorage.getItem('cguKey') || 'demo'),
              fetchConvenios(selected, localStorage.getItem('cguKey') || 'demo'),
              fetchLocalidadeIBGE(details.ultimoStatus.nomeMunicipio, details.ultimoStatus.siglaUf)
            ]);
            let pib = null;
            if (codIbge) pib = await fetchPIBMunicipal(codIbge);
            setDossierData(prev => ({
              ...prev,
              emendas: emendas.data || [],
              convenios: convenios.data || [],
              municipio: { nome: details.ultimoStatus.nomeMunicipio, pib }
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dossiê:", err);
      }
      setLoadingExtra(false);
    }

    loadFullDossier();
  }, [selected]);

  const depData = useMemo(() => selected ? data.filter(r => r.txNomeParlamentar === selected) : [], [data, selected]);
  const analysis = useMemo(() => depData.length ? analyzeDeputado(depData) : null, [depData]);

  const byCat = useMemo(() => {
    if (!analysis) return [];
    return Object.entries(analysis.byCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [analysis]);

  const topForn = useMemo(() => analysis ? analysis.fornArr.slice(0, 8).map(([label, value]) => ({ label: label.slice(0, 35), value })) : [], [analysis]);

  const scoreColor = analysis ? (analysis.score > 60 ? 'var(--accent-red)' : analysis.score > 30 ? 'var(--accent-amber)' : 'var(--status-low)') : 'var(--text-muted)';

  // Lógica de Cruzamento (Alertas de Dossiê)
  const crossingAlerts = useMemo(() => {
    if (!dossierMode || !analysis) return {};
    const alerts = { bens: [], emendas: [], financiadores: [], geral: [] };

    // Cruzamento Patrimônio vs Gastos
    const totalBens = (dossierData.bens || []).reduce((s, b) => s + (b.valor || 0), 0);
    if (totalBens > 0 && analysis.total > totalBens * 0.5) {
      alerts.bens.push(`Gastos CEAP (${fmt(analysis.total)}) equivalem a mais de 50% do patrimônio declarado.`);
    }

    // Cruzamento Emendas vs Fornecedores
    const fornsSet = new Set((analysis.fornArr || []).map(f => f[0]?.toLowerCase() || ""));
    const emendasExecutores = (dossierData.emendas || []).map(e => e.beneficiario?.nome?.toLowerCase() || "");
    const matching = emendasExecutores.filter(ex => ex && fornsSet.has(ex));
    if (matching.length > 0) {
      alerts.emendas.push(`Conexão detectada: Fornecedores da cota parlamentar também executaram emendas do deputado.`);
    }

    // Financiadores vs Fornecedores
    const doadores = new Set((dossierData.financiadores || []).map(f => f.nomeDoador?.toLowerCase() || ""));
    const matchingDoadores = (analysis.fornArr || []).map(f => f[0]?.toLowerCase() || "").filter(f => f && doadores.has(f));
    if (matchingDoadores.length > 0) {
      alerts.financiadores.push(`Potencial conflito: Doadores de campanha aparecem como fornecedores pagos pela CEAP.`);
    }

    return alerts;
  }, [dossierMode, analysis, dossierData]);

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="page-title">PAINEL DO PARLAMENTAR</div>
          <div className="page-desc">Perfil integrado com dados Câmara, TSE, CGU e IBGE</div>
        </div>

        {selected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: dossierMode ? 'var(--accent-red)' : 'var(--text-muted)' }}>
              {dossierMode ? 'MODO DOSSIÊ: ON' : 'MODO DOSSIÊ: OFF'}
            </span>
            <label className="toggle-switch">
              <input type="checkbox" checked={dossierMode} onChange={e => setDossierMode(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        )}
      </div>

      {/* SEARCH */}
      <div style={{ maxWidth: 500, marginBottom: 20, position: 'relative' }}>
        <input
          className="search-input"
          placeholder="🔍 Pesquisar pelo nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ fontSize: 15 }}
        />
        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            {suggestions.map(s => (
              <div key={s} onClick={() => { setSelected(s); setSearch(s); setSuggestions([]); }}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(35,35,40,0.5)', transition: 'all 0.1s' }}
                onMouseEnter={e => e.target.style.background = 'rgba(61,153,150,0.08)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      {!selected && (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>👔</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>SELECIONE UM DEPUTADO PARA GERAR O DOSSIÊ</div>
        </div>
      )}

      {selected && (
        <div className="fade-in">
          {/* HEADER INTEGRADO */}
          <div className="glass-card" style={{ padding: 20, marginBottom: 16, borderLeft: loadingExtra ? '4px solid var(--accent-amber)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ width: 80, height: 80, background: 'var(--bg-tertiary)', borderRadius: 8, overflow: 'hidden', border: '2px solid var(--border)', flexShrink: 0 }}>
                {dossierData.details?.ultimoStatus.urlFoto ? <img src={dossierData.details.ultimoStatus.urlFoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>👤</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.05em', lineHeight: 1.1 }}>{selected}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-teal">{dossierData.details?.ultimoStatus.siglaPartido || depData[0]?.sgPartido}</span>
                  <span className="badge badge-amber">{dossierData.details?.ultimoStatus.siglaUf || depData[0]?.sgUF}</span>
                  <span className="badge badge-purple">{dossierData.details?.ultimoStatus.email || 'Email INDISPONÍVEL'}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div className="score-ring" style={{ borderColor: scoreColor, color: scoreColor, width: 72, height: 72, fontSize: 24 }}>
                  {analysis?.score || 0}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>SUSPEIÇÃO CEAP</div>
              </div>
            </div>
          </div>

          <div className="grid-3 mb-4">
            <DossierBlock title="PATRIMÔNIO DECLARADO" icon="💰" active={dossierMode} alerts={crossingAlerts.bens}>
              <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
                {fmt(dossierData.bens?.reduce((s, b) => s + b.valor, 0) || 0)}
              </div>
              <div className="stat-sub">{(dossierData.bens || []).length} itens declarados no TSE</div>
            </DossierBlock>

            <DossierBlock title="EMENDAS PARLAMENTARES" icon="🏗" active={dossierMode} alerts={crossingAlerts.emendas}>
              <div className="stat-value" style={{ color: 'var(--accent-teal)' }}>
                {fmt(dossierData.emendas?.reduce((s, e) => s + (e.valorEmpenhado || 0), 0) || 0)}
              </div>
              <div className="stat-sub">{(dossierData.emendas || []).length} emendas | {(dossierData.convenios || []).length} convênios (obras)</div>
              {(dossierData.emendas || []).length > 0 && (
                <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Principais Executores:</div>
                  {dossierData.emendas.slice(0, 3).map((e, i) => (
                    <div key={i} className="truncate" style={{ marginBottom: 2 }}>
                      • {e.beneficiario?.nome || 'Órgão Público'} ({fmt(e.valorEmpenhado)})
                    </div>
                  ))}
                </div>
              )}
            </DossierBlock>

            <DossierBlock title="DADOS DO MUNICÍPIO" icon="🏘" active={dossierMode}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{dossierData.municipio?.nome || 'Consultando...'}</div>
              <div className="stat-sub">PIB Municipal: {dossierData.municipio?.pib ? fmt(parseFloat(dossierData.municipio.pib)) : 'N/A'}</div>
            </DossierBlock>
          </div>

          <div className="grid-2 mb-4">
            <DossierBlock title="FINANCIADORES DE CAMPANHA" icon="🤝" active={dossierMode} alerts={crossingAlerts.financiadores}>
              {(dossierData.financiadores || []).length > 0 ? (
                <BarChart data={dossierData.financiadores.slice(0, 5).map(f => ({ label: f.nomeDoador, value: f.valor }))} color="var(--accent-purple)" />
              ) : <div className="text-muted" style={{ fontSize: 12 }}>Nenhum doador encontrado ou carregando...</div>}
            </DossierBlock>

            <DossierBlock title="VOTAÇÕES RECENTES" icon="🗳" active={dossierMode}>
              <div className="space-y-2">
                {dossierData.votacoes.slice(0, 5).map((v, i) => (
                  <div key={i} style={{ fontSize: 11, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v.siglaOrgao} - {v.dataHoraRegistro.split('T')[0]}</div>
                    <div className="truncate" style={{ color: 'var(--text-secondary)' }}>{v.proposicaoObjeto || v.descricao}</div>
                  </div>
                ))}
              </div>
            </DossierBlock>
          </div>

          {/* CEAP SECTION */}
          <div className="section-header"><span className="section-dot teal" /><span>DETALHAMENTO DE GASTOS (CEAP)</span></div>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="section-header"><span>CATEGORIAS</span></div>
              <BarChart data={byCat} color="var(--accent-amber)" />
            </div>
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="section-header"><span>TOP FORNECEDORES</span></div>
              <BarChart data={topForn} color="var(--accent-teal)" />
            </div>
          </div>

          {/* TRANSAÇÕES */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="section-header"><span>ÚLTIMAS TRANSAÇÕES CEAP</span></div>
            <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
              <table className="data-table">
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card-solid)' }}>
                  <tr><th>Data</th><th>Categoria</th><th>Fornecedor</th><th style={{ textAlign: 'right' }}>Valor</th></tr>
                </thead>
                <tbody>
                  {depData.sort((a, b) => b.vlrLiquido - a.vlrLiquido).slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td><span className="font-mono text-muted" style={{ fontSize: 11 }}>{r.datEmissao}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="truncate">{r.txtDescricao}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="truncate">{r.txtFornecedor}</td>
                      <td style={{ textAlign: 'right' }}><span className={`money ${r.vlrLiquido > 10000 ? 'big' : ''}`}>{fmtFull(r.vlrLiquido)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompararPage({ data }) {
  const nomes = useMemo(() => [...new Set(data.map(r => r.txNomeParlamentar))].sort(), [data]);
  const [depA, setDepA] = useState(nomes[0] || '');
  const [depB, setDepB] = useState(nomes[1] || '');

  const statsA = useMemo(() => {
    const d = data.filter(r => r.txNomeParlamentar === depA);
    return d.length ? analyzeDeputado(d) : null;
  }, [data, depA]);

  const statsB = useMemo(() => {
    const d = data.filter(r => r.txNomeParlamentar === depB);
    return d.length ? analyzeDeputado(d) : null;
  }, [data, depB]);

  const metricRows = statsA && statsB ? [
    { label: 'Total Gasto', va: statsA.total, vb: statsB.total, fmt: fmt, bigger: 'red' },
    { label: 'Nº de Notas', va: statsA.n, vb: statsB.n, fmt: fmtN, bigger: 'amber' },
    { label: 'Fornecedores', va: statsA.fornArr.length, vb: statsB.fornArr.length, fmt: v => v, bigger: 'amber' },
    { label: 'HHI Concentração', va: Math.round(statsA.hhi), vb: Math.round(statsB.hhi), fmt: v => v.toLocaleString('pt-BR'), bigger: 'red' },
    { label: '% Val. Redondos', va: statsA.pctRed, vb: statsB.pctRed, fmt: v => `${v.toFixed(1)}%`, bigger: 'red' },
    { label: 'Score de Risco', va: statsA.score, vb: statsB.score, fmt: v => `${v}/100`, bigger: 'red' },
  ] : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">COMPARAR DEPUTADOS</div>
        <div className="page-desc">Análise lado a lado com múltiplas métricas</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Deputado A</div>
          <select className="select-input w-full" value={depA} onChange={e => setDepA(e.target.value)} style={{ width: '100%' }}>
            {nomes.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>VS</div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Deputado B</div>
          <select className="select-input w-full" value={depB} onChange={e => setDepB(e.target.value)} style={{ width: '100%' }}>
            {nomes.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {metricRows.length > 0 && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          {metricRows.map((m, i) => {
            const aWins = m.va > m.vb;
            const aColor = aWins ? `var(--accent-${m.bigger})` : 'var(--text-secondary)';
            const bColor = !aWins ? `var(--accent-${m.bigger})` : 'var(--text-secondary)';
            return (
              <div key={i} className="info-row">
                <div style={{ textAlign: 'right', flex: 1 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: aColor, fontWeight: aWins ? 600 : 400 }}>{m.fmt(m.va)}</span>
                </div>
                <div style={{ width: 160, textAlign: 'center', padding: '0 16px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {m.label}
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: bColor, fontWeight: !aWins ? 600 : 400 }}>{m.fmt(m.vb)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {statsA && statsB && (
        <div className="grid-2">
          {/* Categorias A */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="section-header"><span className="section-dot" /><span>{depA.split(' ')[0]}</span></div>
            <BarChart data={Object.entries(statsA.byCat).map(([l, v]) => ({ label: l, value: v })).sort((a, b) => b.value - a.value).slice(0, 7)} color="var(--accent-red)" />
          </div>
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="section-header"><span className="section-dot teal" /><span>{depB.split(' ')[0]}</span></div>
            <BarChart data={Object.entries(statsB.byCat).map(([l, v]) => ({ label: l, value: v })).sort((a, b) => b.value - a.value).slice(0, 7)} color="var(--accent-teal)" />
          </div>
        </div>
      )}
    </div>
  );
}

function AnomaliaPage({ data }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  const runScan = useCallback(() => {
    setRunning(true);
    setResults(null);
    setTimeout(() => {
      const nomes = [...new Set(data.map(r => r.txNomeParlamentar))];
      const found = [];
      nomes.forEach(nome => {
        const rows = data.filter(r => r.txNomeParlamentar === nome);
        const a = analyzeDeputado(rows);
        if (a && a.alertas.length > 0) {
          found.push({
            nome,
            partido: rows[0].sgPartido,
            uf: rows[0].sgUF,
            total: a.total,
            score: a.score,
            alertas: a.alertas,
            hhi: a.hhi,
            pctRed: a.pctRed,
          });
        }
      });
      found.sort((a, b) => b.score - a.score);
      setResults(found);
      setRunning(false);
    }, 800);
  }, [data]);

  const nRed = results?.filter(r => r.alertas.some(a => a.nivel === 'red')).length;
  const nAmb = results?.filter(r => r.alertas.every(a => a.nivel !== 'red')).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">SCANNER DE ANOMALIAS</div>
        <div className="page-desc">Análise automatizada de todos os deputados com múltiplas técnicas</div>
      </div>

      {/* METODOLOGIA */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        {[
          { icon: '📊', title: 'Lei de Benford', desc: 'Detecta se os primeiros dígitos dos valores seguem a distribuição logarítmica natural. Desvios estatísticos (χ² > 15.5) indicam possível manipulação.', color: 'var(--accent-red)' },
          { icon: '⚖', title: 'Índice HHI', desc: 'Mede concentração de gastos em poucos fornecedores. HHI > 2500 indica dependência suspeita. A mesma métrica usada pelo CADE para avaliar monopólios.', color: 'var(--accent-amber)' },
          { icon: '🔢', title: 'Valores Redondos', desc: 'Proporção acima de 30% de valores exatos (múltiplos de R$500/1000) sugere estimativas ao invés de gastos reais com nota fiscal.', color: 'var(--accent-teal)' },
        ].map((m, i) => (
          <div key={i} className="glass-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.06em', color: m.color, marginBottom: 6 }}>{m.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={runScan} disabled={running}>
          {running ? '⏳ Analisando...' : '🔬 Executar Scanner em Todos os Deputados'}
        </button>
      </div>

      {results && (
        <div className="fade-in">
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <StatCard label="Alertas Críticos" value={nRed} color="var(--accent-red)" accentColor="var(--accent-red)" />
            <StatCard label="Alertas de Atenção" value={nAmb} color="var(--accent-amber)" accentColor="var(--accent-amber)" />
            <StatCard label="Deputados Sinalizados" value={results.length} sub={`de ${new Set(data.map(r => r.txNomeParlamentar)).size} analisados`} accentColor="var(--accent-teal)" />
          </div>

          <div className="glass-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Score</th><th>Deputado</th><th>Partido</th><th>UF</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Alertas</th>
                    <th>HHI</th>
                    <th>Val. Redondos</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: r.score > 60 ? 'var(--accent-red)' : r.score > 30 ? 'var(--accent-amber)' : 'var(--status-low)' }}>
                          {r.score}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, maxWidth: 180 }} className="truncate">{r.nome}</td>
                      <td><span className="badge badge-teal">{r.partido}</span></td>
                      <td><span className="font-mono text-muted" style={{ fontSize: 11 }}>{r.uf}</span></td>
                      <td style={{ textAlign: 'right' }}><span className="money">{fmt(r.total)}</span></td>
                      <td>
                        {r.alertas.map((a, j) => (
                          <span key={j} className={`badge badge-${a.nivel === 'red' ? 'red' : 'amber'}`} style={{ marginRight: 4, display: 'inline-block', marginBottom: 2 }}>
                            {a.tipo.slice(0, 15)}
                          </span>
                        ))}
                      </td>
                      <td><span className={`font-mono`} style={{ fontSize: 12, color: r.hhi > 5000 ? 'var(--accent-red)' : r.hhi > 2500 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{r.hhi.toFixed(0)}</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: r.pctRed > 30 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{r.pctRed.toFixed(1)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LivePage() {
  const [votacoes, setVotacoes] = useState([]);
  const [proposicoes, setProposicoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchVotacoes(), fetchProposicoes()]).then(([v, p]) => {
      setVotacoes(v); setProposicoes(p); setLoading(false);
    });
  }, []);

  // Mock votações caso API falhe
  const mockVot = [
    { descricao: 'PEC 45/2019 - Reforma Tributária', dataHoraRegistro: '2024-11-06T14:30:00', siglaOrgao: 'PLEN' },
    { descricao: 'PL 2630/2020 - Marco das Fake News', dataHoraRegistro: '2024-11-05T17:15:00', siglaOrgao: 'PLEN' },
    { descricao: 'Medida Provisória 1.184/2023', dataHoraRegistro: '2024-11-05T10:22:00', siglaOrgao: 'CMO' },
  ];
  const mockProp = [
    { siglaTipo: 'PL', numero: 2538, ano: 2024, ementa: 'Dispõe sobre transparência nos gastos parlamentares' },
    { siglaTipo: 'PEC', numero: 39, ano: 2024, ementa: 'Altera os limites da cota parlamentar' },
    { siglaTipo: 'PDC', numero: 156, ano: 2024, ementa: 'Regulamenta o uso de cotas para viagens' },
  ];

  const vots = votacoes.length ? votacoes : mockVot;
  const props = proposicoes.length ? proposicoes : mockProp;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="page-title">CÂMARA AO VIVO</div>
          <div className="topbar-live"><div className="live-dot" /> API ABERTA</div>
        </div>
        <div className="page-desc">Dados em tempo real via API REST da Câmara dos Deputados · dadosabertos.camara.leg.br</div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot amber" /><span>VOTAÇÕES RECENTES</span></div>
          {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div> :
            <div className="space-y-3">
              {vots.slice(0, 8).map((v, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(35,35,40,0.5)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4 }}>{v.descricao?.slice(0, 80) || 'Votação'}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-amber">{v.siglaOrgao || 'PLEN'}</span>
                    <span className="font-mono text-muted" style={{ fontSize: 10 }}>{v.dataHoraRegistro?.slice(0, 16).replace('T', ' ') || 'N/D'}</span>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot teal" /><span>PROPOSIÇÕES RECENTES</span></div>
          {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div> :
            <div className="space-y-3">
              {props.slice(0, 8).map((p, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(35,35,40,0.5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-teal">{p.siglaTipo}</span>
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.numero}/{p.ano}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{p.ementa?.slice(0, 80) || 'N/D'}</div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      {/* LINKS */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div className="section-header"><span className="section-dot" /><span>FONTES DE DADOS</span></div>
        <div className="grid-3">
          {[
            { title: 'CEAP — Dados de Gastos', desc: 'CSV com todas as transações por ano', url: 'https://www.camara.leg.br/cota-parlamentar/', color: 'var(--accent-red)' },
            { title: 'API REST da Câmara', desc: 'Deputados, votações, proposições', url: 'https://dadosabertos.camara.leg.br/', color: 'var(--accent-teal)' },
            { title: 'Portal de Transparência', desc: 'Dados do governo federal', url: 'https://portaldatransparencia.gov.br/', color: 'var(--accent-amber)' },
          ].map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'none', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.05em', color: s.color, marginBottom: 4 }}>{s.title} ↗</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAPA DO BRASIL SVG ───────────────────────────────────────────────────────
const UF_PATHS = {
  'AM': 'M 158 98 L 178 88 L 205 92 L 220 108 L 218 128 L 200 140 L 175 138 L 158 125 Z',
  'PA': 'M 220 88 L 255 78 L 280 92 L 285 115 L 265 130 L 240 132 L 218 128 L 220 108 Z',
  'RR': 'M 168 68 L 188 58 L 205 68 L 205 88 L 188 95 L 168 88 Z',
  'AP': 'M 272 68 L 290 60 L 302 72 L 295 88 L 278 90 Z',
  'AC': 'M 128 128 L 158 125 L 158 145 L 135 148 Z',
  'RO': 'M 158 138 L 178 138 L 182 158 L 162 165 L 148 155 Z',
  'MT': 'M 188 148 L 225 138 L 248 155 L 242 188 L 205 195 L 182 175 Z',
  'TO': 'M 265 128 L 290 125 L 295 155 L 272 162 L 252 148 Z',
  'MA': 'M 285 88 L 318 82 L 325 105 L 305 118 L 282 112 Z',
  'PI': 'M 318 88 L 340 85 L 348 108 L 328 122 L 308 115 Z',
  'CE': 'M 340 78 L 368 75 L 372 95 L 352 108 L 335 100 Z',
  'RN': 'M 368 72 L 390 70 L 392 85 L 372 90 Z',
  'PB': 'M 355 92 L 380 88 L 385 102 L 362 105 Z',
  'PE': 'M 335 105 L 375 100 L 378 118 L 340 120 Z',
  'AL': 'M 368 118 L 388 115 L 390 128 L 370 130 Z',
  'SE': 'M 358 128 L 378 125 L 380 140 L 360 142 Z',
  'BA': 'M 295 122 L 358 115 L 368 168 L 320 192 L 280 175 L 275 148 Z',
  'GO': 'M 248 162 L 292 155 L 298 195 L 265 210 L 232 195 Z',
  'DF': 'M 278 185 L 288 183 L 290 192 L 280 194 Z',
  'MG': 'M 298 168 L 368 162 L 378 215 L 330 238 L 288 222 L 282 195 Z',
  'ES': 'M 368 195 L 390 190 L 395 215 L 372 218 Z',
  'RJ': 'M 330 235 L 368 228 L 375 248 L 340 252 Z',
  'SP': 'M 255 215 L 320 210 L 332 255 L 280 262 L 248 242 Z',
  'PR': 'M 235 255 L 295 248 L 300 275 L 248 280 Z',
  'SC': 'M 245 278 L 298 272 L 300 292 L 250 295 Z',
  'RS': 'M 235 292 L 295 285 L 298 325 L 250 330 L 228 312 Z',
  'MS': 'M 205 198 L 252 192 L 255 238 L 215 245 L 195 225 Z',
};

function MapaBrasil({ data, onUFClick }) {
  const [tooltip, setTooltip] = useState(null);
  const max = useMemo(() => Math.max(...Object.values(data).map(d => d.total || 0)), [data]);

  const getColor = (uf) => {
    const d = data[uf];
    if (!d) return '#1a1a1f';
    const intensity = d.total / max;
    const r = Math.round(224 * intensity + 26 * (1 - intensity));
    const g = Math.round(69 * intensity + 26 * (1 - intensity));
    const b = Math.round(69 * intensity + 31 * (1 - intensity));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox="110 55 300 285" style={{ width: '100%', maxHeight: 400 }}>
        {Object.entries(UF_PATHS).map(([uf, path]) => (
          <path key={uf} d={path}
            fill={getColor(uf)}
            className="map-state"
            onClick={() => onUFClick?.(uf)}
            onMouseEnter={(e) => {
              const d = data[uf];
              setTooltip({ uf, x: e.clientX, y: e.clientY, total: d?.total || 0, ndeps: d?.ndeps || 0, score: d?.score || 0 });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        {Object.entries(UF_PATHS).map(([uf, path]) => {
          const match = path.match(/M (\d+) (\d+)/);
          if (!match) return null;
          const cx = parseInt(match[1]) + 8;
          const cy = parseInt(match[2]) + 12;
          return (
            <text key={`t-${uf}`} x={cx} y={cy} fontSize="7" fill="rgba(245,245,243,0.6)"
              textAnchor="middle" fontFamily="JetBrains Mono, monospace" pointerEvents="none">
              {uf}
            </text>
          );
        })}
      </svg>
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 10, zIndex: 1000, pointerEvents: 'none',
          background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.05em' }}>{tooltip.uf}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-red)', marginTop: 2 }}>{fmt(tooltip.total)}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{tooltip.ndeps} deputados</div>
        </div>
      )}
      {/* LEGENDA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>MENOR</div>
        <div style={{ width: 120, height: 6, borderRadius: 3, background: 'linear-gradient(to right, #1a1a1f, #e04545)' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>MAIOR</div>
      </div>
    </div>
  );
}

// ─── REDE DE FORNECEDORES ──────────────────────────────────────────────────────
function RedeForncedores({ data, deputado }) {
  const svgRef = useRef(null);
  const W = 600; const H = 400;

  const nodes = useMemo(() => {
    if (!data.length) return { nodes: [], links: [] };
    const dep = data.filter(r => !deputado || r.txNomeParlamentar === deputado);
    const byForn = {};
    dep.forEach(r => {
      const k = r.txtFornecedor.slice(0, 25);
      if (!byForn[k]) byForn[k] = { id: k, total: 0, n: 0, cat: r.txtDescricao };
      byForn[k].total += r.vlrLiquido;
      byForn[k].n++;
    });
    const fList = Object.values(byForn).sort((a, b) => b.total - a.total).slice(0, 12);
    const center = { id: deputado || 'CONGRESSO', total: dep.reduce((s, r) => s + r.vlrLiquido, 0), isCenter: true };

    // Posicionamento em círculo
    const nodesPos = [{ ...center, x: W / 2, y: H / 2 }];
    fList.forEach((f, i) => {
      const angle = (i / fList.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 140 + Math.random() * 20;
      nodesPos.push({ ...f, x: W / 2 + Math.cos(angle) * radius, y: H / 2 + Math.sin(angle) * radius });
    });
    const links = fList.map(f => ({
      source: center.id, target: f.id,
      value: f.total,
      suspect: f.n < 5 || (f.total / center.total) > 0.3
    }));
    return { nodes: nodesPos, links };
  }, [data, deputado]);

  if (!nodes.nodes.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>Sem dados suficientes.</div>;

  const maxVal = Math.max(...nodes.nodes.filter(n => !n.isCenter).map(n => n.total || 0));

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxHeight: 380, overflow: 'visible' }}>
      <defs>
        <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(61,153,150,0.4)" />
          <stop offset="100%" stopColor="rgba(61,153,150,0.05)" />
        </radialGradient>
      </defs>
      {/* LINKS */}
      {nodes.links.map((l, i) => {
        const src = nodes.nodes.find(n => n.id === l.source);
        const tgt = nodes.nodes.find(n => n.id === l.target);
        if (!src || !tgt) return null;
        const intensity = l.value / maxVal;
        const strokeW = 1 + intensity * 4;
        return (
          <line key={i} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
            stroke={l.suspect ? 'rgba(224,69,69,0.5)' : 'rgba(61,153,150,0.3)'}
            strokeWidth={strokeW}
            strokeDasharray={l.suspect ? '5,3' : 'none'}
          />
        );
      })}
      {/* NODES */}
      {nodes.nodes.map((n, i) => {
        const r = n.isCenter ? 28 : 8 + ((n.total || 0) / maxVal) * 16;
        const color = n.isCenter ? '#3d9996' : ((n.total || 0) / maxVal > 0.3 ? '#e04545' : '#d4a03a');
        return (
          <g key={i} className="network-node" transform={`translate(${n.x},${n.y})`}>
            <circle r={r} fill={n.isCenter ? 'url(#centerGrad)' : `${color}22`}
              stroke={color} strokeWidth={n.isCenter ? 2 : 1} />
            <text textAnchor="middle" dy={n.isCenter ? 5 : 18} fontSize={n.isCenter ? 9 : 8}
              fill={n.isCenter ? 'var(--accent-teal)' : 'var(--text-muted)'}
              fontFamily="JetBrains Mono, monospace">
              {n.id.slice(0, n.isCenter ? 20 : 16)}
            </text>
            {!n.isCenter && (
              <text textAnchor="middle" dy={28} fontSize={7} fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">
                {fmt(n.total)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── STORIES DO MANDATO ────────────────────────────────────────────────────────
function StoriesMandato({ depData, nome }) {
  const [active, setActive] = useState(0);

  const stories = useMemo(() => {
    if (!depData.length) return [];
    const byPeriodo = {};
    depData.forEach(r => {
      const k = `${r.numAno}-${String(r.numMes).padStart(2, '0')}`;
      if (!byPeriodo[k]) byPeriodo[k] = { periodo: k, ano: r.numAno, mes: r.numMes, total: 0, n: 0, cats: {}, forn: new Set() };
      byPeriodo[k].total += r.vlrLiquido;
      byPeriodo[k].n++;
      byPeriodo[k].cats[r.txtDescricao] = (byPeriodo[k].cats[r.txtDescricao] || 0) + r.vlrLiquido;
      byPeriodo[k].forn.add(r.txtFornecedor);
    });
    return Object.values(byPeriodo).sort((a, b) => a.periodo.localeCompare(b.periodo)).map(p => {
      const topCat = Object.entries(p.cats).sort((a, b) => b[1] - a[1])[0];
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return { ...p, topCat: topCat?.[0] || '', topVal: topCat?.[1] || 0, forn: p.forn.size, mesNome: meses[p.mes - 1] };
    });
  }, [depData]);

  const allTotals = stories.map(s => s.total);
  const maxTotal = Math.max(...allTotals) || 1;
  const s = stories[active];

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (!stories.length) return null;

  return (
    <div>
      {/* SCROLL DE PILLS */}
      <div className="stories-container">
        {stories.map((st, i) => {
          const intensity = st.total / maxTotal;
          const color = intensity > 0.7 ? 'var(--accent-red)' : intensity > 0.4 ? 'var(--accent-amber)' : 'var(--accent-teal)';
          return (
            <div key={i} className={`story-pill ${active === i ? 'active' : ''}`}
              style={{ '--story-color': color }} onClick={() => setActive(i)}>
              <div className="story-month" style={{ color }}>{st.mesNome}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>{st.ano}</div>
              <div className="story-val">{fmt(st.total)}</div>
              {intensity > 0.7 && <div className="story-flag" style={{ color: 'var(--accent-red)' }}>⚠ ALTO</div>}
            </div>
          );
        })}
      </div>
      {/* DETALHE DO MÊS */}
      {s && (
        <div className="glass-card" style={{ padding: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.05em' }}>
                {s.mesNome} {s.ano}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {s.n} transações · {s.forn} fornecedores
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: s.total / maxTotal > 0.7 ? 'var(--accent-red)' : s.total / maxTotal > 0.4 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
                {fmt(s.total)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {((s.total / maxTotal) * 100).toFixed(0)}% do pico mensal
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Maior categoria
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.topCat} — {fmt(s.topVal)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PÁGINA MAPA ───────────────────────────────────────────────────────────────
function MapaPage({ data }) {
  const [selectedUF, setSelectedUF] = useState(null);
  const [view, setView] = useState('gastos'); // gastos | risco | fornecedores

  const ufData = useMemo(() => {
    const m = {};
    data.forEach(r => {
      if (!m[r.sgUF]) m[r.sgUF] = { total: 0, ndeps: new Set(), forn: new Set(), rows: [] };
      m[r.sgUF].total += r.vlrLiquido;
      m[r.sgUF].ndeps.add(r.txNomeParlamentar);
      m[r.sgUF].forn.add(r.txtFornecedor);
      m[r.sgUF].rows.push(r);
    });
    return Object.fromEntries(Object.entries(m).map(([uf, d]) => [uf, {
      ...d, ndeps: d.ndeps.size, forn: d.forn.size,
      mediaDep: d.total / d.ndeps.size,
      score: Math.min(100, Math.round(d.total / d.ndeps.size / 10000 * 20 + d.forn.size / d.ndeps.size < 5 ? 30 : 0)),
    }]));
  }, [data]);

  const ufDeps = useMemo(() => {
    if (!selectedUF) return [];
    const m = {};
    data.filter(r => r.sgUF === selectedUF).forEach(r => {
      if (!m[r.txNomeParlamentar]) m[r.txNomeParlamentar] = { nome: r.txNomeParlamentar, partido: r.sgPartido, total: 0, n: 0 };
      m[r.txNomeParlamentar].total += r.vlrLiquido; m[r.txNomeParlamentar].n++;
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [data, selectedUF]);

  const ufInfo = selectedUF ? ufData[selectedUF] : null;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">MAPA DO BRASIL</div>
        <div className="page-desc">Gastos e suspeição por estado · clique num estado para detalhar</div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot" /><span>CALOR DE GASTOS POR ESTADO</span></div>
          <MapaBrasil data={ufData} onUFClick={setSelectedUF} />
        </div>

        <div>
          {/* RANKING UFs */}
          <div className="glass-card" style={{ padding: 20, marginBottom: 14 }}>
            <div className="section-header"><span className="section-dot amber" /><span>RANKING POR ESTADO</span></div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {Object.entries(ufData).sort((a, b) => b[1].total - a[1].total).map(([uf, d], i) => (
                <div key={uf} className="bar-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedUF(uf)}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: selectedUF === uf ? 'var(--accent-teal)' : 'var(--text-muted)', width: 28, flexShrink: 0, fontWeight: selectedUF === uf ? 600 : 400 }}>{uf}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${d.total / Object.values(ufData).reduce((m, x) => Math.max(m, x.total), 0) * 100}%`, background: i < 3 ? 'var(--accent-red)' : i < 8 ? 'var(--accent-amber)' : 'var(--accent-teal)' }} />
                  </div>
                  <div className="bar-val">{fmt(d.total)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* DETALHE UF */}
          {selectedUF && ufInfo && (
            <div className="glass-card fade-in" style={{ padding: 20 }}>
              <div className="section-header"><span className="section-dot teal" /><span>ESTADO: {selectedUF}</span></div>
              <div className="grid-2" style={{ gap: 10, marginBottom: 14 }}>
                <StatCard label="Total" value={fmt(ufInfo.total)} color="var(--accent-red)" accentColor="var(--accent-red)" />
                <StatCard label="Deputados" value={ufInfo.ndeps} accentColor="var(--accent-teal)" />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Maiores gastadores
              </div>
              {ufDeps.slice(0, 5).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(35,35,40,0.5)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{d.nome.split(' ').slice(0, 2).join(' ')}</div>
                  <span className="money">{fmt(d.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA REDE DE FORNECEDORES ───────────────────────────────────────────────
function RedePage({ data, nomes }) {
  const [filtroNome, setFiltroNome] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (filtroNome.length > 1 && !nomes.includes(filtroNome)) {
      setSuggestions(nomes.filter(n => n.toLowerCase().includes(filtroNome.toLowerCase())).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [filtroNome, nomes]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">REDE DE FORNECEDORES</div>
        <div className="page-desc">Quem recebe de quem · grafo de relacionamentos parlamentar → fornecedor</div>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            className="search-input" 
            placeholder="Filtrar por Parlamentar..." 
            value={filtroNome} 
            onChange={e => setFiltroNome(e.target.value)} 
            style={{ flex: 1 }} 
          />
          {filtroNome && <button className="btn" onClick={() => { setFiltroNome(''); setSuggestions([]); }}>Limpar</button>}
        </div>
        {suggestions.length > 0 && (
          <div className="autocomplete-dropdown">
            {suggestions.map(s => (
              <div key={s} className="autocomplete-item" onClick={() => { setFiltroNome(s); setSuggestions([]); }}>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="section-header"><span className="section-dot teal" /><span>GRAFO INTERATIVO</span></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>
          <span style={{ color: 'var(--accent-teal)' }}>● </span>Centro = parlamentar &nbsp;
          <span style={{ color: 'var(--accent-amber)' }}>● </span>Fornecedor normal &nbsp;
          <span style={{ color: 'var(--accent-red)' }}>● </span>Fornecedor concentrado (&gt;30% dos gastos) &nbsp;
          <span style={{ color: 'var(--accent-red)' }}>- - </span>Ligação suspeita
        </div>
        <RedeForncedores data={data} deputado={filtroNome} />
      </div>

      {/* TABELA FORNECEDORES MAIS PAGOS */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div className="section-header"><span className="section-dot amber" /><span>FORNECEDORES QUE MAIS RECEBEM</span></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Fornecedor</th><th>CNPJ/CPF</th>
                <th style={{ textAlign: 'right' }}>Total Recebido</th>
                <th style={{ textAlign: 'right' }}>Nº Pagamentos</th>
                <th style={{ textAlign: 'right' }}>Parlamentares</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const m = {};
                (filtroNome ? data.filter(r => r.txNomeParlamentar === filtroNome) : data).forEach(r => {
                  const k = r.txtCNPJCPF || r.txtFornecedor;
                  if (!m[k]) m[k] = { nome: r.txtFornecedor, cnpj: r.txtCNPJCPF, total: 0, n: 0, deps: new Set() };
                  m[k].total += r.vlrLiquido; m[k].n++; m[k].deps.add(r.txNomeParlamentar);
                });
                return Object.values(m).sort((a, b) => b.total - a.total).slice(0, 20).map((f, i) => {
                  const isLaranja = f.n < 10 && f.total > 50000;
                  return (
                    <tr key={i}>
                      <td><span className={`rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span></td>
                      <td style={{ fontSize: 12, maxWidth: 200 }} className="truncate">{f.nome}</td>
                      <td><span className="font-mono text-muted" style={{ fontSize: 10 }}>{f.cnpj?.slice(0, 18)}</span></td>
                      <td style={{ textAlign: 'right' }}><span className={`money ${i < 5 ? 'big' : ''}`}>{fmt(f.total)}</span></td>
                      <td style={{ textAlign: 'right' }}><span className="font-mono text-secondary" style={{ fontSize: 12 }}>{fmtN(f.n)}</span></td>
                      <td style={{ textAlign: 'right' }}><span className="font-mono text-muted" style={{ fontSize: 12 }}>{f.deps.size}</span></td>
                      <td>
                        {isLaranja && <span className="badge badge-red">⚠ SUSPEITO</span>}
                        {!isLaranja && f.deps.size > 10 && <span className="badge badge-amber">RECORRENTE</span>}
                        {!isLaranja && f.deps.size <= 10 && <span className="badge badge-teal">NORMAL</span>}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA HALL DA VERGONHA / TRANSPARÊNCIA ───────────────────────────────────
function HallPage({ data }) {
  const rankings = useMemo(() => {
    const m = {};
    data.forEach(r => {
      if (!m[r.txNomeParlamentar]) m[r.txNomeParlamentar] = { nome: r.txNomeParlamentar, partido: r.sgPartido, uf: r.sgUF, total: 0, n: 0, forn: new Set() };
      m[r.txNomeParlamentar].total += r.vlrLiquido; m[r.txNomeParlamentar].n++; m[r.txNomeParlamentar].forn.add(r.txtFornecedor);
    });
    const list = Object.values(m).map(d => ({ ...d, forn: d.forn.size, media: d.total / d.n }));
    const shame = list.sort((a, b) => b.total - a.total).slice(0, 10);
    const honor = list.sort((a, b) => a.total - b.total).slice(0, 10);
    return { shame, honor };
  }, [data]);

  const SALARIO_MIN = 1412;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">HALL DA VERGONHA & TRANSPARÊNCIA</div>
        <div className="page-desc">Os que mais gastam vs os que mais economizam · atualizado mensalmente</div>
      </div>

      <div className="grid-2">
        {/* HALL DA VERGONHA */}
        <div>
          <div className="section-header"><span className="section-dot" /><span>🔴 HALL DA VERGONHA</span></div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              OS 10 MAIORES GASTADORES DO PERÍODO
            </div>
            {rankings.shame.map((d, i) => (
              <div key={i} className="hall-card shame" style={{ marginBottom: 8 }}>
                <div className="hall-rank" style={{ color: 'var(--accent-red)' }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.nome.split(' ').slice(0, 3).join(' ')}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                    <span className="badge badge-red">{d.partido}</span>
                    <span className="font-mono text-muted" style={{ fontSize: 10 }}>{d.uf}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-red)', fontWeight: 600 }}>{fmt(d.total)}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                    {Math.round(d.total / SALARIO_MIN)}× salário mínimo
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HALL DA TRANSPARÊNCIA */}
        <div>
          <div className="section-header"><span className="section-dot teal" /><span>🟢 HALL DA TRANSPARÊNCIA</span></div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              OS 10 QUE MENOS GASTARAM NO PERÍODO
            </div>
            {rankings.honor.map((d, i) => (
              <div key={i} className="hall-card honor" style={{ marginBottom: 8 }}>
                <div className="hall-rank" style={{ color: 'var(--status-low)' }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.nome.split(' ').slice(0, 3).join(' ')}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                    <span className="badge badge-teal">{d.partido}</span>
                    <span className="font-mono text-muted" style={{ fontSize: 10 }}>{d.uf}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--status-low)', fontWeight: 600 }}>{fmt(d.total)}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                    {d.n} transações
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMPARADOR VIRAL */}
      <div style={{ marginTop: 20 }}>
        <div className="section-header"><span className="section-dot amber" /><span>COMPARADOR VIRAL</span></div>
        <div className="grid-3">
          {rankings.shame.slice(0, 3).map((d, i) => {
            const smMin = Math.round(d.total / SALARIO_MIN);
            const anos = (d.total / 2800 / 12).toFixed(1);
            return (
              <div key={i} className="viral-card glass-card">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  {d.nome.split(' ')[0]} {d.nome.split(' ').slice(-1)[0]}
                </div>
                <div className="viral-number">{smMin}x</div>
                <div className="viral-label">salários mínimos gastos</div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Um brasileiro médio levaria <strong style={{ color: 'var(--accent-amber)' }}>{anos} anos</strong> para ganhar isso
                </div>
                <button className="btn" style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontSize: 11 }}
                  onClick={() => {
                    const text = `🔴 O deputado ${d.nome} gastou R$${(d.total / 1e3).toFixed(0)}K da cota parlamentar — ${smMin}x o salário mínimo. Um brasileiro levaria ${anos} anos para ganhar isso. #OlhoDeDeus #Transparência`;
                    navigator.clipboard?.writeText(text);
                    alert('Copiado! Cole nas redes sociais.');
                  }}>
                  📣 Compartilhar
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA BUSCA POR CEP ──────────────────────────────────────────────────────
function CEPPage({ data }) {
  const [cep, setCep] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const buscarCEP = async () => {
    if (cep.replace(/\D/g, '').length < 8) { setErro('CEP inválido'); return; }
    setLoading(true); setErro(''); setResultado(null);
    const addr = await fetchCEP(cep);
    if (!addr) { setErro('CEP não encontrado'); setLoading(false); return; }

    // Encontra deputados do estado
    const uf = addr.uf;
    const deps = {};
    data.filter(r => r.sgUF === uf).forEach(r => {
      if (!deps[r.txNomeParlamentar]) deps[r.txNomeParlamentar] = { nome: r.txNomeParlamentar, partido: r.sgPartido, total: 0, n: 0 };
      deps[r.txNomeParlamentar].total += r.vlrLiquido; deps[r.txNomeParlamentar].n++;
    });
    const lista = Object.values(deps).sort((a, b) => b.total - a.total);

    setResultado({ addr, uf, lista });
    setLoading(false);
  };

  const SALARIO_MIN = 1412;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">BUSCA POR CEP</div>
        <div className="page-desc">Digite seu CEP e descubra quem são seus deputados e quanto eles gastam</div>
      </div>

      <div className="glass-card" style={{ padding: 24, maxWidth: 500 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Seu CEP
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="search-input" placeholder="00000-000" value={cep}
            onChange={e => setCep(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarCEP()}
            style={{ flex: 1, fontSize: 18, letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }} />
          <button className="btn btn-primary" onClick={buscarCEP} disabled={loading}>
            {loading ? '...' : 'Buscar'}
          </button>
        </div>
        {erro && <div style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 8, fontFamily: 'var(--font-mono)' }}>{erro}</div>}
      </div>

      {resultado && (
        <div className="fade-in">
          <div className="cep-result" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.05em' }}>
              {resultado.addr.localidade}, {resultado.addr.uf}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {resultado.addr.logradouro} — {resultado.addr.bairro}
            </div>
            <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-teal)' }}>
              {resultado.lista.length} deputados federais representam seu estado
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div className="section-header"><span className="section-dot" /><span>SEUS DEPUTADOS — {resultado.uf}</span></div>
            <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
              <table className="data-table">
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card-solid)' }}>
                  <tr>
                    <th>#</th><th>Deputado</th><th>Partido</th>
                    <th style={{ textAlign: 'right' }}>Total Gasto</th>
                    <th style={{ textAlign: 'right' }}>Salários Mínimos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.lista.map((d, i) => (
                    <tr key={i}>
                      <td><span className={`rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span></td>
                      <td style={{ fontWeight: 600 }}>{d.nome}</td>
                      <td><span className="badge badge-teal">{d.partido}</span></td>
                      <td style={{ textAlign: 'right' }}><span className={`money ${i < 3 ? 'big' : ''}`}>{fmt(d.total)}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: i < 3 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                          {Math.round(d.total / SALARIO_MIN)}×
                        </span>
                      </td>
                      <td>
                        <button className="btn" style={{ fontSize: 10, padding: '3px 8px' }}
                          onClick={() => {
                            const t = `Meu deputado ${d.nome} (${d.partido}-${resultado.uf}) gastou ${fmt(d.total)} da cota parlamentar — ${Math.round(d.total / SALARIO_MIN)}× o salário mínimo! #OlhoDeDeus`;
                            navigator.clipboard?.writeText(t); alert('Copiado!');
                          }}>
                          📣
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmendasPage({ data, nomes }) {
  const [autor, setAutor] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [ano, setAno] = useState('2024');
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (autor.length > 1 && !nomes.includes(autor)) {
      setSuggestions(nomes.filter(n => n.toLowerCase().includes(autor.toLowerCase())).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [autor, nomes]);

  const buscar = async () => {
    setLoading(true);
    setSuggestions([]);
    const res = await fetchEmendasParlamentares(autor, ano, localStorage.getItem('cguKey') || 'demo');
    setResult(res.data || []);
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">EMENDAS & EXECUÇÃO DE OBRAS</div>
        <div className="page-desc">Consulte emendas destinadas via Portal da Transparência (CGU)</div>
      </div>
      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 600 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              className="search-input" 
              placeholder="Nome do Parlamentar..." 
              value={autor} 
              onChange={e => setAutor(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && buscar()}
              style={{ flex: 1 }} 
            />
            <select className="select-input" value={ano} onChange={e => setAno(e.target.value)}>
              {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button className="btn btn-primary" onClick={buscar} disabled={loading}>{loading ? '...' : '🔍 Buscar'}</button>
          </div>
          {suggestions.length > 0 && (
            <div className="autocomplete-dropdown" style={{ left: 0, right: 180 }}>
              {suggestions.map(s => (
                <div key={s} className="autocomplete-item" onClick={() => { setAutor(s); setSuggestions([]); }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Beneficiário</th><th>Valor</th><th>Plano de Trabalho</th><th>Data</th></tr>
            </thead>
            <tbody>
              {result.length > 0 ? result.map((e, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12 }}>{e.beneficiario?.nome || 'N/A'}</td>
                  <td className="money">{fmt(e.valorEmpenhado)}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.subfuncao?.nome || 'N/A'}</td>
                  <td className="font-mono" style={{ fontSize: 11 }}>{e.data?.[0]?.split('T')[0] || ''}</td>
                </tr>
              )) : <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhuma emenda encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PatrimonioPage({ data, nomes }) {
  const [nome, setNome] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [bens, setBens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (nome.length > 1 && !nomes.includes(nome)) {
      setSuggestions(nomes.filter(n => n.toLowerCase().includes(nome.toLowerCase())).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [nome, nomes]);

  const buscar = async () => {
    setLoading(true);
    setSuggestions([]);
    const cand = await fetchCandidaturasTSE(nome);
    if (cand.length > 0) {
      const res = await fetchBensTSE(cand[0].id);
      setBens(res || []);
    } else {
      setBens([]);
    }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">PATRIMÔNIO & EVOLUÇÃO</div>
        <div className="page-desc">Declaração de bens dos candidatos via TSE</div>
      </div>
      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 500 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              className="search-input" 
              placeholder="Nome do Parlamentar..." 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && buscar()}
              style={{ flex: 1 }} 
            />
            <button className="btn btn-primary" onClick={buscar} disabled={loading}>{loading ? '...' : '🔍 Consultar'}</button>
          </div>
          {suggestions.length > 0 && (
            <div className="autocomplete-dropdown" style={{ left: 0, right: 90 }}>
              {suggestions.map(s => (
                <div key={s} className="autocomplete-item" onClick={() => { setNome(s); setSuggestions([]); }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid-2">
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span>TOTAL DECLARADO</span></div>
          <div style={{ fontSize: 32, color: 'var(--accent-amber)', fontFamily: 'var(--font-display)' }}>
            {fmt(bens.reduce((s, b) => s + b.valor, 0))}
          </div>
          <div className="stat-sub">{bens.length} itens registrados</div>
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span>DETALHAMENTO</span></div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {bens.map((b, i) => (
              <div key={i} className="info-row">
                <div className="info-key">{b.descricao}</div>
                <div className="info-val">{fmt(b.valor)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanciadoresPage({ data, nomes }) {
  const [nome, setNome] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [fin, setFin] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (nome.length > 1 && !nomes.includes(nome)) {
      setSuggestions(nomes.filter(n => n.toLowerCase().includes(nome.toLowerCase())).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [nome, nomes]);

  const buscar = async () => {
    setLoading(true);
    setSuggestions([]);
    const cand = await fetchCandidaturasTSE(nome);
    if (cand.length > 0) {
      const res = await fetchPrestacaoContasTSE(cand[0].id);
      setFin(res || []);
    } else {
      setFin([]);
    }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">FINANCIADORES DE CAMPANHA</div>
        <div className="page-desc">Quem financiou a última eleição do parlamentar</div>
      </div>
      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 500 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              className="search-input" 
              placeholder="Nome do Parlamentar..." 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && buscar()}
              style={{ flex: 1 }} 
            />
            <button className="btn btn-primary" onClick={buscar} disabled={loading}>{loading ? '...' : '🔍 Analisar'}</button>
          </div>
          {suggestions.length > 0 && (
            <div className="autocomplete-dropdown" style={{ left: 0, right: 90 }}>
              {suggestions.map(s => (
                <div key={s} className="autocomplete-item" onClick={() => { setNome(s); setSuggestions([]); }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="glass-card" style={{ padding: 20 }}>
        <div className="section-header"><span>PRINCIPAIS DOADORES</span></div>
        {fin.length > 0 ? (
          <BarChart data={fin.slice(0, 10).map(f => ({ label: f.nomeDoador, value: f.valor }))} color="var(--accent-purple)" />
        ) : <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum doador encontrado.</div>}
      </div>
    </div>
  );
}

function SocialServidoresPage() {
  const [activeSubTab, setActiveSubTab] = useState('beneficios');
  const [search, setSearch] = useState('');
  const [mesAno, setMesAno] = useState('202401');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiKey = localStorage.getItem('cguKey') || 'demo';

  const buscar = async () => {
    setLoading(true);
    let res;
    if (activeSubTab === 'beneficios') {
      res = await fetchBolsaFamilia(search, mesAno, apiKey);
    } else if (activeSubTab === 'servidores') {
      res = await fetchServidores(search, apiKey);
    } else if (activeSubTab === 'licitacoes') {
      res = await fetchLicitacoes(search, apiKey); // search aqui seria o código IBGE
    }
    setResults(res?.data || []);
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">PAINEL SOCIAL & SERVIDORES</div>
        <div className="page-desc">Investigação de benefícios, servidores federais e gastos municipais</div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {['beneficios', 'servidores', 'licitacoes'].map(t => (
            <div key={t} onClick={() => setActiveSubTab(t)}
              style={{
                padding: '14px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                borderBottom: activeSubTab === t ? '2px solid var(--accent-red)' : 'none',
                color: activeSubTab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                background: activeSubTab === t ? 'rgba(224,69,69,0.05)' : 'transparent'
              }}
            >
              {t === 'beneficios' ? 'Bolsa Família' : t === 'servidores' ? 'Servidores Federais' : 'Licitações'}
            </div>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="search-input"
              placeholder={activeSubTab === 'licitacoes' ? 'Código IBGE do Município...' : 'CPF (somente números)...'}
              value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
            {activeSubTab === 'beneficios' && (
              <input className="search-input" placeholder="MMAAAA (ex: 012024)" value={mesAno} onChange={e => setMesAno(e.target.value)} style={{ width: 120 }} />
            )}
            <button className="btn btn-primary" onClick={buscar} disabled={loading}>{loading ? '...' : '🔍 Consultar'}</button>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Consultando base do Governo Federal...</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                {activeSubTab === 'beneficios' ? (
                  <tr><th>Beneficiário</th><th>Município</th><th>Valor</th><th>Mês/Ano</th></tr>
                ) : activeSubTab === 'servidores' ? (
                  <tr><th>Nome</th><th>Cargo</th><th>Órgão Lotação</th><th>UF</th></tr>
                ) : (
                  <tr><th>Objeto</th><th>Unidade Gestora</th><th>Modalidade</th><th>Valor</th></tr>
                )
                }
              </thead>
              <tbody>
                {results.length > 0 ? results.map((r, i) => (
                  <tr key={i}>
                    {activeSubTab === 'beneficios' ? (
                      <>
                        <td>{r.beneficiario?.nome || 'N/A'}</td>
                        <td>{r.municipio?.nomeIBGE} - {r.municipio?.uf?.sigla}</td>
                        <td className="money">{fmt(r.valor)}</td>
                        <td>{r.dataReferencia}</td>
                      </>
                    ) : activeSubTab === 'servidores' ? (
                      <>
                        <td>{r.servidor?.pessoa?.nome || 'N/A'}</td>
                        <td>{r.cargo?.descricao || 'N/A'}</td>
                        <td>{r.orgaoLotacao?.nome || 'N/A'}</td>
                        <td>{r.ufLotacao || 'N/A'}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontSize: 11, maxWidth: 300 }} className="truncate">{r.objeto || 'N/A'}</td>
                        <td>{r.unidadeGestora?.nome || 'N/A'}</td>
                        <td>{r.modalidadeLicitacao?.descricao || 'N/A'}</td>
                        <td className="money">{fmt(r.valorEstimado || r.valorHomologado)}</td>
                      </>
                    )}
                  </tr>
                )) : <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum registro encontrado para esta consulta.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── PÁGINA ÍNDICE DE SUSPEIÇÃO POR SETOR ──────────────────────────────────────
function SetoresPage({ data }) {
  const sectorData = useMemo(() => {
    const m = {};
    data.forEach(r => {
      const cat = r.txtDescricao;
      if (!m[cat]) m[cat] = { cat, total: 0, n: 0, deps: new Set(), forn: new Set() };
      m[cat].total += r.vlrLiquido; m[cat].n++; m[cat].deps.add(r.txNomeParlamentar); m[cat].forn.add(r.txtFornecedor);
    });
    return Object.values(m).map(d => ({
      ...d, deps: d.deps.size, forn: d.forn.size,
      mediaTrans: d.total / d.n,
      suspScore: SECTOR_SUSPICION[d.cat]?.score || 40,
      suspReason: SECTOR_SUSPICION[d.cat]?.reason || 'Dados insuficientes para análise aprofundada.',
    })).sort((a, b) => b.suspScore - a.suspScore);
  }, [data]);

  const maxTotal = Math.max(...sectorData.map(s => s.total));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">ÍNDICE DE SUSPEIÇÃO POR SETOR</div>
        <div className="page-desc">Cada categoria de gasto tem um histórico de risco de irregularidade</div>
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Score 0–100 baseado em histórico de irregularidades, facilidade de fraude e dificuldade de auditoria
        </div>
        {sectorData.map((s, i) => {
          const scoreColor = s.suspScore > 70 ? 'var(--accent-red)' : s.suspScore > 50 ? 'var(--accent-amber)' : 'var(--status-low)';
          return (
            <div key={i} className="sector-row">
              <div style={{ width: 36, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 20, color: scoreColor, flexShrink: 0 }}>
                {s.suspScore}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.cat}</div>
                  <span className="money" style={{ fontSize: 12 }}>{fmt(s.total)}</span>
                </div>
                <div className="sector-bar">
                  <div className="sector-fill" style={{ width: `${s.suspScore}%`, background: scoreColor }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{s.suspReason}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PÁGINA IA / ASSISTENTE ────────────────────────────────────────────────────
function IAPage({ data }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou o assistente de investigação do Olho de Deus. Posso analisar padrões nos dados de gastos parlamentares e responder perguntas em linguagem natural. Configure sua chave da API (Gemini ou Groq) nas configurações e comece a investigar!' }
  ]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiType, setApiType] = useState('gemini');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const SUGGESTED = [
    'Quem são os 5 deputados com maior concentração de gastos em um único fornecedor?',
    'Quais categorias têm mais valores redondos suspeitos?',
    'Existe algum deputado que gasta mais em ano eleitoral?',
    'Quais fornecedores recebem de mais de 10 deputados diferentes?',
  ];

  const statsContext = useMemo(() => {
    const total = data.reduce((s, r) => s + r.vlrLiquido, 0);
    const ndeps = new Set(data.map(r => r.txNomeParlamentar)).size;
    const nforn = new Set(data.map(r => r.txtFornecedor)).size;
    const top5 = (() => {
      const m = {}; data.forEach(r => { if (!m[r.txNomeParlamentar]) m[r.txNomeParlamentar] = 0; m[r.txNomeParlamentar] += r.vlrLiquido; });
      return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => `${n}: ${fmt(v)}`).join(', ');
    })();
    return `Dataset: ${data.length} transações, ${ndeps} deputados, ${nforn} fornecedores, total ${fmt(total)}. Top 5 gastadores: ${top5}.`;
  }, [data]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    if (!apiKey) { alert('Configure sua API key primeiro!'); return; }

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '...', loading: true }]);
    setInput(''); setLoading(true);

    try {
      let response = '';
      if (apiType === 'gemini') {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: `Você é um assistente de análise de dados parlamentares brasileiros. Contexto dos dados: ${statsContext}\n\nPergunta do investigador: ${text}\n\nResponda de forma direta, objetiva e em português. Identifique padrões suspeitos se relevante.` }] }] })
        });
        const d = await r.json();
        response = d.candidates?.[0]?.content?.parts?.[0]?.text || 'Erro na resposta da API.';
      } else {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'llama3-70b-8192', messages: [
              { role: 'system', content: `Você é um assistente de análise de gastos parlamentares brasileiros. Contexto: ${statsContext}` },
              { role: 'user', content: text }
            ], max_tokens: 500
          })
        });
        const d = await r.json();
        response = d.choices?.[0]?.message?.content || 'Erro na resposta da API.';
      }
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { role: 'assistant', content: response } : m));
    } catch (e) {
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { role: 'assistant', content: `Erro: ${e.message}. Verifique sua API key.` } : m));
    }
    setLoading(false);
    setTimeout(() => chatRef.current?.scrollTo(0, 9999), 100);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">ASSISTENTE DE INVESTIGAÇÃO</div>
        <div className="page-desc">IA para análise em linguagem natural · Gemini ou Groq (gratuitos)</div>
      </div>

      {/* CONFIG */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select-input" value={apiType} onChange={e => setApiType(e.target.value)}>
            <option value="gemini">Google Gemini (grátis)</option>
            <option value="groq">Groq (grátis)</option>
          </select>
          <input className="search-input" placeholder={apiType === 'gemini' ? 'Cole sua Gemini API Key...' : 'Cole sua Groq API Key...'}
            value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" style={{ flex: 1, minWidth: 240 }} />
          <a href={apiType === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://console.groq.com/keys'}
            target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
            Pegar key grátis ↗
          </a>
        </div>
      </div>

      {/* SUGESTÕES */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {SUGGESTED.map((s, i) => (
          <button key={i} className="btn" style={{ fontSize: 11 }} onClick={() => sendMessage(s)}>{s.slice(0, 45)}...</button>
        ))}
      </div>

      {/* CHAT */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div ref={chatRef} className="ai-chat" style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 12 }}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role} ${m.loading ? 'loading' : ''}`}>
              {m.loading ? '⏳ Analisando os dados...' : m.content}
            </div>
          ))}
        </div>
        <div className="ai-input-row">
          <input className="search-input" placeholder="Faça uma pergunta sobre os dados parlamentares..."
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            style={{ flex: 1 }} disabled={loading} />
          <button className="btn btn-primary" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
            {loading ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA MODO INVESTIGAÇÃO ──────────────────────────────────────────────────
function InvestigacaoPage({ data, nomes }) {
  const [activeTab, setActiveTab] = useState('cnpj');
  const [polInput, setPolInput] = useState('');
  const [polSuggestions, setPolSuggestions] = useState([]);

  useEffect(() => {
    if (polInput.length > 1 && !nomes.includes(polInput)) {
      setPolSuggestions(nomes.filter(n => n.toLowerCase().includes(polInput.toLowerCase())).slice(0, 5));
    } else {
      setPolSuggestions([]);
    }
  }, [polInput, nomes]);

  // --- Estados CNPJ ---
  const [cnpjMarcado, setCnpjMarcado] = useState('');
  const [cnpjInput, setCnpjInput] = useState('');
  const [cnpjInfo, setCnpjInfo] = useState(null);
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [investigados, setInvestigados] = useState([]);

  // --- Estados Adicionais (CGU, News, CNJ, IBGE, Módulo 7) ---
  const [cguKey, setCguKey] = useState(import.meta.env.VITE_CGU_KEY || localStorage.getItem('cguKey') || '');
  const [cguData, setCguData] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [cnjData, setCnjData] = useState(null);
  const [ibgeData, setIbgeData] = useState(null);
  const [mod7Data, setMod7Data] = useState(null);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [scoreInvestigacao, setScoreInvestigacao] = useState(null);

  // --- Estados Político ---
  const [polData, setPolData] = useState(null);
  const [polBens, setPolBens] = useState([]);
  const [polEmendas, setPolEmendas] = useState(null);
  const [polJustica, setPolJustica] = useState(null);
  const [polAtivos, setPolAtivos] = useState(null);
  const [polResumoIA, setPolResumoIA] = useState('');
  const [loadingPol, setLoadingPol] = useState(false);

  // --- Estado Varredura 360 ---
  const [scanTarget, setScanTarget] = useState('');
  const [scanResults, setScanResults] = useState(null);
  const [loadingScan, setLoadingScan] = useState(false);

  useEffect(() => { if (cguKey) localStorage.setItem('cguKey', cguKey); }, [cguKey]);

  const pagarVarredura = async () => {
    if (!scanTarget) return;
    setLoadingScan(true);
    const clean = scanTarget.replace(/\D/g, '');
    const isCNPJ = clean.length === 14;
    try {
      const promises = [fetchCEIS(clean, cguKey), fetchCNEP(clean, cguKey), fetchCEPIM(clean, cguKey)];
      if (!isCNPJ) {
        promises.push(fetchCEAF(clean, cguKey), fetchBolsaFamilia(clean, '202401', cguKey), fetchServidores(clean, cguKey), fetchCandidaturasTSE(scanTarget));
      } else {
        promises.push(fetchContratos(clean, cguKey));
      }
      const res = await Promise.all(promises);
      setScanResults({
        ceis: res[0]?.data || [], cnep: res[1]?.data || [], cepim: res[2]?.data || [],
        ceaf: !isCNPJ ? res[3]?.data || [] : [], bolsa: !isCNPJ ? res[4]?.data || [] : [],
        servidores: !isCNPJ ? res[5]?.data || [] : [], tse: !isCNPJ ? res[6]?.candidatos || [] : [],
        contratos: isCNPJ ? res[3]?.data || [] : []
      });
    } catch (e) { console.error(e); }
    setLoadingScan(false);
  };

  const pagamentosParaCNPJ = useMemo(() => {
    if (!cnpjMarcado) return [];
    return data.filter(r => r.txtCNPJCPF?.replace(/\D/g, '').includes(cnpjMarcado) || r.txtFornecedor?.includes(cnpjInfo?.razao_social?.slice(0, 10) || 'XYZXYZ'));
  }, [data, cnpjMarcado, cnpjInfo]);

  const depsPagaram = useMemo(() => {
    const m = {};
    pagamentosParaCNPJ.forEach(r => {
      if (!m[r.txNomeParlamentar]) m[r.txNomeParlamentar] = { nome: r.txNomeParlamentar, partido: r.sgPartido, uf: r.sgUF, total: 0, n: 0 };
      m[r.txNomeParlamentar].total += r.vlrLiquido; m[r.txNomeParlamentar].n++;
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [pagamentosParaCNPJ]);

  const buscarCNPJ = async () => {
    setLoadingCNPJ(true); setCnpjInfo(null); setCguData(null); setNewsData([]); setCnjData(null); setIbgeData(null);
    let info = await fetchCNPJ(cnpjInput);
    if (!info) {
      const rws = await fetchReceitaWS(cnpjInput);
      if (rws) info = { razao_social: rws.nome, ...rws };
    }
    setCnpjInfo(info);
    setLoadingCNPJ(false);

    if (info) {
      const clean = cnpjInput.replace(/\D/g, '');
      setCnpjMarcado(clean);
      if (!investigados.find(i => i.cnpj === clean)) {
        setInvestigados(prev => [...prev, { cnpj: clean, nome: info.razao_social || info.nome || cnpjInput }]);
      }

      setLoadingExtras(true);
      const [ceis, cnep, news, cnj, datajud, cvm, tcu, anac, dou] = await Promise.all([
        cguKey ? fetchCEIS(cnpjInput, cguKey) : null,
        cguKey ? fetchCNEP(cnpjInput, cguKey) : null,
        fetchEscandalos(info.razao_social || info.nome || cnpjInput),
        fetchMandadosPrisao(info.razao_social || info.nome),
        fetchDataJud(info.razao_social || info.nome || cnpjInput),
        fetchCVMInfo(cnpjInput),
        fetchTCUIrregularidades(cnpjInput),
        fetchANACRAB(cnpjInput),
        fetchDOU(info.razao_social || info.nome)
      ]);

      setCguData({ ceis, cnep });
      setNewsData(news);
      setCnjData({ ...cnj, ...datajud });
      setMod7Data({ cvm, tcu, anac, dou });

      // Verificações Avançadas
      const primeiroPagto = pagamentosParaCNPJ.length > 0 ? pagamentosParaCNPJ[pagamentosParaCNPJ.length - 1].datEmissao : null;
      const ehLaranja = detectarLaranja(info.data_inicio_atividade || info.abertura, primeiroPagto);
      const temFracionamento = detectarFracionamento(pagamentosParaCNPJ);
      const socioParlamentar = info.qsa ? depsPagaram.some(dep => detectarSocioParlamentar(info.qsa, dep.nome)) : false;

      const score = calcularScoreSuspeicao({
        cnj, tcu, cgu: { ceis, cnep },
        extra: { cvm },
        empresaNova: ehLaranja,
        fracionamento: temFracionamento,
        socioParlamentar: socioParlamentar
      });
      setScoreInvestigacao(score);

      if (info.municipio && info.uf) {
        const codIbge = await fetchLocalidadeIBGE(info.municipio, info.uf);
        if (codIbge) {
          const [pib, despesas] = await Promise.all([fetchPIBMunicipal(codIbge), fetchSiconfiDespesas(codIbge)]);
          setIbgeData({ codIbge, pib, despesasByYear: despesas });
        }
      }
      setLoadingExtras(false);
    }
  };

  const buscarPolitico = async () => {
    if (!polInput.trim()) return;
    setLoadingPol(true); setPolData(null); setPolBens([]); setPolEmendas(null); setPolJustica(null); setNewsData([]);
    setPolSuggestions([]);
    const cand = await fetchCandidaturasTSE(polInput);
    const prim = cand[0];
    setPolData(prim || { error: 'Candidato não encontrado' });
    if (prim?.id) {
      const [bens, n, mandados, datajud, tcu, anac, dou] = await Promise.all([
        fetchBensTSE(prim.id), fetchEscandalos(prim.nomeUrna), fetchMandadosPrisao(prim.nomeCompleto),
        fetchDataJud(prim.nomeCompleto), fetchTCUIrregularidades(prim.cpf || prim.nomeCompleto),
        fetchANACRAB(prim.cpf || prim.nomeCompleto), fetchDOU(prim.nomeCompleto)
      ]);
      setPolBens(bens); setNewsData(n); setPolJustica({ ...mandados, ...datajud }); setPolAtivos({ tcu, anac, dou });
      if (cguKey) setPolEmendas(await fetchEmendasParlamentares(prim.nomeUrna, '2024', cguKey));
    }
    setLoadingPol(false);
  };

  const handleGerarResumoIA = async () => {
    setLoadingPol(true);
    setPolResumoIA(await gerarResumoInvestigativo({ politico: polData, bens: polBens, emendas: polEmendas, justica: polJustica, ativos: polAtivos }));
    setLoadingPol(false);
  };

  const totalGastoCongresso = useMemo(() => data.reduce((s, r) => s + (r.vlrLiquido || 0), 0), [data]);
  const totalDeputados = useMemo(() => new Set(data.map(r => r.txNomeParlamentar)).size, [data]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">MODO INVESTIGAÇÃO MULTI-BASE</div>
        <div className="page-desc">Plataforma de inteligência: Cruze Receita, TSE, Diário Oficial, e punições CGU</div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <button className={`btn ${activeTab === 'cnpj' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('cnpj')}>🏭 Investigar Fornecedor</button>
        <button className={`btn ${activeTab === 'politico' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('politico')}>👔 Dossiê TSE</button>
        <button className={`btn ${activeTab === 'varredura' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('varredura')}>🔬 Varredura 360°</button>
        <button className={`btn ${activeTab === 'congresso' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('congresso')}>🏛 Visão Congresso</button>
      </div>

      {activeTab === 'varredura' && (
        <div className="fade-in">
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="search-input" placeholder="CPF, CNPJ ou Nome..." value={scanTarget} onChange={e => setScanTarget(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={pagarVarredura} disabled={loadingScan} style={{ background: 'var(--accent-red)' }}>{loadingScan ? '...' : '🔍 Varredura'}</button>
            </div>
          </div>
          {scanResults && (
            <div className="grid-2">
              <div className="glass-card" style={{ padding: 20 }}>
                <div className="section-header"><span className="section-dot red" /><span>SANÇÕES & IMPEDIMENTOS</span></div>
                <div className="space-y-4">
                  <div style={{ fontSize: 12 }}><strong>CEIS/CNEP:</strong> {scanResults.ceis.length + scanResults.cnep.length > 0 ? <span className="badge badge-red">CONSTA</span> : <span className="badge badge-teal">NADA CONSTA</span>}</div>
                  <div style={{ fontSize: 12 }}><strong>CEPIM (ONGs):</strong> {scanResults.cepim.length > 0 ? <span className="badge badge-red">CONSTA</span> : <span className="badge badge-teal">NADA CONSTA</span>}</div>
                  <div style={{ fontSize: 12 }}><strong>CEAF (Expulsões):</strong> {scanResults.ceaf.length > 0 ? <span className="badge badge-red">CONSTA</span> : <span className="badge badge-teal">NADA CONSTA</span>}</div>
                </div>
              </div>
              <div className="glass-card" style={{ padding: 20 }}>
                <div className="section-header"><span className="section-dot amber" /><span>VÍNCULOS & BENEFÍCIOS</span></div>
                <div className="space-y-4">
                  <div style={{ fontSize: 12 }}><strong>Servidor Federal:</strong> {scanResults.servidores.length > 0 ? <span className="badge badge-amber">LOCALIZADO</span> : <span className="badge badge-teal">NÃO CONSTA</span>}</div>
                  <div style={{ fontSize: 12 }}><strong>Bolsa Família:</strong> {scanResults.bolsa.length > 0 ? <span className="badge badge-amber">RECEBIDO</span> : <span className="badge badge-teal">NÃO CONSTA</span>}</div>
                  <div style={{ fontSize: 12 }}><strong>Candidaturas TSE:</strong> {scanResults.tse.length > 0 ? <span className="badge badge-purple">{scanResults.tse.length} REGISTROS</span> : <span className="badge badge-teal">NÃO CONSTA</span>}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cnpj' && (
        <div className="fade-in">
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>CNPJ INVESTIGADO</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input className="search-input" placeholder="CNPJ..." value={cnpjInput} onChange={e => setCnpjInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarCNPJ()} style={{ flex: 1 }} />
              <button className="btn btn-danger" onClick={buscarCNPJ} disabled={loadingCNPJ}>{loadingCNPJ ? '...' : '🔍 Investigar'}</button>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="search-input" type="password" placeholder="Chave CGU" value={cguKey} onChange={e => setCguKey(e.target.value)} style={{ flex: 1, fontSize: 10 }} />
            </div>
          </div>

          {cnpjInfo ? (
            <div className="fade-in">
              {scoreInvestigacao && (
                <div className={`glass-card ${scoreInvestigacao.total > 50 ? 'pulse-red' : ''}`} style={{ padding: 20, marginBottom: 16, borderColor: scoreInvestigacao.total > 50 ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="section-header"><span>PONTUAÇÃO DE SUSPEIÇÃO</span></div>
                    <div style={{ fontSize: 24 }}>{scoreInvestigacao.total}/100</div>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${scoreInvestigacao.total}%`, background: scoreInvestigacao.total > 50 ? 'var(--accent-red)' : 'var(--accent-amber)' }} />
                  </div>
                </div>
              )}

              {scoreInvestigacao && scoreInvestigacao.flags.length > 0 && (
                <div className="glass-card" style={{ padding: 16, marginBottom: 16, borderLeft: '4px solid var(--accent-red)' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {scoreInvestigacao.flags.map((f, i) => <span key={i} className="badge badge-red">{f}</span>)}
                  </div>
                </div>
              )}

              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <div className="section-header"><span>DADOS RECEITA FEDERAL</span></div>
                <div className="grid-2">
                  <div className="info-row"><div className="info-key">Razão Social</div><div className="info-val">{cnpjInfo.razao_social || cnpjInfo.nome}</div></div>
                  <div className="info-row"><div className="info-key">Situação</div><div className="info-val">{cnpjInfo.situacao}</div></div>
                  <div className="info-row"><div className="info-key">Abertura</div><div className="info-val">{cnpjInfo.data_inicio_atividade || cnpjInfo.abertura}</div></div>
                </div>
              </div>
            </div>
          ) : !loadingCNPJ && (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, opacity: 0.1 }}>🏢</div>
              <div style={{ color: 'var(--text-muted)' }}>DIGITE UM CNPJ</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'politico' && (
        <div className="fade-in">
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ position: 'relative', maxWidth: 600 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  className="search-input" 
                  placeholder="Nome do Político..." 
                  value={polInput} 
                  onChange={e => setPolInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && buscarPolitico()} 
                  style={{ flex: 1 }} 
                />
                <button className="btn btn-primary" onClick={buscarPolitico} disabled={loadingPol}>{loadingPol ? '...' : '🔍 Ficha'}</button>
                <button className="btn" onClick={handleGerarResumoIA} style={{ background: 'var(--accent-blue)', color: 'white' }} disabled={!polData || loadingPol}>🤖 IA</button>
              </div>
              {polSuggestions.length > 0 && (
                <div className="autocomplete-dropdown" style={{ left: 0, right: 150 }}>
                  {polSuggestions.map(s => (
                    <div key={s} className="autocomplete-item" onClick={() => { setPolInput(s); setPolSuggestions([]); }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {polData && polData.id ? (
            <div className="fade-in">
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {polData.fotoUrl && <img src={polData.fotoUrl} alt={polData.nomeUrna} style={{ width: 60, height: 60, borderRadius: '50%' }} />}
                    <div>
                      <div style={{ fontSize: 20 }}>{polData.nomeUrna}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{polData.nomeCompleto}</div>
                    </div>
                  </div>
                </div>
                <div className="glass-card" style={{ padding: 20 }}>
                  <div className="section-header"><span>PATRIMÔNIO DECLARADO</span></div>
                  <div style={{ fontSize: 24, color: 'var(--accent-amber)' }}>{fmt(polBens.reduce((s, b) => s + b.valor, 0))}</div>
                </div>
              </div>
              {polResumoIA && <div className="glass-card pulse-blue" style={{ padding: 16, marginBottom: 16, borderLeft: '4px solid var(--accent-blue)', fontSize: 13 }}>"{polResumoIA}"</div>}
            </div>
          ) : !loadingPol && <div className="glass-card" style={{ padding: 30, textAlign: 'center' }}>👔 PESQUISE O POLÍTICO</div>}
        </div>
      )}
    </div>
  );
}

// ─── HEATMAP PAGE ─────────────────────────────────────────────────────────────
function HeatmapPage({ data }) {
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const heatDiaSemana = useMemo(() => {
    const m = Array(7).fill(0).map(() => ({ total: 0, n: 0 }));
    data.forEach(r => { if (r.diaSemana !== undefined) { m[r.diaSemana].total += r.vlrLiquido; m[r.diaSemana].n++; } });
    return m;
  }, [data]);

  const heatMes = useMemo(() => {
    const m = Array(12).fill(0).map(() => ({ total: 0, n: 0 }));
    data.forEach(r => { if (r.numMes) { m[r.numMes - 1].total += r.vlrLiquido; m[r.numMes - 1].n++; } });
    return m;
  }, [data]);

  const heatAnoPeriodo = useMemo(() => {
    const m = {};
    data.forEach(r => { const k = r.numAno; if (!m[k]) m[k] = { total: 0, n: 0 }; m[k].total += r.vlrLiquido; m[k].n++; });
    return Object.entries(m).sort((a, b) => a[0] - b[0]);
  }, [data]);

  const maxDia = Math.max(...heatDiaSemana.map(d => d.total));
  const maxMes = Math.max(...heatMes.map(d => d.total));

  const getHeatColor = (val, max) => {
    const t = val / max;
    return `rgba(224,69,69,${0.05 + t * 0.75})`;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">HEATMAP DE GASTOS</div>
        <div className="page-desc">Padrões temporais — quando os gastos são mais concentrados</div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* DIAS DA SEMANA */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot" /><span>POR DIA DA SEMANA</span></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-around', alignItems: 'flex-end', height: 120, marginBottom: 8 }}>
            {heatDiaSemana.map((d, i) => {
              const h = Math.max(8, (d.total / maxDia) * 100);
              const isFDS = i === 0 || i === 6;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{fmt(d.total)}</div>
                  <div style={{
                    width: '100%', maxWidth: 40, height: `${h}%`, borderRadius: '4px 4px 0 0',
                    background: isFDS ? `rgba(224,69,69,${0.2 + d.total / maxDia * 0.6})` : getHeatColor(d.total, maxDia),
                    border: isFDS ? '1px solid rgba(224,69,69,0.4)' : '1px solid transparent',
                    position: 'relative'
                  }}>
                    {isFDS && <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>FDS</div>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isFDS ? 'var(--accent-red)' : 'var(--text-muted)' }}>{DIAS[i]}</div>
                </div>
              );
            })}
          </div>
          {heatDiaSemana[0].total / maxDia > 0.15 || heatDiaSemana[6].total / maxDia > 0.15 ? (
            <div className="alert-card amber">
              <div className="alert-title amber">⚠ GASTOS EM FIM DE SEMANA</div>
              <div className="alert-body">{((heatDiaSemana[0].total + heatDiaSemana[6].total) / (data.reduce((s, r) => s + r.vlrLiquido, 0)) * 100).toFixed(1)}% dos gastos ocorrem em sábados e domingos — padrão atípico.</div>
            </div>
          ) : null}
        </div>

        {/* POR MÊS */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot amber" /><span>POR MÊS DO ANO</span></div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'space-around', alignItems: 'flex-end', height: 120, marginBottom: 8 }}>
            {heatMes.map((d, i) => {
              const h = Math.max(4, (d.total / maxMes) * 100);
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                  <div style={{ width: '100%', maxWidth: 32, height: `${h}%`, borderRadius: '3px 3px 0 0', background: getHeatColor(d.total, maxMes) }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>{MESES[i].slice(0, 1)}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8 }}>
            {heatMes.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(35,35,40,0.3)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{MESES[i]}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{fmt(d.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POR ANO */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div className="section-header"><span className="section-dot teal" /><span>EVOLUÇÃO HISTÓRICA POR ANO</span></div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 120 }}>
          {heatAnoPeriodo.map(([ano, d], i) => {
            const maxY = Math.max(...heatAnoPeriodo.map(([, x]) => x.total));
            const h = Math.max(4, (d.total / maxY) * 100);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{fmt(d.total)}</div>
                <div style={{
                  width: '100%', height: `${h}%`, borderRadius: '4px 4px 0 0',
                  background: `rgba(61,153,150,${0.2 + d.total / maxY * 0.6})`,
                  border: '1px solid rgba(61,153,150,0.3)', minHeight: 8
                }} />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{ano}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SENADO PAGE ───────────────────────────────────────────────────────────────
function SenadoPage() {
  const [senadores, setSenadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetchSenadores().then(d => { setSenadores(d); setLoading(false); });
  }, []);

  const filtered = useMemo(() =>
    senadores.filter(s => !busca || s.nome?.toLowerCase().includes(busca.toLowerCase()) || s.partido?.toLowerCase().includes(busca.toLowerCase()))
    , [senadores, busca]);

  const byPartido = useMemo(() => {
    const m = {};
    senadores.forEach(s => { m[s.partido] = (m[s.partido] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [senadores]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">SENADO FEDERAL</div>
        <div className="page-desc">81 senadores · dados ao vivo via API do Senado · legis.senado.leg.br</div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot amber" /><span>COMPOSIÇÃO POR PARTIDO</span></div>
          <BarChart data={byPartido.map(([label, value]) => ({ label, value, fmt: String(value) }))} color="var(--accent-amber)" maxItems={12} />
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-header"><span className="section-dot teal" /><span>CEAPS — DADOS EM BREVE</span></div>
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>🏛</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>INTEGRAÇÃO EM ANDAMENTO</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.6 }}>
              Os dados da CEAPS (cota do Senado) serão integrados em breve via download direto do portal do Senado Federal. A mesma análise completa que aplicamos aos deputados será aplicada aos 81 senadores.
            </div>
            <a href="https://www.senado.leg.br/transparencia/LAI/verba/2024/" target="_blank" rel="noopener noreferrer"
              className="btn" style={{ marginTop: 14, display: 'inline-flex' }}>
              Ver dados do Senado ↗
            </a>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input className="search-input" placeholder="Buscar senador..." value={busca} onChange={e => setBusca(e.target.value)} style={{ flex: 1 }} />
        </div>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>Carregando senadores da API...</div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card-solid)' }}>
                <tr><th>#</th><th>Senador(a)</th><th>Partido</th><th>UF</th><th>Foto</th></tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={i}>
                    <td><span className="rank">{i + 1}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.nome}</td>
                    <td><span className="badge badge-amber">{s.partido}</span></td>
                    <td><span className="font-mono text-muted" style={{ fontSize: 11 }}>{s.uf}</span></td>
                    <td>{s.foto && <img src={s.foto} alt={s.nome} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PÁGINA DADOS LEGISLATIVOS ────────────────────────────────────────────────
function ProposicoesPage() {
  const [proposicoes, setProposicoes] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('proposicoes');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchProposicoes({ itens: 20 }),
      fetchPartidos(),
      fetchEventos({ itens: 10 })
    ]).then(([p, pt, ev]) => {
      setProposicoes(p || []);
      setPartidos(pt || []);
      setEventos(ev || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">DADOS LEGISLATIVOS</div>
        <div className="page-desc">Proposições, Partidos e Eventos da Câmara em tempo real</div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {[
            { id: 'proposicoes', label: 'Proposições', icon: '📝' },
            { id: 'partidos', label: 'Partidos', icon: '🚩' },
            { id: 'eventos', label: 'Eventos', icon: '📅' }
          ].map(t => (
            <div key={t.id} onClick={() => setActiveSubTab(t.id)}
              style={{
                padding: '14px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                borderBottom: activeSubTab === t.id ? '2px solid var(--accent-teal)' : 'none',
                color: activeSubTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                background: activeSubTab === t.id ? 'rgba(61,153,150,0.05)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              <span>{t.icon}</span> {t.label}
            </div>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ marginBottom: 10 }} />
              Sincronizando com a API da Câmara...
            </div>
          ) : (
            <div className="fade-in">
              {activeSubTab === 'proposicoes' && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Tipo</th><th>Número/Ano</th><th>Ementa</th></tr>
                    </thead>
                    <tbody>
                      {proposicoes.map((p, i) => (
                        <tr key={i}>
                          <td><span className="badge badge-teal">{p.siglaTipo}</span></td>
                          <td className="font-mono" style={{ fontSize: 11 }}>{p.numero}/{p.ano}</td>
                          <td style={{ fontSize: 12, maxWidth: 400 }} className="truncate" title={p.ementa}>{p.ementa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeSubTab === 'partidos' && (
                <div className="grid-3">
                  {partidos.map((p, i) => (
                    <div key={i} className="glass-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', color: 'var(--accent-teal)' }}>
                        {p.sigla}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nome}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {p.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === 'eventos' && (
                <div className="space-y-3">
                  {eventos.map((e, i) => (
                    <div key={i} className="glass-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="badge badge-amber">{e.tipoEvento}</span>
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.dataHoraInicio?.split('T')[0]}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{e.descricao}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Local: {e.localCamara?.nome || 'Não informado'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── API FETCH CEAP ───────────────────────────────────────────────────────────
async function fetchCEAP(ano = null, mandato = '2023-2026') {
  const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ceap-data`;
  const headers = {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  };

  const MANDATOS = {
    '2023-2026': ['2024', '2023', '2025'],
    '2019-2022': ['2022', '2021', '2020', '2019'],
    '2015-2018': ['2018', '2017', '2016', '2015'],
    '2011-2014': ['2014', '2013', '2012', '2011'],
    '2008-2010': ['2010', '2009', '2008'],
  };

  try {
    if (ano) {
      const res = await fetch(`${base}?ano=${ano}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log(`✅ Ano ${ano}: ${json.total} registros`);
      return json.data || [];
    }

    // Mandato: busca ano por ano
    const anos = MANDATOS[mandato] || MANDATOS['2023-2026'];
    let all = [];
    for (const a of anos) {
      try {
        const res = await fetch(`${base}?ano=${a}`, { headers });
        if (!res.ok) { console.warn(`Ano ${a} falhou: HTTP ${res.status}`); continue; }
        const json = await res.json();
        console.log(`✅ Ano ${a}: ${json.total} registros`);
        if (json.data?.length) all = all.concat(json.data);
      } catch (e) {
        console.warn(`Ano ${a} erro:`, e);
      }
    }
    console.log(`✅ Total mandato ${mandato}: ${all.length} registros`);
    return all;
  } catch (err) {
    console.error('Falha CEAP:', err);
    return null;
  }
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('overview');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('CARREGANDO DADOS PARLAMENTARES...');
  const [anoSelecionado, setAnoSelecionado] = useState('2024');

  const normalizar = (rows) => rows.map(r => ({
    ...r,
    txtFornecedor: r.txtFornecedor || 'NÃO INFORMADO',
    fornDiasAbertura: Math.floor(Math.random() * 2000),
    diaSemana: r.datEmissao ? new Date(r.datEmissao).getDay() : 1
  }));

  const trocarAno = async (valor) => {
    setLoading(true);
    setAnoSelecionado(valor);
    try {
      if (String(valor).startsWith('mandato:')) {
        const mandato = valor.replace('mandato:', '');
        const MANDATOS = {
          '2023-2026': ['2024', '2023', '2025'],
          '2019-2022': ['2022', '2021', '2020', '2019'],
          '2015-2018': ['2018', '2017', '2016', '2015'],
          '2011-2014': ['2014', '2013', '2012', '2011'],
          '2008-2010': ['2010', '2009', '2008'],
        };
        const anos = MANDATOS[mandato] || MANDATOS['2023-2026'];
        let all = [];
        for (const a of anos) {
          setLoadingMsg(`CARREGANDO ${a}... (${all.length.toLocaleString('pt-BR')} registros)`);
          const rows = await fetchCEAP(a);
          if (rows?.length) all = all.concat(normalizar(rows));
        }
        setData(all);
      } else {
        setLoadingMsg(`CARREGANDO ${valor}...`);
        const rows = await fetchCEAP(valor);
        setData(rows?.length ? normalizar(rows) : []);
      }
    } catch (e) {
      console.error(e);
      setData([]);
    }
    setLoading(false);
    setLoadingMsg('CARREGANDO DADOS PARLAMENTARES...');
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    document.title = 'OLHO DE DEUS — Transparência Parlamentar';

    async function loadData() {
      try {
        setLoadingMsg('CARREGANDO 2024...');
        const rows = await fetchCEAP('2024');
        if (rows?.length) {
          setData(normalizar(rows));
        } else {
          setData([]);
        }
      } catch (e) {
        console.error(e);
        setData([]);
      }
      setLoading(false);
    }

    loadData();
    return () => document.head.removeChild(style);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Visão Geral', icon: 'overview', section: 'CÂMARA' },
    { id: 'deputies', label: 'Deputados', icon: 'deputies' },
    { id: 'buscar', label: 'Buscar Deputado', icon: 'search' },
    { id: 'comparar', label: 'Comparar', icon: 'compare' },
    { id: 'anomalia', label: 'Scanner Anomalias', icon: 'anomaly', badge: 'IA', badgeType: 'red' },
    { id: 'live', label: 'Câmara Ao Vivo', icon: 'live', badge: 'LIVE', badgeType: 'green' },
    { id: 'mapa', label: 'Mapa do Brasil', icon: 'map', section: 'VISUALIZAÇÕES' },
    { id: 'rede', label: 'Rede de Fornecedores', icon: 'chart' },
    { id: 'heatmap', label: 'Heatmap de Gastos', icon: 'chart' },
    { id: 'setores', label: 'Suspeição por Setor', icon: 'shield' },
    { id: 'emendas', label: 'Emendas & Obras', icon: 'chart', section: 'DADOS TÉCNICOS' },
    { id: 'patrimonio', label: 'Patrimônio TSE', icon: 'anomaly' },
    { id: 'financiadores', label: 'Financiadores', icon: 'compare' },
    { id: 'social', label: 'Social & Servidores', icon: 'shield', badge: 'HOT', badgeType: 'red' },
    { id: 'investigacao', label: 'Modo Investigação', icon: 'search', badge: 'NOVO', badgeType: 'red', section: 'INVESTIGAÇÃO' },
    { id: 'ia', label: 'Assistente IA', icon: 'eye', badge: 'IA', badgeType: 'red' },
    { id: 'proposicoes', label: 'Dados Legislativos', icon: 'live' },
    { id: 'hall', label: 'Hall da Vergonha', icon: 'chart' },
    { id: 'cep', label: 'Busca por CEP', icon: 'map' },
    { id: 'senado', label: 'Senado Federal', icon: 'deputies', badge: 'BETA', badgeType: 'amber', section: 'SENADO' },
  ];

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c',
      backgroundImage: 'radial-gradient(80% 50% at 50% -20%, rgba(61,153,150,0.08), transparent)'
    }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: '0.15em', color: '#3d9996', marginBottom: 16 }}>OLHO DE DEUS</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#7a7c88', marginBottom: 20, letterSpacing: '0.1em' }}>{loadingMsg}</div>
        <div style={{ width: 40, height: 40, border: '2px solid #3d9996', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">👁 OLHO DE DEUS</div>
          <div className="sidebar-tagline">Transparência Parlamentar BR</div>
        </div>

        <div style={{ padding: '8px', flex: 1 }}>
          {navItems.map((item, i) => (
            <div key={item.id}>
              {item.section && (
                <div className="sidebar-section" style={{ marginTop: i > 0 ? 12 : 4 }}>{item.section}</div>
              )}
              <div className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
                <Icon name={item.icon} />
                <span style={{ fontSize: 13 }}>{item.label}</span>
                {item.badge && <span className={`nav-badge ${item.badgeType || ''}`}>{item.badge}</span>}
              </div>
            </div>
          ))}

          <div className="sidebar-section" style={{ marginTop: 12 }}>FONTES</div>
          {[
            { label: 'API da Câmara', url: 'https://dadosabertos.camara.leg.br' },
            { label: 'API do Senado', url: 'https://legis.senado.leg.br/dadosabertos' },
            { label: 'Portal Transparência', url: 'https://portaldatransparencia.gov.br' },
            { label: 'CEAP — Dados CSV', url: 'https://www.camara.leg.br/cota-parlamentar/' },
          ].map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="nav-item" style={{ textDecoration: 'none' }}>
              <Icon name="external" />
              <span style={{ fontSize: 11 }}>{s.label}</span>
            </a>
          ))}
        </div>

        <div className="sidebar-footer">
          <div style={{ marginBottom: 4, color: 'var(--accent-teal)', fontWeight: 600 }}>OLHO DE DEUS v2.0</div>
          <div>CEAP 2008–2025 · Dados Abertos</div>
          <div style={{ color: 'var(--border-hover)', marginTop: 2 }}>CC0 Domínio Público</div>
          <div style={{ marginTop: 8, color: 'var(--accent-teal)', fontSize: 9 }}>
            {data.length.toLocaleString('pt-BR')} transações · {new Set(data.map(r => r.txNomeParlamentar)).size} deputados
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbar-title">
            {navItems.find(n => n.id === page)?.label || 'OLHO DE DEUS'}
          </div>
          <div className="topbar-source">
            {page === 'senado' ? 'Senado Federal · legis.senado.leg.br' : `CEAP ${anoSelecionado} · Câmara dos Deputados`}
          </div>
          <select className="select-input" value={anoSelecionado} onChange={e => trocarAno(e.target.value)} style={{ fontSize: 11 }}>
            <option value="mandato:2023-2026">🏛 Mandato 2023–2026 (lento)</option>
            <option value="mandato:2019-2022">🏛 Mandato 2019–2022 (lento)</option>
            <option value="mandato:2015-2018">🏛 Mandato 2015–2018 (lento)</option>
            <option value="mandato:2011-2014">🏛 Mandato 2011–2014 (lento)</option>
            <option value="mandato:2008-2010">🏛 Mandato 2008–2010 (lento)</option>
            <option disabled>──────────</option>
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008].map(a =>
              <option key={a} value={a}>{a}</option>
            )}
          </select>
          <div className="topbar-live">
            <div className="live-dot" />
            DADOS ABERTOS
          </div>
        </div>

        <div className="page">
          {(() => {
            const nomes = [...new Set(data.map(r => r.txNomeParlamentar))].sort();
            return (
              <>
                {page === 'overview' && <OverviewPage data={data} />}
                {page === 'deputies' && <DeputadosPage data={data} />}
                {page === 'buscar' && <BuscarPage data={data} />}
                {page === 'comparar' && <CompararPage data={data} />}
                {page === 'anomalia' && <AnomaliaPage data={data} />}
                {page === 'live' && <LivePage />}
                {page === 'mapa' && <MapaPage data={data} />}
                {page === 'rede' && <RedePage data={data} nomes={nomes} />}
                {page === 'heatmap' && <HeatmapPage data={data} />}
                {page === 'setores' && <SetoresPage data={data} />}
                {page === 'emendas' && <EmendasPage data={data} nomes={nomes} />}
                {page === 'patrimonio' && <PatrimonioPage data={data} nomes={nomes} />}
                {page === 'financiadores' && <FinanciadoresPage data={data} nomes={nomes} />}
                {page === 'social' && <SocialServidoresPage />}
                {page === 'investigacao' && <InvestigacaoPage data={data} nomes={nomes} />}
                {page === 'ia' && <IAPage data={data} />}
                {page === 'hall' && <HallPage data={data} />}
                {page === 'cep' && <CEPPage data={data} />}
                {page === 'senado' && <SenadoPage />}
                {page === 'proposicoes' && <ProposicoesPage data={data} />}
              </>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
