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
    wsRef.current = new WebSocket(GAME_CONSTANTS.WS_URL);
    setConnectionStatus('connecting');

    wsRef.current.onopen = () => {
      setConnectionStatus('connected');
      if (roomCode) {
        sendMessage({
          type: 'JOIN_ROOM',
          roomCode,
          playerName,
        });
      }
    };

    wsRef.current.onmessage = (event: MessageEvent) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      onMessage(message);
    };

    wsRef.current.onclose = () => {
      setConnectionStatus('disconnected');
      // Attempt to reconnect after delay
      setTimeout(() => {
        if (roomCode) {
          connect();
        }
      }, GAME_CONSTANTS.RECONNECT_DELAY);
    };

    wsRef.current.onerror = () => {
      setConnectionStatus('error');
    };
  }, [roomCode, playerName, onMessage, sendMessage]);

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
