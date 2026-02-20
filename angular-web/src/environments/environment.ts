export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  // Neon Auth URL - get this from your Neon project dashboard
  // Go to: Neon Dashboard → Users → Configuration → Auth URL
  // Format: https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth
  authUrl: 'https://ep-shiny-voice-agz9vcbc.neonauth.c-2.eu-central-1.aws.neon.tech/neondb/auth',
  // Supabase Realtime (optional) - when true, use Supabase for real-time instead of WebSocket
  useSupabaseRealtime: true,
  supabaseUrl: 'https://kbprawumtzahuqhalhjo.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticHJhd3VtdHphaHVxaGFsaGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTk3NzYsImV4cCI6MjA4NTUzNTc3Nn0.XiRTxa8vT-FcHNnXjLeJe8BSDx8WI_FXNe4ZiJWzCUk',
};
