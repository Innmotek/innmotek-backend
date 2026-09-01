const http = require('http');

function checkPort(port, path = '/') {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path, timeout: 3000 }, (res) => {
      resolve({ port, status: res.statusCode });
    });
    req.on('error', (err) => {
      resolve({ port, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ port, error: 'TIMEOUT' });
    });
  });
}

async function checkAll() {
  const [b, f, a] = await Promise.all([
    checkPort(5000, '/api/health'),
    checkPort(3000, '/'),
    checkPort(3001, '/')
  ]);
  console.log('Results:', { backend: b, frontend: f, admin: a });
}

checkAll();
