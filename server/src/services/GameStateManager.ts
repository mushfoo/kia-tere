import {
  Room,
  ExtendedWebSocket,
  EliminationResult,
  Difficulty,
} from '../types';
import { GAME_CONSTANTS, LETTER_SETS, CATEGORIES } from '../constants';
import {
  generateRoomCode,
  createInitialGameState,
  shouldCleanupRoom,
  getRandomCategory,
} from '../utils/roomUtils';

export class GameStateManager {
  private rooms: Map<string, Room> = new Map();
  private playerConnections: Map<string, ExtendedWebSocket> = new Map();
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();

  // Room management
  createRoom(hostName: string): Room {
    const roomCode = generateRoomCode();
    const room: Room = {
      roomCode,
      players: [hostName],
      connectedPlayers: [hostName],
      host: hostName,
      gameState: createInitialGameState([hostName]),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  joinRoom(roomCode: string, playerName: string): Room | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Check if player is rejoining
    const existingPlayerIndex = room.players.indexOf(playerName);
    if (existingPlayerIndex !== -1) {
      // Player is rejoining
      if (!room.connectedPlayers.includes(playerName)) {
        room.connectedPlayers.push(playerName);
      }
    } else {
      // New player joining
      room.players.push(playerName);
      room.connectedPlayers.push(playerName);
    }

    room.lastActivity = Date.now();
    return room;
  }

  removePlayer(roomCode: string, playerName: string): Room | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Remove from connected players
    room.connectedPlayers = room.connectedPlayers.filter(
      (p) => p !== playerName
    );
    room.lastActivity = Date.now();

    // If no players connected, mark for cleanup (but don't delete immediately)
    if (room.connectedPlayers.length === 0) {
      room.emptyAt = Date.now();
    }

    return room;
  }

  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode) || null;
  }

  // Timer management methods
  private startServerTimer(roomCode: string): void {
    // Clear any existing timer for this room
    this.clearTimer(roomCode);

    const timer = setInterval(() => {
      const room = this.rooms.get(roomCode);
      if (!room || !room.gameState.isTimerRunning) {
        this.clearTimer(roomCode);
        return;
      }

      room.gameState.timeLeft--;

      // Broadcast timer update to all players in room
      this.broadcastToRoom(roomCode, {
        type: 'TIMER_UPDATE',
        timeLeft: room.gameState.timeLeft,
      });

      // Check if time is up
      if (room.gameState.timeLeft <= 0) {
        this.clearTimer(roomCode);
        // Handle time up logic
        const eliminationResult = this.eliminatePlayer(roomCode);
        if (eliminationResult) {
          this.handleEliminationResult(roomCode, eliminationResult);
        }
      }
    }, 1000);

    this.roomTimers.set(roomCode, timer);
  }

  private clearTimer(roomCode: string): void {
    const timer = this.roomTimers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.roomTimers.delete(roomCode);
    }
  }

  private broadcastToRoom(roomCode: string, message: any): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.connectedPlayers.forEach((playerName) => {
      const connection = this.playerConnections.get(playerName);
      if (connection && connection.readyState === 1) {
        // WebSocket.OPEN = 1
        connection.send(JSON.stringify(message));
      }
    });
  }

  private handleEliminationResult(
    roomCode: string,
    result: EliminationResult
  ): void {
    if (result.eliminatedPlayer) {
      this.broadcastToRoom(roomCode, {
        type: 'PLAYER_ELIMINATED',
        player: result.eliminatedPlayer,
      });
    }

    switch (result.type) {
      case 'continue':
        this.broadcastToRoom(roomCode, {
          type: 'GAME_STATE_UPDATE',
          gameState: result.room.gameState,
        });
        // Start timer for next player
        this.startServerTimer(roomCode);
        break;

      case 'overtimeStart':
        // Broadcast overtime start with full game state
        this.broadcastToRoom(roomCode, {
          type: 'OVERTIME_START',
          gameState: result.room.gameState,
          overtimeLevel: result.room.gameState.overtimeLevel,
          answersRequired: result.room.gameState.answersRequired,
          newCategory: result.room.gameState.currentCategory,
        });
        break;

      case 'roundEnd':
        // Broadcast round end with full game state
        this.broadcastToRoom(roomCode, {
          type: 'ROUND_END',
          gameState: result.room.gameState, // Include full game state
          roundWins: result.room.gameState.roundWins,
          roundNumber: result.room.gameState.roundNumber,
          winner: result.winner,
        });
        break;

      case 'gameEnd':
        this.broadcastToRoom(roomCode, {
          type: 'GAME_END',
          roundWins: result.room.gameState.roundWins,
          winner: result.winner,
        });
        this.clearTimer(roomCode);
        break;
    }
  }

  /**
   * Checks if overtime should be triggered (all letters used with multiple players remaining).
   *
   * @param room - The room to check for overtime conditions
   * @returns true if overtime should start, false otherwise
   */
  private shouldTriggerOvertime(room: Room): boolean {
    const availableLetters = LETTER_SETS[room.gameState.difficulty];
    const allLettersUsed =
      room.gameState.usedLetters.length >= availableLetters.length;
    return allLettersUsed && room.gameState.activePlayers.length > 1;
  }

  private selectCategory(room: Room): string {
    if (room.gameState.usedCategories.length >= CATEGORIES.length) {
      room.gameState.usedCategories = [];
    }
    const category = getRandomCategory(room.gameState.usedCategories);
    room.gameState.usedCategories.push(category);
    return category;
  }

  // Game state management
  startGame(
    roomCode: string,
    difficulty: Difficulty = 'easy',
    turnTime: number = GAME_CONSTANTS.TURN_TIME
  ): Room | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Initialize game state
    room.gameState = createInitialGameState(room.players, turnTime);
    room.gameState.gameStarted = true;
    room.gameState.roundActive = true;
    room.gameState.currentCategory = this.selectCategory(room);
    room.gameState.difficulty = difficulty;

    return room;
  }

  refreshCategory(roomCode: string): Room | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    if (room.gameState.usedLetters.length > 0) {
      return null;
    }
    room.gameState.usedCategories = room.gameState.usedCategories.filter(
      (c) => c !== room.gameState.currentCategory
    );
    room.gameState.currentCategory = this.selectCategory(room);
    return room;
  }

  startTurn(roomCode: string): Room | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    room.gameState.isTimerRunning = true;
    room.gameState.timeLeft = room.gameState.turnTime;

    // Start the server-side timer
    this.startServerTimer(roomCode);

    return room;
  }

  endTurn(roomCode: string, selectedLetter: string): EliminationResult | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Clear the current timer
    this.clearTimer(roomCode);

    // Only allow if timer is running
    if (!room.gameState.isTimerRunning) {
      return { type: 'continue', room };
    }

    // Add letter to used letters
    room.gameState.usedLetters.push(selectedLetter);

    // Check for overtime condition: all letters used and multiple players remaining
    if (this.shouldTriggerOvertime(room)) {
      return this.startOvertimeRound(roomCode);
    }

    // Move to next player
    room.gameState.currentPlayerIndex =
      (room.gameState.currentPlayerIndex + 1) %
      room.gameState.activePlayers.length;

    room.gameState.timeLeft = room.gameState.turnTime;
    room.gameState.isTimerRunning = true;

    // Start timer for next player
    this.startServerTimer(roomCode);

    return { type: 'continue', room };
  }

  eliminatePlayer(roomCode: string): EliminationResult | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Clear the current timer
    this.clearTimer(roomCode);

    const currentPlayer =
      room.gameState.activePlayers[room.gameState.currentPlayerIndex];

    // Remove current player from active players
    room.gameState.activePlayers = room.gameState.activePlayers.filter(
      (name) => name !== currentPlayer
    );

    room.gameState.isTimerRunning = false;

    // Check if round is over
    if (room.gameState.activePlayers.length === 1) {
      const result = this.endRound(roomCode);
      if (result) result.eliminatedPlayer = currentPlayer;
      return result;
    }

    // Check for overtime condition: all letters used and multiple players remaining
    if (this.shouldTriggerOvertime(room)) {
      const result = this.startOvertimeRound(roomCode);
      if (result) result.eliminatedPlayer = currentPlayer;
      return result;
    }

    // Adjust current player index
    if (
      room.gameState.currentPlayerIndex >= room.gameState.activePlayers.length
    ) {
      room.gameState.currentPlayerIndex = 0;
    }

    // Continue with next player - fresh timer
    room.gameState.timeLeft = room.gameState.turnTime;
    room.gameState.isTimerRunning = true;

    return { type: 'continue', room, eliminatedPlayer: currentPlayer };
  }

  endRound(roomCode: string): EliminationResult | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Clear any existing timer
    this.clearTimer(roomCode);

    const winner = room.gameState.activePlayers[0];

    // Calculate points based on round type
    let pointsToAward = 1; // Default for normal rounds
    if (room.gameState.isOvertimeRound) {
      pointsToAward = room.gameState.answersRequired; // 2 for first overtime, 3 for second, etc.
    }

    room.gameState.roundWins[winner] =
      (room.gameState.roundWins[winner] || 0) + pointsToAward;

    // Check if game is over (first to 3 wins)
    if (room.gameState.roundWins[winner] >= GAME_CONSTANTS.WINS_TO_END_GAME) {
      room.gameState.roundActive = false; // End the game
      return { type: 'gameEnd', room, winner };
    }

    // Calculate next starting player - the player after the winner in the original rotation
    const winnerIndexInFullPlayers = room.gameState.players.indexOf(winner);
    const nextPlayerIndex =
      (winnerIndexInFullPlayers + 1) % room.gameState.players.length;

    // Start new round
    room.gameState.roundNumber++;
    room.gameState.activePlayers = [...room.gameState.players];
    room.gameState.currentPlayerIndex = nextPlayerIndex; // Start with next player, not 0
    room.gameState.usedLetters = [];
    room.gameState.timeLeft = room.gameState.turnTime;
    room.gameState.isTimerRunning = false; // Timer not running yet - player needs to start turn
    room.gameState.roundActive = true; // Keep this TRUE for new round
    room.gameState.currentCategory = this.selectCategory(room);

    // Reset overtime state for new round
    room.gameState.isOvertimeRound = false;
    room.gameState.overtimeLevel = 0;
    room.gameState.answersRequired = 1;

    return { type: 'roundEnd', room, winner };
  }

  /**
   * Starts an overtime round when all letters are used but multiple players remain.
   * Increments overtime level, resets letters, assigns new category, and increases answer requirements.
   *
   * @param roomCode - The room code where overtime should start
   * @returns EliminationResult with type 'overtimeStart' and updated room state, or null if room not found
   */
  startOvertimeRound(roomCode: string): EliminationResult | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Clear any existing timer
    this.clearTimer(roomCode);

    // Increment overtime level and set answers required
    room.gameState.overtimeLevel++;
    room.gameState.answersRequired = room.gameState.overtimeLevel + 1; // 2 for first overtime, 3 for second, etc.
    room.gameState.isOvertimeRound = true;

    // Reset letters for overtime round
    room.gameState.usedLetters = [];

    // Get new category for overtime round
    room.gameState.currentCategory = this.selectCategory(room);

    // Reset timer and start with first player
    room.gameState.currentPlayerIndex = 0;
    room.gameState.timeLeft = room.gameState.turnTime;
    room.gameState.isTimerRunning = false; // Player needs to start turn

    return { type: 'overtimeStart', room };
  }

  // Cleanup old rooms
  cleanupRooms(): void {
    for (const [roomCode, room] of this.rooms.entries()) {
      if (shouldCleanupRoom(room)) {
        this.clearTimer(roomCode); // Clear timer before deleting room
        this.rooms.delete(roomCode);
        console.log(`Cleaned up room: ${roomCode}`);
      }
    }
  }

  // Test cleanup method - clears all timers and state
  cleanup(): void {
    // Clear all active timers
    for (const [roomCode] of this.roomTimers.entries()) {
      this.clearTimer(roomCode);
    }

    // Clear all rooms and connections
    this.rooms.clear();
    this.playerConnections.clear();
    this.roomTimers.clear();

    console.log('GameStateManager cleanup completed');
  }

  // Future database integration points
  async saveRoom(room: Room): Promise<void> {
    // TODO: Save room state to database
    // await database.rooms.upsert(room);
  }

  async loadRoom(roomCode: string): Promise<Room | null> {
    // TODO: Load room from database
    // return await database.rooms.findOne({ roomCode });
    return this.rooms.get(roomCode) || null;
  }

  async saveGameEvent(roomCode: string, event: any): Promise<void> {
    // TODO: Log game events for analytics/replay
    // await database.events.create({ roomCode, event, timestamp: Date.now() });
  }

  // Getters for WebSocket server
  getPlayerConnection(playerName: string): ExtendedWebSocket | undefined {
    return this.playerConnections.get(playerName);
  }

  setPlayerConnection(playerName: string, ws: ExtendedWebSocket): void {
    this.playerConnections.set(playerName, ws);
  }

  removePlayerConnection(playerName: string): void {
    this.playerConnections.delete(playerName);
  }
}
