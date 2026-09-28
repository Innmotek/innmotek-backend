const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const res = await pool.query("SELECT slug, title, image, description FROM pages WHERE slug = 'about-us'");
  console.log('Row found:', res.rows.length);
  if (res.rows.length > 0) {
    console.log('Title:', res.rows[0].title);
    console.log('Image:', res.rows[0].image);
    console.log('Description:\n', res.rows[0].description);
  }
  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
});
