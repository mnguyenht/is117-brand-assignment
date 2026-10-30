// Public site settings. Everything here is safe to commit:
// - The Supabase "anon" key is designed to be public. Row-level security in
//   supabase/schema.sql decides what each visitor can read or write.
// - Secrets (the Resend API key) live only in Vercel environment variables.
// Leave the Supabase values empty to run the offline demo (no accounts; cart
// and orders stay in this browser). The automated tests use offline mode.
export const CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
};

export const LIVE_MODE = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
