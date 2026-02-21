#!/usr/bin/env node

/**
 * Script to replace environment variables in Angular environment files at build time.
 * Reads API_URL, AUTH_URL, SUPABASE_URL, SUPABASE_ANON_KEY, etc. from process.env.
 * - Local: optional .env file (angular-web/.env) is loaded into process.env if present.
 * - Production: set env vars in your platform (Vercel, Netlify, CI, etc.); no .env file needed.
 * Usage: node scripts/replace-env.js [environment-file]
 */

const fs = require('fs');
const path = require('path');

// Optional: load .env from frontend repo (local dev). Production uses platform env vars.
const frontendRoot = path.join(__dirname, '..');
const envPath = path.join(frontendRoot, '.env');
try {
  const dotenv = require('dotenv');
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
} catch (_) {
  // dotenv not installed; process.env from shell/platform is used
}

const envFile = process.argv[2] || 'src/environments/environment.prod.ts';
const basePath = path.join(__dirname, '..');
// For dev, read from template so we never commit secrets; write to environment.ts (gitignored)
const isDevEnv = envFile === 'src/environments/environment.ts';
const readPath = isDevEnv
  ? path.join(basePath, 'src/environments/environment.ts.example')
  : path.join(basePath, envFile);
const writePath = path.join(basePath, envFile);

if (!fs.existsSync(readPath)) {
  console.error(`Environment file not found: ${readPath}`);
  process.exit(1);
}

let content = fs.readFileSync(readPath, 'utf8');

// Dev defaults for environment.ts; prod/staging use production defaults
const isDev = envFile.includes('environment.ts') && !envFile.includes('.prod') && !envFile.includes('.staging');
const defaultApiUrl = isDev ? 'http://localhost:8000/api/v1' : 'https://whist.api.orbasker.com/api/v1';
const defaultAuthUrl = isDev
  ? 'https://ep-shiny-voice-agz9vcbc.neonauth.c-2.eu-central-1.aws.neon.tech/neondb/auth'
  : 'https://ep-xxx-prod.neonauth.region.aws.neon.tech/neondb/auth';

const apiUrl = process.env.API_URL || defaultApiUrl;
const authUrl = process.env.AUTH_URL || defaultAuthUrl;
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
// Default to Supabase Realtime when URL/key are set; allow USE_SUPABASE_REALTIME=false to override
const useSupabaseRealtime =
  process.env.USE_SUPABASE_REALTIME === 'false' || process.env.USE_SUPABASE_REALTIME === '0'
    ? false
    : process.env.USE_SUPABASE_REALTIME === 'true' ||
      process.env.USE_SUPABASE_REALTIME === '1' ||
      !!(supabaseUrl && supabaseAnonKey);

// Replace apiUrl (handle both single and double quotes)
content = content.replace(
  /apiUrl:\s*['"](.*?)['"]/,
  `apiUrl: '${apiUrl}'`
);

// Replace authUrl (handle both single and double quotes)
content = content.replace(
  /authUrl:\s*['"](.*?)['"]/,
  `authUrl: '${authUrl}'`
);

// Replace Supabase Realtime (frontend)
content = content.replace(
  /useSupabaseRealtime:\s*(true|false)/,
  `useSupabaseRealtime: ${useSupabaseRealtime}`
);
content = content.replace(
  /supabaseUrl:\s*['"](.*?)['"]/,
  `supabaseUrl: '${supabaseUrl}'`
);
content = content.replace(
  /supabaseAnonKey:\s*['"](.*?)['"]/,
  `supabaseAnonKey: '${supabaseAnonKey}'`
);

fs.writeFileSync(writePath, content);

console.log(`✅ Updated ${envFile}${isDevEnv ? ' (from .example + .env)' : ''}`);
console.log(`   API URL: ${apiUrl}`);
console.log(`   Auth URL: ${authUrl}`);
if (supabaseUrl) {
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Use Supabase Realtime: ${useSupabaseRealtime}`);
}
