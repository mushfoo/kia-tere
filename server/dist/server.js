"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocketServer_1 = require("./services/WebSocketServer");
const server = new WebSocketServer_1.WebSocketServer(9191);
server.start();
//# sourceMappingURL=server.js.map