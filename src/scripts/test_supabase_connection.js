require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function testConnectivity() {
  console.log('==============================================');
  console.log('SUPABASE CONNECTIVITY TEST');
  console.log('==============================================\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.SUPABASE_DB_URL;

  console.log('1. Checking Environment Variables:');
  console.log('  - SUPABASE_URL:              ', supabaseUrl ? `Present (${supabaseUrl})` : 'MISSING');
  console.log('  - SUPABASE_ANON_KEY:         ', anonKey ? `Present (${anonKey.substring(0, 15)}...)` : 'MISSING');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY: ', serviceRoleKey ? `Present (${serviceRoleKey.substring(0, 15)}...)` : 'MISSING');
  console.log('  - SUPABASE_DB_URL:           ', dbUrl ? `Present (${dbUrl.replace(/:[^:]*@/, ':****@')})` : 'MISSING');

  if (!supabaseUrl || !anonKey) {
    console.log('\n[WAITING] Please add SUPABASE_URL and SUPABASE_ANON_KEY to innmotek-backend-NEW/.env');
    return false;
  }

  // Test REST / Client Connection
  console.log('\n2. Testing Supabase Client (REST / Auth API)...');
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey);
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('  - REST API Error:', error.message);
    } else {
      console.log('  - REST API Status: CONNECTED (OK)');
    }
  } catch (err) {
    console.log('  - REST API Connection Failed:', err.message);
  }

  // Test Direct Postgres DB Connection
  if (dbUrl) {
    console.log('\n3. Testing Direct PostgreSQL Connection (pg client)...');
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const res = await client.query('SELECT version(), current_database(), now();');
      console.log('  - Direct Postgres Status: CONNECTED (OK)');
      console.log('  - Database:', res.rows[0].current_database);
      console.log('  - Postgres Version:', res.rows[0].version.split(' ')[0], res.rows[0].version.split(' ')[1]);
      console.log('  - Server Time (UTC):', res.rows[0].now);
      await client.end();
    } catch (err) {
      console.log('  - Direct Postgres Connection Failed:', err.message);
    }
  }

  return true;
}

testConnectivity().catch(console.error);
