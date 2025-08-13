import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import KiaTereGame from '../KiaTereGame';

const mockSendMessage = jest.fn();
let capturedOnMessage: (msg: any) => void = () => {};

jest.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: ({ onMessage }: any) => {
    capturedOnMessage = onMessage;
    return {
      connectionStatus: 'connected',
      sendMessage: mockSendMessage,
      connect: jest.fn(),
    };
  },
}));

describe('KiaTereGame category refresh', () => {
  const baseGameState = {
    players: ['host'],
    activePlayers: ['host'],
    currentPlayerIndex: 0,
    roundWins: { host: 0 },
    currentCategory: 'Animals',
    usedLetters: [],
    usedCategories: [],
    timeLeft: 10,
    isTimerRunning: false,
    roundActive: true,
    roundNumber: 1,
    gameStarted: true,
    letterDifficulty: 'easy',
    categoryDifficulty: 'easy',
    isOvertimeRound: false,
    overtimeLevel: 0,
    answersRequired: 1,
  };

  beforeEach(() => {
    mockSendMessage.mockClear();
  });

  it('sends REFRESH_CATEGORY when host clicks refresh', () => {
    render(<KiaTereGame />);
    act(() => {
      capturedOnMessage({
        type: 'ROOM_CREATED',
        roomCode: 'ABC123',
        players: ['host'],
        connectedPlayers: ['host'],
      });
      capturedOnMessage({ type: 'GAME_STARTED', gameState: baseGameState });
    });

    const button = screen.getByTitle('Refresh category');
    fireEvent.click(button);

    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'REFRESH_CATEGORY' });
  });

  it('updates category on GAME_STATE_UPDATE', () => {
    render(<KiaTereGame />);
    act(() => {
      capturedOnMessage({
        type: 'ROOM_CREATED',
        roomCode: 'ABC123',
        players: ['host'],
        connectedPlayers: ['host'],
      });
      capturedOnMessage({ type: 'GAME_STARTED', gameState: baseGameState });
    });

    expect(screen.getByText('Animals')).toBeInTheDocument();

    act(() => {
      capturedOnMessage({
        type: 'GAME_STATE_UPDATE',
        gameState: { ...baseGameState, currentCategory: 'Food' },
      });
    });

    expect(screen.getByText('Food')).toBeInTheDocument();
  });
});
