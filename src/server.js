/**
 * Innmotek V2 - Server Entrypoint
 */

require('dotenv').config();
const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 5000;

/**
 * 24-Hour Supabase Database Keep-Alive Heartbeat
 * Supabase Free Tier auto-pauses databases after 7 days without queries.
 * The Render backend runs 24/7; this background heartbeat guarantees
 * the database never auto-pauses, even without external monitors or visitors.
 */
const runDatabaseHeartbeat = async () => {
  const startTime = Date.now();
  try {
    const status = await db.ping();
    const latency = Date.now() - startTime;
    console.log(`[Supabase Keep-Alive] [${new Date().toISOString()}] Ping successful (Latency: ${latency}ms) - 7-day auto-pause prevented.`);
  } catch (err) {
    console.warn(`[Supabase Keep-Alive] [${new Date().toISOString()}] Heartbeat warning:`, err.message);
  }
};

const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` Innmotek V2 Backend API Running`);
  console.log(` Port:    http://localhost:${PORT}`);
  console.log(` Health:  http://localhost:${PORT}/api/health`);
  console.log(` Media:   http://localhost:${PORT}/api/media/:folder/:filename`);
  console.log(`=============================================`);

  // 1. Initial ping on server startup
  runDatabaseHeartbeat();

  // 2. Schedule 24h recurring heartbeat
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const heartbeatTimer = setInterval(runDatabaseHeartbeat, TWENTY_FOUR_HOURS_MS);
  if (heartbeatTimer.unref) {
    heartbeatTimer.unref();
  }
});

module.exports = server;
