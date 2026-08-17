# Caspian Connect (Silkbridge) Backend Architecture

## Overview
Express.js REST API backend powering the Caspian Connect B2B Portal (Silkbridge). It handles user authentication, partner applications, travel package catalog management, partnership tier discounts, and booking administration.

## Tech Stack
- **Node.js & Express.js**: Application framework and API routing
- **PostgreSQL & Prisma ORM**: Relational database with Neon Serverless adapter (WebSocket / HTTP over 443)
- **JWT (JSON Web Tokens) & HTTP-Only Cookies**: Dual-support secure token authentication
- **Bcrypt**: Salted password hashing
- **Nodemailer**: Transactional email service for partner notifications and password resets

## Directory Structure
- `server.js`: Main server entry point, CORS configuration, centralized error handling, and graceful shutdown.
- `lib/`:
  - `prisma.js`: Prisma client initialization with automated Neon serverless driver fallback.
  - `mail.js`: Nodemailer service for transactional emails and admin alerts.
  - `authCookie.js`: Secure cookie helper with cross-origin and production support.
- `middleware/`:
  - `auth.js`: JWT protection, optional authentication, and role-based access control (`adminOnly`).
- `controllers/`: Business logic implementations for Auth, Packages, Applications, Tiers, Bookings.
- `routes/`: Express route definitions.
- `prisma/`: Prisma schema, migrations, seed datasets (`seed_data.json`), and seed scripts.

## API Endpoints Summary
- **Authentication**: `/api/auth` (`/login`, `/register`, `/logout`, `/me`, `/forgot-password`, `/reset-password`, `/send-registration-otp`)
- **Packages**: `/api/packages` (Public overview, authenticated B2B net pricing, admin CRUD)
- **Applications**: `/api/applications` (Partner registration submission, admin approvals, tier upgrades, custom email dispatcher)
- **Tiers**: `/api/tiers` (B2B discount tiers: Silver, Gold, Platinum)
- **Bookings**: `/api/bookings` (Booking creation, listing, and status management)
- **Health Check**: `GET /health`
