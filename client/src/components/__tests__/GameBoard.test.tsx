import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { GameBoard } from '../GameBoard';

describe('GameBoard', () => {
  const mockProps = {
    currentCategory: 'Animals',
    usedLetters: new Set(['A', 'B']),
    timeLeft: 10,
    isTimerRunning: true,
    currentPlayer: 'Player1',
    isCurrentPlayer: true,
    onLetterSelect: jest.fn(),
    letters: ['A', 'B', 'C', 'D', 'E', 'F'] as const,
    roundNumber: 1,
    roundWins: {
      Player1: 2,
      Player2: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the game board with all elements', () => {
    render(<GameBoard {...mockProps} />);

    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Category: Animals')).toBeInTheDocument();
    expect(screen.getByText(/Current Player:/)).toBeInTheDocument();
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText("It's your turn!")).toBeInTheDocument();
  });

  it('displays round wins correctly', () => {
    render(<GameBoard {...mockProps} />);

    expect(screen.getByText('Player1: 2')).toBeInTheDocument();
    expect(screen.getByText('Player2: 1')).toBeInTheDocument();
  });

  it('displays timer with correct color based on time left', () => {
    const { rerender } = render(<GameBoard {...mockProps} />);
    const timerContainer = screen.getByTestId('timer-container');
    expect(timerContainer).toHaveClass('text-gray-700');
    expect(within(timerContainer).getByText('10s')).toBeInTheDocument();

    rerender(<GameBoard {...mockProps} timeLeft={3} />);
    expect(timerContainer).toHaveClass('text-red-600');
    expect(within(timerContainer).getByText('3s')).toBeInTheDocument();
  });

  it('handles letter selection correctly', () => {
    render(<GameBoard {...mockProps} />);

    const letterButton = screen.getByTestId('letter-button-C');
    fireEvent.click(letterButton);

    expect(mockProps.onLetterSelect).toHaveBeenCalledWith('C');
  });

  it('disables used letters', () => {
    render(<GameBoard {...mockProps} />);

    const usedLetterA = screen.getByTestId('letter-button-A');
    const usedLetterB = screen.getByTestId('letter-button-B');

    expect(usedLetterA).toBeDisabled();
    expect(usedLetterB).toBeDisabled();
    expect(usedLetterA).toHaveClass('bg-gray-200');
    expect(usedLetterB).toHaveClass('bg-gray-200');
  });

  it('disables all letters when not current player', () => {
    render(<GameBoard {...mockProps} isCurrentPlayer={false} />);

    mockProps.letters.forEach((letter) => {
      expect(screen.getByTestId(`letter-button-${letter}`)).toBeDisabled();
    });
  });

  it('disables all letters when timer is not running', () => {
    render(<GameBoard {...mockProps} isTimerRunning={false} />);

    mockProps.letters.forEach((letter) => {
      expect(screen.getByTestId(`letter-button-${letter}`)).toBeDisabled();
    });
  });

  it('displays used letters section', () => {
    render(<GameBoard {...mockProps} />);

    expect(screen.getByText('Used Letters')).toBeInTheDocument();
    const usedLettersSection = screen.getByRole('region', {
      name: /used letters/i,
    });
    expect(within(usedLettersSection).getByText('A')).toBeInTheDocument();
    expect(within(usedLettersSection).getByText('B')).toBeInTheDocument();
  });

  it('hides "It\'s your turn!" message when not current player', () => {
    render(<GameBoard {...mockProps} isCurrentPlayer={false} />);

    expect(screen.queryByText("It's your turn!")).not.toBeInTheDocument();
  });
});
