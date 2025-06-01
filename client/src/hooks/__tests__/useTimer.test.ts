import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../useTimer';
import { GAME_CONSTANTS } from '../../constants';

describe('useTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should call onTick when timer is running', () => {
    const onTick = jest.fn();
    const onTimeUp = jest.fn();

    renderHook(() =>
      useTimer({
        isRunning: true,
        timeLeft: 10,
        onTick,
        onTimeUp,
      })
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTick).toHaveBeenCalledWith(9);
  });

  it('should call onTimeUp when time reaches zero', () => {
    const onTick = jest.fn();
    const onTimeUp = jest.fn();

    renderHook(() =>
      useTimer({
        isRunning: true,
        timeLeft: 1,
        onTick,
        onTimeUp,
      })
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTick).toHaveBeenCalledWith(0);

    // Need to wait for the effect to run after time reaches zero
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(onTimeUp).toHaveBeenCalled();
  });

  it('should not call onTick when timer is not running', () => {
    const onTick = jest.fn();
    const onTimeUp = jest.fn();

    renderHook(() =>
      useTimer({
        isRunning: false,
        timeLeft: 10,
        onTick,
        onTimeUp,
      })
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTick).not.toHaveBeenCalled();
  });

  it('should clear timer on unmount', () => {
    const onTick = jest.fn();
    const onTimeUp = jest.fn();

    const { unmount } = renderHook(() =>
      useTimer({
        isRunning: true,
        timeLeft: 10,
        onTick,
        onTimeUp,
      })
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTick).not.toHaveBeenCalled();
  });

  it('should reset timer to initial time', () => {
    const onTick = jest.fn();
    const onTimeUp = jest.fn();

    const { result } = renderHook(() =>
      useTimer({
        isRunning: true,
        timeLeft: 5,
        onTick,
        onTimeUp,
      })
    );

    act(() => {
      result.current.resetTimer();
    });

    expect(onTick).toHaveBeenCalledWith(GAME_CONSTANTS.TURN_TIME);
  });

  it('should clear existing timer when resetting', () => {
    const onTick = jest.fn();
    const onTimeUp = jest.fn();

    const { result } = renderHook(() =>
      useTimer({
        isRunning: true,
        timeLeft: 5,
        onTick,
        onTimeUp,
      })
    );

    act(() => {
      jest.advanceTimersByTime(500); // Half a second
      result.current.resetTimer();
      jest.advanceTimersByTime(500); // Complete the second
    });

    // Should only be called once for the reset, not for the timer tick
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenCalledWith(GAME_CONSTANTS.TURN_TIME);
  });
});
