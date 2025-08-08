import { Difficulty } from '../types';

export const LETTER_SETS: Record<Difficulty, readonly string[]> = {
  easy: [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'L',
    'M',
    'N',
    'O',
    'P',
    'R',
    'S',
    'T',
    'W',
  ], // 18 common letters - easier to find words
  hard: [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ], // All 26 letters - includes challenging letters like Q, X, Z
} as const;

export const CATEGORIES = [
  'Animals',
  'Foods',
  'Countries',
  'Movies',
  'Sports',
  'Colors',
  'Professions',
  'Things in a Kitchen',
  'School Subjects',
  'Board Games',
  'Fruits',
  'Vegetables',
  'Car Brands',
  'TV Shows',
  'Books',
  'Things You Wear',
  'Musical Instruments',
  'Things in Nature',
  'Superheroes',
  'Pizza Toppings',
  'Things in Space',
  'Board Game Mechanics',
  'Modes of Transportation',
  'Desserts',
  'Languages',
  'Hobbies',
  'Flowers',
] as const;

const getWebSocketUrl = (): string => {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }

  const { protocol: httpProtocol, hostname, port } = window.location;
  const wsProtocol = httpProtocol === 'https:' ? 'wss:' : 'ws:';

  // Development: Detect dev environment by localhost/127.0.0.1 or React dev server (port 3000)
  // When running on port 3000 (React dev server), WebSocket server runs on port 9191
  if (hostname === 'localhost' || hostname === '127.0.0.1' || port === '3000') {
    // Use localhost for local IPs, otherwise use the actual hostname for network access
    const devHost =
      hostname === 'localhost' || hostname === '127.0.0.1'
        ? 'localhost'
        : hostname;
    return `${wsProtocol}//${devHost}:9191`;
  }

  // Production: Use same host and port as HTTP (or default ports)
  const wsPort = port || (wsProtocol === 'wss:' ? '443' : '80');
  return `${wsProtocol}//${hostname}:${wsPort}`;
};

export const GAME_CONSTANTS = {
  TURN_TIME: 10, // seconds
  RECONNECT_DELAY: 3000, // milliseconds
  WS_URL: getWebSocketUrl(),
} as const;
