const fs = require('fs');

const ALL_36_ROUTES = [
  '/',
  '/about',
  '/services',
  '/projects',
  '/blogs',
  '/blogs/the-efficiency-revolution-exploring-inverter-pool-heat-pumps',
  '/blogs/empowering-sustainability-how-heat-pump-technology-is-transferming-the-world',
  '/blogs/recent-commericial-estate-transactions',
  '/blogs/dehumidifiers-creating-comfortable-and-healthy-indoor-species',
  '/faqs',
  '/contact',
  '/category',
  '/category/swimming-pool-heat-pump',
  '/category/hot-water-heat-pump',
  '/category/residential',
  '/category/commercial',
  '/products/wood-fired-fireplace-helix',
  '/products/split-heat-pump-water-heater-imhw-0108-s',
  '/products/glass-lined-hot-water-storage-tank',
  '/products/all-in-one-190-litres-heat-pump',
  '/dehumidifier',
  '/glass-lined-tanks',
  '/pool-and-spa-cover',
  '/pool-pumps',
  '/robotic-pool-cleaner',
  '/hot-water-storage-tank',
  '/modular-panel-tank',
  '/thermal-solar-collector',
  '/pressurized-thermosiphon',
  '/radiators',
  '/radiator-and-fancoil',
  '/heat-pump-air-dryer',
  '/privacy-policy',
  '/terms-and-conditions',
  '/payment-policy',
  '/dealer-policy'
];

async function run36RouteCrawl() {
  console.log('================================================================');
  console.log('FULL 36-ROUTE SITE CRAWL (LIVE SUPABASE POSTGRES + STORAGE CDN)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const route of ALL_36_ROUTES) {
    const t0 = Date.now();
    try {
      const res = await fetch(`http://localhost:3000${route}`);
      const duration = Date.now() - t0;
      const pass = res.status === 200;
      if (pass) passed++; else failed++;
      results.push({ route, status: res.status, duration, pass });
      console.log(`[${pass ? 'PASS' : 'FAIL'}] Route: ${route.padEnd(70, ' ')} -> HTTP ${res.status} (${duration}ms)`);
    } catch (e) {
      failed++;
      results.push({ route, status: 'ERROR', error: e.message, pass: false });
      console.log(`[FAIL] Route: ${route.padEnd(70, ' ')} -> Error: ${e.message}`);
    }
  }

  console.log('\n================================================================');
  console.log(`CRAWL COMPLETED: ${passed}/36 PASSED | ${failed} FAILED`);
  console.log('================================================================');

  fs.writeFileSync(
    'C:/Users/Tusha/.gemini/antigravity-ide/brain/1d5efebe-de41-4904-bffa-fbaf34f956a4/scratch/supabase_36_route_crawl_results.json',
    JSON.stringify(results, null, 2)
  );
}

run36RouteCrawl().catch(console.error);
