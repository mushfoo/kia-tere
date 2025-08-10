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
- ⌨️ **Keyboard Controls** - Play using letter keys and Enter

## 🎮 How to Play

### Game Setup
1. **Join or Create**: Create a room or join with a 6-digit code
2. **Minimum Players**: 2+ players required to start
3. **Choose Difficulty**: Easy (18 letters A-R) or Hard (all 26 letters)

### Gameplay
1. **Category Challenge**: Each round has a category (Animals, Foods, Countries, etc.)
2. **Your Turn**: You have 10 seconds to find a word that fits the category
3. **Select Letter**: Choose the starting letter by clicking or typing it
4. **Say Your Word**: Announce your word out loud to other players
5. **End Turn**: Press Enter or click "End Turn" to pass to the next player
6. **Elimination**: If time runs out, you're eliminated from the round

### Winning
- **Round Victory**: Last player remaining wins the round
- **Game Victory**: First player to win 3 rounds wins the game!
- **Fresh Start**: Eliminated players rejoin for each new round
- **No Repeats**: Used letters can't be selected again in the same round

### Disconnections vs Leaving
- Losing connection keeps you in the room's player list so you can reconnect.
- Clicking "Leave Room" removes you from the room for everyone.

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


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the board game Tapple
- Built with React and WebSockets
- Name "Kia Tere" means "hurry up" in Te Reo Māori
