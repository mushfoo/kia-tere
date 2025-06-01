import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import {
  generateRoomCode,
  createInitialGameState,
  shouldCleanupRoom,
  getRandomCategory,
} from '../roomUtils';
import { GAME_CONSTANTS, CATEGORIES } from '../../constants';
import { Room } from '../../types';

describe('Room Utilities', () => {
  describe('generateRoomCode', () => {
    it('should generate a room code of correct length', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(GAME_CONSTANTS.ROOM_CODE_LENGTH);
    });

    it('should only contain uppercase letters and numbers', () => {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 1000; i++) {
        codes.add(generateRoomCode());
      }
      // With 36 possible characters and 6 positions, we should get mostly unique codes
      expect(codes.size).toBeGreaterThan(900);
    });
  });

  describe('createInitialGameState', () => {
    it('should create initial game state with correct players', () => {
      const players = ['player1', 'player2'];
      const state = createInitialGameState(players);

      expect(state.players).toEqual(players);
      expect(state.activePlayers).toEqual(players);
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.roundWins).toEqual({ player1: 0, player2: 0 });
      expect(state.timeLeft).toBe(GAME_CONSTANTS.TURN_TIME);
      expect(state.isTimerRunning).toBe(false);
      expect(state.roundActive).toBe(false);
      expect(state.roundNumber).toBe(1);
      expect(state.gameStarted).toBe(false);
      expect(state.difficulty).toBe('easy');
      expect(state.usedLetters).toEqual([]);
    });

    it('should create a deep copy of players array', () => {
      const players = ['player1', 'player2'];
      const state = createInitialGameState(players);

      // Modifying the original array should not affect the state
      players.push('player3');
      expect(state.players).toEqual(['player1', 'player2']);
    });
  });

  describe('shouldCleanupRoom', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true when room is empty for too long', () => {
      const room: Room = {
        roomCode: 'TEST01',
        host: 'host',
        players: ['host'],
        connectedPlayers: ['host'],
        gameState: createInitialGameState(['host']),
        createdAt: Date.now(),
        lastActivity: Date.now(),
        emptyAt: Date.now() - GAME_CONSTANTS.EMPTY_ROOM_TIMEOUT - 1000,
      };

      expect(shouldCleanupRoom(room)).toBe(true);
    });

    it('should return true when room is inactive for too long', () => {
      const room: Room = {
        roomCode: 'TEST02',
        host: 'host',
        players: ['host'],
        connectedPlayers: ['host'],
        gameState: createInitialGameState(['host']),
        createdAt: Date.now(),
        lastActivity: Date.now() - GAME_CONSTANTS.ROOM_TIMEOUT - 1000,
      };

      expect(shouldCleanupRoom(room)).toBe(true);
    });

    it('should return false for active room', () => {
      const room: Room = {
        roomCode: 'TEST03',
        host: 'host',
        players: ['host'],
        connectedPlayers: ['host'],
        gameState: createInitialGameState(['host']),
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      expect(shouldCleanupRoom(room)).toBe(false);
    });

    it('should return false for recently emptied room', () => {
      const room: Room = {
        roomCode: 'TEST04',
        host: 'host',
        players: ['host'],
        connectedPlayers: ['host'],
        gameState: createInitialGameState(['host']),
        createdAt: Date.now(),
        lastActivity: Date.now(),
        emptyAt: Date.now() - GAME_CONSTANTS.EMPTY_ROOM_TIMEOUT + 60000, // 1 minute before timeout
      };

      expect(shouldCleanupRoom(room)).toBe(false);
    });
  });

  describe('getRandomCategory', () => {
    it('should return a valid category', () => {
      const category = getRandomCategory();
      expect(CATEGORIES).toContain(category);
    });

    it('should return different categories over multiple calls', () => {
      const categories = new Set();
      for (let i = 0; i < 100; i++) {
        categories.add(getRandomCategory());
      }
      // With 22 categories and 100 tries, we should get at least 10 different ones
      expect(categories.size).toBeGreaterThan(10);
    });
  });
});
