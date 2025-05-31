import React from 'react'
import { MenuProps } from '../types'

export const Menu: React.FC<MenuProps> = ({
  onCreateRoom,
  onJoinRoom,
  onPlayerNameChange,
  playerName,
  joinCode,
  isConnecting,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode) {
      onJoinRoom(joinCode)
    } else {
      onCreateRoom()
    }
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
      <h1 className='text-4xl font-bold mb-8 text-indigo-600'>Kia Tere!</h1>
      <form
        role='form'
        onSubmit={handleSubmit}
        className='w-full max-w-md space-y-4'>
        <div>
          <label
            htmlFor='playerName'
            className='block text-sm font-medium text-gray-700'>
            Your Name
          </label>
          <input
            type='text'
            id='playerName'
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
            required
            minLength={2}
            maxLength={20}
            placeholder='Enter your name'
          />
        </div>
        <div>
          <label
            htmlFor='roomCode'
            className='block text-sm font-medium text-gray-700'>
            Room Code (optional)
          </label>
          <input
            type='text'
            id='roomCode'
            value={joinCode}
            onChange={(e) => onJoinRoom(e.target.value.toUpperCase())}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
            placeholder='Enter room code to join'
            maxLength={6}
          />
        </div>
        <button
          type='submit'
          disabled={!playerName || isConnecting}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            !playerName || isConnecting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}>
          {isConnecting
            ? 'Connecting...'
            : joinCode
            ? 'Join Game'
            : 'Create Game'}
        </button>
      </form>
    </div>
  )
}
