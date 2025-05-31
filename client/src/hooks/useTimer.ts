import { useEffect, useRef, useCallback } from 'react'
import { GAME_CONSTANTS } from '../constants'

interface UseTimerProps {
  isRunning: boolean
  timeLeft: number
  onTick: (newTime: number) => void
  onTimeUp: () => void
}

export function useTimer({
  isRunning,
  timeLeft,
  onTick,
  onTimeUp,
}: UseTimerProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        const newTime = timeLeft - 1
        onTick(newTime)
        if (newTime === 0) {
          onTimeUp()
        }
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      onTimeUp()
    }

    return clearTimer
  }, [timeLeft, isRunning, onTick, onTimeUp, clearTimer])

  const resetTimer = useCallback(() => {
    clearTimer()
    onTick(GAME_CONSTANTS.TURN_TIME)
  }, [clearTimer, onTick])

  return {
    resetTimer,
    clearTimer,
  }
}
