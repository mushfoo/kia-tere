#!/bin/bash

set -e

echo "🎭 Running E2E tests against local containerized environment"

# Change to project root
cd "$(dirname "$0")/../.."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available (v1 or v2)
if command -v docker-compose > /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
elif docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Run tests with local configuration
echo "🚀 Starting tests..."
cd e2e
npx playwright test --config=playwright.local.config.ts "$@"

echo "✅ Local E2E tests completed!"