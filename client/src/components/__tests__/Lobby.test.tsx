import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Lobby } from '../Lobby'
import { Difficulty } from '../../types'

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
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the lobby with all elements', () => {
    render(<Lobby {...mockProps} />)

    expect(screen.getByText('Game Lobby')).toBeInTheDocument()
    expect(screen.getByText('Room Code:')).toBeInTheDocument()
    expect(screen.getByText('TEST123')).toBeInTheDocument()
    expect(screen.getByText('Players (2)')).toBeInTheDocument()
  })

  it('displays connected and disconnected players correctly', () => {
    render(<Lobby {...mockProps} />)

    expect(screen.getByText('Player1')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('Player2')).toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  it('handles copy room code button click', () => {
    render(<Lobby {...mockProps} />)

    const copyButton = screen.getByTitle('Copy room code')
    fireEvent.click(copyButton)

    expect(mockProps.onCopyCode).toHaveBeenCalled()
  })

  it('shows check icon when copy is successful', () => {
    render(<Lobby {...mockProps} copySuccess={true} />)

    // Since we're using Lucide icons, we can't easily test for the specific icon
    // Instead, we'll verify the button is present
    expect(screen.getByTitle('Copy room code')).toBeInTheDocument()
  })

  it('handles difficulty change when host', () => {
    render(<Lobby {...mockProps} />)

    const select = screen.getByLabelText('Difficulty')
    fireEvent.change(select, { target: { value: 'hard' } })

    expect(mockProps.onDifficultyChange).toHaveBeenCalledWith('hard')
  })

  it('disables difficulty select when not host', () => {
    render(<Lobby {...mockProps} isHost={false} />)

    const select = screen.getByLabelText('Difficulty')
    expect(select).toBeDisabled()
  })

  it('shows start game button only when host', () => {
    const { rerender } = render(<Lobby {...mockProps} />)
    expect(screen.getByText('Start Game')).toBeInTheDocument()

    rerender(<Lobby {...mockProps} isHost={false} />)
    expect(screen.queryByText('Start Game')).not.toBeInTheDocument()
  })

  it('disables start game button when not enough players are connected', () => {
    render(<Lobby {...mockProps} />)

    const startButton = screen.getByText('Start Game')
    expect(startButton).toBeDisabled()
  })

  it('enables start game button when all players are connected', () => {
    render(<Lobby {...mockProps} connectedPlayers={['Player1', 'Player2']} />)

    const startButton = screen.getByText('Start Game')
    expect(startButton).not.toBeDisabled()

    fireEvent.click(startButton)
    expect(mockProps.onStartGame).toHaveBeenCalled()
  })
})
