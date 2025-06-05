import { describe, it, expect, beforeEach } from '@jest/globals';
import { GameStateManager } from '../GameStateManager';
import { GAME_CONSTANTS } from '../../constants';
import { Room } from '../../types';

describe('GameStateManager', () => {
  let gameManager: GameStateManager;
  let room: Room;

  beforeEach(() => {
    gameManager = new GameStateManager();
    room = gameManager.createRoom('host');
  });
  afterEach(() => {
    gameManager.cleanup();
  });

  describe('Room Management', () => {
    it('should create a room with host', () => {
      expect(room.roomCode).toBeDefined();
      expect(room.players).toEqual(['host']);
      expect(room.host).toBe('host');
      expect(room.gameState.gameStarted).toBe(false);
    });

    it('should allow player to join room', () => {
      const joinedRoom = gameManager.joinRoom(room.roomCode, 'player1');
      expect(joinedRoom?.players).toContain('player1');
      expect(joinedRoom?.connectedPlayers).toContain('player1');
    });

    it('should remove player from room', () => {
      gameManager.joinRoom(room.roomCode, 'player1');
      const updatedRoom = gameManager.removePlayer(room.roomCode, 'player1');
      expect(updatedRoom?.connectedPlayers).not.toContain('player1');
      expect(updatedRoom?.players).toContain('player1'); // Player still in list
    });
  });

  describe('Game State Management', () => {
    beforeEach(() => {
      gameManager.joinRoom(room.roomCode, 'player1');
      gameManager.startGame(room.roomCode);
    });

    describe('Round Management', () => {
      it('should start a new round with fresh state', () => {
        // Simulate a round end
        const newRound = gameManager.endRound(room.roomCode);
        expect(newRound?.type).toBe('roundEnd');
        expect(newRound?.room.gameState.roundNumber).toBe(2);
        expect(newRound?.room.gameState.activePlayers).toEqual([
          'host',
          'player1',
        ]);
        expect(newRound?.room.gameState.usedLetters).toHaveLength(0);
        expect(newRound?.room.gameState.isTimerRunning).toBe(false);
      });

      it('should handle round wins correctly', () => {
        const result = gameManager.endRound(room.roomCode);
        expect(result?.type).toBe('roundEnd');
        expect(result?.room.gameState.roundWins['host']).toBe(1);
      });
    });

    describe('Timer Management', () => {
      it('should start turn with timer', () => {
        const turn = gameManager.startTurn(room.roomCode);
        expect(turn?.gameState.isTimerRunning).toBe(true);
        expect(turn?.gameState.timeLeft).toBe(GAME_CONSTANTS.TURN_TIME);
      });

      it('should not allow turn actions when timer is not running', () => {
        // End turn without starting it
        const turnResult = gameManager.endTurn(room.roomCode, 'A');
        expect(turnResult?.room.gameState.usedLetters).toHaveLength(0);
      });
    });

    describe('Player Elimination', () => {
      it('should handle last player standing correctly', () => {
        // Eliminate all players except host
        const result = gameManager.eliminatePlayer(room.roomCode);
        expect(result?.type).toBe('roundEnd');
        // After roundEnd, activePlayers is reset for the new round
        expect(result?.room.gameState.activePlayers).toEqual([
          'host',
          'player1',
        ]);
      });

      it('should handle multiple eliminations in one round', () => {
        gameManager.joinRoom(room.roomCode, 'player2');
        gameManager.startGame(room.roomCode); // Reset game state with 3 players

        // Eliminate first player
        const result1 = gameManager.eliminatePlayer(room.roomCode);
        expect(result1?.type).toBe('continue');
        expect(result1?.room.gameState.activePlayers).toHaveLength(2);

        // Eliminate second player
        const result2 = gameManager.eliminatePlayer(room.roomCode);
        expect(result2?.type).toBe('roundEnd');
        // After roundEnd, activePlayers is reset for the new round
        expect(result2?.room.gameState.activePlayers).toEqual([
          'host',
          'player1',
          'player2',
        ]);
      });
    });

    describe('Game End Conditions', () => {
      it('should end game when player wins required number of rounds', () => {
        // Simulate 3 wins for host
        for (let i = 0; i < 3; i++) {
          const result = gameManager.endRound(room.roomCode);
          if (i < 2) {
            expect(result?.type).toBe('roundEnd');
          } else {
            expect(result?.type).toBe('gameEnd');
            expect(result?.winner).toBe('host');
          }
        }
      });

      it('should not end game before required number of wins', () => {
        // Simulate 2 wins for host
        for (let i = 0; i < 2; i++) {
          const result = gameManager.endRound(room.roomCode);
          expect(result?.type).toBe('roundEnd');
          expect(result?.room.gameState.roundWins['host']).toBe(i + 1);
        }
      });
    });
  });

  describe('Player Connection Management', () => {
    it('should manage player connections', () => {
      const mockWs = {} as any;
      gameManager.setPlayerConnection('player1', mockWs);
      expect(gameManager.getPlayerConnection('player1')).toBe(mockWs);
      gameManager.removePlayerConnection('player1');
      expect(gameManager.getPlayerConnection('player1')).toBeUndefined();
    });
  });
});
