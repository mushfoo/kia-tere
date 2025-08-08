import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useWebSocket } from '../useWebSocket';
import { WebSocketMessage } from '../../types';
import { GAME_CONSTANTS } from '../../constants';

// Track the last created MockWebSocket instance
let lastMockWebSocket: any = null;

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0; // WebSocket.CONNECTING
  close = jest.fn();
  send = jest.fn();

  constructor(public url: string) {
    lastMockWebSocket = this;
    // Simulate connection after a small delay
    setTimeout(() => {
      this.readyState = 1; // WebSocket.OPEN
      if (this.onopen) this.onopen();
    }, 0);
  }
}

// Setup global WebSocket mock
global.WebSocket = MockWebSocket as any;

describe('useWebSocket', () => {
  const mockProps = {
    roomCode: 'TEST123',
    playerName: 'TestPlayer',
    onMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    lastMockWebSocket = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() => useWebSocket(mockProps));
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('should connect and update status', async () => {
    const { result } = renderHook(() => useWebSocket(mockProps));

    await act(async () => {
      result.current.connect();
    });

    expect(result.current.connectionStatus).toBe('connecting');

    // Wait for the connection to be established
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current.connectionStatus).toBe('connected');
  });

  it('should send message when connected', async () => {
    const { result } = renderHook(() => useWebSocket(mockProps));
    const testMessage: WebSocketMessage = { type: 'TEST' };

    await act(async () => {
      result.current.connect();
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await act(async () => {
      result.current.sendMessage(testMessage);
    });

    // Assert on the actual WebSocket instance used by the hook
    expect(lastMockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify(testMessage)
    );
  });

  it('should handle reconnection on close', async () => {
    const { result } = renderHook(() => useWebSocket(mockProps));

    await act(async () => {
      result.current.connect();
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    // Simulate close
    await act(async () => {
      if (lastMockWebSocket.onclose) lastMockWebSocket.onclose();
    });

    expect(result.current.connectionStatus).toBe('disconnected');

    // Fast-forward reconnection timer
    await act(async () => {
      jest.advanceTimersByTime(GAME_CONSTANTS.RECONNECT_DELAY);
    });

    // Should attempt to reconnect (new instance created)
    expect(lastMockWebSocket.url).toBe(GAME_CONSTANTS.WS_URL);
  });

  it('should send LEAVE_ROOM on disconnect', async () => {
    const { result } = renderHook(() => useWebSocket(mockProps));

    await act(async () => {
      result.current.connect();
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      result.current.disconnect();
    });

    expect(lastMockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'LEAVE_ROOM',
        roomCode: mockProps.roomCode,
        playerName: mockProps.playerName,
      })
    );
    expect(lastMockWebSocket.close).toHaveBeenCalled();
  });
});
