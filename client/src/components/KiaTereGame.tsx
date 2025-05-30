import React, { useState, useEffect, useRef, useCallback } from 'react'
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
} from 'lucide-react'

// Types
interface WebSocketMessage {
  type: string
  [key: string]: any
}

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error'
type GamePhase = 'menu' | 'lobby' | 'playing' | 'gameOver'

const KiaTereGame: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GamePhase>('menu')
  const [isHost, setIsHost] = useState<boolean>(false)
  const [roomCode, setRoomCode] = useState<string>('')
  const [joinCode, setJoinCode] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [players, setPlayers] = useState<string[]>([])
  const [connectedPlayers, setConnectedPlayers] = useState<string[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0)
  const [roundWins, setRoundWins] = useState<Record<string, number>>({})
  const [currentCategory, setCurrentCategory] = useState<string>('')
  const [usedLetters, setUsedLetters] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState<number>(10)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const [roundActive, setRoundActive] = useState<boolean>(false)
  const [activePlayers, setActivePlayers] = useState<string[]>([])
  const [roundNumber, setRoundNumber] = useState<number>(1)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected')
  const [copySuccess, setCopySuccess] = useState<boolean>(false)

  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Letters arranged in a grid
  const letters: string[] = [
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
  ]

  const sendWebSocketMessage = (message: WebSocketMessage): void => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  const handleTimeUp = useCallback((): void => {
    if (activePlayers[currentPlayerIndex] === playerName) {
      sendWebSocketMessage({
        type: 'TIME_UP',
      })
    }
  }, [activePlayers, currentPlayerIndex, playerName])

  // WebSocket connection
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
        // Send timer update to other players
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'TIMER_UPDATE',
              timeLeft: timeLeft - 1,
            })
          )
        }
      }, 1000)
    } else if (timeLeft === 0 && isTimerRunning) {
      handleTimeUp()
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeLeft, isTimerRunning, handleTimeUp])

  const connectWebSocket = (): void => {
    // Replace with your WebSocket server URL
    const wsUrl = 'ws://10.0.0.3:9191'
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      setConnectionStatus('connected')
    }

    wsRef.current.onmessage = (event: MessageEvent) => {
      const message: WebSocketMessage = JSON.parse(event.data)
      handleWebSocketMessage(message)
    }

    wsRef.current.onclose = () => {
      setConnectionStatus('disconnected')
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (roomCode) {
          connectWebSocket()
          // Rejoin room after reconnection
          setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'JOIN_ROOM',
                  roomCode,
                  playerName,
                })
              )
            }
          }, 100)
        }
      }, 3000)
    }

    wsRef.current.onerror = () => {
      setConnectionStatus('error')
    }
  }

  const handleWebSocketMessage = (message: WebSocketMessage): void => {
    switch (message.type) {
      case 'ROOM_CREATED':
        setRoomCode(message.roomCode)
        setGameState('lobby')
        setIsHost(true)
        break

      case 'ROOM_JOINED':
        setRoomCode(message.roomCode)
        setGameState('lobby')
        setPlayers(message.players)
        setConnectedPlayers(message.connectedPlayers)
        break

      case 'PLAYER_JOINED':
        setPlayers(message.players)
        setConnectedPlayers(message.connectedPlayers)
        break

      case 'PLAYER_LEFT':
        setPlayers(message.players)
        setConnectedPlayers(message.connectedPlayers)
        break

      case 'GAME_STARTED':
        setGameState('playing')
        setPlayers(message.gameState.players)
        setActivePlayers(message.gameState.activePlayers)
        setCurrentPlayerIndex(message.gameState.currentPlayerIndex)
        setCurrentCategory(message.gameState.currentCategory)
        setUsedLetters(new Set(message.gameState.usedLetters))
        setRoundWins(message.gameState.roundWins)
        setRoundNumber(message.gameState.roundNumber)
        setTimeLeft(message.gameState.timeLeft)
        setIsTimerRunning(message.gameState.isTimerRunning)
        setRoundActive(message.gameState.roundActive)
        setSelectedLetter(null)
        break

      case 'GAME_STATE_UPDATE':
        setActivePlayers(message.gameState.activePlayers)
        setCurrentPlayerIndex(message.gameState.currentPlayerIndex)
        setUsedLetters(new Set(message.gameState.usedLetters))
        setTimeLeft(message.gameState.timeLeft)
        setIsTimerRunning(message.gameState.isTimerRunning)
        setSelectedLetter(null)
        break

      case 'TIMER_UPDATE':
        setTimeLeft(message.timeLeft)
        break

      case 'ROUND_END':
        setRoundWins(message.roundWins)
        setRoundNumber(message.roundNumber)
        setRoundActive(false)
        setIsTimerRunning(false)
        break

      case 'GAME_END':
        setGameState('gameOver')
        setRoundWins(message.roundWins)
        break

      case 'ERROR':
        alert(message.message)
        break
    }
  }

  const createRoom = (): void => {
    if (!playerName.trim()) return
    connectWebSocket()
    setTimeout(() => {
      sendWebSocketMessage({
        type: 'CREATE_ROOM',
        playerName: playerName.trim(),
      })
    }, 100)
  }

  const joinRoom = (): void => {
    if (!playerName.trim() || !joinCode.trim()) return
    connectWebSocket()
    setTimeout(() => {
      sendWebSocketMessage({
        type: 'JOIN_ROOM',
        roomCode: joinCode.trim().toUpperCase(),
        playerName: playerName.trim(),
      })
    }, 100)
  }

  const startGame = (): void => {
    if (!isHost) return
    sendWebSocketMessage({
      type: 'START_GAME',
    })
  }

  const handleLetterSelect = (letter: string): void => {
    if (!roundActive || usedLetters.has(letter) || !isTimerRunning) return
    if (activePlayers[currentPlayerIndex] !== playerName) return

    // Toggle letter selection
    const newSelectedLetter = selectedLetter === letter ? null : letter
    setSelectedLetter(newSelectedLetter)
  }

  const startTurn = (): void => {
    if (activePlayers[currentPlayerIndex] !== playerName) return
    sendWebSocketMessage({
      type: 'START_TURN',
    })
  }

  const endTurn = (): void => {
    if (!selectedLetter || activePlayers[currentPlayerIndex] !== playerName)
      return
    sendWebSocketMessage({
      type: 'END_TURN',
      selectedLetter,
    })
  }

  const resetGame = (): void => {
    setGameState('menu')
    setIsHost(false)
    setRoomCode('')
    setJoinCode('')
    setPlayers([])
    setConnectedPlayers([])
    setCurrentPlayerIndex(0)
    setRoundWins({})
    setUsedLetters(new Set())
    setSelectedLetter(null)
    setTimeLeft(10)
    setIsTimerRunning(false)
    setRoundActive(false)
    setActivePlayers([])
    setRoundNumber(1)
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  const copyRoomCode = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = roomCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  // Main Menu
  if (gameState === 'menu') {
    return (
      <div className='min-h-screen bg-slate-50 p-4'>
        <div className='max-w-md mx-auto bg-white rounded-2xl shadow-lg border p-6'>
          <div className='text-center mb-6'>
            <h1 className='text-3xl font-bold text-slate-800 mb-2'>Kia Tere</h1>
            <p className='text-slate-600'>Fast-paced multiplayer word game</p>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Your Name
              </label>
              <input
                type='text'
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
                placeholder='Enter your name'
                maxLength={20}
              />
            </div>

            <button
              onClick={createRoom}
              disabled={!playerName.trim() || connectionStatus === 'connecting'}
              className='w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors'>
              Create Room
            </button>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-slate-300' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-slate-500'>or</span>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Room Code
              </label>
              <input
                type='text'
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
                placeholder='Enter room code'
                maxLength={6}
              />
            </div>

            <button
              onClick={joinRoom}
              disabled={
                !playerName.trim() ||
                !joinCode.trim() ||
                connectionStatus === 'connecting'
              }
              className='w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors'>
              Join Room
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Lobby
  if (gameState === 'lobby') {
    return (
      <div className='min-h-screen bg-slate-50 p-4'>
        <div className='max-w-md mx-auto bg-white rounded-2xl shadow-lg border p-6'>
          <div className='text-center mb-6'>
            <h1 className='text-2xl font-bold text-slate-800 mb-2'>
              Game Lobby
            </h1>
            <div className='flex items-center justify-center gap-2 mb-4'>
              <span className='text-lg font-mono bg-slate-100 px-3 py-1 rounded'>
                {roomCode}
              </span>
              <button
                onClick={copyRoomCode}
                className='p-2 text-slate-600 hover:text-teal-600 transition-colors'
                title='Copy room code'>
                {copySuccess ? (
                  <Check className='w-4 h-4 text-green-600' />
                ) : (
                  <Copy className='w-4 h-4' />
                )}
              </button>
            </div>
            <div className='flex items-center justify-center gap-1 text-sm'>
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className='w-4 h-4 text-green-600' />
                  <span className='text-green-600'>Connected</span>
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <Wifi className='w-4 h-4 text-yellow-600' />
                  <span className='text-yellow-600'>Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className='w-4 h-4 text-red-600' />
                  <span className='text-red-600'>Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className='space-y-3 mb-6'>
            <div className='flex items-center gap-2 mb-2'>
              <Users className='w-5 h-5 text-slate-600' />
              <h2 className='text-lg font-semibold'>
                Players ({players.length})
              </h2>
            </div>

            {players.map((player, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                <span className='font-medium'>{player}</span>
                <div className='flex items-center gap-2'>
                  {player === playerName && (
                    <span className='text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded'>
                      You
                    </span>
                  )}
                  {index === 0 && (
                    <span className='text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded'>
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

          <div className='space-y-3'>
            {isHost && (
              <button
                onClick={startGame}
                disabled={
                  players.length < 2 || connectionStatus !== 'connected'
                }
                className='w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'>
                <Play className='w-5 h-5' />
                Start Game
              </button>
            )}

            <button
              onClick={resetGame}
              className='w-full py-2 bg-slate-500 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors'>
              Leave Room
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Game Over
  if (gameState === 'gameOver') {
    const winner = Object.entries(roundWins).find(([_, wins]) => wins >= 3)?.[0]
    return (
      <div className='min-h-screen bg-slate-50 p-4 flex items-center justify-center'>
        <div className='bg-white rounded-2xl shadow-lg border p-8 text-center max-w-md'>
          <Trophy className='w-16 h-16 text-amber-500 mx-auto mb-4' />
          <h1 className='text-3xl font-bold text-slate-800 mb-2'>Game Over!</h1>
          <h2 className='text-2xl font-semibold text-teal-600 mb-6'>
            {winner} Wins!
          </h2>

          <div className='space-y-2 mb-6'>
            {Object.entries(roundWins)
              .sort((a, b) => b[1] - a[1])
              .map(([player, wins]) => (
                <div key={player} className='flex justify-between items-center'>
                  <span className='font-medium'>{player}</span>
                  <span className='bg-teal-50 text-teal-800 px-2 py-1 rounded'>
                    {wins} wins
                  </span>
                </div>
              ))}
          </div>

          <button
            onClick={resetGame}
            className='w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2'>
            <RotateCcw className='w-5 h-5' />
            New Game
          </button>
        </div>
      </div>
    )
  }

  const currentPlayer = activePlayers[currentPlayerIndex]
  const isMyTurn = currentPlayer === playerName

  // Playing Game
  return (
    <div className='min-h-screen bg-slate-50 p-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-2xl shadow-lg border p-6 mb-6'>
          <div className='flex flex-wrap justify-between items-center gap-4'>
            <div className='flex items-center gap-4'>
              <h1 className='text-2xl font-bold text-slate-800'>Kia Tere</h1>
              <div className='flex items-center gap-2 text-sm text-slate-600'>
                <Target className='w-4 h-4' />
                Round {roundNumber}
              </div>
              <div className='flex items-center gap-1 text-sm'>
                {connectionStatus === 'connected' ? (
                  <Wifi className='w-4 h-4 text-green-600' />
                ) : (
                  <WifiOff className='w-4 h-4 text-red-600' />
                )}
                <span className='font-mono text-xs'>{roomCode}</span>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              {Object.entries(roundWins).map(([player, wins]) => (
                <div key={player} className='text-center'>
                  <div className='text-sm font-medium text-slate-600'>
                    {player}
                  </div>
                  <div className='text-lg font-bold text-teal-600'>
                    {wins}/3
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className='bg-white rounded-2xl shadow-lg border p-8'>
          {/* Category and Current Player */}
          <div className='text-center mb-8'>
            <div className='bg-cyan-50 rounded-xl p-4 mb-4 border'>
              <h2 className='text-xl font-bold text-slate-800 mb-2'>
                Category
              </h2>
              <p className='text-2xl font-bold text-cyan-600 bg-cyan-100 px-4 py-2 rounded-lg inline-block'>
                {currentCategory}
              </p>
            </div>

            {roundActive && (
              <div
                className={`rounded-xl p-4 border ${
                  isMyTurn ? 'bg-green-50 border-green-200' : 'bg-slate-50'
                }`}>
                <p className='text-lg font-semibold text-slate-800'>
                  {currentPlayer}'s Turn {isMyTurn && '(You)'}
                </p>
                <div className='flex items-center justify-center gap-2 mt-2'>
                  <Clock className='w-5 h-5 text-slate-600' />
                  <span
                    className={`text-2xl font-bold ${
                      timeLeft <= 3 ? 'text-red-600' : 'text-slate-800'
                    }`}>
                    {timeLeft}s
                  </span>
                </div>

                {selectedLetter && isMyTurn && (
                  <div className='mt-3 p-2 bg-teal-100 rounded-lg'>
                    <p className='text-sm text-teal-800'>
                      Selected:{' '}
                      <span className='font-bold text-lg'>
                        {selectedLetter}
                      </span>
                    </p>
                  </div>
                )}

                {isMyTurn && (
                  <div className='flex gap-2 mt-3'>
                    {!isTimerRunning ? (
                      <button
                        onClick={startTurn}
                        className='flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold'>
                        Start Turn
                      </button>
                    ) : (
                      <button
                        onClick={endTurn}
                        disabled={!selectedLetter}
                        className='flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold'>
                        End Turn
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Letter Grid */}
          <div className='max-w-2xl mx-auto mb-8'>
            <div className='grid grid-cols-6 gap-3 sm:gap-4'>
              {letters.map((letter) => {
                const isUsed = usedLetters.has(letter)
                const isSelected = selectedLetter === letter && isMyTurn

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
                    `}>
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className='text-center mt-8 text-slate-600'>
            <p className='mb-2'>
              1. Select/deselect letters to plan your word • 2. Say your word •
              3. Click "End Turn"
            </p>
            <p className='text-sm'>
              {isMyTurn ? "It's your turn!" : `Waiting for ${currentPlayer}...`}{' '}
              • 10 seconds per turn
            </p>
          </div>

          {/* Reset Button */}
          <div className='text-center mt-6'>
            <button
              onClick={resetGame}
              className='px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 mx-auto'>
              <RotateCcw className='w-4 h-4' />
              Leave Game
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KiaTereGame
