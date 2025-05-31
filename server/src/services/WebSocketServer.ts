import WebSocket from 'ws'
import { createServer } from 'http'
import { ExtendedWebSocket, WebSocketMessage } from '../types'
import { GameStateManager } from './GameStateManager'

export class WebSocketServer {
  private port: number
  private gameManager: GameStateManager
  private server: any
  private wss: WebSocket.Server
  private cleanupInterval?: NodeJS.Timeout
  private roundTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor(port: number = 8080) {
    this.port = port
    this.gameManager = new GameStateManager()
    this.server = createServer()
    this.wss = new WebSocket.Server({ server: this.server })

    this.setupWebSocketHandlers()
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

  public handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage): void {
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

      // Clear any existing timeout for this room
      const existingTimeout = this.roundTimeouts.get(ws.roomCode!)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Start new round after delay
      const timeout = setTimeout(() => {
        this.broadcastToRoom(ws.roomCode!, {
          type: 'GAME_STARTED',
          gameState: result.room.gameState,
        })
        this.roundTimeouts.delete(ws.roomCode!)
      }, 3000)
      this.roundTimeouts.set(ws.roomCode!, timeout)
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

    // Only allow timer updates from the current player
    const currentPlayer =
      room.gameState.activePlayers[room.gameState.currentPlayerIndex]
    if (currentPlayer !== ws.playerName) return

    // Broadcast timer update to other players only
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

  public handleDisconnection(ws: ExtendedWebSocket): void {
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

  // Utility methods
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
    this.cleanupInterval = setInterval(() => {
      this.gameManager.cleanupRooms()
    }, 5 * 60 * 1000)
  }

  public stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }

  start(): void {
    this.server.listen(this.port, () => {
      console.log(`Kia Tere WebSocket server running on port ${this.port}`)
      console.log(`WebSocket URL: ws://localhost:${this.port}`)
      this.startCleanupInterval()
    })
  }

  public close(): void {
    // Clear all round timeouts
    for (const timeout of this.roundTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.roundTimeouts.clear()

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.wss.close()
    this.server.close()
  }

  // Added for testing
  public getRoom(roomCode: string) {
    return this.gameManager.getRoom(roomCode)
  }
}
