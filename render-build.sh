#!/bin/bash
set -e

echo "=== Nishabdha Backend - Render Build Script ==="

# Install pnpm
echo "Installing pnpm..."
npm install -g pnpm@9.0.0

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client
echo "Generating Prisma client..."
cd packages/database
npx prisma generate
cd ../..

# Build all packages
echo "Building packages..."
pnpm build

# Run database migrations
echo "Running database migrations..."
cd packages/database
npx prisma migrate deploy
cd ../..

echo "Build complete!"
