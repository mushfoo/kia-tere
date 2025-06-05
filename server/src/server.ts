import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from './services/WebSocketServer';

const app = express();
const port = process.env.PORT || 9191;

// Serve static files from client build directory
const clientBuildPath = path.join(__dirname, '../../client/build');
app.use(express.static(clientBuildPath));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res
    .status(200)
    .json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Create HTTP server
const httpServer = createServer(app);

// Start HTTP server on all interfaces for network access
const host = process.env.HOST || '0.0.0.0';
httpServer.listen(Number(port), host, () => {
  console.log(`Combined server running on ${host}:${port}`);
  console.log(`HTTP server: http://localhost:${port}`);
  console.log(`Network access: http://${getNetworkIP()}:${port}`);
  console.log(`Client build path: ${clientBuildPath}`);
});

// Helper function to get network IP
function getNetworkIP(): string {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  return 'localhost';
}

// Start WebSocket server on the same HTTP server
const wsServer = new WebSocketServer(undefined, httpServer);
wsServer.start();
