const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes');

const app = express();

// Strict CORS: Allowlist only - Zero wildcard fallbacks
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser / server-to-server requests without origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`[CORS Blocked] Origin '${origin}' is not permitted.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false
}));

// Rate Limiter: Login security (Max 5 attempts / 15 minutes / IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    result: 'error',
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  }
});

// Apply rate limiter specifically to auth login endpoint
app.use('/api/auth/login', loginLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static images from local reference assets directory
const localImageDir = path.resolve(__dirname, '../../innotek-backend-OLD/public/frontend/images');
if (fs.existsSync(localImageDir)) {
  app.use('/frontend/images', express.static(localImageDir));
  console.log(`[Static] Serving local images from: ${localImageDir}`);
}

// Request logger for development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root Status Landing Page
app.get('/', (req, res) => {
  // If client expects JSON, return JSON
  if (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html')) {
    return res.json({
      result: 'success',
      service: 'Innmotek V2 API Engine',
      status: 'operational',
      database: 'Supabase PostgreSQL 17',
      storage: 'Supabase CDN',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  }

  // Otherwise render a sleek Innmotek branded HTML status page
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Innmotek V2 API — Operational</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: radial-gradient(circle at 50% 20%, #171512 0%, #0A0A0A 100%);
      color: #E5E5E5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(18, 18, 18, 0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(197, 168, 128, 0.25);
      border-radius: 28px;
      max-width: 560px;
      width: 100%;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(197, 168, 128, 0.08);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, #C5A880, transparent);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #34D399;
      margin-bottom: 20px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 10px #10B981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    p.subtitle {
      font-size: 13px;
      color: #9CA3AF;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .metric-box {
      background: #141414;
      border: 1px solid #222222;
      border-radius: 16px;
      padding: 16px;
    }
    .metric-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #71717A;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 13px;
      font-weight: 600;
      color: #F4F4F5;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .gold-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #C5A880;
    }
    .cta-row {
      display: flex;
      gap: 12px;
    }
    .btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #C5A880;
      color: #0A0A0A;
    }
    .btn-primary:hover {
      background: #D4B890;
    }
    .btn-secondary {
      background: #1A1A1A;
      color: #D4D4D8;
      border: 1px solid #27272A;
    }
    .btn-secondary:hover {
      border-color: #C5A880;
      color: #FFFFFF;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="pulse-dot"></span>
      System Operational
    </div>
    <h1>Innmotek V2 API Engine</h1>
    <p class="subtitle">Next-generation REST API backend powering high-efficiency heat pump catalogues, dynamic pricing, and administrative CMS workflows.</p>
    
    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-label">Database</div>
        <div class="metric-value"><span class="gold-dot"></span>Supabase PostgreSQL</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Storage CDN</div>
        <div class="metric-value"><span class="gold-dot"></span>Active (WebP CDN)</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Security Protocol</div>
        <div class="metric-value"><span class="gold-dot"></span>JWT & CORS Guarded</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Version</div>
        <div class="metric-value"><span class="gold-dot"></span>v2.0.0 Production</div>
      </div>
    </div>

    <div class="cta-row">
      <a href="/api/health" class="btn btn-primary" target="_blank">View Live Health JSON</a>
      <a href="/api/banners" class="btn btn-secondary" target="_blank">Explore API Routes</a>
    </div>
  </div>
</body>
</html>`);
});

// Mount all API endpoints under /api
app.use('/api', apiRoutes);

// Global 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({
    result: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    result: 'error',
    message: 'Internal server error'
  });
});

module.exports = app;
