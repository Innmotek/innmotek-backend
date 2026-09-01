/**
 * Innmotek V2 - Server Entrypoint
 */

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` Innmotek V2 Backend API Running`);
  console.log(` Port:    http://localhost:${PORT}`);
  console.log(` Health:  http://localhost:${PORT}/api/health`);
  console.log(` Storage: ${process.env.STORAGE_BASE_URL || `Local Storage (http://localhost:${PORT}/frontend/images)`}`);
  console.log(`=============================================`);
});

module.exports = server;
