# Kia Tere 🏃‍♂️

[![CI Pipeline](https://github.com/campbell-rehu/kia-tere/actions/workflows/ci.yml/badge.svg)](https://github.com/campbell-rehu/kia-tere/actions/workflows/ci.yml)

_"Hurry up!" in Te Reo Māori_

A fast-paced multiplayer word game where players race against time to find words that match categories. Based on the popular board game Tapple, Kia Tere brings the excitement online with real-time multiplayer support.

## ✨ Features

- 🌐 **Real-time Multiplayer** - Play with friends anywhere in the world
- 🔄 **Reconnection Support** - Rejoin games if you disconnect  
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎯 **22+ Categories** - From Animals to Superheroes
- ⚡ **10-Second Turns** - Fast-paced gameplay keeps everyone engaged
- 🏆 **Score Tracking** - First to win 3 rounds wins the game
- 🎨 **Modern UI** - Clean, professional design with TypeScript

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

### Quick Start

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
│   │   └── types.ts                 # Legacy types (consolidation needed)
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

## 🛠️ Development

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + WebSocket + TypeScript  
- **Testing**: Jest + React Testing Library + Playwright
- **DevOps**: GitHub Actions + Docker + Railway

### Quick Commands
```bash
# Install dependencies
npm install

# Start development servers
cd server && npm run dev  # WebSocket server on :9191
cd client && npm start    # React app on :3000

# Run tests
npm run test:e2e         # End-to-end tests
cd client && npm test     # Client unit tests
cd server && npm test     # Server unit tests

# Code quality
npm run check            # Lint and format check
npm run fix              # Fix lint and format issues
```

📚 **For detailed technical documentation, see the [Wiki](https://github.com/campbell-rehu/kia-tere/wiki):**
- [Architecture](https://github.com/campbell-rehu/kia-tere/wiki/Architecture) - System design and patterns
- [Development Setup](https://github.com/campbell-rehu/kia-tere/wiki/Development-Setup) - Complete development guide
- [Testing Strategy](https://github.com/campbell-rehu/kia-tere/wiki/Testing-Strategy) - Unit, integration, and e2e testing
- [Deployment](https://github.com/campbell-rehu/kia-tere/wiki/Deployment) - Railway and Docker deployment

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

Deployment is configured for Railway with Docker containerization:
- **Staging & Production**: Environment-specific Railway configurations
- **Docker**: Automated container builds for both client and server
- **CI/CD**: GitHub Actions pipeline with automated testing

See the [Deployment Wiki](https://github.com/campbell-rehu/kia-tere/wiki/Deployment) for detailed setup instructions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the board game Tapple
- Built with React and WebSockets
- Name "Kia Tere" means "hurry up" in Te Reo Māori
