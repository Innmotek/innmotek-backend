require('dotenv').config({ path: 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW/.env' });
const { Client } = require('pg');

async function exactRestore40and41() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('1. Deleting any current row for IDs 40 & 41 in Supabase...');
  await client.query('DELETE FROM categories WHERE id IN (40, 41);');

  console.log('2. Inserting EXACT verbatim dump data for categories #40 and #41...');
  await client.query(`
    INSERT INTO categories (
      id, slug, user_id, title, image, description,
      navigation_status, home_status, status, created_at, updated_at,
      parent_category, "order", seo_title, seo_keyword, seo_description
    ) VALUES 
    (40, 'others', 1, 'Others', NULL, NULL, 1, 0, 1, '2024-05-22 04:06:37+00', '2024-05-22 04:06:37+00', NULL, 7, NULL, NULL, NULL),
    (41, 'fire-pits-barbecue', 3, 'Fire Pits & Barbecue', NULL, NULL, 1, 0, 1, '2025-03-05 00:32:57+00', '2025-03-05 00:32:57+00', 4, NULL, NULL, NULL, NULL);
  `);

  console.log('3. Syncing identity sequence for categories table to MAX(id)...');
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('categories', 'id'),
      COALESCE((SELECT MAX(id) FROM categories), 1),
      true
    );
  `);

  console.log('4. Querying restored rows from Supabase PostgreSQL:');
  const res = await client.query('SELECT * FROM categories WHERE id IN (40, 41) ORDER BY id;');
  console.log(JSON.stringify(res.rows, null, 2));

  const totalCount = await client.query('SELECT COUNT(*)::int AS count FROM categories;');
  console.log(`\nTotal categories count in Supabase: ${totalCount.rows[0].count} (Expected: 33)`);

  await client.end();
}

exactRestore40and41().catch(console.error);
