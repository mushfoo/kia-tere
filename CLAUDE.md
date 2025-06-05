# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Level Commands
- `npm run check` - Run linting and formatting checks for both client and server
- `npm run fix` - Fix linting and formatting issues for both client and server

### Client Development (React + TypeScript)
```bash
cd client
npm start          # Start development server (localhost:3000)
npm run build      # Build for production
npm test           # Run Jest tests
npm run test       # Run tests in watch mode
npm run lint:check # Check ESLint rules
npm run lint:fix   # Fix ESLint issues
npm run format:check # Check Prettier formatting
npm run format:fix # Fix Prettier formatting
```

### Server Development (Node.js + WebSocket + TypeScript)
```bash
cd server
npm run dev        # Start development server with ts-node-dev
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled server from dist/
npm test           # Run Jest tests
npm run test:watch # Run tests in watch mode
npm run lint:check # Check ESLint rules
npm run lint:fix   # Fix ESLint issues
npm run format:check # Check Prettier formatting
npm run format:fix # Fix Prettier formatting
```

## Architecture Overview

### Monorepo Structure
- **Root**: Workspace configuration with shared TypeScript and linting setup
- **Client**: React application with TypeScript, Tailwind CSS, and WebSocket client
- **Server**: Node.js WebSocket server with TypeScript and Jest testing

### Core Game Architecture

**Server-Side Game Management:**
- `GameStateManager` - Central game state orchestration, room management, player lifecycle
- `WebSocketServer` - WebSocket connection handling, message routing, CORS configuration
- Shared type definitions between client/server for WebSocket messages and game state

**Client-Side Architecture:**
- `KiaTereGame` - Main game component managing overall game flow and WebSocket connection
- `useWebSocket` hook - WebSocket connection management with reconnection logic
- `useTimer` hook - Game timer functionality with automatic cleanup
- Component-based UI: `Menu`, `Lobby`, `GameBoard` with clear separation of concerns

### Key Design Patterns

**State Management:**
- Server maintains authoritative game state in `GameStateManager`
- Client receives state updates via WebSocket messages
- Client components are largely stateless, driven by server state

**WebSocket Communication:**
- Bidirectional message-based protocol defined in shared types
- Client events: `CREATE_ROOM`, `JOIN_ROOM`, `START_GAME`, `START_TURN`, `END_TURN`, `TIME_UP`
- Server events: `ROOM_CREATED`, `ROOM_JOINED`, `GAME_STARTED`, `GAME_STATE_UPDATE`, `PLAYER_JOINED/LEFT`, `ROUND_END/GAME_END`

**Game Flow:**
- Players join lobby → Host starts game → Turn-based gameplay with 10-second timer → Round/game completion
- Automatic player elimination on timeout, reconnection support for disconnected players
- Difficulty affects available letter set (easy: 18 letters, hard: 26 letters)

### Configuration

**Environment Variables:**
- `REACT_APP_WS_URL` - WebSocket server URL for client (defaults to `ws://localhost:9191`)
- `NODE_ENV` - Enables CORS restrictions when set to `production` or `staging`
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins for production/staging CORS

**Constants:**
- Game timing, categories, and letter sets defined in `client/src/constants/index.ts`
- Server constants in `server/src/constants/game.ts`
- Default WebSocket port: 9191