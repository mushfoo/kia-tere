import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Menu } from '../Menu'

describe('Menu', () => {
  const mockProps = {
    onCreateRoom: jest.fn(),
    onJoinRoom: jest.fn(),
    onPlayerNameChange: jest.fn(),
    playerName: '',
    joinCode: '',
    isConnecting: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the menu with all elements', () => {
    render(<Menu {...mockProps} />)

    expect(screen.getByText('Kia Tere!')).toBeInTheDocument()
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Room Code (optional)')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Create Game')
  })

  it('handles player name input', () => {
    render(<Menu {...mockProps} />)

    const nameInput = screen.getByLabelText('Your Name')
    fireEvent.change(nameInput, { target: { value: 'TestPlayer' } })

    expect(mockProps.onPlayerNameChange).toHaveBeenCalledWith('TestPlayer')
  })

  it('handles room code input', () => {
    render(<Menu {...mockProps} />)

    const codeInput = screen.getByLabelText('Room Code (optional)')
    fireEvent.change(codeInput, { target: { value: 'abc123' } })

    expect(mockProps.onJoinRoom).toHaveBeenCalledWith('ABC123')
  })

  it('disables submit button when player name is empty', () => {
    render(<Menu {...mockProps} />)

    const submitButton = screen.getByRole('button')
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when player name is provided', () => {
    render(<Menu {...mockProps} playerName='TestPlayer' />)

    const submitButton = screen.getByRole('button')
    expect(submitButton).not.toBeDisabled()
  })

  it('shows "Join Game" when room code is provided', () => {
    render(<Menu {...mockProps} playerName='TestPlayer' joinCode='ABC123' />)

    const submitButton = screen.getByRole('button')
    expect(submitButton).toHaveTextContent('Join Game')
  })

  it('shows "Connecting..." when isConnecting is true', () => {
    render(<Menu {...mockProps} playerName='TestPlayer' isConnecting={true} />)

    const submitButton = screen.getByRole('button')
    expect(submitButton).toHaveTextContent('Connecting...')
    expect(submitButton).toBeDisabled()
  })

  it('calls onCreateRoom when submitting without room code', () => {
    render(<Menu {...mockProps} playerName='TestPlayer' />)

    const form = screen.getByRole('form')
    fireEvent.submit(form)

    expect(mockProps.onCreateRoom).toHaveBeenCalled()
    expect(mockProps.onJoinRoom).not.toHaveBeenCalled()
  })

  it('calls onJoinRoom when submitting with room code', () => {
    render(<Menu {...mockProps} playerName='TestPlayer' joinCode='ABC123' />)

    const form = screen.getByRole('form')
    fireEvent.submit(form)

    expect(mockProps.onJoinRoom).toHaveBeenCalledWith('ABC123')
    expect(mockProps.onCreateRoom).not.toHaveBeenCalled()
  })
})
