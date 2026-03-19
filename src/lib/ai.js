/ Motor de IA - Olho de Deus
// Integração Híbrida: Groq (Principal) + Gemini (Fallback)

export async function gerarResumoInvestigativo(dados) {
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const prompt = `
    VOCÊ É UM ANALISTA DE INTELIGÊNCIA FINANCEIRA E JORNALISTA INVESTIGATIVO.
    Analise os dados abaixo retirados de bases oficiais (TSE, Receita, CGU, ANAC, TCU).
    Gere um dossiê resumido, direto e factual (máximo 150 palavras).
    Use o termo "ALERTA VERMELHO" para inconsistências graves como:
    - Patrimônio incompatível com cargo.
    - Sócio em empresas com punição CEIS/CNEP.
    - Contas julgadas irregulares pelo TCU.
    - Recebimento desproporcional de emendas.

    DADOS PARA ANÁLISE:
    ${JSON.stringify(dados)}

    ESTILO: Profissional, técnico, sem rodeios. Português do Brasil.
  `;

  // 1. Tentar Groq (Llama 3 70b) — mixtral foi removido, usar llama3
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2
        })
      });
      const json = await res.json();
      if (json.choices && json.choices[0]) return json.choices[0].message.content;
    } catch (e) {
      console.warn("Groq falhou, tentando Gemini...", e);
    }
  }

  // 2. Fallback Gemini 1.5 Flash (gemini-pro foi depreciado)
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const json = await res.json();
      return json.candidates[0].content.parts[0].text;
    } catch (err) {
      console.error("Gemini também falhou:", err);
    }
  }

  return "Sistema de IA indisponível no momento (Verifique as chaves VITE_GROQ_API_KEY e VITE_GEMINI_API_KEY).";
}
