import { Room, GameState } from '../types';
import { GAME_CONSTANTS, CATEGORIES } from '../constants';

/**
 * Generates a random 6-character room code using uppercase letters and numbers.
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < GAME_CONSTANTS.ROOM_CODE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates the initial game state for a new game with the given players.
 */
export function createInitialGameState(
  players: string[],
  turnTime: number = GAME_CONSTANTS.TURN_TIME
): GameState {
  const roundWins: Record<string, number> = {};
  const playersCopy = [...players];
  playersCopy.forEach((player) => (roundWins[player] = 0));

  return {
    players: [...playersCopy],
    activePlayers: [...playersCopy],
    currentPlayerIndex: 0,
    roundWins,
    currentCategory: '',
    usedLetters: [],
    usedCategories: [],
    timeLeft: turnTime,
    isTimerRunning: false,
    roundActive: false,
    roundNumber: 1,
    gameStarted: false,
    difficulty: 'easy',
    isOvertimeRound: false,
    overtimeLevel: 0,
    answersRequired: 1,
    turnTime,
  };
}

/**
 * Checks if a room should be cleaned up based on its activity and empty status.
 */
export function shouldCleanupRoom(room: Room): boolean {
  const now = Date.now();
  return (
    (room.emptyAt && now - room.emptyAt > GAME_CONSTANTS.EMPTY_ROOM_TIMEOUT) ||
    now - room.lastActivity > GAME_CONSTANTS.ROOM_TIMEOUT
  );
}

/**
 * Returns a random category from the predefined list of categories,
 * excluding any categories that have already been used. If all
 * categories have been used, the full list is used again.
 */
export function getRandomCategory(usedCategories: string[] = []): string {
  const available = CATEGORIES.filter(
    (category) => !usedCategories.includes(category)
  );
  const source = available.length > 0 ? available : CATEGORIES;
  return source[Math.floor(Math.random() * source.length)];
}
