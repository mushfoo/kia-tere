import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionStatus, WebSocketMessage } from '../types';
import { GAME_CONSTANTS } from '../constants';

interface UseWebSocketProps {
  roomCode: string;
  playerName: string;
  onMessage: (message: WebSocketMessage) => void;
}

export function useWebSocket({
  roomCode,
  playerName,
  onMessage,
}: UseWebSocketProps) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback(
    (message: WebSocketMessage): void => {
      if (connectionStatus === 'connected') {
        wsRef.current!.send(JSON.stringify(message));
      }
    },
    [connectionStatus]
  );

  const connect = useCallback(() => {
    console.log('Attempting to connect to WebSocket:', GAME_CONSTANTS.WS_URL);
    wsRef.current = new WebSocket(GAME_CONSTANTS.WS_URL);
    setConnectionStatus('connecting');

    wsRef.current.onopen = () => {
      console.log('WebSocket connected successfully');
      setConnectionStatus('connected');
      if (roomCode) {
        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              roomCode,
              playerName,
            })
          );
        }
      }
    };

    wsRef.current.onmessage = (event: MessageEvent) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      onMessage(message);
    };

    wsRef.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setConnectionStatus('disconnected');
      // Attempt to reconnect after delay
      setTimeout(() => {
        if (roomCode) {
          connect();
        }
      }, GAME_CONSTANTS.RECONNECT_DELAY);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };
  }, [roomCode, playerName, onMessage]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    connectionStatus,
    sendMessage,
    connect,
  };
}
