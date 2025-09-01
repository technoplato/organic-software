#!/bin/bash

# Automated test script
echo "Running automated tests..."

# Run e2e tests
npx tsx tests/e2e/test-e2e-flow.ts

# Add other test commands as needed