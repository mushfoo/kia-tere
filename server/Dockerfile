# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev dependencies for building
RUN npm ci --omit=optional

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --omit=optional && \
    apk add --no-cache curl && \
    npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built application and health check script from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs health-check.js .

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 9191 9192

# Start both main server and health check
CMD node health-check.js & node dist/server.js