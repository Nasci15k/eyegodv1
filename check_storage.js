import { createClient } from '@supabase/supabase-js';

const url = 'https://sogqxbpnptjzvwexjsvm.supabase.co';
const key = 'sb_publishable_11D6D0NPTgy9ECQ806NqHg_QG4l0U7U';
const supabase = createClient(url, key);

async function check() {
  const tables = ['ceap', 'despesas', 'gastos', 'camara', 'deputados'];
  for (const t of tables) {
    const { data, error, status } = await supabase.from(t).select('*').limit(1);
    console.log(`Table ${t}:`, {
      hasData: !!data,
      dataLength: data ? data.length : 0,
      error: error ? error.message : null,
      code: error ? error.code : null
    });
  }
}
check();
