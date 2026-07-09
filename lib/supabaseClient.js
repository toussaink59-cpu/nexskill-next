// lib/supabaseClient.js
// Client Supabase utilisé dans le navigateur (composants "use client").
// Utilise la clé publique "anon" — sans danger à exposer, elle est conçue
// pour ça, et toute action sensible est protégée par les politiques RLS
// et/ou les routes API server-side.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
