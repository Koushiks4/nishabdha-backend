#!/bin/bash
set -e

echo "=== Nishabdha Backend - Render Build Script ==="

# Install pnpm globally
echo "Installing pnpm..."
npm install -g pnpm@9.0.0

# Install ALL dependencies (including devDependencies needed for building)
echo "Installing dependencies..."
pnpm install --frozen-lockfile --prod=false

# Generate Prisma client
echo "Generating Prisma client..."
cd packages/database
pnpm exec prisma generate
cd ../..

# Build backend packages in correct order
echo "Building backend packages..."
pnpm --filter @nishabdha/types build
pnpm --filter @nishabdha/database build
pnpm --filter @nishabdha/api build

# Run database migrations
echo "Running database migrations..."
cd packages/database
pnpm exec prisma migrate deploy
cd ../..

# Prune devDependencies after build to reduce deployment size
echo "Pruning devDependencies..."
pnpm install --frozen-lockfile --prod

echo "Build complete!"
