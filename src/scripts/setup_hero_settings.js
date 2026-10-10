require('dotenv').config();
const { Pool } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('--- Step 1: Creating hero_settings table in PostgreSQL ---');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hero_settings (
        id SERIAL PRIMARY KEY,
        media_mode VARCHAR(30) DEFAULT 'image', -- 'image', 'video', 'both'
        layout_mode VARCHAR(30) DEFAULT 'carousel', -- 'single', 'carousel'
        transition_engine VARCHAR(30) DEFAULT 'animation', -- 'default', 'animation'
        animation_type VARCHAR(50) DEFAULT 'ken_burns', -- 'ken_burns', 'slide', 'zoom', 'parallax'
        interval_seconds INTEGER DEFAULT 6,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Ensure page_placement column in banners table
    await pool.query(`
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS page_placement VARCHAR(50) DEFAULT 'home';
    `);

    // Ensure status of the 4 hero slides is explicitly integer 1 and page_placement = 'home'
    await pool.query(`
      UPDATE banners 
      SET status = 1, page_placement = 'home'
      WHERE id IN (24, 25, 26, 27) OR image IN ('hero-slide-1.webp', 'hero-slide-2.webp', 'hero-slide-3.webp', 'hero-slide-4.webp');
    `);

    // Check or insert default hero_settings row
    const existing = await pool.query('SELECT * FROM hero_settings LIMIT 1');
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO hero_settings (media_mode, layout_mode, transition_engine, animation_type, interval_seconds)
        VALUES ('image', 'carousel', 'animation', 'ken_burns', 6);
      `);
      console.log('✓ Inserted default hero_settings record.');
    } else {
      console.log('✓ Existing hero_settings:', existing.rows[0]);
    }

    const checkBanners = await pool.query(`
      SELECT id, title, image, status, "order", page_placement
      FROM banners
      WHERE status = 1
      ORDER BY "order" ASC;
    `);
    console.log('✓ Active banners in PostgreSQL:', checkBanners.rows);
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
