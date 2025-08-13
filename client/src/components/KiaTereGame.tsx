import React, { useState, useCallback, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Users,
  Trophy,
  Clock,
  Target,
  Wifi,
  WifiOff,
  Copy,
  Check,
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketMessage, GamePhase, Difficulty } from '../types';

// Letter difficulty constants based on frequency and word availability
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
} as const;

const KiaTereGame: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GamePhase>('menu');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [players, setPlayers] = useState<string[]>([]);
  const [connectedPlayers, setConnectedPlayers] = useState<string[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [roundWins, setRoundWins] = useState<Record<string, number>>({});
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [usedLetters, setUsedLetters] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [roundActive, setRoundActive] = useState<boolean>(false);
  const [activePlayers, setActivePlayers] = useState<string[]>([]);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [currentSelectedLetter, setCurrentSelectedLetter] = useState<
    string | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [turnTime, setTurnTime] = useState<number>(10);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isOvertimeRound, setIsOvertimeRound] = useState<boolean>(false);
  const [overtimeLevel, setOvertimeLevel] = useState<number>(0);
  const [answersRequired, setAnswersRequired] = useState<number>(1);

  // Letters arranged in a grid - now using difficulty-based sets
  const letters: readonly string[] = LETTER_SETS[difficulty];

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage): void => {
      switch (message.type) {
        case 'ROOM_CREATED':
          setRoomCode(message.roomCode);
          setGameState('lobby');
          setIsHost(true);
          setIsCreatingRoom(false);
          setPlayers(message.players);
          setConnectedPlayers(message.connectedPlayers);
          break;

        case 'ROOM_JOINED':
          setRoomCode(message.roomCode);
          setGameState('lobby');
          setPlayers(message.players);
          setConnectedPlayers(message.connectedPlayers);
          break;

        case 'PLAYER_JOINED':
          setPlayers(message.players);
          setConnectedPlayers(message.connectedPlayers);
          if (message.roundWins) {
            setRoundWins(message.roundWins);
          }
          break;

        case 'PLAYER_LEFT':
          setPlayers(message.players);
          setConnectedPlayers(message.connectedPlayers);
          if (message.roundWins) {
            setRoundWins(message.roundWins);
          }
          break;

        case 'PLAYER_DISCONNECTED':
          setPlayers(message.players);
          setConnectedPlayers(message.connectedPlayers);
          break;

        case 'GAME_STARTED':
          setGameState('playing');
          setPlayers(message.gameState.players);
          setActivePlayers(message.gameState.activePlayers);
          setCurrentPlayerIndex(message.gameState.currentPlayerIndex);
          setCurrentCategory(message.gameState.currentCategory);
          setUsedLetters(new Set(message.gameState.usedLetters));
          setRoundWins(message.gameState.roundWins);
          setRoundNumber(message.gameState.roundNumber);
          setTimeLeft(message.gameState.timeLeft);
          setIsTimerRunning(message.gameState.isTimerRunning);
          setRoundActive(message.gameState.roundActive);
          setDifficulty(message.gameState.difficulty || 'easy');
          setTurnTime(message.gameState.turnTime || 10);
          setIsOvertimeRound(message.gameState.isOvertimeRound || false);
          setOvertimeLevel(message.gameState.overtimeLevel || 0);
          setAnswersRequired(message.gameState.answersRequired || 1);
          setSelectedLetter(null);
          setCurrentSelectedLetter(null);
          break;

        case 'GAME_STATE_UPDATE':
          setActivePlayers(message.gameState.activePlayers);
          setCurrentPlayerIndex(message.gameState.currentPlayerIndex);
          setUsedLetters(new Set(message.gameState.usedLetters));
          setCurrentCategory(message.gameState.currentCategory);
          setTimeLeft(message.gameState.timeLeft);
          setIsTimerRunning(message.gameState.isTimerRunning);
          setTurnTime(message.gameState.turnTime || turnTime);
          setIsOvertimeRound(message.gameState.isOvertimeRound || false);
          setOvertimeLevel(message.gameState.overtimeLevel || 0);
          setAnswersRequired(message.gameState.answersRequired || 1);
          setSelectedLetter(null);
          setCurrentSelectedLetter(null);
          break;

        case 'TIMER_UPDATE':
          setTimeLeft(message.timeLeft);
          break;

        case 'OVERTIME_START':
          if (message.gameState) {
            setActivePlayers(message.gameState.activePlayers);
            setCurrentPlayerIndex(message.gameState.currentPlayerIndex);
            setUsedLetters(new Set(message.gameState.usedLetters));
            setCurrentCategory(message.gameState.currentCategory);
            setTimeLeft(message.gameState.timeLeft);
            setIsTimerRunning(message.gameState.isTimerRunning);
            setTurnTime(message.gameState.turnTime || turnTime);
            setRoundActive(message.gameState.roundActive);
            setIsOvertimeRound(message.gameState.isOvertimeRound);
            setOvertimeLevel(message.gameState.overtimeLevel);
            setAnswersRequired(message.gameState.answersRequired);
          }
          setSelectedLetter(null);
          setCurrentSelectedLetter(null);
          break;

        case 'ROUND_END':
          if (message.gameState) {
            setActivePlayers(message.gameState.activePlayers);
            setCurrentPlayerIndex(message.gameState.currentPlayerIndex);
            setUsedLetters(new Set(message.gameState.usedLetters));
            setCurrentCategory(message.gameState.currentCategory);
            setTimeLeft(message.gameState.timeLeft);
            setIsTimerRunning(message.gameState.isTimerRunning);
            setTurnTime(message.gameState.turnTime || turnTime);
            setRoundActive(message.gameState.roundActive);
            setIsOvertimeRound(message.gameState.isOvertimeRound || false);
            setOvertimeLevel(message.gameState.overtimeLevel || 0);
            setAnswersRequired(message.gameState.answersRequired || 1);
          }

          setRoundWins(message.roundWins);
          setRoundNumber(message.roundNumber);
          setSelectedLetter(null);
          setCurrentSelectedLetter(null);
          if (message.winner) {
            showToast(`${message.winner} won the round`);
          }
          break;

        case 'GAME_END':
          setGameState('gameOver');
          setRoundWins(message.roundWins);
          setCurrentSelectedLetter(null);
          break;

        case 'PLAYER_ELIMINATED':
          showToast(`${message.player} was eliminated`);
          break;

        case 'PLAYER_SELECTED_LETTER':
          setCurrentSelectedLetter(message.letter);
          break;

        case 'ERROR':
          alert(message.message);
          break;
      }
    },
    [turnTime]
  );

  const { connectionStatus, sendMessage, connect, disconnect } = useWebSocket({
    roomCode,
    playerName,
    onMessage: handleWebSocketMessage,
  });

  // Send CREATE_ROOM message when connection is established and we're creating a room
  useEffect(() => {
    if (connectionStatus === 'connected' && isCreatingRoom) {
      sendMessage({
        type: 'CREATE_ROOM',
        playerName: playerName.trim(),
      });
      setIsCreatingRoom(false);
    }
  }, [connectionStatus, isCreatingRoom, sendMessage, playerName]);

  // Send JOIN_ROOM message when connection is established and we have a join code
  useEffect(() => {
    if (
      connectionStatus === 'connected' &&
      roomCodeInput &&
      !roomCode &&
      !isCreatingRoom
    ) {
      sendMessage({
        type: 'JOIN_ROOM',
        roomCode: roomCodeInput,
        playerName: playerName.trim(),
      });
    }
  }, [
    connectionStatus,
    roomCodeInput,
    roomCode,
    isCreatingRoom,
    sendMessage,
    playerName,
  ]);

  const createRoom = (): void => {
    if (!playerName.trim()) return;
    setIsCreatingRoom(true);
    connect();
  };

  const joinRoom = (): void => {
    if (!playerName.trim() || !roomCodeInput.trim()) return;

    // Set joining state to trigger useEffect below
    setRoomCodeInput(roomCodeInput.trim().toUpperCase());
    connect();
  };

  const startGame = (): void => {
    if (!isHost) return;
    sendMessage({
      type: 'START_GAME',
      difficulty,
      turnTime,
    });
  };

  const handleLetterSelect = useCallback(
    (letter: string): void => {
      if (!roundActive || usedLetters.has(letter) || !isTimerRunning) return;
      if (activePlayers[currentPlayerIndex] !== playerName) return;

      const newSelectedLetter = selectedLetter === letter ? null : letter;
      setSelectedLetter(newSelectedLetter);
      sendMessage({
        type: 'PLAYER_SELECTED_LETTER',
        letter: newSelectedLetter,
      });
    },
    [
      roundActive,
      usedLetters,
      isTimerRunning,
      activePlayers,
      currentPlayerIndex,
      playerName,
      selectedLetter,
      sendMessage,
    ]
  );

  const startTurn = useCallback((): void => {
    if (activePlayers[currentPlayerIndex] !== playerName) return;
    sendMessage({
      type: 'START_TURN',
    });
  }, [activePlayers, currentPlayerIndex, playerName, sendMessage]);

  const endTurn = useCallback((): void => {
    if (!selectedLetter || activePlayers[currentPlayerIndex] !== playerName)
      return;
    sendMessage({
      type: 'END_TURN',
      selectedLetter,
    });
  }, [
    selectedLetter,
    activePlayers,
    currentPlayerIndex,
    playerName,
    sendMessage,
  ]);

  const refreshCategory = (): void => {
    if (!isHost) return;
    sendMessage({ type: 'REFRESH_CATEGORY' });
  };

  const resetGame = (): void => {
    disconnect();
    setGameState('menu');
    setIsHost(false);
    setRoomCode('');
    setRoomCodeInput('');
    setPlayers([]);
    setConnectedPlayers([]);
    setCurrentPlayerIndex(0);
    setRoundWins({});
    setUsedLetters(new Set());
    setSelectedLetter(null);
    setCurrentSelectedLetter(null);
    setToastMessage(null);
    setTimeLeft(10);
    setIsTimerRunning(false);
    setRoundActive(false);
    setActivePlayers([]);
    setRoundNumber(1);
    setDifficulty('easy');
    setTurnTime(10);
    setIsOvertimeRound(false);
    setOvertimeLevel(0);
    setAnswersRequired(1);
  };

  const copyRoomCode = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = roomCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const currentPlayer =
    activePlayers && activePlayers.length > 0
      ? activePlayers[currentPlayerIndex] || activePlayers[0]
      : players[0] || 'Unknown';
  const isMyTurn = currentPlayer === playerName && currentPlayer !== 'Unknown';

  useEffect(() => {
    if (gameState !== 'playing') return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName))
        return;
      const key = event.key.toUpperCase();
      if (letters.includes(key)) {
        handleLetterSelect(key);
      } else if (event.key === 'Enter' && isMyTurn) {
        if (!isTimerRunning) {
          startTurn();
        } else if (roundActive) {
          endTurn();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState,
    letters,
    handleLetterSelect,
    isMyTurn,
    roundActive,
    isTimerRunning,
    startTurn,
    endTurn,
  ]);

  // Main Menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Kia Tere</h1>
            <p className="text-slate-600">Fast-paced multiplayer word game</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>

            <button
              onClick={createRoom}
              disabled={!playerName.trim() || connectionStatus === 'connecting'}
              className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              data-testid="create-room-button"
            >
              Create Room
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter room code"
                maxLength={6}
              />
            </div>

            <button
              onClick={joinRoom}
              disabled={
                !playerName.trim() ||
                !roomCodeInput.trim() ||
                connectionStatus === 'connecting'
              }
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby
  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-50 p-4" data-testid="game-lobby">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Game Lobby
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span
                className="text-lg font-mono bg-slate-100 px-3 py-1 rounded"
                data-testid="room-code"
              >
                {roomCode}
              </span>
              <button
                onClick={copyRoomCode}
                className="p-2 text-slate-600 hover:text-teal-600 transition-colors"
                title="Copy room code"
              >
                {copySuccess ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1 text-sm">
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <Wifi className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-600">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold">
                Players ({players.length})
              </h2>
            </div>

            {players.map((player, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                data-testid={`player-${player}`}
              >
                <span
                  className="font-medium"
                  data-testid={`player-name-${player}`}
                >
                  {player}
                </span>
                <div className="flex items-center gap-2">
                  {player === playerName && (
                    <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">
                      You
                    </span>
                  )}
                  {index === 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      Host
                    </span>
                  )}
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectedPlayers.includes(player)
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {isHost && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDifficulty('easy')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        difficulty === 'easy'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Easy ({LETTER_SETS.easy.length} letters)
                    </button>
                    <button
                      onClick={() => setDifficulty('hard')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        difficulty === 'hard'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Hard ({LETTER_SETS.hard.length} letters)
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    {difficulty === 'easy'
                      ? 'Common letters only - easier to find words'
                      : 'All letters including Q, X, Z - more challenging'}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Turn Time (seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={turnTime}
                    onChange={(e) => setTurnTime(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="mt-2 text-xs text-slate-600">
                    5-60 seconds
                  </div>
                </div>

                <button
                  onClick={startGame}
                  disabled={
                    players.length < 2 || connectionStatus !== 'connected'
                  }
                  className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Game ({difficulty} mode)
                </button>
              </>
            )}

            {!isHost && (
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-600 mb-2">
                  Waiting for host to start the game
                </p>
                <p className="text-sm text-slate-500">
                  Difficulty:{' '}
                  <span className="font-semibold capitalize">{difficulty}</span>
                  ({LETTER_SETS[difficulty].length} letters)
                </p>
                <p className="text-sm text-slate-500">Turn Time: {turnTime}s</p>
              </div>
            )}

            <button
              onClick={resetGame}
              className="w-full py-2 bg-slate-500 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Over
  if (gameState === 'gameOver') {
    const winner = Object.entries(roundWins).find(
      ([_, wins]) => wins >= 3
    )?.[0];
    return (
      <div
        className="min-h-screen bg-slate-50 p-4 flex items-center justify-center"
        data-testid="game-over"
      >
        <div className="bg-white rounded-2xl shadow-lg border p-8 text-center max-w-md">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Game Over!</h1>
          <h2 className="text-2xl font-semibold text-teal-600 mb-6">
            {winner} Wins!
          </h2>

          <div className="space-y-2 mb-6">
            {Object.entries(roundWins)
              .sort((a, b) => b[1] - a[1])
              .map(([player, wins]) => (
                <div key={player} className="flex justify-between items-center">
                  <span className="font-medium">{player}</span>
                  <span className="bg-teal-50 text-teal-800 px-2 py-1 rounded">
                    {wins} wins
                  </span>
                </div>
              ))}
          </div>

          <button
            onClick={resetGame}
            className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            New Game
          </button>
        </div>
      </div>
    );
  }

  // Playing Game
  return (
    <div className="min-h-screen bg-slate-50 p-4" data-testid="game-playing">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow">
          {toastMessage}
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-800">Kia Tere</h1>
              <div
                className="flex items-center gap-2 text-sm text-slate-600"
                data-testid="round-indicator"
              >
                <Target className="w-4 h-4" />
                Round {roundNumber}
              </div>
              <div className="flex items-center gap-1 text-sm">
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <span className="font-mono text-xs">{roomCode}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {Object.entries(roundWins).map(([player, wins]) => (
                <div key={player} className="text-center">
                  <div className="text-sm font-medium text-slate-600">
                    {player}
                  </div>
                  <div className="text-lg font-bold text-teal-600">
                    {wins}/3
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-white rounded-2xl shadow-lg border p-8">
          {/* Category and Current Player */}
          <div className="text-center mb-8">
            <div
              className={`rounded-xl p-4 mb-4 border ${
                isOvertimeRound
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-cyan-50 border-cyan-200'
              }`}
            >
              {isOvertimeRound && (
                <div className="mb-3 p-2 bg-amber-100 rounded-lg border border-amber-300">
                  <h3 className="text-lg font-bold text-amber-800 mb-1">
                    🔥 OVERTIME ROUND {overtimeLevel}
                  </h3>
                  <p className="text-sm text-amber-700">
                    Name <span className="font-bold">{answersRequired}</span>{' '}
                    different answers using different letters!
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-slate-800">Category</h2>
                {isHost && (
                  <button
                    onClick={refreshCategory}
                    disabled={usedLetters.size > 0 || isTimerRunning}
                    className="p-1 rounded hover:text-teal-600 disabled:text-slate-400"
                    title="Refresh category"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p
                className={`text-2xl font-bold px-4 py-2 rounded-lg inline-block ${
                  isOvertimeRound
                    ? 'text-amber-600 bg-amber-100'
                    : 'text-cyan-600 bg-cyan-100'
                }`}
              >
                {currentCategory}
              </p>
              <div className="mt-2 text-sm text-slate-600">
                <span className="font-medium">Difficulty:</span>
                <span
                  className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${
                    difficulty === 'easy'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {difficulty.toUpperCase()} ({letters.length} letters)
                </span>
                {isOvertimeRound && (
                  <span className="ml-1 px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                    OVERTIME: {answersRequired} ANSWERS
                  </span>
                )}
              </div>
            </div>

            {activePlayers.length > 0 && (
              <div
                className={`rounded-xl p-4 border ${
                  isMyTurn ? 'bg-green-50 border-green-200' : 'bg-slate-50'
                }`}
              >
                <p className="text-lg font-semibold text-slate-800">
                  {currentPlayer}'s Turn {isMyTurn && '(You)'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <span
                    className={`text-2xl font-bold ${
                      timeLeft <= 3 ? 'text-red-600' : 'text-slate-800'
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>

                {selectedLetter && isMyTurn && (
                  <div className="mt-3 p-2 bg-teal-100 rounded-lg">
                    <p className="text-sm text-teal-800">
                      Selected:{' '}
                      <span className="font-bold text-lg">
                        {selectedLetter}
                      </span>
                    </p>
                  </div>
                )}

                {!isMyTurn && currentSelectedLetter && (
                  <div className="mt-3 p-2 bg-teal-100 rounded-lg">
                    <p className="text-sm text-teal-800">
                      Selected:{' '}
                      <span className="font-bold text-lg">
                        {currentSelectedLetter}
                      </span>
                    </p>
                  </div>
                )}

                {isMyTurn && (
                  <div className="flex gap-2 mt-3">
                    {!isTimerRunning ? (
                      <button
                        onClick={startTurn}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                      >
                        Start Turn
                      </button>
                    ) : (
                      <button
                        onClick={endTurn}
                        disabled={!selectedLetter}
                        className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold"
                      >
                        End Turn
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Letter Grid */}
          <div className="max-w-2xl mx-auto mb-8">
            <div
              className={`grid gap-3 sm:gap-4 ${
                letters.length <= 18 ? 'grid-cols-6' : 'grid-cols-6'
              }`}
            >
              {letters.map((letter) => {
                const isUsed = usedLetters.has(letter);
                const isSelected = selectedLetter === letter && isMyTurn;

                return (
                  <button
                    key={letter}
                    onClick={() => handleLetterSelect(letter)}
                    disabled={
                      isUsed || !roundActive || !isTimerRunning || !isMyTurn
                    }
                    className={`
                      aspect-square rounded-lg font-bold text-lg transition-all duration-200 border-2
                      ${
                        isUsed
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : isSelected
                            ? 'bg-amber-500 text-white border-amber-600 scale-105 shadow-lg'
                            : roundActive && isTimerRunning && isMyTurn
                              ? 'bg-teal-600 text-white border-teal-700 hover:bg-teal-700 hover:scale-105 cursor-pointer shadow-md'
                              : 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                      }
                    `}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center mt-8 text-slate-600">
            <p className="mb-2">
              1. Select/deselect letters with your keyboard or mouse • 2. Say
              your word • 3. Press Enter to start or end your turn
            </p>
            <p className="text-sm">
              {isMyTurn ? "It's your turn!" : `Waiting for ${currentPlayer}...`}{' '}
              • {turnTime} seconds per turn
            </p>
          </div>

          {/* Reset Button */}
          <div className="text-center mt-6">
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Leave Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KiaTereGame;
