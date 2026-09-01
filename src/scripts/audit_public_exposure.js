const BASE_URL = 'http://localhost:5000/api';

async function auditPublicExposure() {
  console.log('=== AUDITING PUBLIC ENDPOINTS FOR SENSITIVE DATA EXPOSURE ===\n');

  const publicRoutes = [
    '/banners',
    '/categories',
    '/category/swimming-pool-heat-pump',
    '/products/swimming-pool-heat-pump',
    '/products/wood-fired-fireplace-helix/show',
    '/featured/products',
    '/testimonials',
    '/brands',
    '/faqs',
    '/pages/privacy-policy',
    '/blogs',
    '/blogs/the-efficiency-revolution-exploring-inverter-pool-heat-pumps',
    '/projects',
    '/services'
  ];

  for (const route of publicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`);
      const text = await res.text();

      const hasPassword = text.includes('password') || text.includes('$2y$') || text.includes('$2a$') || text.includes('$2b$');
      const hasSecrets = text.includes('JWT_SECRET') || text.includes('SERVICE_ROLE') || text.includes('SUPABASE_DB_URL');
      const hasEmailLeak = text.includes('admin@innmotek.com') || text.includes('appmero.com');

      const pass = !hasPassword && !hasSecrets;
      console.log(`[${pass ? 'PASS' : 'WARN'}] ${route.padEnd(55, ' ')} -> Passwords: ${hasPassword ? 'LEAKED' : 'CLEAN'}, Secrets: ${hasSecrets ? 'LEAKED' : 'CLEAN'}, Internal Emails: ${hasEmailLeak ? 'DETECTED' : 'CLEAN'}`);
    } catch (e) {
      console.log(`[ERR] ${route}: ${e.message}`);
    }
  }
}

auditPublicExposure().catch(console.error);
