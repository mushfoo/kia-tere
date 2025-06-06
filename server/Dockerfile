FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Copy health check script
RUN echo 'const http = require("http"); const server = http.createServer((req, res) => { if (req.url === "/health") { res.writeHead(200); res.end("OK"); } else { res.writeHead(404); res.end(); } }); const port = process.env.HEALTH_PORT || 9192; server.listen(port, () => console.log(`Health check server running on port ${port}`));' > health-check.js

# Expose ports
EXPOSE 9191 9192

# Install curl for health checks
RUN apk add --no-cache curl

# Start both main server and health check
CMD node health-check.js & node dist/server.js