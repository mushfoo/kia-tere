"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateManager = void 0;
const constants_1 = require("../constants");
const roomUtils_1 = require("../utils/roomUtils");
class GameStateManager {
    constructor() {
        this.rooms = new Map();
        this.playerConnections = new Map();
    }
    createRoom(hostName) {
        const roomCode = (0, roomUtils_1.generateRoomCode)();
        const room = {
            roomCode,
            players: [hostName],
            connectedPlayers: [hostName],
            host: hostName,
            gameState: (0, roomUtils_1.createInitialGameState)([hostName]),
            createdAt: Date.now(),
            lastActivity: Date.now(),
        };
        this.rooms.set(roomCode, room);
        return room;
    }
    joinRoom(roomCode, playerName) {
        const room = this.rooms.get(roomCode);
        if (!room)
            return null;
        const existingPlayerIndex = room.players.indexOf(playerName);
        if (existingPlayerIndex !== -1) {
            if (!room.connectedPlayers.includes(playerName)) {
                room.connectedPlayers.push(playerName);
            }
        }
        else {
            room.players.push(playerName);
            room.connectedPlayers.push(playerName);
        }
        room.lastActivity = Date.now();
        return room;
    }
    removePlayer(roomCode, playerName) {
        const room = this.rooms.get(roomCode);
        if (!room)
            return null;
        room.connectedPlayers = room.connectedPlayers.filter((p) => p !== playerName);
        room.lastActivity = Date.now();
        if (room.connectedPlayers.length === 0) {
            room.emptyAt = Date.now();
        }
        return room;
    }
    getRoom(roomCode) {
        return this.rooms.get(roomCode) || null;
    }
    startGame(roomCode, difficulty = 'easy') {
        const room = this.rooms.get(roomCode);
        if (!room)
            return null;
        room.gameState = (0, roomUtils_1.createInitialGameState)(room.players);
        room.gameState.gameStarted = true;
        room.gameState.roundActive = true;
        room.gameState.currentCategory = (0, roomUtils_1.getRandomCategory)();
        room.gameState.difficulty = difficulty;
        return room;
    }
    startTurn(roomCode) {
        const room = this.rooms.get(roomCode);
        if (!room)
            return null;
        room.gameState.isTimerRunning = true;
        room.gameState.timeLeft = constants_1.GAME_CONSTANTS.TURN_TIME;
        return room;
    }
    endTurn(roomCode, selectedLetter) {
        const room = this.rooms.get(roomCode);
        if (!room)
            return null;
        if (!room.gameState.isTimerRunning) {
            return room;
        }
        room.gameState.usedLetters.push(selectedLetter);
        room.gameState.currentPlayerIndex =
            (room.gameState.currentPlayerIndex + 1) %
                room.gameState.activePlayers.length;
        room.gameState.timeLeft = constants_1.GAME_CONSTANTS.TURN_TIME;
        room.gameState.isTimerRunning = true;
        return room;
    }
    eliminatePlayer(roomCode) {
        const room = this.rooms.get(roomCode);
        if (!room)
            return null;
        const currentPlayer = room.gameState.activePlayers[room.gameState.currentPlayerIndex];
        room.gameState.activePlayers = room.gameState.activePlayers.filter((name) => name !== currentPlayer);
        room.gameState.isTimerRunning = false;
        if (room.gameState.activePlayers.length === 1) {
            return this.endRound(roomCode);
        }
        if (room.gameState.currentPlayerIndex >= room.gameState.activePlayers.length) {
            room.gameState.currentPlayerIndex = 0;
        }
        room.gameState.timeLeft = constants_1.GAME_CONSTANTS.TURN_TIME;
        room.gameState.isTimerRunning = true;
        return { type: 'continue', room };
    }
    endRound(roomCode) {
        const room = this.rooms.get(roomCode);
        if (!room)
            return null;
        const winner = room.gameState.activePlayers[0];
        room.gameState.roundWins[winner] =
            (room.gameState.roundWins[winner] || 0) + 1;
        if (room.gameState.roundWins[winner] >= constants_1.GAME_CONSTANTS.WINS_TO_END_GAME) {
            return { type: 'gameEnd', room, winner };
        }
        room.gameState.roundNumber++;
        room.gameState.activePlayers = [...room.gameState.players];
        room.gameState.currentPlayerIndex = 0;
        room.gameState.usedLetters = [];
        room.gameState.timeLeft = constants_1.GAME_CONSTANTS.TURN_TIME;
        room.gameState.isTimerRunning = false;
        room.gameState.roundActive = true;
        room.gameState.currentCategory = (0, roomUtils_1.getRandomCategory)();
        return { type: 'roundEnd', room };
    }
    cleanupRooms() {
        for (const [roomCode, room] of this.rooms.entries()) {
            if ((0, roomUtils_1.shouldCleanupRoom)(room)) {
                this.rooms.delete(roomCode);
                console.log(`Cleaned up room: ${roomCode}`);
            }
        }
    }
    async saveRoom(room) {
    }
    async loadRoom(roomCode) {
        return this.rooms.get(roomCode) || null;
    }
    async saveGameEvent(roomCode, event) {
    }
    getPlayerConnection(playerName) {
        return this.playerConnections.get(playerName);
    }
    setPlayerConnection(playerName, ws) {
        this.playerConnections.set(playerName, ws);
    }
    removePlayerConnection(playerName) {
        this.playerConnections.delete(playerName);
    }
}
exports.GameStateManager = GameStateManager;
//# sourceMappingURL=GameStateManager.js.map