require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Client } = require('pg');

async function syncCache() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const tables = [
    'users', 'roles', 'permissions', 'model_has_roles', 'model_has_permissions',
    'role_has_permissions', 'categories', 'brands', 'products', 'banners', 'blog_categories',
    'blogs', 'testimonials', 'faq_types', 'faqs', 'pages', 'services', 'plugins', 'projects',
    'project_images', 'images', 'catalogues', 'candidates', 'complains', 'complain_types',
    'contact_forms', 'subscribers', 'failed_jobs', 'job_lists', 'migrations', 'password_resets',
    'hero_settings'
  ];

  const colRes = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public';
  `);

  const columnsByTable = {};
  colRes.rows.forEach(r => {
    if (!columnsByTable[r.table_name]) columnsByTable[r.table_name] = [];
    columnsByTable[r.table_name].push(r.column_name);
  });

  const data = {};
  for (const t of tables) {
    const res = await client.query(`SELECT * FROM "${t}";`);
    data[t] = res.rows;
  }

  await client.end();
  process.stdout.write(JSON.stringify({ data, columns: columnsByTable }));
}

syncCache().catch(err => {
  console.error(err);
  process.exit(1);
});
