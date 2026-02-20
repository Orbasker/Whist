#!/usr/bin/env node

/**
 * Script to replace environment variables in Angular environment files at build time.
 * Usage: node scripts/replace-env.js [environment-file]
 * Example: node scripts/replace-env.js src/environments/environment.prod.ts
 */

const fs = require('fs');
const path = require('path');

const envFile = process.argv[2] || 'src/environments/environment.prod.ts';
const filePath = path.join(__dirname, '..', envFile);

if (!fs.existsSync(filePath)) {
  console.error(`Environment file not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Get environment variables with fallbacks
const apiUrl = process.env.API_URL || 'https://whist.api.orbasker.com/api/v1';
const authUrl = process.env.AUTH_URL || 'https://ep-xxx-prod.neonauth.region.aws.neon.tech/neondb/auth';
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

fs.writeFileSync(filePath, content);

console.log(`✅ Updated ${envFile}`);
console.log(`   API URL: ${apiUrl}`);
console.log(`   Auth URL: ${authUrl}`);
if (supabaseUrl) {
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Use Supabase Realtime: ${useSupabaseRealtime}`);
}
