import { Room, GameState } from '../types'
import { GAME_CONSTANTS, CATEGORIES } from '../constants'

/**
 * Generates a random 6-character room code using uppercase letters and numbers.
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < GAME_CONSTANTS.ROOM_CODE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Creates the initial game state for a new game with the given players.
 */
export function createInitialGameState(players: string[]): GameState {
  const roundWins: Record<string, number> = {}
  const playersCopy = [...players]
  playersCopy.forEach((player) => (roundWins[player] = 0))

  return {
    players: [...playersCopy],
    activePlayers: [...playersCopy],
    currentPlayerIndex: 0,
    roundWins,
    currentCategory: '',
    usedLetters: [],
    timeLeft: GAME_CONSTANTS.TURN_TIME,
    isTimerRunning: false,
    roundActive: false,
    roundNumber: 1,
    gameStarted: false,
    difficulty: 'easy',
  }
}

/**
 * Checks if a room should be cleaned up based on its activity and empty status.
 */
export function shouldCleanupRoom(room: Room): boolean {
  const now = Date.now()
  return (
    (room.emptyAt && now - room.emptyAt > GAME_CONSTANTS.EMPTY_ROOM_TIMEOUT) ||
    now - room.lastActivity > GAME_CONSTANTS.ROOM_TIMEOUT
  )
}

/**
 * Returns a random category from the predefined list of categories.
 */
export function getRandomCategory(): string {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
}
