#!/usr/bin/env python3
"""
apply_fixes.py — Olho de Deus v2.0
Aplica os 4 fixes no src/App.jsx automaticamente.

USO:
  python3 apply_fixes.py

O script faz backup em src/App.jsx.bak antes de modificar.
"""

import os, shutil, sys

TARGET = os.path.join(os.path.dirname(__file__), 'src', 'App.jsx')

if not os.path.exists(TARGET):
    print(f"❌ Arquivo não encontrado: {TARGET}")
    sys.exit(1)

shutil.copy(TARGET, TARGET + '.bak')
print(f"✅ Backup criado: {TARGET}.bak")

with open(TARGET, 'r', encoding='utf-8') as f:
    content = f.read()

original = content
applied = 0

fixes = [
    # ── FIX 1 ── StatCard: guard contra value undefined (crash crítico) ────────
    (
        """function StatCard({ label, value, sub, color='var(--text-primary)', accentColor, icon }) {

  return (

    <div className="glass-card stat-card fade-in" style={{'--accent-color': accentColor}}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{color}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {icon && <div className="stat-icon">{icon}</div>}
    </div>
  );
}""",
        """function StatCard({ label, value, sub, color = 'var(--text-primary)', accentColor, icon }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="glass-card stat-card fade-in" style={{ '--accent-color': accentColor }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {icon && <div className="stat-icon">{icon}</div>}
    </div>
  );
}""",
        "StatCard: guard null/undefined"
    ),

    # ── FIX 2 ── fetchCEAP: normaliza colunas lowercase do PostgreSQL ──────────
    (
        """    return data.map(r => ({
      ...r,
      vlrLiquido: parseFloat(r.vlrLiquido) || 0,
      vlrDocumento: parseFloat(r.vlrDocumento) || 0,
      vlrGlosa: parseFloat(r.vlrGlosa) || 0,
      vlrRestituicao: parseFloat(r.vlrRestituicao) || 0,
      numMes: parseInt(r.numMes) || 1
    })).filter(r => r.vlrLiquido > 0);""",
        """    return data.map(r => ({
      ...r,
      // PostgreSQL converte colunas para lowercase — suportamos ambos os formatos
      vlrLiquido: parseFloat(r.vlrliquido ?? r.vlrLiquido) || 0,
      vlrDocumento: parseFloat(r.vlrdocumento ?? r.vlrDocumento) || 0,
      vlrGlosa: parseFloat(r.vlrglosa ?? r.vlrGlosa) || 0,
      vlrRestituicao: parseFloat(r.vlrrestituicao ?? r.vlrRestituicao) || 0,
      numMes: parseInt(r.nummes ?? r.numMes) || 1,
      numAno: parseInt(r.numano ?? r.numAno) || 2024,
      txNomeParlamentar: r.txnomeparlamentar ?? r.txNomeParlamentar ?? 'N/D',
      sgPartido: r.sgpartido ?? r.sgPartido ?? 'N/D',
      sgUF: r.sguf ?? r.sgUF ?? 'N/D',
      txtDescricao: r.txtdescricao ?? r.txtDescricao ?? 'N/D',
      txtFornecedor: r.txtfornecedor ?? r.txtFornecedor ?? r.txtBeneficiario ?? 'NÃO INFORMADO',
      txtCNPJCPF: r.txtcnpjcpf ?? r.txtCNPJCPF ?? '',
      datEmissao: r.datemissao ?? r.datEmissao ?? '',
    })).filter(r => r.vlrLiquido > 0);""",
        "fetchCEAP: normaliza colunas lowercase PostgreSQL"
    ),

    # ── FIX 3 ── Supabase query com fallback sem filtro de ano ─────────────────
    (
        """    const { data, error } = await supabase
      .from('ceap')
      .select('*')
      .eq('numano', ano.toString())
      .limit(30000); // 30.000 para manter os gráficos com performance 60fps
      
    if (error) {
      console.error('Erro no Supabase:', error);
      return null;
    }""",
        """    let { data, error } = await supabase
      .from('ceap')
      .select('*')
      .eq('numano', ano.toString())
      .limit(30000);

    // Fallback: se retornar vazio, tenta sem filtro de ano
    if (!error && (!data || data.length === 0)) {
      const res2 = await supabase.from('ceap').select('*').limit(30000);
      if (!res2.error && res2.data?.length) { data = res2.data; }
    }

    if (error) {
      console.error('Erro no Supabase:', error);
      return null;
    }""",
        "fetchCEAP: fallback sem filtro de ano"
    ),

    # ── FIX 4 ── Gemini: modelo gemini-pro depreciado ──────────────────────────
    (
        "models/gemini-pro:generateContent",
        "models/gemini-1.5-flash:generateContent",
        "Gemini: gemini-pro → gemini-1.5-flash"
    ),

    # ── FIX 5 ── Groq: modelo mixtral removido ─────────────────────────────────
    (
        "model:'mixtral-8x7b-32768'",
        "model:'llama3-70b-8192'",
        "Groq: mixtral → llama3-70b-8192"
    ),
]

for old, new, label in fixes:
    if old in content:
        content = content.replace(old, new)
        print(f"  ✅ {label}")
        applied += 1
    else:
        print(f"  ⚠️  Não encontrado (pode já estar corrigido): {label}")

if applied == 0:
    print("\n⚠️  Nenhuma alteração aplicada. Verifique se o arquivo está correto.")
    sys.exit(0)

with open(TARGET, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ {applied} fix(es) aplicado(s) em {TARGET}")
print("   Execute: npm run dev  — para testar localmente")
