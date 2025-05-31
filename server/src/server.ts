import { WebSocketServer } from './services/WebSocketServer'

// Start the server
const server = new WebSocketServer(9191)
server.start()
