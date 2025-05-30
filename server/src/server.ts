import WebSocket from 'ws'
import { createServer } from 'http'

// Types
interface Room {
  roomCode: string
  players: string[]
  connectedPlayers: string[]
  host: string
  gameState: GameState
  createdAt: number
  lastActivity: number
  emptyAt?: number
}

interface GameState {
  players: string[]
  activePlayers: string[]
  currentPlayerIndex: number
  roundWins: Record<string, number>
  currentCategory: string
  usedLetters: string[]
  timeLeft: number
  isTimerRunning: boolean
  roundActive: boolean
  roundNumber: number
  gameStarted: boolean
  difficulty: 'easy' | 'hard'
}

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface ExtendedWebSocket extends WebSocket {
  roomCode?: string
  playerName?: string
}

type EliminationResult = {
  type: 'continue' | 'roundEnd' | 'gameEnd'
  room: Room
  winner?: string
}

// Letter difficulty constants
const LETTER_SETS = {
  easy: [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'L',
    'M',
    'N',
    'O',
    'P',
    'R',
    'S',
    'T',
    'W',
  ], // 18 common letters - easier to find words
  hard: [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ], // All 26 letters - includes challenging letters like Q, X, Z
} as const

// Game State Manager - Flexible for future database integration
class GameStateManager {
  private rooms: Map<string, Room> = new Map()
  private playerConnections: Map<string, ExtendedWebSocket> = new Map()

  // Room management
  createRoom(hostName: string): Room {
    const roomCode = this.generateRoomCode()
    const room: Room = {
      roomCode,
      players: [hostName],
      connectedPlayers: [hostName],
      host: hostName,
      gameState: this.createInitialGameState([hostName]),
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
  createInitialGameState(players: string[]): GameState {
    const roundWins: Record<string, number> = {}
    players.forEach((player) => (roundWins[player] = 0))

    return {
      players,
      activePlayers: [...players],
      currentPlayerIndex: 0,
      roundWins,
      currentCategory: '',
      usedLetters: [],
      timeLeft: 10,
      isTimerRunning: false,
      roundActive: false,
      roundNumber: 1,
      gameStarted: false,
      difficulty: 'easy',
    }
  }

  startGame(
    roomCode: string,
    difficulty: 'easy' | 'hard' = 'easy'
  ): Room | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    // Initialize game state
    room.gameState = this.createInitialGameState(room.players)
    room.gameState.gameStarted = true
    room.gameState.roundActive = true
    room.gameState.currentCategory = this.getRandomCategory()
    room.gameState.difficulty = difficulty

    return room
  }

  startTurn(roomCode: string): Room | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    room.gameState.isTimerRunning = true
    room.gameState.timeLeft = 10
    return room
  }

  endTurn(roomCode: string, selectedLetter: string): Room | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    // Add letter to used letters
    room.gameState.usedLetters.push(selectedLetter)

    // Move to next player
    room.gameState.currentPlayerIndex =
      (room.gameState.currentPlayerIndex + 1) %
      room.gameState.activePlayers.length
    room.gameState.timeLeft = 10
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
      (_, index) => index !== room.gameState.currentPlayerIndex
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

    // Continue with next player
    room.gameState.timeLeft = 10
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
    if (room.gameState.roundWins[winner] >= 3) {
      return { type: 'gameEnd', room, winner }
    }

    // Start new round
    room.gameState.roundNumber++
    room.gameState.activePlayers = [...room.gameState.players]
    room.gameState.currentPlayerIndex = 0
    room.gameState.usedLetters = []
    room.gameState.timeLeft = 10
    room.gameState.isTimerRunning = false
    room.gameState.roundActive = true
    room.gameState.currentCategory = this.getRandomCategory()

    return { type: 'roundEnd', room }
  }

  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  getRandomCategory(): string {
    const categories = [
      'Animals',
      'Foods',
      'Countries',
      'Movies',
      'Sports',
      'Colors',
      'Professions',
      'Things in a Kitchen',
      'School Subjects',
      'Board Games',
      'Fruits',
      'Vegetables',
      'Car Brands',
      'TV Shows',
      'Books',
      'Things You Wear',
      'Musical Instruments',
      'Things in Nature',
      'Superheroes',
      'Pizza Toppings',
      'Things in Space',
      'Board Game Mechanics',
    ]
    return categories[Math.floor(Math.random() * categories.length)]
  }

  cleanupRooms(): void {
    const now = Date.now()
    const ROOM_TIMEOUT = 30 * 60 * 1000 // 30 minutes
    const EMPTY_ROOM_TIMEOUT = 5 * 60 * 1000 // 5 minutes

    for (const [roomCode, room] of this.rooms.entries()) {
      // Remove rooms that have been empty for too long
      if (room.emptyAt && now - room.emptyAt > EMPTY_ROOM_TIMEOUT) {
        this.rooms.delete(roomCode)
        console.log(`Cleaned up empty room: ${roomCode}`)
      }
      // Remove very old rooms
      else if (now - room.lastActivity > ROOM_TIMEOUT) {
        this.rooms.delete(roomCode)
        console.log(`Cleaned up old room: ${roomCode}`)
      }
    }
  }

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

