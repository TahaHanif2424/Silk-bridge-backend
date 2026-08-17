# Silkbridge Caspian Connect Backend

Production-ready Node.js/Express backend API for the Silkbridge Caspian Connect B2B Travel Portal.

## Prerequisites
- Node.js >= 18.x
- PostgreSQL database (or Neon Serverless Postgres instance)

## Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the environment variables:
   - `JWT_SECRET`: Secure random string for signing JWT tokens.
   - `DATABASE_URL`: PostgreSQL connection string.
   - `CORS_ORIGIN`: Comma-separated list of allowed frontend domain URLs.
   - `SMTP_*`: SMTP email credentials for outbound notifications.

## Installation & Running

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# (Optional) Seed the database with default tiers, admin, and package catalog
npm run seed # or: node prisma/seed.js

# Start production server
npm start

# Start development server
npm run dev
```

## Health Check
Verify the service is running:
```bash
curl http://localhost:5000/health
```