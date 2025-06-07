# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including dev dependencies for building
RUN npm ci --legacy-peer-deps --omit=optional

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install serve and curl in a single layer
RUN npm install -g serve@14.2.0 && \
    apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy only the built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/build ./build

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Serve the built application
CMD ["serve", "-s", "build", "-l", "3000"]