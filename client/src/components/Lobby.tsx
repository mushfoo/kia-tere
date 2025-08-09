import React from 'react';
import { Users, Copy, Check } from 'lucide-react';
import { LobbyProps, Difficulty } from '../types';

export const Lobby: React.FC<LobbyProps> = ({
  roomCode,
  players,
  connectedPlayers,
  isHost,
  onStartGame,
  onCopyCode,
  copySuccess,
  onDifficultyChange,
  difficulty,
  turnTime,
  onTurnTimeChange,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Game Lobby</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Room Code:</span>
            <code
              className="px-2 py-1 bg-gray-100 rounded"
              data-testid="room-code"
            >
              {roomCode}
            </code>
            <button
              onClick={onCopyCode}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Copy room code"
            >
              {copySuccess ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="flex items-center text-lg font-medium text-gray-700 mb-2">
            <Users size={20} className="mr-2" />
            Players ({players.length})
          </h3>
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player}
                className={`flex items-center justify-between p-2 rounded ${
                  connectedPlayers.includes(player)
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                <span>{player}</span>
                <span className="text-sm">
                  {connectedPlayers.includes(player)
                    ? 'Connected'
                    : 'Disconnected'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Game Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) =>
                  onDifficultyChange(e.target.value as Difficulty)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={!isHost}
              >
                <option value="easy">Easy (18 common letters)</option>
                <option value="hard">Hard (All 26 letters)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="turnTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Turn Time (seconds)
              </label>
              <input
                id="turnTime"
                type="number"
                min={5}
                max={60}
                value={turnTime}
                onChange={(e) => onTurnTimeChange(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={!isHost}
              />
            </div>
          </div>
        </div>

        {isHost && (
          <button
            onClick={onStartGame}
            disabled={
              players.length < 2 || players.length !== connectedPlayers.length
            }
            className={`w-full py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white ${
              players.length < 2 || players.length !== connectedPlayers.length
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
};
