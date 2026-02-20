export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  // Neon Auth URL - get this from your Neon project dashboard
  // Go to: Neon Dashboard → Users → Configuration → Auth URL
  // Format: https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth
  authUrl: 'https://ep-shiny-voice-agz9vcbc.neonauth.c-2.eu-central-1.aws.neon.tech/neondb/auth',
  // Supabase Realtime (default when URL and anon key are set) - set at build time via SUPABASE_URL, SUPABASE_ANON_KEY (see scripts/replace-env.js). No keys committed.
  useSupabaseRealtime: true,
  supabaseUrl: '',
  supabaseAnonKey: '',
};
