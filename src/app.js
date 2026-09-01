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
