# Kia Tere 🏃‍♂️

[![CI Pipeline](https://github.com/campbell-rehu/kia-tere/actions/workflows/ci.yml/badge.svg)](https://github.com/campbell-rehu/kia-tere/actions/workflows/ci.yml)

_"Hurry up!" in Te Reo Māori_

A fast-paced multiplayer word game where players race against time to find words that match categories. Based on the popular board game Tapple, Kia Tere brings the excitement online with real-time multiplayer support.

## 🎯 Game Rules

### Basic Rules

- **2+ players** required to start
- **10 seconds** per turn
- **First to 3 rounds** wins the game
- **No repeated letters** in the same round

### How to Play

1. **Join or Create**: Create a room or join with a 6-digit code
2. **Category Challenge**: Each round has a category (Animals, Foods, Countries, etc.)
3. **Find Your Word**: Think of a word that fits the category
4. **Select & Say**: Choose the starting letter and say your word aloud
5. **Beat the Clock**: You have 10 seconds per turn
6. **Win Rounds**: Last player standing wins the round
7. **First to 3**: First player to win 3 rounds wins the game!

### Turn Flow

1. Player's turn starts automatically
2. Player selects a letter (can change selection)
3. Player says their word out loud
4. Player clicks "End Turn"
5. Next player's turn begins immediately

### Elimination

- Players are eliminated if time runs out
- Last player remaining wins the round
- Eliminated players rejoin for the next round

### Difficulty Levels

- **Easy**: 18 letters available (A-R)
- **Hard**: All 26 letters available (A-Z)

## 🛠️ Development

### CI Pipeline

This project uses GitHub Actions for continuous integration. The pipeline:

- **Runs on**: Pull requests to `main` and pushes to `main`
- **Client Pipeline**: Installs dependencies, builds the React app, and runs tests
- **Server Pipeline**: Installs dependencies, compiles TypeScript, and runs Jest tests
- **Parallel Execution**: Both client and server jobs run simultaneously for faster feedback
- **Branch Protection**: PRs cannot be merged until both pipelines pass

The CI configuration can be found in `.github/workflows/ci.yml`.

### Running Tests Locally

**Client tests:**

```bash
cd client
npm test
```

**Server tests:**

```bash
cd server
npm test
```

**Build verification:**

```bash
# Client build
cd client && npm run build

# Server build
cd server && npm run build
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 8+ (included with Node.js)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd kia-tere
   ```

2. **Install all dependencies** (monorepo setup)

   ```bash
   npm install
   ```

3. **Start the server** (development mode)

   ```bash
   cd server
   npm run dev
   ```

   Server will run on `ws://localhost:9191`

4. **Start the client** (in a new terminal)
   ```bash
   cd client
   npm start
   ```
   Client will run on `http://localhost:3000`

### Development Commands

#### Root Level Commands
- `npm run check` - Run linting and formatting checks for both client and server
- `npm run fix` - Fix linting and formatting issues for both client and server
- `npm run test:e2e` - Run end-to-end tests locally
- `npm run test:e2e:ci` - Run end-to-end tests in CI environment

#### Client Development (React + TypeScript)
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

#### Server Development (Node.js + WebSocket + TypeScript)
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

## 📁 Project Structure

```
kia-tere/
├── client/                     # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameBoard.tsx
│   │   │   ├── KiaTereGame.tsx  # Main game component
│   │   │   ├── Lobby.tsx
│   │   │   ├── Menu.tsx
│   │   │   └── __tests__/       # Component tests
│   │   ├── hooks/
│   │   │   ├── useTimer.ts      # Game timer hook
│   │   │   ├── useWebSocket.ts  # WebSocket connection hook
│   │   │   └── __tests__/       # Hook tests
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript type definitions
│   │   ├── constants/
│   │   │   └── index.ts         # Game constants
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── public/
├── server/                     # Node.js TypeScript WebSocket server
│   ├── src/
│   │   ├── services/
│   │   │   ├── GameStateManager.ts  # Core game logic
│   │   │   ├── WebSocketServer.ts   # WebSocket handling
│   │   │   └── __tests__/           # Service tests
│   │   ├── utils/
│   │   │   ├── roomUtils.ts         # Room management utilities
│   │   │   └── __tests__/           # Utility tests
│   │   ├── types/
│   │   │   └── index.ts             # Shared type definitions
│   │   ├── server.ts                # Main server entry
│   │   ├── constants.ts             # Server constants
│   │   └── types.ts                 # Legacy types (to be consolidated)
│   ├── dist/                       # Compiled JavaScript output
│   ├── package.json
│   └── tsconfig.json
├── e2e/                           # End-to-end tests with Playwright
│   ├── tests/                     # E2E test suites
│   ├── scripts/                   # Test execution scripts
│   └── playwright.config.ts       # Playwright configuration
├── package.json                   # Workspace configuration
├── CLAUDE.md                      # Development guidelines
├── README.md
└── LICENSE
```

## 🏗️ Architecture Overview

### Monorepo Structure
- **Root**: Workspace configuration with shared TypeScript and linting setup
- **Client**: React application with TypeScript, Tailwind CSS, and WebSocket client
- **Server**: Node.js WebSocket server with TypeScript and Jest testing
- **E2E**: Playwright end-to-end testing infrastructure

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

## 🧪 Testing & Development

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Jest & React Testing Library for unit tests
- Custom hooks for WebSocket and timer management

**Backend:**
- Node.js with TypeScript
- WebSocket (ws library) for real-time communication
- Express for health checks
- Jest for unit testing
- ts-node-dev for development hot reloading

**DevOps & Testing:**
- Playwright for end-to-end testing
- GitHub Actions CI/CD pipeline
- Docker containerization
- ESLint & Prettier for code quality
- Husky for pre-commit hooks

### Testing Strategy

**Unit Tests:**
- Component testing with React Testing Library
- Hook testing for custom WebSocket and timer logic
- Service layer testing for game state management
- Utility function testing

**End-to-End Tests:**
- Complete game flow testing with Playwright
- Multi-player scenarios with containerized setup
- WebSocket connection reliability testing
- Cross-browser compatibility verification

**Running Tests:**

```bash
# Unit tests
cd client && npm test    # Client tests
cd server && npm test    # Server tests

# E2E tests
npm run test:e2e         # Local e2e tests
npm run test:e2e:ci      # CI e2e tests

# Build verification
cd client && npm run build
cd server && npm run build
```

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration:

- **Triggers**: Pull requests to `main` and pushes to `main`
- **Client Pipeline**: Dependencies, build, unit tests, linting
- **Server Pipeline**: Dependencies, TypeScript compilation, unit tests, linting
- **E2E Pipeline**: Full application testing with Docker containers
- **Parallel Execution**: All jobs run simultaneously for faster feedback
- **Branch Protection**: PRs require all checks to pass before merging

## ⚙️ Configuration

### Environment Variables

**Client Configuration:**
- `REACT_APP_WS_URL` - WebSocket server URL (defaults to `ws://localhost:9191`)

**Server Configuration:**
- `NODE_ENV` - Environment mode (`development`, `staging`, `production`)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins for production/staging
- `PORT` - Server port (defaults to 9191)

### Development Setup

**Local Development:**
```bash
# Client will connect to ws://localhost:9191 by default
cd client && npm start

# Server runs on port 9191 by default
cd server && npm run dev
```

**Production Configuration:**
```bash
# Set environment variables
export NODE_ENV=production
export ALLOWED_ORIGINS=https://your-domain.com,https://staging.your-domain.com
export REACT_APP_WS_URL=wss://your-websocket-server.com

# Build and start
cd server && npm run build && npm start
cd client && npm run build
```

### Docker Support

Both client and server include Dockerfile configurations:

```bash
# Build containers
docker build -t kia-tere-client ./client
docker build -t kia-tere-server ./server

# Run with docker-compose (for e2e testing)
docker-compose -f docker-compose.test.yml up
```

## 🎯 Game Rules

### Basic Rules

- **2+ players** required to start
- **10 seconds** per turn
- **First to 3 rounds** wins the game
- **No repeated letters** in the same round

### Turn Flow

1. Player's turn starts automatically
2. Player selects a letter (can change selection)
3. Player says their word out loud
4. Player clicks "End Turn"
5. Next player's turn begins immediately

### Elimination

- Players are eliminated if time runs out
- Last player remaining wins the round
- Eliminated players rejoin for the next round

## 🔌 WebSocket Events

### Client → Server

- `CREATE_ROOM` - Host creates a new game room
- `JOIN_ROOM` - Player joins existing room
- `START_GAME` - Host starts the game
- `START_TURN` - Player starts their turn timer
- `END_TURN` - Player completes their turn
- `TIME_UP` - Player's time expired

### Server → Client

- `ROOM_CREATED` - Room successfully created
- `ROOM_JOINED` - Successfully joined room
- `GAME_STARTED` - Game has begun
- `GAME_STATE_UPDATE` - Game state changed
- `PLAYER_JOINED/LEFT` - Player connection updates
- `ROUND_END/GAME_END` - Round or game completed

## 🚀 Deployment

The application is configured for deployment on Railway with environment-specific configurations:

- **Staging**: `railway.staging.json`
- **Production**: `railway.production.json`

Docker containers are built automatically for both client and server components during deployment.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the board game Tapple
- Built with React and WebSockets
- Name "Kia Tere" means "hurry up" in Te Reo Māori
