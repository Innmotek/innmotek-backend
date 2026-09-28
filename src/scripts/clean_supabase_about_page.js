const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const cleanDesc = `<p>Founded on the principles of precision thermodynamic engineering, Innmotek bridges the gap between European HVAC technology and regional Himalayan climatic requirements. Our systems are engineered to operate seamlessly from sweltering sub-tropical plains to freezing mountain peaks.</p><p>By utilizing ambient heat from the atmosphere, our aerothermal heat pumps achieve coefficients of performance (COP) exceeding 4.2—meaning every unit of electrical energy yields over four units of useful thermal output.</p>`;

  await pool.query(
    `UPDATE pages 
     SET title = $1, 
         description = $2, 
         image = $3 
     WHERE slug = 'about-us'`,
    [
      'Engineering Excellence Born for Extreme Climates',
      cleanDesc,
      'https://fqrmvgfbrcgyszgefzlp.supabase.co/storage/v1/object/public/products/3e12ee32-093e-43f5-87ab-d90b53a3f6bc.webp'
    ]
  );

  console.log('Successfully updated about-us page in Supabase PostgreSQL!');
  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
});
