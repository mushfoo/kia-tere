# Kia Tere 🏃‍♂️

[![CI Pipeline](https://github.com/campbell-rehu/kia-tere/actions/workflows/ci.yml/badge.svg)](https://github.com/campbell-rehu/kia-tere/actions/workflows/ci.yml)

_"Hurry up!" in Te Reo Māori_

A fast-paced multiplayer word game where players race against time to find words that match categories. Based on the popular board game Tapple, Kia Tere brings the excitement online with real-time multiplayer support.

## 🎮 How to Play

1. **Join or Create**: Create a room or join with a 6-digit code
2. **Category Challenge**: Each round has a category (Animals, Foods, Countries, etc.)
3. **Find Your Word**: Think of a word that fits the category
4. **Select & Say**: Choose the starting letter and say your word aloud
5. **Beat the Clock**: You have 10 seconds per turn
6. **Win Rounds**: Last player standing wins the round
7. **First to 3**: First player to win 3 rounds wins the game!

## ✨ Features

- 🌐 **Real-time Multiplayer** - Play with friends anywhere in the world
- 🔄 **Reconnection Support** - Rejoin games if you disconnect
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎯 **22+ Categories** - From Animals to Superheroes
- ⚡ **Instant Turn Switching** - Seamless gameplay flow
- 🏆 **Score Tracking** - Track wins across rounds
- 🎨 **Modern UI** - Clean, professional design

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

- Node.js 14+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd kia-tere
   ```

2. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd ../client
   npm install
   ```

4. **Start the server**

   ```bash
   cd ../server
   npm run build
   npm start
   ```

   Server will run on `ws://localhost:9191`

5. **Start the client**
   ```bash
   cd ../client
   npm start
   ```
   Client will run on `http://localhost:3000`

## 📁 Project Structure

```
kia-tere/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── KiaTereGame.js    # Main game component
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── public/
├── server/                 # Node.js WebSocket server
│   ├── server.js          # Main server file
│   └── package.json
├── README.md
└── LICENSE
```

## 🔧 Configuration

### Client Configuration

Update the WebSocket URL in `client/src/components/KiaTereGame.js`:

```javascript
const wsUrl = 'ws://your-server-url:9191'
```

### Server Configuration

The server runs on port 9191 by default. To change:

```javascript
const server = new KiaTereServer(3001) // Custom port
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the board game Tapple
- Built with React and WebSockets
- Name "Kia Tere" means "hurry up" in Te Reo Māori
