# Caspian Connect Backend Architecture

## Overview
This is an Express.js backend for the Caspian Connect Portal. It provides RESTful APIs for user authentication and other services.

## Tech Stack
- **Node.js & Express.js**: Web framework
- **MongoDB & Mongoose**: Database & ODM (Prepared)
- **JWT**: JSON Web Tokens for secure authentication
- **Bcrypt**: Password hashing

## Directory Structure
- `server.js`: Application entry point. Sets up middleware and routes.
- `routes/`: Defines API endpoints.
- `controllers/`: Contains business logic for routes.
- `middleware/`: Custom middleware (e.g., JWT verification).
- `models/`: Mongoose schemas for MongoDB.

## Authentication Flow
1. **Register**: `POST /api/auth/register` - Creates a new user, hashes password, and returns a JWT.
2. **Login**: `POST /api/auth/login` - Verifies credentials and returns a JWT.
3. **Protected Routes**: Middleware verifies the `Bearer` token before granting access (e.g., `GET /api/auth/me`).
