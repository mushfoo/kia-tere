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
  timeLeft: number;
  isTimerRunning: boolean;
  roundActive: boolean;
  roundNumber: number;
  gameStarted: boolean;
  difficulty: Difficulty;
  isOvertimeRound: boolean;
  overtimeLevel: number;
  answersRequired: number;
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

export interface MenuProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onPlayerNameChange: (name: string) => void;
  playerName: string;
  joinCode: string;
  isConnecting: boolean;
}

export interface LobbyProps {
  roomCode: string;
  players: string[];
  connectedPlayers: string[];
  isHost: boolean;
  onStartGame: () => void;
  onCopyCode: () => void;
  copySuccess: boolean;
  onDifficultyChange: (difficulty: Difficulty) => void;
  difficulty: Difficulty;
}

export interface GameBoardProps {
  currentCategory: string;
  usedLetters: Set<string>;
  timeLeft: number;
  isTimerRunning: boolean;
  currentPlayer: string;
  isCurrentPlayer: boolean;
  onLetterSelect: (letter: string) => void;
  letters: readonly string[];
  roundNumber: number;
  roundWins: Record<string, number>;
}
