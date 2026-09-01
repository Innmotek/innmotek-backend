require('dotenv').config();
const { Client } = require('pg');

async function checkRoles() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const res = await client.query('SELECT id, name FROM roles ORDER BY id;');
  console.log('=== REAL ROLES FROM SUPABASE POSTGRESQL ===');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

checkRoles().catch(console.error);
