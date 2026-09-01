require('dotenv').config({ path: 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW/.env' });
const jwt = require('jsonwebtoken');

async function testAuthSecurity() {
  console.log('=== TESTING AUTH SECURITY & TOKEN TAMPERING ===\n');

  // Test 1: Missing Token
  const missingRes = await fetch('http://localhost:5000/api/auth/me');
  const missingData = await missingRes.json();
  console.log('1. Missing Token Test:');
  console.log('   HTTP Status:', missingRes.status, '(Expected: 401)');
  console.log('   Response Body:', JSON.stringify(missingData));

  // Test 2: Tampered Token
  const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature';
  const tamperedRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: { Authorization: `Bearer ${tamperedToken}` }
  });
  const tamperedData = await tamperedRes.json();
  console.log('\n2. Tampered Token Test:');
  console.log('   HTTP Status:', tamperedRes.status, '(Expected: 401)');
  console.log('   Response Body:', JSON.stringify(tamperedData));

  // Test 3: Expired Token
  const secret = process.env.JWT_SECRET || 'innmotek_v2_dev_jwt_secret_change_in_production_2026';
  const expiredToken = jwt.sign({ userId: 2, email: 'admin@innmotek.com', role: 'super admin' }, secret, { expiresIn: '1ms' });
  await new Promise(r => setTimeout(r, 50));
  const expiredRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: { Authorization: `Bearer ${expiredToken}` }
  });
  const expiredData = await expiredRes.json();
  console.log('\n3. Expired Token Test:');
  console.log('   HTTP Status:', expiredRes.status, '(Expected: 401)');
  console.log('   Response Body:', JSON.stringify(expiredData));

  // Test 4: Dev password rejection under NODE_ENV=production logic
  console.log('\n4. DEV_PASSWORD in Production Mode Test:');
  // Check auth controller code logic
  const authCode = require('fs').readFileSync('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW/src/controllers/auth.controller.js', 'utf8');
  const hasDevBypassCondition = authCode.includes("process.env.NODE_ENV !== 'production'");
  console.log('   Has strict `NODE_ENV !== "production"` check on dev password fallback:', hasDevBypassCondition);
}

testAuthSecurity().catch(console.error);
