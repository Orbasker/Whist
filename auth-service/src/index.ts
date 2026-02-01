/**
 * Better Auth service for Wist game
 * 
 * This service runs Better Auth on a Hono server, handling authentication
 * for the Wist application. It shares the same PostgreSQL database as FastAPI.
 * 
 * Environment variables:
 * - BETTER_AUTH_SECRET: Secret for signing JWTs and cookies (min 32 chars)
 * - DATABASE_URL: PostgreSQL connection string (same as FastAPI)
 * - BETTER_AUTH_URL: Base URL where this service is accessible (e.g. http://localhost:3000)
 * - PORT: Port to run on (default: 3000)
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { hono } from "better-auth/hono";

const { Pool } = pg;

// Environment variables
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const PORT = parseInt(process.env.PORT || "3000", 10);

if (!BETTER_AUTH_SECRET || BETTER_AUTH_SECRET.length < 32) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set and at least 32 characters long. " +
    "Generate one with: openssl rand -base64 32"
  );
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set (PostgreSQL connection string)");
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Initialize Drizzle (Better Auth will handle schema via migrations)
const db = drizzle(pool);

// Initialize Better Auth
const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "postgresql",
  }),
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can be enabled later
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      strategy: "jwt",
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    generateId: () => crypto.randomUUID(), // Use UUID for user.id to match games.owner_id
  },
});

// Create Hono app
const app = new Hono();

// Mount Better Auth
app.use("/api/auth/*", hono(auth));

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "better-auth" });
});

// Start server
serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`🚀 Better Auth service running on http://localhost:${info.port}`);
  console.log(`   Auth endpoints: ${BETTER_AUTH_URL}/api/auth/*`);
  const dbInfo = DATABASE_URL.includes("@") ? DATABASE_URL.split("@")[1] : "configured";
  console.log(`   Database: ${dbInfo}`);
});
