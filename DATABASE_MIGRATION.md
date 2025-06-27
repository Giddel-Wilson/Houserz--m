# Database Migration Guide

## Current Setup
- **Development**: SQLite (`file:./prisma/dev.db`)
- **Production**: Ready for Neon PostgreSQL

## To Deploy to Production with Neon Database:

### 1. Verify Neon Database Access
First, test if the Neon database is accessible:
```bash
# Test connection
psql "postgresql://neondb_owner:npg_5l3TRHWVBCNt@ep-flat-recipe-a4c3bxb8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 2. Update Configuration for Production
```bash
# Copy production environment
cp .env.production .env

# Or manually update .env:
# DATABASE_URL="postgresql://neondb_owner:npg_5l3TRHWVBCNt@ep-flat-recipe-a4c3bxb8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 3. Update Prisma Schema
```prisma
# In prisma/schema.prisma, change:
datasource db {
  provider = "postgresql"  # Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 4. Run Database Migration
```bash
# Generate Prisma client for PostgreSQL
npm run db:generate

# Push schema to Neon database
npm run db:push

# Or create migration
npm run db:migrate
```

### 5. Seed Production Database
```bash
npm run db:seed
```

## Alternative: Create New Neon Database

If the current Neon database is not accessible:

### Option A: Create via Neon Console
1. Go to https://neon.tech/
2. Create new database
3. Copy connection string
4. Update `.env` with new DATABASE_URL

### Option B: Use Supabase Database
The project already has Supabase configured. To use Supabase database:

1. Get Supabase database URL from your project settings
2. Update DATABASE_URL in .env
3. Follow steps 3-5 above

## Rollback to Development
To return to SQLite for development:
```bash
# Restore development settings
git checkout HEAD -- .env
npm run db:generate
```

## Environment Variables for Production Deployment

Ensure these are set in your production environment:
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (secure random string)
- `NODE_ENV=production`
- `PUBLIC_APP_URL` (your production domain)
- All Cloudinary, SMTP, and Supabase credentials