// WebSocket Server
class KiaTereServer {
  private port: number
  private gameManager: GameStateManager
  private server: any
  private wss: WebSocket.Server

  constructor(port: number = 8080) {
    this.port = port
    this.gameManager = new GameStateManager()
    this.server = createServer()
    this.wss = new WebSocket.Server({
      server: this.server,
      // Add CORS headers
      verifyClient: (info, callback) => {
        callback(true)
      },
    })

    this.setupWebSocketHandlers()
    this.startCleanupInterval()
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: ExtendedWebSocket) => {
      console.log('New WebSocket connection')

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString())
          this.handleMessage(ws, message)
        } catch (error) {
          console.error('Error parsing message:', error)
          this.sendError(ws, 'Invalid message format')
        }
      })

      ws.on('close', () => {
        this.handleDisconnection(ws)
      })

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error)
      })
    })
  }

  private handleMessage(
    ws: ExtendedWebSocket,
    message: WebSocketMessage
  ): void {
    switch (message.type) {
      case 'CREATE_ROOM':
        this.handleCreateRoom(ws, message)
        break
      case 'JOIN_ROOM':
        this.handleJoinRoom(ws, message)
        break
      case 'START_GAME':
        this.handleStartGame(ws, message)
        break
      case 'START_TURN':
        this.handleStartTurn(ws, message)
        break
      case 'END_TURN':
        this.handleEndTurn(ws, message)
        break
      case 'TIME_UP':
        this.handleTimeUp(ws, message)
        break
      case 'TIMER_UPDATE':
        this.handleTimerUpdate(ws, message)
        break
      case 'SET_DIFFICULTY':
        this.handleSetDifficulty(ws, message)
        break
      default:
        this.sendError(ws, 'Unknown message type')
    }
  }

  private handleCreateRoom(
    ws: ExtendedWebSocket,
    message: WebSocketMessage
  ): void {
    const room = this.gameManager.createRoom(message.playerName)
    ws.roomCode = room.roomCode
    ws.playerName = message.playerName

    this.gameManager.setPlayerConnection(message.playerName, ws)

    this.send(ws, {
      type: 'ROOM_CREATED',
      roomCode: room.roomCode,
    })

    console.log(`Room created: ${room.roomCode} by ${message.playerName}`)
  }

  private handleJoinRoom(
    ws: ExtendedWebSocket,
    message: WebSocketMessage
  ): void {
    const room = this.gameManager.joinRoom(message.roomCode, message.playerName)

    if (!room) {
      this.sendError(ws, 'Room not found')
      return
    }

    ws.roomCode = message.roomCode
    ws.playerName = message.playerName

    this.gameManager.setPlayerConnection(message.playerName, ws)

    // Send room state to joining player
    this.send(ws, {
      type: 'ROOM_JOINED',
      roomCode: room.roomCode,
      players: room.players,
      connectedPlayers: room.connectedPlayers,
    })

    // If game is in progress, send game state
    if (room.gameState.gameStarted) {
      this.send(ws, {
        type: 'GAME_STARTED',
        gameState: room.gameState,
      })
    }

    // Notify other players
    this.broadcastToRoom(
      room.roomCode,
      {
        type: 'PLAYER_JOINED',
        players: room.players,
        connectedPlayers: room.connectedPlayers,
      },
      message.playerName
    )

    console.log(`${message.playerName} joined room: ${message.roomCode}`)
  }

  private handleStartGame(
    ws: ExtendedWebSocket,
    message: WebSocketMessage
  ): void {
    const room = this.gameManager.getRoom(ws.roomCode!)
    if (!room || room.host !== ws.playerName) {
      this.sendError(ws, 'Not authorized to start game')
      return
    }

    if (room.players.length < 2) {
      this.sendError(ws, 'Need at least 2 players to start')
      return
    }

    const difficulty = message.difficulty || 'easy'
    this.gameManager.startGame(ws.roomCode!, difficulty)

    this.broadcastToRoom(ws.roomCode!, {
      type: 'GAME_STARTED',
      gameState: room.gameState,
    })

    console.log(
      `Game started in room: ${ws.roomCode} with ${difficulty} difficulty`
    )
  }

  private handleStartTurn(
    ws: ExtendedWebSocket,
    message: WebSocketMessage
  ): void {
    const room = this.gameManager.getRoom(ws.roomCode!)
    if (!room) return

    const currentPlayer =
      room.gameState.activePlayers[room.gameState.currentPlayerIndex]
    if (currentPlayer !== ws.playerName) {
      this.sendError(ws, 'Not your turn')
      return
    }

    this.gameManager.startTurn(ws.roomCode!)

    this.broadcastToRoom(ws.roomCode!, {
      type: 'GAME_STATE_UPDATE',
      gameState: room.gameState,
    })
  }

  private handleEndTurn(
    ws: ExtendedWebSocket,
    message: WebSocketMessage
  ): void {
    const room = this.gameManager.getRoom(ws.roomCode!)
    if (!room) return

    const currentPlayer =
      room.gameState.activePlayers[room.gameState.currentPlayerIndex]
    if (currentPlayer !== ws.playerName) {
      this.sendError(ws, 'Not your turn')
      return
    }

    this.gameManager.endTurn(ws.roomCode!, message.selectedLetter)

    this.broadcastToRoom(ws.roomCode!, {
      type: 'GAME_STATE_UPDATE',
      gameState: room.gameState,
    })
  }

  private handleTimeUp(ws: ExtendedWebSocket, message: WebSocketMessage): void {
    const room = this.gameManager.getRoom(ws.roomCode!)
    if (!room) return

    const currentPlayer =
      room.gameState.activePlayers[room.gameState.currentPlayerIndex]
    if (currentPlayer !== ws.playerName) return

    const result = this.gameManager.eliminatePlayer(ws.roomCode!)

    if (!result) return

    if (result.type === 'gameEnd') {
      this.broadcastToRoom(ws.roomCode!, {
        type: 'GAME_END',
        roundWins: result.room.gameState.roundWins,
        winner: result.winner,
      })
    } else if (result.type === 'roundEnd') {
      this.broadcastToRoom(ws.roomCode!, {
        type: 'ROUND_END',
        roundWins: result.room.gameState.roundWins,
        roundNumber: result.room.gameState.roundNumber,
      })

      // Start new round after delay
      setTimeout(() => {
        this.broadcastToRoom(ws.roomCode!, {
          type: 'GAME_STARTED',
          gameState: result.room.gameState,
        })
      }, 3000)
    } else {
      this.broadcastToRoom(ws.roomCode!, {
        type: 'GAME_STATE_UPDATE',
        gameState: result.room.gameState,
      })
    }
  }

  private handleTimerUpdate(
    ws: ExtendedWebSocket,
    message: WebSocketMessage
  ): void {
    const room = this.gameManager.getRoom(ws.roomCode!)
    if (!room) return

    // Broadcast timer update to other players
    this.broadcastToRoom(
      ws.roomCode!,
      {
        type: 'TIMER_UPDATE',
        timeLeft: message.timeLeft,
      },
      ws.playerName
    )
  }

  private handleSetDifficulty(
    ws: ExtendedWebSocket,
    message: WebSocketMessage
  ): void {
    const room = this.gameManager.getRoom(ws.roomCode!)
    if (!room || room.host !== ws.playerName) {
      this.sendError(ws, 'Not authorized to change difficulty')
      return
    }

    // Update difficulty in game state
    room.gameState.difficulty = message.difficulty

    // Broadcast the change to all players
    this.broadcastToRoom(ws.roomCode!, {
      type: 'GAME_STATE_UPDATE',
      gameState: room.gameState,
    })

    console.log(
      `Difficulty changed to ${message.difficulty} in room: ${ws.roomCode}`
    )
  }

  private handleDisconnection(ws: ExtendedWebSocket): void {
    if (ws.roomCode && ws.playerName) {
      const room = this.gameManager.removePlayer(ws.roomCode, ws.playerName)

      if (room) {
        this.broadcastToRoom(ws.roomCode, {
          type: 'PLAYER_LEFT',
          players: room.players,
          connectedPlayers: room.connectedPlayers,
        })
      }

      this.gameManager.removePlayerConnection(ws.playerName)
      console.log(`${ws.playerName} disconnected from room: ${ws.roomCode}`)
    }
  }

  private send(ws: ExtendedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private sendError(ws: ExtendedWebSocket, message: string): void {
    this.send(ws, {
      type: 'ERROR',
      message,
    })
  }

  private broadcastToRoom(
    roomCode: string,
    message: WebSocketMessage,
    excludePlayer?: string
  ): void {
    const room = this.gameManager.getRoom(roomCode)
    if (!room) return

    room.connectedPlayers.forEach((playerName) => {
      if (playerName !== excludePlayer) {
        const playerWs = this.gameManager.getPlayerConnection(playerName)
        if (playerWs) {
          this.send(playerWs, message)
        }
      }
    })
  }

  private startCleanupInterval(): void {
    // Clean up old rooms every 5 minutes
    setInterval(() => {
      this.gameManager.cleanupRooms()
    }, 5 * 60 * 1000)
  }

  start(): void {
    this.server.listen(this.port, () => {
      console.log(`Kia Tere WebSocket server running on port ${this.port}`)
      console.log(`WebSocket URL: ws://localhost:${this.port}`)
    })
  }
}

// Start the server
const server = new KiaTereServer(9191)
server.start()

export { KiaTereServer, GameStateManager }
