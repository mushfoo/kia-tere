export interface Player {
  name: string;
  isConnected: boolean;
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
  letterDifficulty: Difficulty;
  categoryDifficulty: Difficulty;
  isOvertimeRound: boolean;
  overtimeLevel: number;
  answersRequired: number;
  turnTime: number;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error';
export type GamePhase = 'menu' | 'lobby' | 'playing' | 'gameOver';
export type Difficulty = 'easy' | 'hard';

export interface GameProps {
  onGameEnd?: () => void;
}
