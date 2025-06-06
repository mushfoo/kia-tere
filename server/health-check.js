const http = require('http');

const server = http.createServer((req, res) => {
  // Only respond to health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end();
  }
});

const port = process.env.HEALTH_PORT || 9192;
server.listen(port, '0.0.0.0', () => {
  console.log(`Health check server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Health check server closed');
  });
});