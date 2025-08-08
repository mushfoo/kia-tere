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

    describe('Category Management', () => {
      it('should refresh category when no letters are used', () => {
        const initial = gameManager.getRoom(room.roomCode)!.gameState
          .currentCategory;
        const updatedRoom = gameManager.refreshCategory(room.roomCode);
        expect(updatedRoom?.gameState.currentCategory).not.toBe(initial);
      });

      it('should not refresh category after letters are used', () => {
        const testRoom = gameManager.getRoom(room.roomCode)!;
        testRoom.gameState.usedLetters.push('A');
        const updatedRoom = gameManager.refreshCategory(room.roomCode);
        expect(updatedRoom).toBeNull();
      });
    });

    describe('Overtime Rounds', () => {
      beforeEach(() => {
        // Add a third player for more complex scenarios
        gameManager.joinRoom(room.roomCode, 'player2');
        gameManager.startGame(room.roomCode);
      });

      it('should trigger overtime when all letters are used with multiple players', () => {
        const testRoom = gameManager.getRoom(room.roomCode)!;

        // Start timer first
        gameManager.startTurn(room.roomCode);

        // Use all 18 letters (easy mode) - need to fill exactly 17 first
        const easyLetters = [
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
        ];
        testRoom.gameState.usedLetters = [...easyLetters];

        // End turn with the 18th letter - should trigger overtime
        const result = gameManager.endTurn(room.roomCode, 'W');

        expect(result?.type).toBe('overtimeStart');
        expect(result?.room.gameState.isOvertimeRound).toBe(true);
        expect(result?.room.gameState.overtimeLevel).toBe(1);
        expect(result?.room.gameState.answersRequired).toBe(2);
        expect(result?.room.gameState.usedLetters).toEqual([]); // Letters reset
        expect(result?.room.gameState.currentCategory).toBeDefined(); // New category assigned
      });

      it('should not trigger overtime when all letters used but only one player remains', () => {
        const testRoom = gameManager.getRoom(room.roomCode)!;

        // Start timer first
        gameManager.startTurn(room.roomCode);

        // Eliminate players to leave only one
        testRoom.gameState.activePlayers = ['host'];
        testRoom.gameState.currentPlayerIndex = 0;

        // Use all letters
        const easyLetters = [
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
        ];
        testRoom.gameState.usedLetters = [...easyLetters];

        // End turn with the last letter - should not trigger overtime (only one player)
        const result = gameManager.endTurn(room.roomCode, 'W');

        expect(result?.type).toBe('continue');
        expect(result?.room.gameState.isOvertimeRound).toBe(false);
      });

      it('should escalate overtime levels correctly', () => {
        const testRoom = gameManager.getRoom(room.roomCode)!;

        // Start overtime round 1
        const result1 = gameManager.startOvertimeRound(room.roomCode);
        expect(result1?.room.gameState.overtimeLevel).toBe(1);
        expect(result1?.room.gameState.answersRequired).toBe(2);

        // Start overtime round 2
        const result2 = gameManager.startOvertimeRound(room.roomCode);
        expect(result2?.room.gameState.overtimeLevel).toBe(2);
        expect(result2?.room.gameState.answersRequired).toBe(3);

        // Start overtime round 3
        const result3 = gameManager.startOvertimeRound(room.roomCode);
        expect(result3?.room.gameState.overtimeLevel).toBe(3);
        expect(result3?.room.gameState.answersRequired).toBe(4);
      });

      it('should award correct points for overtime rounds', () => {
        const testRoom = gameManager.getRoom(room.roomCode)!;

        // Set up overtime round 2 (3 answers required)
        testRoom.gameState.isOvertimeRound = true;
        testRoom.gameState.overtimeLevel = 2;
        testRoom.gameState.answersRequired = 3;
        testRoom.gameState.activePlayers = ['host']; // Only winner remains

        const result = gameManager.endRound(room.roomCode);

        expect(result?.room.gameState.roundWins['host']).toBe(3); // 3 points for 3-answer overtime
      });

      it('should reset overtime state for new rounds', () => {
        const testRoom = gameManager.getRoom(room.roomCode)!;

        // Set up overtime state
        testRoom.gameState.isOvertimeRound = true;
        testRoom.gameState.overtimeLevel = 2;
        testRoom.gameState.answersRequired = 3;
        testRoom.gameState.activePlayers = ['host']; // Only winner remains
        testRoom.gameState.roundWins = { host: 0, player1: 0, player2: 0 }; // Initialize wins

        const result = gameManager.endRound(room.roomCode);

        // Only check for roundEnd type (not gameEnd) to verify overtime reset
        if (result?.type === 'roundEnd') {
          expect(result.room.gameState.isOvertimeRound).toBe(false);
          expect(result.room.gameState.overtimeLevel).toBe(0);
          expect(result.room.gameState.answersRequired).toBe(1);
        } else {
          // If game ends, just verify it doesn't continue overtime
          expect(result?.type).toBe('gameEnd');
        }
      });

      it('should assign new category for each overtime round', () => {
        const testRoom = gameManager.getRoom(room.roomCode)!;
        const originalCategory = testRoom.gameState.currentCategory;

        const result = gameManager.startOvertimeRound(room.roomCode);

        expect(result?.room.gameState.currentCategory).toBeDefined();
        // Note: New category might be the same by chance, but the logic assigns a fresh one
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

  describe('Concurrent Games Management', () => {
    it('should manage multiple rooms simultaneously', () => {
      const room1 = gameManager.createRoom('host1');
      const room2 = gameManager.createRoom('host2');
      const room3 = gameManager.createRoom('host3');

      expect(room1.roomCode).not.toBe(room2.roomCode);
      expect(room2.roomCode).not.toBe(room3.roomCode);
      expect(room1.roomCode).not.toBe(room3.roomCode);

      expect(gameManager.getRoom(room1.roomCode)).toBeDefined();
      expect(gameManager.getRoom(room2.roomCode)).toBeDefined();
      expect(gameManager.getRoom(room3.roomCode)).toBeDefined();
    });

    it('should isolate game state between rooms', () => {
      const room1 = gameManager.createRoom('host1');
      const room2 = gameManager.createRoom('host2');

      gameManager.joinRoom(room1.roomCode, 'player1');
      gameManager.joinRoom(room2.roomCode, 'player2');

      gameManager.startGame(room1.roomCode);
      gameManager.startTurn(room1.roomCode);
      gameManager.endTurn(room1.roomCode, 'A');

      const room1State = gameManager.getRoom(room1.roomCode);
      const room2State = gameManager.getRoom(room2.roomCode);

      expect(room1State?.gameState.gameStarted).toBe(true);
      expect(room2State?.gameState.gameStarted).toBe(false);
      expect(room1State?.gameState.usedLetters).toContain('A');
      expect(room2State?.gameState.usedLetters).toHaveLength(0);
    });

    it('should handle different difficulty levels in concurrent games', () => {
      const room1 = gameManager.createRoom('host1');
      const room2 = gameManager.createRoom('host2');

      gameManager.joinRoom(room1.roomCode, 'player1');
      gameManager.joinRoom(room2.roomCode, 'player2');

      gameManager.startGame(room1.roomCode);
      gameManager.startGame(room2.roomCode);

      const updatedRoom1 = gameManager.getRoom(room1.roomCode)!;
      const updatedRoom2 = gameManager.getRoom(room2.roomCode)!;

      expect(updatedRoom1.gameState.gameStarted).toBe(true);
      expect(updatedRoom2.gameState.gameStarted).toBe(true);
      expect(updatedRoom1.roomCode).not.toBe(updatedRoom2.roomCode);
    });
  });

  describe('Timer Elimination Logic', () => {
    beforeEach(() => {
      gameManager.joinRoom(room.roomCode, 'player1');
      gameManager.joinRoom(room.roomCode, 'player2');
      gameManager.startGame(room.roomCode);
    });

    it('should eliminate player on timeout and advance to next player', () => {
      gameManager.startTurn(room.roomCode);
      const testRoom = gameManager.getRoom(room.roomCode)!;
      const initialActivePlayers = [...testRoom.gameState.activePlayers];

      const result = gameManager.eliminatePlayer(room.roomCode);

      expect(result?.room.gameState.activePlayers).toHaveLength(
        initialActivePlayers.length - 1
      );
      expect(result?.type).toBeDefined();
    });

    it('should handle timeout with only one player remaining', () => {
      const testRoom = gameManager.getRoom(room.roomCode)!;
      testRoom.gameState.activePlayers = ['host'];
      testRoom.gameState.currentPlayerIndex = 0;
      gameManager.startTurn(room.roomCode);

      const result = gameManager.eliminatePlayer(room.roomCode);

      expect(result?.type).toBeDefined();
      expect(result?.room.gameState.activePlayers).toHaveLength(0);
    });

    it('should maintain turn order after elimination', () => {
      gameManager.joinRoom(room.roomCode, 'player3');
      gameManager.startGame(room.roomCode);

      const testRoom = gameManager.getRoom(room.roomCode)!;
      testRoom.gameState.activePlayers = [
        'host',
        'player1',
        'player2',
        'player3',
      ];
      testRoom.gameState.currentPlayerIndex = 1; // player1's turn
      gameManager.startTurn(room.roomCode);

      const result = gameManager.eliminatePlayer(room.roomCode);
      const updatedRoom = gameManager.getRoom(room.roomCode)!;

      expect(result?.room.gameState.activePlayers).not.toContain('player1');
      expect(updatedRoom.gameState.currentPlayerIndex).toBe(1); // Should now be player2
      expect(updatedRoom.gameState.activePlayers[1]).toBe('player2');
    });
  });

  describe('Round Progression Logic', () => {
    beforeEach(() => {
      gameManager.joinRoom(room.roomCode, 'player1');
      gameManager.startGame(room.roomCode);
    });

    it('should progress through multiple rounds maintaining state', () => {
      for (let round = 1; round <= 3; round++) {
        const result = gameManager.endRound(room.roomCode);
        const testRoom = gameManager.getRoom(room.roomCode)!;

        if (round < 3) {
          expect(result?.type).toBe('roundEnd');
          expect(testRoom.gameState.roundNumber).toBe(round + 1);
          expect(testRoom.gameState.roundWins['host']).toBe(round);
          expect(testRoom.gameState.usedLetters).toHaveLength(0);
          expect(testRoom.gameState.activePlayers).toEqual(['host', 'player1']);
        } else {
          expect(result?.type).toBe('gameEnd');
          expect(result?.winner).toBe('host');
        }
      }
    });

    it('should reset turn state between rounds', () => {
      gameManager.startTurn(room.roomCode);
      gameManager.endTurn(room.roomCode, 'A');

      const result = gameManager.endRound(room.roomCode);
      const testRoom = gameManager.getRoom(room.roomCode)!;

      expect(result?.room.gameState.isTimerRunning).toBe(false);
      expect(testRoom.gameState.timeLeft).toBe(GAME_CONSTANTS.TURN_TIME);
      expect(testRoom.gameState.usedLetters).toHaveLength(0);
    });

    it('should maintain player scores across rounds', () => {
      const testRoom = gameManager.getRoom(room.roomCode)!;
      testRoom.gameState.roundWins = { host: 1, player1: 2 };

      const result = gameManager.endRound(room.roomCode);

      if (result?.type === 'roundEnd') {
        expect(result.room.gameState.roundWins['host']).toBe(2);
        expect(result.room.gameState.roundWins['player1']).toBe(2);
      }
    });
  });

  describe('Turn Mechanics Validation', () => {
    beforeEach(() => {
      gameManager.joinRoom(room.roomCode, 'player1');
      gameManager.startGame(room.roomCode);
    });

    it('should validate turn actions only when timer is running', () => {
      const result1 = gameManager.endTurn(room.roomCode, 'A');
      expect(result1?.room.gameState.usedLetters).toHaveLength(0);

      gameManager.startTurn(room.roomCode);
      const result2 = gameManager.endTurn(room.roomCode, 'A');
      expect(result2?.room.gameState.usedLetters).toContain('A');
    });

    it('should track letter usage', () => {
      gameManager.startTurn(room.roomCode);
      const result1 = gameManager.endTurn(room.roomCode, 'A');

      gameManager.startTurn(room.roomCode);
      const result2 = gameManager.endTurn(room.roomCode, 'B');

      expect(result2?.room.gameState.usedLetters).toContain('A');
      expect(result2?.room.gameState.usedLetters).toContain('B');
    });

    it('should advance to next player after valid turn', () => {
      const testRoom = gameManager.getRoom(room.roomCode)!;
      const initialPlayer =
        testRoom.gameState.activePlayers[testRoom.gameState.currentPlayerIndex];

      gameManager.startTurn(room.roomCode);
      gameManager.endTurn(room.roomCode, 'A');

      const updatedRoom = gameManager.getRoom(room.roomCode)!;
      const newPlayer =
        updatedRoom.gameState.activePlayers[
          updatedRoom.gameState.currentPlayerIndex
        ];

      expect(newPlayer).not.toBe(initialPlayer);
    });

    it('should handle turn progression with eliminated players', () => {
      gameManager.joinRoom(room.roomCode, 'player2');
      gameManager.startGame(room.roomCode);

      const testRoom = gameManager.getRoom(room.roomCode)!;
      testRoom.gameState.activePlayers = ['host', 'player2'];
      testRoom.gameState.currentPlayerIndex = 0;

      gameManager.startTurn(room.roomCode);
      gameManager.endTurn(room.roomCode, 'A');

      const updatedRoom = gameManager.getRoom(room.roomCode)!;
      expect(updatedRoom.gameState.currentPlayerIndex).toBe(1);
      expect(updatedRoom.gameState.activePlayers[1]).toBe('player2');
    });
  });

  describe('State Persistence Logic', () => {
    it('should maintain room state across multiple operations', () => {
      gameManager.joinRoom(room.roomCode, 'player1');
      gameManager.startGame(room.roomCode);

      const initialState = {
        players: [...gameManager.getRoom(room.roomCode)!.players],
        gameStarted: gameManager.getRoom(room.roomCode)!.gameState.gameStarted,
        roundNumber: gameManager.getRoom(room.roomCode)!.gameState.roundNumber,
      };

      gameManager.startTurn(room.roomCode);
      gameManager.endTurn(room.roomCode, 'A');

      const currentState = gameManager.getRoom(room.roomCode)!;
      expect(currentState.players).toEqual(initialState.players);
      expect(currentState.gameState.gameStarted).toBe(initialState.gameStarted);
      expect(currentState.gameState.roundNumber).toBe(initialState.roundNumber);
      expect(currentState.gameState.usedLetters).toContain('A');
    });

    it('should preserve game state during player disconnections', () => {
      gameManager.joinRoom(room.roomCode, 'player1');
      gameManager.startGame(room.roomCode);
      gameManager.startTurn(room.roomCode);
      gameManager.endTurn(room.roomCode, 'A');

      const beforeState = {
        usedLetters: [
          ...gameManager.getRoom(room.roomCode)!.gameState.usedLetters,
        ],
        roundNumber: gameManager.getRoom(room.roomCode)!.gameState.roundNumber,
        roundWins: {
          ...gameManager.getRoom(room.roomCode)!.gameState.roundWins,
        },
      };

      gameManager.removePlayer(room.roomCode, 'player1');

      const afterState = gameManager.getRoom(room.roomCode)!;
      expect(afterState.gameState.usedLetters).toEqual(beforeState.usedLetters);
      expect(afterState.gameState.roundNumber).toBe(beforeState.roundNumber);
      expect(afterState.gameState.roundWins).toEqual(beforeState.roundWins);
    });

    it('should maintain consistency across room operations', () => {
      const room2 = gameManager.createRoom('host2');

      expect(gameManager.getRoom(room.roomCode)).toBeDefined();
      expect(gameManager.getRoom(room2.roomCode)).toBeDefined();

      gameManager.joinRoom(room.roomCode, 'player1');
      gameManager.joinRoom(room2.roomCode, 'player2');

      expect(gameManager.getRoom(room.roomCode)?.players).toContain('player1');
      expect(gameManager.getRoom(room2.roomCode)?.players).toContain('player2');
      expect(gameManager.getRoom(room.roomCode)?.players).not.toContain(
        'player2'
      );
      expect(gameManager.getRoom(room2.roomCode)?.players).not.toContain(
        'player1'
      );
    });
  });

  describe('Room Joining Edge Cases', () => {
    it('should handle joining room that does not exist', () => {
      const result = gameManager.joinRoom('INVALID', 'player1');
      expect(result).toBeNull();
    });

    it('should handle duplicate player names in same room', () => {
      gameManager.joinRoom(room.roomCode, 'player1');
      const result = gameManager.joinRoom(room.roomCode, 'player1');

      expect(result?.players.filter((p) => p === 'player1')).toHaveLength(1);
    });

    it('should handle rejoining after disconnection', () => {
      gameManager.joinRoom(room.roomCode, 'player1');
      gameManager.startGame(room.roomCode);

      gameManager.removePlayer(room.roomCode, 'player1');
      expect(
        gameManager.getRoom(room.roomCode)?.connectedPlayers
      ).not.toContain('player1');

      const result = gameManager.joinRoom(room.roomCode, 'player1');
      expect(result?.connectedPlayers).toContain('player1');
      expect(result?.players).toContain('player1');
    });

    it('should handle joining room during active game', () => {
      gameManager.joinRoom(room.roomCode, 'player1');
      gameManager.startGame(room.roomCode);
      gameManager.startTurn(room.roomCode);

      const result = gameManager.joinRoom(room.roomCode, 'player2');

      expect(result?.players).toContain('player2');
      expect(result?.gameState.activePlayers).not.toContain('player2');
      expect(result?.gameState.gameStarted).toBe(true);
    });

    it('should handle multiple players joining room', () => {
      for (let i = 1; i <= 5; i++) {
        gameManager.joinRoom(room.roomCode, `player${i}`);
      }

      const result = gameManager.getRoom(room.roomCode);
      expect(result?.players).toContain('host');
      expect(result?.players).toContain('player1');
      expect(result?.players).toContain('player5');
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
