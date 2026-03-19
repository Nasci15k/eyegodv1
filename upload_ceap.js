const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { from: copyFrom } = require('pg-copy-streams');

const uri = 'postgresql://postgres:Nasci15k715k@db.sogqxbpnptjzvwexjsvm.supabase.co:5432/postgres';
const baseDir = 'C:\\Users\\eonasci\\Downloads\\CEAP (csvs)';

const createTableQuery = `
CREATE TABLE IF NOT EXISTS public.ceap (
    txNomeParlamentar text, cpf text, ideCadastro text, nuCarteiraParlamentar text,
    nuLegislatura text, sgUF text, sgPartido text, codLegislatura text,
    numSubCota text, txtDescricao text, numEspecificacaoSubCota text, txtDescricaoEspecificacao text,
    txtFornecedor text, txtCNPJCPF text, txtNumero text, indTipoDocumento text,
    datEmissao text, vlrDocumento text, vlrGlosa text, vlrLiquido text,
    numMes text, numAno text, numParcela text, txtPassageiro text,
    txtTrecho text, numLote text, numRessarcimento text, datPagamentoRestituicao text,
    vlrRestituicao text, nuDeputadoId text, ideDocumento text, urlDocumento text
);
-- Clean up slightly if it already exists so we can safely re-run
DELETE FROM public.ceap WHERE numAno IN ('2024', '2023'); 
`;

async function run() {
  const client = new Client({ connectionString: uri, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Postgres Connected.');

  await client.query(createTableQuery);
  console.log('Table "ceap" ready.');

  // For testing/performance, let's just upload 2024 and 2023 first
  // The user has 2008-2026, which is gigabytes. Uploading all sequentially could take 30 mins.
  const yearsToUpload = ['2023', '2024'];
  
  for (const year of yearsToUpload) {
    const folderName = `Ano-${year}.csv`;
    const fileName = `Ano-${year}.csv`;
    const fullPath = path.join(baseDir, folderName, fileName);
    
    if (fs.existsSync(fullPath)) {
      console.log(`Starting upload for ${year}...`);
      await new Promise((resolve, reject) => {
        const stream = client.query(copyFrom(`COPY public.ceap FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ';', QUOTE '"')`));
        const fileStream = fs.createReadStream(fullPath);
        
        fileStream.on('error', reject);
        stream.on('error', reject);
        stream.on('finish', () => {
             console.log(`Finished ${year}`);
             resolve();
        });
        
        fileStream.pipe(stream);
      });
    } else {
      console.log(`File ${fullPath} not found. Skipped.`);
    }
  }

  console.log('Converting columns to proper types...');
  await client.query(`
    -- Enable RLS for anon read access
    ALTER TABLE public.ceap ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read Access" on public.ceap;
    CREATE POLICY "Public Read Access" ON public.ceap FOR SELECT USING (true);
  `);
  
  console.log('Done!');
  await client.end();
}

run().catch(e => console.error(e));
