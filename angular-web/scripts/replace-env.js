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

fs.writeFileSync(filePath, content);

console.log(`✅ Updated ${envFile}`);
console.log(`   API URL: ${apiUrl}`);
console.log(`   Auth URL: ${authUrl}`);
