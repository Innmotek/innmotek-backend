require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const dbUrl = process.env.SUPABASE_DB_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dbUrl || !supabaseUrl || !supabaseKey) {
  console.error('Missing DB or Supabase credentials in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('--- Step 1: Upgrading Banners Table Schema in PostgreSQL ---');
    await pool.query(`
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS animation_type VARCHAR(50) DEFAULT 'ken_burns';
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS link_url VARCHAR(255) DEFAULT '';
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
    `);
    console.log('✓ Banners table schema updated successfully.');

    console.log('--- Step 2: Processing & Compressing 4 Hero Images ---');
    const heroDir = path.resolve(__dirname, '../../../Hero');
    const backendBannersDir = path.resolve(__dirname, '../../../innotek-backend-OLD/public/frontend/images/banners');
    const frontendBannersDir = path.resolve(__dirname, '../../../innmotek-frontend-NEW/public/images/banners');

    if (!fs.existsSync(backendBannersDir)) fs.mkdirSync(backendBannersDir, { recursive: true });
    if (!fs.existsSync(frontendBannersDir)) fs.mkdirSync(frontendBannersDir, { recursive: true });

    const slidesMeta = [
      {
        srcFile: '1.png',
        filename: 'hero-slide-1.webp',
        title: 'Sustainable Thermal Engineering',
        description: 'Pioneering ultra-low energy heat pumps and clean thermal storage engineered for extreme climates.',
        order: 1
      },
      {
        srcFile: '2.png',
        filename: 'hero-slide-2.webp',
        title: 'Aerothermal Heating & Cooling',
        description: 'Advanced thermodynamic efficiency delivering 4.2+ COP coefficients for residential & commercial spaces.',
        order: 2
      },
      {
        srcFile: '3.png',
        filename: 'hero-slide-3.webp',
        title: 'Precision Climate Control',
        description: 'Intelligent multi-zone thermal management designed with quiet variable-inverter technology.',
        order: 3
      },
      {
        srcFile: '4.png',
        filename: 'hero-slide-4.webp',
        title: 'Next-Gen Thermal Performance',
        description: 'Architectural heating innovation built for durability, efficiency, and zero direct fossil emissions.',
        order: 4
      }
    ];

    // Ensure banners.id has sequence
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS banners_id_seq;
      SELECT setval('banners_id_seq', (SELECT COALESCE(MAX(id), 1) FROM banners));
      ALTER TABLE banners ALTER COLUMN id SET DEFAULT nextval('banners_id_seq');
    `);

    // Deactivate previous banners
    await pool.query(`UPDATE banners SET status = 0 WHERE status = 1`);
    console.log('✓ Previous banners set to inactive (status = 0).');

    for (const slide of slidesMeta) {
      const sourcePath = path.join(heroDir, slide.srcFile);
      if (!fs.existsSync(sourcePath)) {
        console.error(`Source image missing: ${sourcePath}`);
        continue;
      }

      console.log(`Processing ${slide.srcFile} -> ${slide.filename}...`);
      const webpBuffer = await sharp(sourcePath)
        .webp({ quality: 88, effort: 4 })
        .toBuffer();

      // Save to backend static folder
      fs.writeFileSync(path.join(backendBannersDir, slide.filename), webpBuffer);
      // Save to frontend public folder
      fs.writeFileSync(path.join(frontendBannersDir, slide.filename), webpBuffer);

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage.from('banners').upload(slide.filename, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });
      if (uploadErr) {
        console.warn(`Supabase storage upload warning for ${slide.filename}:`, uploadErr.message);
      } else {
        console.log(`✓ Uploaded ${slide.filename} to Supabase bucket 'banners'.`);
      }

      // Insert or Update banner record in PostgreSQL
      const existing = await pool.query('SELECT id FROM banners WHERE image = $1', [slide.filename]);
      if (existing.rows.length > 0) {
        await pool.query(`
          UPDATE banners SET
            title = $1,
            description = $2,
            "order" = $3,
            status = 1,
            media_type = 'image',
            animation_type = 'ken_burns',
            updated_at = NOW()
          WHERE image = $4
        `, [slide.title, slide.description, slide.order, slide.filename]);
        console.log(`✓ Updated banner ${slide.filename} in PostgreSQL.`);
      } else {
        const slug = crypto.randomUUID();
        const nextIdRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM banners');
        const nextId = nextIdRes.rows[0].next_id;
        await pool.query(`
          INSERT INTO banners (id, slug, user_id, title, description, image, media_type, animation_type, "order", status, created_at, updated_at)
          VALUES ($1, $2, 1, $3, $4, $5, 'image', 'ken_burns', $6, 1, NOW(), NOW())
        `, [nextId, slug, slide.title, slide.description, slide.filename, slide.order]);
        console.log(`✓ Inserted new banner ${slide.filename} (ID: ${nextId}) into PostgreSQL.`);
      }
    }

    console.log('--- Step 3: Verifying Active Banners in PostgreSQL ---');
    const result = await pool.query(`
      SELECT id, title, image, media_type, animation_type, "order", status
      FROM banners
      WHERE status = 1
      ORDER BY "order" ASC
    `);
    console.log('Active Hero Banners in DB:', result.rows);
    console.log('Done!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
