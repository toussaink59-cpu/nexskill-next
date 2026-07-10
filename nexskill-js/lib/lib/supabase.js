import { createClient } from "@supabase/supabase-js";

// Client "public" : utilise la clé anonyme, protégée par les policies RLS
// déjà définies dans votre schéma Supabase (policy "certificates_public_read",
// lecture publique uniquement — aucune écriture possible depuis le navigateur).
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variables Supabase manquantes. Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local"
    );
  }

  return createClient(url, anonKey);
}

// Forme d'une ligne de la table `certificates` (voir votre schéma) :
// {
//   id: string,              // ex: "NS-DEMO01"
//   learner_id: string|null,
//   learner_name: string,
//   course: string,
//   filiere: string|null,
//   hours: number,
//   level: string,
//   status: string,          // "valide" | "revoque" | "expire" en pratique
//   issued_at: string,       // timestamptz
// }
