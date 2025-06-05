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

// Start HTTP server
httpServer.listen(port, () => {
  console.log(`Combined server running on port ${port}`);
  console.log(`HTTP server: http://localhost:${port}`);
  console.log(`Client build path: ${clientBuildPath}`);
});

// Start WebSocket server on the same HTTP server
const wsServer = new WebSocketServer(undefined, httpServer);
wsServer.start();
