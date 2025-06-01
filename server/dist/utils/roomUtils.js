"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoomCode = generateRoomCode;
exports.createInitialGameState = createInitialGameState;
exports.shouldCleanupRoom = shouldCleanupRoom;
exports.getRandomCategory = getRandomCategory;
const constants_1 = require("../constants");
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < constants_1.GAME_CONSTANTS.ROOM_CODE_LENGTH; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function createInitialGameState(players) {
    const roundWins = {};
    const playersCopy = [...players];
    playersCopy.forEach((player) => (roundWins[player] = 0));
    return {
        players: [...playersCopy],
        activePlayers: [...playersCopy],
        currentPlayerIndex: 0,
        roundWins,
        currentCategory: '',
        usedLetters: [],
        timeLeft: constants_1.GAME_CONSTANTS.TURN_TIME,
        isTimerRunning: false,
        roundActive: false,
        roundNumber: 1,
        gameStarted: false,
        difficulty: 'easy',
    };
}
function shouldCleanupRoom(room) {
    const now = Date.now();
    return ((room.emptyAt && now - room.emptyAt > constants_1.GAME_CONSTANTS.EMPTY_ROOM_TIMEOUT) ||
        now - room.lastActivity > constants_1.GAME_CONSTANTS.ROOM_TIMEOUT);
}
function getRandomCategory() {
    return constants_1.CATEGORIES[Math.floor(Math.random() * constants_1.CATEGORIES.length)];
}
//# sourceMappingURL=roomUtils.js.map