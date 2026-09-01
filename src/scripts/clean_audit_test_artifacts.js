require('dotenv').config({ path: 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW/.env' });
const { Client } = require('pg');

async function cleanAuditTestArtifacts() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('Cleaning only explicitly named test records (e.g. "Audit Test%", "Commercial Heat Exchanger Series%")...');

  const tablesToClean = [
    { table: 'categories', col: 'title' },
    { table: 'products', col: 'title' },
    { table: 'banners', col: 'title' },
    { table: 'blogs', col: 'title' },
    { table: 'projects', col: 'title' },
    { table: 'services', col: 'title' },
    { table: 'testimonials', col: 'full_name' },
    { table: 'brands', col: 'title' },
    { table: 'faqs', col: 'question' },
    { table: 'pages', col: 'title' }
  ];

  for (const item of tablesToClean) {
    const res = await client.query(`DELETE FROM "${item.table}" WHERE "${item.col}" LIKE 'Audit Test%' OR "${item.col}" LIKE 'Commercial Heat Exchanger Series%';`);
    if (res.rowCount > 0) {
      console.log(`  ✓ Table '${item.table}': Removed ${res.rowCount} test record(s).`);
    }
  }

  console.log('\nFinal verification of 10 primary content table counts:');
  const counts = await Promise.all([
    client.query('SELECT COUNT(*)::int AS count FROM categories;'),
    client.query('SELECT COUNT(*)::int AS count FROM products;'),
    client.query('SELECT COUNT(*)::int AS count FROM banners;'),
    client.query('SELECT COUNT(*)::int AS count FROM blogs;'),
    client.query('SELECT COUNT(*)::int AS count FROM projects;'),
    client.query('SELECT COUNT(*)::int AS count FROM services;'),
    client.query('SELECT COUNT(*)::int AS count FROM testimonials;'),
    client.query('SELECT COUNT(*)::int AS count FROM brands;'),
    client.query('SELECT COUNT(*)::int AS count FROM faqs;'),
    client.query('SELECT COUNT(*)::int AS count FROM pages;')
  ]);

  console.log(`  - categories:   ${counts[0].rows[0].count} (Expected: 33)`);
  console.log(`  - products:     ${counts[1].rows[0].count} (Expected: 33)`);
  console.log(`  - banners:      ${counts[2].rows[0].count} (Expected: 15)`);
  console.log(`  - blogs:        ${counts[3].rows[0].count} (Expected: 4)`);
  console.log(`  - projects:     ${counts[4].rows[0].count} (Expected: 0)`);
  console.log(`  - services:     ${counts[5].rows[0].count} (Expected: 1)`);
  console.log(`  - testimonials: ${counts[6].rows[0].count} (Expected: 3)`);
  console.log(`  - brands:       ${counts[7].rows[0].count} (Expected: 2)`);
  console.log(`  - faqs:         ${counts[8].rows[0].count} (Expected: 9)`);
  console.log(`  - pages:        ${counts[9].rows[0].count} (Expected: 10)`);

  await client.end();
}

cleanAuditTestArtifacts().catch(console.error);
