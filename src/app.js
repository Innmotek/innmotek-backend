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

// Serve public static assets (favicons, etc.)
app.use(express.static(path.resolve(__dirname, '../public')));

// Root Status Landing Page - Minimal & Clean
app.get('/', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html')) {
    return res.json({
      result: 'success',
      message: 'Innmotek V2 API is running',
      status: 'operational',
      version: '2.0.0'
    });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Innmotek API — Running</title>
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon-32x32.png" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0A0A0A;
      color: #E5E5E5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .badge-card {
      background: #141414;
      border: 1px solid #262626;
      border-radius: 16px;
      padding: 24px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .pulse-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 12px #10B981;
      animation: pulse 2s infinite;
      flex-shrink: 0;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .text-group h1 {
      font-size: 16px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    .text-group p {
      font-size: 12px;
      color: #A1A1AA;
      margin-top: 2px;
    }
    .status-tag {
      margin-left: 12px;
      background: rgba(197, 168, 128, 0.15);
      border: 1px solid rgba(197, 168, 128, 0.3);
      color: #C5A880;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
    }
  </style>
</head>
<body>
  <div class="badge-card">
    <div class="pulse-dot"></div>
    <div class="text-group">
      <h1>Innmotek V2 API</h1>
      <p>Operational &bull; Connected to Supabase</p>
    </div>
    <span class="status-tag">Running</span>
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
