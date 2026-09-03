require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Restoring testimonial id=1 to original name "James Clark"...');
  const res = await pool.query(
    "UPDATE testimonials SET full_name = 'James Clark' WHERE id = 1 RETURNING *"
  );
  console.log('Successfully restored:');
  console.log(JSON.stringify(res.rows[0], null, 2));

  // Sync memory cache on backend
  const { execSync } = require('child_process');
  console.log('\nVerifying all testimonials in Supabase:');
  const all = await pool.query('SELECT id, full_name, company_name, position FROM testimonials ORDER BY id');
  console.table(all.rows);
  await pool.end();
}

run().catch(console.error);
