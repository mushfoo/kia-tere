#!/bin/bash

set -e

echo "🎭 Running E2E tests against CI/staging environment"

# Change to e2e directory
cd "$(dirname "$0")/.."

# Run tests with CI configuration
echo "🚀 Starting tests against staging..."
npx playwright test --config=playwright.ci.config.ts "$@"

echo "✅ CI E2E tests completed!"