async function testFix2AndFix3() {
  console.log('================================================================');
  console.log('TESTING FIX 2 (STRICT CORS) & FIX 3 (RATE LIMITING)');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // PART A: FIX 2 - STRICT CORS TESTS
  // -------------------------------------------------------------
  console.log('--- PART A: STRICT CORS ENFORCEMENT ---');

  // Test 1: Request with DISALLOWED Origin (https://evil.com)
  console.log('1. Sending request with disallowed Origin header: "https://evil.com"...');
  try {
    const evilRes = await fetch('http://localhost:5000/api/banners', {
      headers: { Origin: 'https://evil.com' }
    });
    console.log('   HTTP Status:', evilRes.status);
    const evilData = await evilRes.json();
    console.log('   Response Body:', JSON.stringify(evilData));
  } catch (e) {
    console.log('   CORS Block Result:', e.message);
  }

  // Test 2: Request with ALLOWED Origin (http://localhost:3000)
  console.log('\n2. Sending request with allowed Origin header: "http://localhost:3000"...');
  const allowedRes = await fetch('http://localhost:5000/api/banners', {
    headers: { Origin: 'http://localhost:3000' }
  });
  console.log('   HTTP Status:', allowedRes.status, '(Expected: 200)');
  console.log('   Access-Control-Allow-Origin header:', allowedRes.headers.get('access-control-allow-origin'));

  // -------------------------------------------------------------
  // PART B: FIX 3 - LOGIN RATE LIMITING TESTS
  // -------------------------------------------------------------
  console.log('\n--- PART B: LOGIN BRUTE-FORCE RATE LIMITING ---');
  console.log('Sending 6 rapid login attempts with bad credentials (Max allowed: 5 / 15 min)...');

  for (let i = 1; i <= 6; i++) {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'attacker@evil.com', password: 'wrongpassword' })
    });
    const data = await res.json();
    console.log(`  Attempt #${i}: HTTP ${res.status} -> ${data.message || JSON.stringify(data)}`);
  }

  console.log('\n================================================================');
  console.log('FIX 2 & FIX 3 PROOF COMPLETED');
  console.log('================================================================');
}

testFix2AndFix3().catch(console.error);
