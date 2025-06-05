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
] as const;

const getWebSocketUrl = (): string => {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }

  // Auto-detect protocol based on current page
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;

  // Use localhost for development, current host for production
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'ws://localhost:9191';
  }

  // For combined service deployment, WebSocket is on same host and port
  return `${protocol}//${window.location.host}`;
};

export const GAME_CONSTANTS = {
  TURN_TIME: 10, // seconds
  RECONNECT_DELAY: 3000, // milliseconds
  WS_URL: getWebSocketUrl(),
} as const;
