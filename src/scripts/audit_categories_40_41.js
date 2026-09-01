require('dotenv').config({ path: 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW/.env' });
const { Client } = require('pg');
const fs = require('fs');

async function auditCategories40and41() {
  const sqlDump = fs.readFileSync('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotekllp_admin.sql', 'utf8');

  // Find exact tuple for 40 and 41 in categories table
  const lines = sqlDump.split('\n');
  const rawTuples = [];
  let inCatInsert = false;

  for (const line of lines) {
    if (line.includes('INSERT INTO `categories`')) {
      inCatInsert = true;
    }
    if (inCatInsert) {
      if (line.includes('(40,') || line.includes('(41,')) {
        rawTuples.push(line.trim());
      }
      if (line.endsWith(';')) {
        inCatInsert = false;
      }
    }
  }

  console.log('=== RAW ORIGINAL TUPLES FROM innmotekllp_admin.sql ===');
  rawTuples.forEach(t => console.log(t));

  // Query Supabase directly
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const supabaseRows = await client.query('SELECT * FROM categories WHERE id IN (40, 41) ORDER BY id;');
  console.log('\n=== CURRENT SUPABASE ROWS (BEFORE RE-APPLYING) ===');
  console.log(JSON.stringify(supabaseRows.rows, null, 2));

  await client.end();
}

auditCategories40and41().catch(console.error);
