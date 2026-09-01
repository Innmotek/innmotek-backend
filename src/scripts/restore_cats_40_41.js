require('dotenv').config();
const { Client } = require('pg');

async function restore40and41() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  await client.query(`
    INSERT INTO categories (id, slug, user_id, title, image, description, navigation_status, home_status, status, created_at, updated_at, parent_category, "order", seo_title, seo_keyword, seo_description)
    VALUES 
    (40, 'others', 2, 'Others', '378f4e6b-67df-40cb-ba1a-5b481aa42c8d.webp', NULL, 0, 0, 1, '2023-08-27 12:47:04', '2023-08-27 12:47:04', 35, 0, NULL, NULL, NULL),
    (41, 'fire-pits-and-barbecue', 2, 'Fire Pits & Barbecue', '78bf1335-9bf8-4be8-a400-349f2b87fcfd.webp', NULL, 0, 0, 1, '2023-08-27 12:47:33', '2023-08-27 12:47:33', 35, 0, NULL, NULL, NULL);
  `);

  const res = await client.query('SELECT COUNT(*)::int AS count FROM categories;');
  console.log('Categories count in Supabase:', res.rows[0].count);
  await client.end();
}

restore40and41().catch(console.error);
