"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
const ws_1 = __importDefault(require("ws"));
const http_1 = require("http");
const GameStateManager_1 = require("./GameStateManager");
class WebSocketServer {
    constructor(port = 8080) {
        this.roundTimeouts = new Map();
        this.port = port;
        this.gameManager = new GameStateManager_1.GameStateManager();
        this.server = (0, http_1.createServer)();
        this.wss = new ws_1.default.Server({ server: this.server });
        this.setupWebSocketHandlers();
    }
    setupWebSocketHandlers() {
        this.wss.on('connection', (ws) => {
            console.log('New WebSocket connection');
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(ws, message);
                }
                catch (error) {
                    console.error('Error parsing message:', error);
                    this.sendError(ws, 'Invalid message format');
                }
            });
            ws.on('close', () => {
                this.handleDisconnection(ws);
            });
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
    }
    handleMessage(ws, message) {
        switch (message.type) {
            case 'CREATE_ROOM':
                this.handleCreateRoom(ws, message);
                break;
            case 'JOIN_ROOM':
                this.handleJoinRoom(ws, message);
                break;
            case 'START_GAME':
                this.handleStartGame(ws, message);
                break;
            case 'START_TURN':
                this.handleStartTurn(ws, message);
                break;
            case 'END_TURN':
                this.handleEndTurn(ws, message);
                break;
            case 'TIME_UP':
                this.handleTimeUp(ws, message);
                break;
            case 'TIMER_UPDATE':
                this.handleTimerUpdate(ws, message);
                break;
            case 'SET_DIFFICULTY':
                this.handleSetDifficulty(ws, message);
                break;
            default:
                this.sendError(ws, 'Unknown message type');
        }
    }
    handleCreateRoom(ws, message) {
        const room = this.gameManager.createRoom(message.playerName);
        ws.roomCode = room.roomCode;
        ws.playerName = message.playerName;
        this.gameManager.setPlayerConnection(message.playerName, ws);
        this.send(ws, {
            type: 'ROOM_CREATED',
            roomCode: room.roomCode,
        });
        console.log(`Room created: ${room.roomCode} by ${message.playerName}`);
    }
    handleJoinRoom(ws, message) {
        const room = this.gameManager.joinRoom(message.roomCode, message.playerName);
        if (!room) {
            this.sendError(ws, 'Room not found');
            return;
        }
        ws.roomCode = message.roomCode;
        ws.playerName = message.playerName;
        this.gameManager.setPlayerConnection(message.playerName, ws);
        this.send(ws, {
            type: 'ROOM_JOINED',
            roomCode: room.roomCode,
            players: room.players,
            connectedPlayers: room.connectedPlayers,
        });
        if (room.gameState.gameStarted) {
            this.send(ws, {
                type: 'GAME_STARTED',
                gameState: room.gameState,
            });
        }
        this.broadcastToRoom(room.roomCode, {
            type: 'PLAYER_JOINED',
            players: room.players,
            connectedPlayers: room.connectedPlayers,
        }, message.playerName);
        console.log(`${message.playerName} joined room: ${message.roomCode}`);
    }
    handleStartGame(ws, message) {
        const room = this.gameManager.getRoom(ws.roomCode);
        if (!room || room.host !== ws.playerName) {
            this.sendError(ws, 'Not authorized to start game');
            return;
        }
        if (room.players.length < 2) {
            this.sendError(ws, 'Need at least 2 players to start');
            return;
        }
        const difficulty = message.difficulty || 'easy';
        this.gameManager.startGame(ws.roomCode, difficulty);
        this.broadcastToRoom(ws.roomCode, {
            type: 'GAME_STARTED',
            gameState: room.gameState,
        });
        console.log(`Game started in room: ${ws.roomCode} with ${difficulty} difficulty`);
    }
    handleStartTurn(ws, message) {
        const room = this.gameManager.getRoom(ws.roomCode);
        if (!room)
            return;
        const currentPlayer = room.gameState.activePlayers[room.gameState.currentPlayerIndex];
        if (currentPlayer !== ws.playerName) {
            this.sendError(ws, 'Not your turn');
            return;
        }
        this.gameManager.startTurn(ws.roomCode);
        this.broadcastToRoom(ws.roomCode, {
            type: 'GAME_STATE_UPDATE',
            gameState: room.gameState,
        });
    }
    handleEndTurn(ws, message) {
        const room = this.gameManager.getRoom(ws.roomCode);
        if (!room)
            return;
        const currentPlayer = room.gameState.activePlayers[room.gameState.currentPlayerIndex];
        if (currentPlayer !== ws.playerName) {
            this.sendError(ws, 'Not your turn');
            return;
        }
        this.gameManager.endTurn(ws.roomCode, message.selectedLetter);
        this.broadcastToRoom(ws.roomCode, {
            type: 'GAME_STATE_UPDATE',
            gameState: room.gameState,
        });
    }
    handleTimeUp(ws, message) {
        const room = this.gameManager.getRoom(ws.roomCode);
        if (!room)
            return;
        const currentPlayer = room.gameState.activePlayers[room.gameState.currentPlayerIndex];
        if (currentPlayer !== ws.playerName)
            return;
        const result = this.gameManager.eliminatePlayer(ws.roomCode);
        if (!result)
            return;
        if (result.type === 'gameEnd') {
            this.broadcastToRoom(ws.roomCode, {
                type: 'GAME_END',
                roundWins: result.room.gameState.roundWins,
                winner: result.winner,
            });
        }
        else if (result.type === 'roundEnd') {
            this.broadcastToRoom(ws.roomCode, {
                type: 'ROUND_END',
                roundWins: result.room.gameState.roundWins,
                roundNumber: result.room.gameState.roundNumber,
            });
            const existingTimeout = this.roundTimeouts.get(ws.roomCode);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }
            const timeout = setTimeout(() => {
                this.broadcastToRoom(ws.roomCode, {
                    type: 'GAME_STARTED',
                    gameState: result.room.gameState,
                });
                this.roundTimeouts.delete(ws.roomCode);
            }, 3000);
            this.roundTimeouts.set(ws.roomCode, timeout);
        }
        else {
            this.broadcastToRoom(ws.roomCode, {
                type: 'GAME_STATE_UPDATE',
                gameState: result.room.gameState,
            });
        }
    }
    handleTimerUpdate(ws, message) {
        const room = this.gameManager.getRoom(ws.roomCode);
        if (!room)
            return;
        const currentPlayer = room.gameState.activePlayers[room.gameState.currentPlayerIndex];
        if (currentPlayer !== ws.playerName)
            return;
        this.broadcastToRoom(ws.roomCode, {
            type: 'TIMER_UPDATE',
            timeLeft: message.timeLeft,
        }, ws.playerName);
    }
    handleSetDifficulty(ws, message) {
        const room = this.gameManager.getRoom(ws.roomCode);
        if (!room || room.host !== ws.playerName) {
            this.sendError(ws, 'Not authorized to change difficulty');
            return;
        }
        room.gameState.difficulty = message.difficulty;
        this.broadcastToRoom(ws.roomCode, {
            type: 'GAME_STATE_UPDATE',
            gameState: room.gameState,
        });
        console.log(`Difficulty changed to ${message.difficulty} in room: ${ws.roomCode}`);
    }
    handleDisconnection(ws) {
        if (ws.roomCode && ws.playerName) {
            const room = this.gameManager.removePlayer(ws.roomCode, ws.playerName);
            if (room) {
                this.broadcastToRoom(ws.roomCode, {
                    type: 'PLAYER_LEFT',
                    players: room.players,
                    connectedPlayers: room.connectedPlayers,
                });
            }
            this.gameManager.removePlayerConnection(ws.playerName);
            console.log(`${ws.playerName} disconnected from room: ${ws.roomCode}`);
        }
    }
    send(ws, message) {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    sendError(ws, message) {
        this.send(ws, {
            type: 'ERROR',
            message,
        });
    }
    broadcastToRoom(roomCode, message, excludePlayer) {
        const room = this.gameManager.getRoom(roomCode);
        if (!room)
            return;
        room.connectedPlayers.forEach((playerName) => {
            if (playerName !== excludePlayer) {
                const playerWs = this.gameManager.getPlayerConnection(playerName);
                if (playerWs) {
                    this.send(playerWs, message);
                }
            }
        });
    }
    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            this.gameManager.cleanupRooms();
        }, 5 * 60 * 1000);
    }
    stopCleanupInterval() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
    start() {
        this.server.listen(this.port, () => {
            console.log(`Kia Tere WebSocket server running on port ${this.port}`);
            console.log(`WebSocket URL: ws://localhost:${this.port}`);
            this.startCleanupInterval();
        });
    }
    close() {
        for (const timeout of this.roundTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.roundTimeouts.clear();
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.wss.close();
        this.server.close();
    }
    getRoom(roomCode) {
        return this.gameManager.getRoom(roomCode);
    }
}
exports.WebSocketServer = WebSocketServer;
//# sourceMappingURL=WebSocketServer.js.map