# Better Auth Service

This is the Node.js service that runs Better Auth for the Wist game application.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and set:
   # - BETTER_AUTH_SECRET (generate with: openssl rand -base64 32)
   # - DATABASE_URL (PostgreSQL connection string)
   # - BETTER_AUTH_URL (e.g. http://localhost:3000)
   ```

3. **Run database migrations:**
   ```bash
   npm run migrate
   ```
   This creates the `user`, `session`, `account`, and `verification` tables in your PostgreSQL database.

4. **Start the service:**
   ```bash
   npm run dev
   ```

The service will run on `http://localhost:3000` (or the port specified in `PORT`).

## Important Notes

- **Shared Secret**: The `BETTER_AUTH_SECRET` must be the same value as `AUTH_JWT_SECRET` in the FastAPI backend's `.env` file.
- **Database**: This service uses the same PostgreSQL database as FastAPI (shared `DATABASE_URL`).
- **User IDs**: Configured to use UUID for user IDs to match `games.owner_id` in the FastAPI schema.

## API Endpoints

All Better Auth endpoints are available under `/api/auth/*`:
- `POST /api/auth/sign-up/email` - Sign up with email/password
- `POST /api/auth/sign-in/email` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/get-session` - Get current session
- `GET /health` - Health check

See [Better Auth documentation](https://www.better-auth.com/docs) for full API reference.
