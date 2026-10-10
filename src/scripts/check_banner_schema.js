const db = require('../config/database');

setTimeout(async () => {
  try {
    const res = await db.pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'banners' ORDER BY ordinal_position");
    console.log('POSTGRES BANNERS COLUMNS:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}, 1500);
