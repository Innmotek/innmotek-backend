require('dotenv').config();
const { Client } = require('pg');

async function fixNullability() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const tables = [
    'banners', 'categories', 'products', 'blogs', 'blog_categories',
    'brands', 'testimonials', 'services', 'pages', 'faqs', 'faq_types',
    'projects', 'plugins', 'catalogues', 'candidates', 'complains', 'job_lists'
  ];

  for (const t of tables) {
    try {
      await client.query(`ALTER TABLE "${t}" ALTER COLUMN "user_id" DROP NOT NULL;`);
      console.log(`  ✓ Table '${t}': user_id made nullable.`);
    } catch (e) {
      console.log(`  - Table '${t}': ${e.message}`);
    }
  }

  // Also make slug / status / summary nullable if needed for safe inserts
  const softColumns = [
    { table: 'categories', col: 'slug' },
    { table: 'products', col: 'summary' },
    { table: 'products', col: 'description' },
    { table: 'products', col: 'brand_id' },
    { table: 'products', col: 'category_id' }
  ];

  for (const item of softColumns) {
    try {
      await client.query(`ALTER TABLE "${item.table}" ALTER COLUMN "${item.col}" DROP NOT NULL;`);
      console.log(`  ✓ Table '${item.table}': ${item.col} made nullable.`);
    } catch (e) {
      console.log(`  - Table '${item.table}.${item.col}': ${e.message}`);
    }
  }

  await client.end();
  console.log('\nSupabase column constraints normalized.');
}

fixNullability().catch(console.error);
