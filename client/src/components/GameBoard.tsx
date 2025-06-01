import React from 'react';
import { Clock, Trophy } from 'lucide-react';
import { GameBoardProps } from '../types';

export const GameBoard: React.FC<GameBoardProps> = ({
  currentCategory,
  usedLetters,
  timeLeft,
  isTimerRunning,
  currentPlayer,
  isCurrentPlayer,
  onLetterSelect,
  letters,
  roundNumber,
  roundWins,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Round {roundNumber}
            </h2>
            <p className="text-lg text-gray-600">Category: {currentCategory}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-700">
              <Trophy size={20} className="mr-2" />
              <div className="space-x-2">
                {Object.entries(roundWins).map(([player, wins]) => (
                  <span key={player} className="text-sm">
                    {player}: {wins}
                  </span>
                ))}
              </div>
            </div>
            <div
              className={`flex items-center ${
                timeLeft <= 3 ? 'text-red-600' : 'text-gray-700'
              }`}
              data-testid="timer-container"
            >
              <Clock size={20} className="mr-2" />
              <span className="text-lg font-medium">{timeLeft}s</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg text-gray-700">
              Current Player:{' '}
              <span className="font-medium">{currentPlayer}</span>
            </p>
            {isCurrentPlayer && (
              <p className="text-indigo-600 font-medium">It's your turn!</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          {letters.map((letter) => (
            <button
              key={letter}
              onClick={() => onLetterSelect(letter)}
              disabled={
                usedLetters.has(letter) || !isCurrentPlayer || !isTimerRunning
              }
              data-testid={`letter-button-${letter}`}
              className={`
                aspect-square flex items-center justify-center text-2xl font-bold rounded-lg
                ${
                  usedLetters.has(letter)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isCurrentPlayer && isTimerRunning
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {letter}
            </button>
          ))}
        </div>

        <div
          className="bg-gray-50 rounded-lg p-4"
          role="region"
          aria-label="Used Letters"
        >
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Used Letters
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(usedLetters).map((letter) => (
              <span
                key={letter}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded"
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
