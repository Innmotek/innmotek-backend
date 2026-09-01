require('dotenv').config({ path: 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW/.env' });
const { Client } = require('pg');
const fs = require('fs');

async function compareFullProduct15() {
  const sqlDump = fs.readFileSync('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotekllp_admin.sql', 'utf8');

  // Find exact tuple for product 15
  const match = sqlDump.match(/\(15,\s*'wood-fired-fireplace-helix'[\s\S]*?\),/);
  if (!match) {
    console.error('Could not find product 15 in SQL dump');
    return;
  }
  console.log('Found product 15 in SQL dump.');

  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const res = await client.query('SELECT * FROM products WHERE id = 15;');
  const dbProd = res.rows[0];

  console.log('--- Database Product 15 Specification (Full) ---');
  console.log(dbProd.specification);
  console.log('--- Database Product 15 Installation (Full) ---');
  console.log(dbProd.installation);

  console.log('\nContains "Net Weight: 120 kg":', dbProd.specification.includes('Net Weight: 120 kg'));
  console.log('Contains "Net Weight: 135 kg":', dbProd.specification.includes('Net Weight: 135 kg'));

  await client.end();
}

compareFullProduct15().catch(console.error);
