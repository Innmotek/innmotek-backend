require('dotenv').config({ path: 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW/.env' });
const { Client } = require('pg');

async function checkFinalCounts() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const tables = ['categories', 'products', 'banners', 'blogs', 'projects', 'services', 'testimonials', 'brands', 'faqs', 'pages'];
  console.log('=== LIVE SUPABASE POSTGRESQL ROW COUNTS ===');
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*)::int AS count FROM "${t}";`);
    console.log(`  - ${t.padEnd(15, ' ')}: ${res.rows[0].count}`);
  }

  await client.end();
}

checkFinalCounts().catch(console.error);
