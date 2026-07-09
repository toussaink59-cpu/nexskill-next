// lib/supabaseAdmin.js
// Client Supabase réservé au serveur (routes API uniquement — jamais importé
// dans un composant "use client"). Utilise la clé "service role", qui
// contourne RLS : à garder strictement secrète, jamais exposée au navigateur,
// jamais préfixée par NEXT_PUBLIC_.
import { createClient } from '@supabase/supabase-js';

let adminClient;

export function getSupabaseAdmin() {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error(
        'Configuration Supabase manquante (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Vérifiez les variables d\'environnement sur Vercel.'
      );
    }
    adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return adminClient;
}

// Vérifie le jeton d'accès Supabase envoyé par le navigateur (Authorization: Bearer <token>)
// et renvoie l'utilisateur authentifié, ou null si absent/invalide.
export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data || !data.user) return null;
  return data.user;
}
