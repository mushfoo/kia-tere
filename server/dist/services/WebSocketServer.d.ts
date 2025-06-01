import { ExtendedWebSocket, WebSocketMessage } from '../types';
export declare class WebSocketServer {
    private port;
    private gameManager;
    private server;
    private wss;
    private cleanupInterval?;
    private roundTimeouts;
    constructor(port?: number);
    private setupWebSocketHandlers;
    handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage): void;
    private handleCreateRoom;
    private handleJoinRoom;
    private handleStartGame;
    private handleStartTurn;
    private handleEndTurn;
    private handleTimeUp;
    private handleTimerUpdate;
    private handleSetDifficulty;
    handleDisconnection(ws: ExtendedWebSocket): void;
    private send;
    private sendError;
    private broadcastToRoom;
    private startCleanupInterval;
    stopCleanupInterval(): void;
    start(): void;
    close(): void;
    getRoom(roomCode: string): import("../types").Room | null;
}
//# sourceMappingURL=WebSocketServer.d.ts.map