require('dotenv').config({ path: 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW/.env' });
const { Client } = require('pg');
const fs = require('fs');

async function auditHelixProduct() {
  const sqlDump = fs.readFileSync('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotekllp_admin.sql', 'utf8');

  // Find exact tuple for product 15 in SQL dump
  const lines = sqlDump.split('\n');
  let inProdInsert = false;
  let rawHelixTuple = '';

  for (const line of lines) {
    if (line.includes('INSERT INTO `products`')) {
      inProdInsert = true;
    }
    if (inProdInsert) {
      if (line.includes('(15,') || line.includes('(15 ,')) {
        rawHelixTuple = line.trim();
      }
      if (line.endsWith(';')) {
        inProdInsert = false;
      }
    }
  }

  console.log('=== RAW TUPLE FOR PRODUCT 15 IN innmotekllp_admin.sql ===');
  console.log(rawHelixTuple);

  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const res = await client.query('SELECT id, title, slug, specification, installation FROM products WHERE id = 15;');
  console.log('\n=== CURRENT PRODUCT 15 IN SUPABASE POSTGRESQL ===');
  console.log(JSON.stringify(res.rows[0], null, 2));

  await client.end();
}

auditHelixProduct().catch(console.error);
