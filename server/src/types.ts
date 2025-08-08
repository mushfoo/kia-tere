import WebSocket from 'ws';

export interface Room {
  roomCode: string;
  players: string[];
  connectedPlayers: string[];
  host: string;
  gameState: GameState;
  createdAt: number;
  lastActivity: number;
  emptyAt?: number;
}

export interface GameState {
  players: string[];
  activePlayers: string[];
  currentPlayerIndex: number;
  roundWins: Record<string, number>;
  currentCategory: string;
  usedLetters: string[];
  usedCategories: string[];
  timeLeft: number;
  isTimerRunning: boolean;
  roundActive: boolean;
  roundNumber: number;
  gameStarted: boolean;
  difficulty: 'easy' | 'hard';
  isOvertimeRound: boolean;
  overtimeLevel: number;
  answersRequired: number;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface ExtendedWebSocket extends WebSocket {
  roomCode?: string;
  playerName?: string;
  messages?: WebSocketMessage[]; // For testing purposes
}

export type EliminationResult = {
  type: 'continue' | 'roundEnd' | 'gameEnd' | 'overtimeStart';
  room: Room;
  winner?: string;
};

export type Difficulty = 'easy' | 'hard';
