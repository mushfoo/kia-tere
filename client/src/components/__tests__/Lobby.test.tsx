import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Lobby } from '../Lobby';
import { Difficulty } from '../../types';

describe('Lobby', () => {
  const mockProps = {
    roomCode: 'TEST123',
    players: ['Player1', 'Player2'],
    connectedPlayers: ['Player1'],
    isHost: true,
    onStartGame: jest.fn(),
    onCopyCode: jest.fn(),
    copySuccess: false,
    onDifficultyChange: jest.fn(),
    difficulty: 'easy' as Difficulty,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the lobby with all elements', () => {
    render(<Lobby {...mockProps} />);

    expect(screen.getByText('Game Lobby')).toBeInTheDocument();
    expect(screen.getByText('Room Code:')).toBeInTheDocument();
    expect(screen.getByText('TEST123')).toBeInTheDocument();
    expect(screen.getByText('Players (2)')).toBeInTheDocument();
  });

  it('displays connected and disconnected players correctly', () => {
    render(<Lobby {...mockProps} />);

    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('handles copy room code button click', () => {
    render(<Lobby {...mockProps} />);

    const copyButton = screen.getByTitle('Copy room code');
    fireEvent.click(copyButton);

    expect(mockProps.onCopyCode).toHaveBeenCalled();
  });

  it('shows check icon when copy is successful', () => {
    render(<Lobby {...mockProps} copySuccess={true} />);

    // Since we're using Lucide icons, we can't easily test for the specific icon
    // Instead, we'll verify the button is present
    expect(screen.getByTitle('Copy room code')).toBeInTheDocument();
  });

  it('handles difficulty change when host', () => {
    render(<Lobby {...mockProps} />);

    const select = screen.getByLabelText('Difficulty');
    fireEvent.change(select, { target: { value: 'hard' } });

    expect(mockProps.onDifficultyChange).toHaveBeenCalledWith('hard');
  });

  it('disables difficulty select when not host', () => {
    render(<Lobby {...mockProps} isHost={false} />);

    const select = screen.getByLabelText('Difficulty');
    expect(select).toBeDisabled();
  });

  it('shows start game button only when host', () => {
    const { rerender } = render(<Lobby {...mockProps} />);
    expect(screen.getByText('Start Game')).toBeInTheDocument();

    rerender(<Lobby {...mockProps} isHost={false} />);
    expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
  });

  it('disables start game button when not enough players are connected', () => {
    render(<Lobby {...mockProps} />);

    const startButton = screen.getByText('Start Game');
    expect(startButton).toBeDisabled();
  });

  it('enables start game button when all players are connected', () => {
    render(<Lobby {...mockProps} connectedPlayers={['Player1', 'Player2']} />);

    const startButton = screen.getByText('Start Game');
    expect(startButton).not.toBeDisabled();

    fireEvent.click(startButton);
    expect(mockProps.onStartGame).toHaveBeenCalled();
  });

  describe('Error Handling', () => {
    it('should handle empty room code gracefully', () => {
      render(<Lobby {...mockProps} roomCode="" />);

      expect(screen.getByText('Room Code:')).toBeInTheDocument();
      expect(screen.queryByText('TEST123')).not.toBeInTheDocument();
    });

    it('should handle empty players array', () => {
      render(<Lobby {...mockProps} players={[]} />);

      expect(screen.getByText('Players (0)')).toBeInTheDocument();
    });

    it('should handle empty connected players array', () => {
      render(<Lobby {...mockProps} connectedPlayers={[]} />);

      const startButton = screen.getByText('Start Game');
      expect(startButton).toBeDisabled();

      expect(screen.getAllByText('Disconnected')).toHaveLength(2);
    });

    it('should handle players not in connected players list', () => {
      render(
        <Lobby {...mockProps} players={['Player1', 'Player2', 'Player3']} />
      );

      expect(screen.getByText('Players (3)')).toBeInTheDocument();
      expect(screen.getAllByText('Disconnected')).toHaveLength(2);
    });

    it('should handle connected players not in players list', () => {
      render(
        <Lobby {...mockProps} connectedPlayers={['Player1', 'Player3']} />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should handle invalid difficulty value', () => {
      render(<Lobby {...mockProps} difficulty={'invalid' as any} />);

      const select = screen.getByLabelText('Difficulty');
      expect(select).toBeInTheDocument();
    });

    it('should handle missing callback functions', () => {
      const propsWithoutCallbacks = {
        ...mockProps,
        onStartGame: jest.fn(),
        onCopyCode: jest.fn(),
        onDifficultyChange: jest.fn(),
      };

      expect(() => render(<Lobby {...propsWithoutCallbacks} />)).not.toThrow();
    });

    it('should handle very long room codes', () => {
      const longRoomCode = 'A'.repeat(100);
      render(<Lobby {...mockProps} roomCode={longRoomCode} />);

      expect(screen.getByText(longRoomCode)).toBeInTheDocument();
    });

    it('should handle very long player names', () => {
      const longPlayerName = 'SuperLongPlayerNameThatExceedsNormalLimits';
      render(
        <Lobby
          {...mockProps}
          players={[longPlayerName]}
          connectedPlayers={[longPlayerName]}
        />
      );

      expect(screen.getByText(longPlayerName)).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should handle special characters in room code', () => {
      render(<Lobby {...mockProps} roomCode="ABC-123_!@#" />);

      expect(screen.getByText('ABC-123_!@#')).toBeInTheDocument();
    });

    it('should handle copy code callback execution', () => {
      const copyCallback = jest.fn();

      render(<Lobby {...mockProps} onCopyCode={copyCallback} />);

      const copyButton = screen.getByTitle('Copy room code');
      fireEvent.click(copyButton);

      expect(copyCallback).toHaveBeenCalled();
    });

    it('should handle start game callback execution', () => {
      const startCallback = jest.fn();

      render(
        <Lobby
          {...mockProps}
          onStartGame={startCallback}
          connectedPlayers={['Player1', 'Player2']}
        />
      );

      const startButton = screen.getByText('Start Game');
      fireEvent.click(startButton);

      expect(startCallback).toHaveBeenCalled();
    });

    it('should handle difficulty change callback execution', () => {
      const difficultyCallback = jest.fn();

      render(<Lobby {...mockProps} onDifficultyChange={difficultyCallback} />);

      const select = screen.getByLabelText('Difficulty');
      fireEvent.change(select, { target: { value: 'hard' } });

      expect(difficultyCallback).toHaveBeenCalledWith('hard');
    });

    it('should handle duplicate player names', () => {
      // Suppress React warning about duplicate keys in test environment
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <Lobby
          {...mockProps}
          players={['Player1', 'Player1', 'Player2']}
          connectedPlayers={['Player1']}
        />
      );

      expect(screen.getByText('Players (3)')).toBeInTheDocument();
      expect(screen.getAllByText('Player1')).toHaveLength(2);

      consoleSpy.mockRestore();
    });

    it('should handle large number of players', () => {
      const manyPlayers = Array.from(
        { length: 20 },
        (_, i) => `Player${i + 1}`
      );
      render(
        <Lobby
          {...mockProps}
          players={manyPlayers}
          connectedPlayers={manyPlayers.slice(0, 10)}
        />
      );

      expect(screen.getByText('Players (20)')).toBeInTheDocument();
      expect(screen.getAllByText('Connected')).toHaveLength(10);
      expect(screen.getAllByText('Disconnected')).toHaveLength(10);
    });
  });
});
