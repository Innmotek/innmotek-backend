require('dotenv').config();
const { Client } = require('pg');

async function fixAllTableSlugs() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const tablesWithSlug = [
    'banners', 'blogs', 'blog_categories', 'brands', 'categories',
    'faqs', 'faq_types', 'pages', 'plugins', 'products', 'projects', 'services', 'testimonials'
  ];

  for (const t of tablesWithSlug) {
    try {
      await client.query(`ALTER TABLE "${t}" ALTER COLUMN "slug" DROP NOT NULL;`);
      console.log(`  ✓ Table '${t}': slug made nullable.`);
    } catch (e) {
      console.log(`  - Table '${t}': ${e.message}`);
    }
  }

  await client.end();
}

fixAllTableSlugs().catch(console.error);
