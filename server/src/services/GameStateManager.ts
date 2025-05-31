import {
  Room,
  GameState,
  ExtendedWebSocket,
  EliminationResult,
  Difficulty,
} from '../types'
import { GAME_CONSTANTS, CATEGORIES } from '../constants'
import {
  generateRoomCode,
  createInitialGameState,
  shouldCleanupRoom,
  getRandomCategory,
} from '../utils/roomUtils'

export class GameStateManager {
  private rooms: Map<string, Room> = new Map()
  private playerConnections: Map<string, ExtendedWebSocket> = new Map()

  // Room management
  createRoom(hostName: string): Room {
    const roomCode = generateRoomCode()
    const room: Room = {
      roomCode,
      players: [hostName],
      connectedPlayers: [hostName],
      host: hostName,
      gameState: createInitialGameState([hostName]),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }

    this.rooms.set(roomCode, room)
    return room
  }

  joinRoom(roomCode: string, playerName: string): Room | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    // Check if player is rejoining
    const existingPlayerIndex = room.players.indexOf(playerName)
    if (existingPlayerIndex !== -1) {
      // Player is rejoining
      if (!room.connectedPlayers.includes(playerName)) {
        room.connectedPlayers.push(playerName)
      }
    } else {
      // New player joining
      room.players.push(playerName)
      room.connectedPlayers.push(playerName)
    }

    room.lastActivity = Date.now()
    return room
  }

  removePlayer(roomCode: string, playerName: string): Room | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    // Remove from connected players
    room.connectedPlayers = room.connectedPlayers.filter(
      (p) => p !== playerName
    )
    room.lastActivity = Date.now()

    // If no players connected, mark for cleanup (but don't delete immediately)
    if (room.connectedPlayers.length === 0) {
      room.emptyAt = Date.now()
    }

    return room
  }

  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode) || null
  }

  // Game state management
  startGame(roomCode: string, difficulty: Difficulty = 'easy'): Room | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    // Initialize game state
    room.gameState = createInitialGameState(room.players)
    room.gameState.gameStarted = true
    room.gameState.roundActive = true
    room.gameState.currentCategory = getRandomCategory()
    room.gameState.difficulty = difficulty

    return room
  }

  startTurn(roomCode: string): Room | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    room.gameState.isTimerRunning = true
    room.gameState.timeLeft = GAME_CONSTANTS.TURN_TIME
    return room
  }

  endTurn(roomCode: string, selectedLetter: string): Room | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    // Only allow if timer is running
    if (!room.gameState.isTimerRunning) {
      return room
    }

    // Add letter to used letters
    room.gameState.usedLetters.push(selectedLetter)

    // Move to next player
    room.gameState.currentPlayerIndex =
      (room.gameState.currentPlayerIndex + 1) %
      room.gameState.activePlayers.length
    room.gameState.timeLeft = GAME_CONSTANTS.TURN_TIME // Fresh timer for next player
    room.gameState.isTimerRunning = true // Auto-start next turn

    return room
  }

  eliminatePlayer(roomCode: string): EliminationResult | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    const currentPlayer =
      room.gameState.activePlayers[room.gameState.currentPlayerIndex]

    // Remove current player from active players
    room.gameState.activePlayers = room.gameState.activePlayers.filter(
      (name) => name !== currentPlayer
    )

    room.gameState.isTimerRunning = false

    // Check if round is over
    if (room.gameState.activePlayers.length === 1) {
      return this.endRound(roomCode)
    }

    // Adjust current player index
    if (
      room.gameState.currentPlayerIndex >= room.gameState.activePlayers.length
    ) {
      room.gameState.currentPlayerIndex = 0
    }

    // Continue with next player - fresh timer
    room.gameState.timeLeft = GAME_CONSTANTS.TURN_TIME
    room.gameState.isTimerRunning = true

    return { type: 'continue', room }
  }

  endRound(roomCode: string): EliminationResult | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    const winner = room.gameState.activePlayers[0]
    room.gameState.roundWins[winner] =
      (room.gameState.roundWins[winner] || 0) + 1

    // Check if game is over (first to 3 wins)
    if (room.gameState.roundWins[winner] >= GAME_CONSTANTS.WINS_TO_END_GAME) {
      return { type: 'gameEnd', room, winner }
    }

    // Start new round
    room.gameState.roundNumber++
    room.gameState.activePlayers = [...room.gameState.players]
    room.gameState.currentPlayerIndex = 0
    room.gameState.usedLetters = []
    room.gameState.timeLeft = GAME_CONSTANTS.TURN_TIME
    room.gameState.isTimerRunning = false
    room.gameState.roundActive = true
    room.gameState.currentCategory = getRandomCategory()

    return { type: 'roundEnd', room }
  }

  // Cleanup old rooms
  cleanupRooms(): void {
    for (const [roomCode, room] of this.rooms.entries()) {
      if (shouldCleanupRoom(room)) {
        this.rooms.delete(roomCode)
        console.log(`Cleaned up room: ${roomCode}`)
      }
    }
  }

  // Future database integration points
  async saveRoom(room: Room): Promise<void> {
    // TODO: Save room state to database
    // await database.rooms.upsert(room);
  }

  async loadRoom(roomCode: string): Promise<Room | null> {
    // TODO: Load room from database
    // return await database.rooms.findOne({ roomCode });
    return this.rooms.get(roomCode) || null
  }

  async saveGameEvent(roomCode: string, event: any): Promise<void> {
    // TODO: Log game events for analytics/replay
    // await database.events.create({ roomCode, event, timestamp: Date.now() });
  }

  // Getters for WebSocket server
  getPlayerConnection(playerName: string): ExtendedWebSocket | undefined {
    return this.playerConnections.get(playerName)
  }

  setPlayerConnection(playerName: string, ws: ExtendedWebSocket): void {
    this.playerConnections.set(playerName, ws)
  }

  removePlayerConnection(playerName: string): void {
    this.playerConnections.delete(playerName)
  }
}
