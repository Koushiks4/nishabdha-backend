# Nishabdha Backend

Complete e-commerce backend system for Nishabdha acoustic solutions platform.

## Architecture

- **apps/api** - Express.js REST API (public endpoints)
- **apps/admin** - Next.js 14 Admin Portal
- **packages/database** - Prisma ORM + database utilities
- **packages/types** - Shared TypeScript types
- **packages/utils** - Shared utilities
- **packages/config** - Shared configuration

## Tech Stack

- Node.js 20, TypeScript 5.x
- Express.js, Next.js 14
- Prisma ORM, Supabase PostgreSQL
- Turborepo, pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Run database migrations
pnpm --filter database prisma migrate dev

# Start development servers
pnpm dev
```

## Deployment

- API: Render (free tier)
- Admin: Vercel (free tier)
- Database: Supabase (free tier)
