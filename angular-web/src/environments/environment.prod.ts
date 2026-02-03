export const environment = {
  production: true,
  // Production API URL - replace with your production backend URL
  // This will be replaced at build time by deployment platform environment variables
  apiUrl: 'https://api.yourdomain.com/api/v1',
  // Production Neon Auth URL - update this with your production Neon Auth URL
  // Go to: Neon Dashboard → Users → Configuration → Auth URL
  // Format: https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth
  // This will be replaced at build time by deployment platform environment variables
  authUrl: 'https://ep-xxx-prod.neonauth.region.aws.neon.tech/neondb/auth'
};
