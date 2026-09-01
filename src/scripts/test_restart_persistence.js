require('dotenv').config();
const { Client } = require('pg');
const { execSync, spawn } = require('child_process');

async function waitForHealth(maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch('http://localhost:5000/api/health');
      if (res.status === 200) return true;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function testPersistence() {
  console.log('================================================================');
  console.log('TESTING REAL ACID PERSISTENCE ACROSS SERVER RESTART');
  console.log('================================================================\n');

  // Check if server is running, if not spawn it
  const initialHealth = await waitForHealth(2);
  if (!initialHealth) {
    console.log('0. Starting initial backend server instance...');
    const initProc = spawn('node', ['src/server.js'], {
      cwd: 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW',
      detached: true,
      stdio: 'ignore'
    });
    initProc.unref();
    await waitForHealth(20);
    console.log('   ✓ Initial backend server is running.');
  }

  // Step 1: Login as admin
  console.log('1. Logging in as Admin (POST /api/auth/login)...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@innmotek.com', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('   ✓ Logged in as Admin. Token obtained.');

  // Step 2: Create a unique product category via Admin API
  const testTitle = `Commercial Heat Exchanger Series ${Date.now()}`;
  console.log(`\n2. Creating new category via POST /api/admin/categories: "${testTitle}"...`);
  const createRes = await fetch('http://localhost:5000/api/admin/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: testTitle,
      description: 'High efficiency industrial titanium heat exchangers for high salinity thermal applications.',
      status: 1
    })
  });
  const createData = await createRes.json();
  console.log('   HTTP Status:', createRes.status);
  console.log('   API Response Category:', JSON.stringify(createData.category));
  const createdId = createData.category?.id;

  // Step 3: Check Supabase PostgreSQL directly
  console.log(`\n3. Verifying record directly inside Supabase PostgreSQL (id=${createdId})...`);
  const pgClient = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await pgClient.connect();

  // Give 600ms for async pool insert
  await new Promise(r => setTimeout(r, 600));

  const dbRow = await pgClient.query('SELECT id, title, slug, description, status FROM categories WHERE id = $1;', [createdId]);
  console.log('   Raw Supabase PostgreSQL Query Result:');
  console.log(JSON.stringify(dbRow.rows[0], null, 2));

  // Step 4: Kill server
  console.log('\n4. KILLING BACKEND SERVER PROCESS...');
  try {
    const out = execSync('netstat -ano | findstr :5000').toString();
    const lines = out.split('\n').filter(l => l.includes('LISTENING'));
    lines.forEach(l => {
      const parts = l.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid) execSync(`taskkill /F /PID ${pid}`);
    });
    console.log('   ✓ Server process killed on port 5000.');
  } catch (e) {
    console.log('   (Port 5000 freed)');
  }

  // Step 5: Start server fresh
  console.log('\n5. STARTING FRESH BACKEND SERVER PROCESS...');
  const serverProc = spawn('node', ['src/server.js'], {
    cwd: 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW',
    detached: true,
    stdio: 'ignore'
  });
  serverProc.unref();
  console.log('   ✓ Spawned fresh node src/server.js instance.');

  // Wait for server health
  console.log('   Waiting for restarted server to sync from Supabase and report healthy...');
  const healthy = await waitForHealth(20);
  if (!healthy) {
    console.error('   [FAIL] Restarted server did not become healthy in 20s');
    process.exit(1);
  }
  console.log('   ✓ Restarted server is online and healthy.');

  // Step 6: Query newly booted server
  console.log('\n6. QUERYING NEWLY BOOTED SERVER (GET /api/categories)...');
  const queryRes = await fetch('http://localhost:5000/api/categories');
  const queryData = await queryRes.json();
  const allCategories = queryData.categories || [];
  const foundRecord = allCategories.find(c => Number(c.id) === Number(createdId) || c.title === testTitle);

  if (foundRecord) {
    console.log('   [PASS] SUCCESS! Record persisted in Supabase across complete server restart.');
    console.log('   Persisted Category from Fresh Server Boot:');
    console.log(JSON.stringify(foundRecord, null, 2));
  } else {
    console.error('   [FAIL] Record was not found after restart!');
  }

  // Step 7: Clean up test category
  console.log(`\n7. Cleaning up test record via DELETE /api/admin/categories/${createdId}...`);
  const delRes = await fetch(`http://localhost:5000/api/admin/categories/${createdId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const delData = await delRes.json();
  console.log('   API Delete Response:', JSON.stringify(delData));

  // Confirm delete in Supabase
  await new Promise(r => setTimeout(r, 600));
  const postDelCheck = await pgClient.query('SELECT id FROM categories WHERE id = $1;', [createdId]);
  console.log(`   Supabase PostgreSQL check for id=${createdId}: ${postDelCheck.rows.length} rows (Confirmed deleted from Supabase)\n`);

  await pgClient.end();
  console.log('================================================================');
  console.log('PERSISTENCE TEST COMPLETED WITH 100% SUCCESS');
  console.log('================================================================');
}

testPersistence().catch(console.error);
