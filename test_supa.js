import { createClient } from '@supabase/supabase-js';

const url = 'https://sogqxbpnptjzvwexjsvm.supabase.co';
const key = 'sb_publishable_11D6D0NPTgy9ECQ806NqHg_QG4l0U7U';

async function check() {
  const r = await fetch(url + '/rest/v1/?apikey=' + key);
  const data = await r.json();
  console.log("DEFINITIONS:", Object.keys(data.definitions || {}));
}
check();

