-- Schéma Supabase pour NexSkill
-- À exécuter dans l'éditeur SQL de votre projet Supabase (SQL Editor > New query).
-- Supabase gère déjà l'authentification (table auth.users) : mots de passe,
-- vérification d'e-mail, réinitialisation de mot de passe. On ajoute ici
-- uniquement les données propres à NexSkill.

-- Profil applicatif, lié 1-à-1 à un compte Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('apprenant','formateur','entreprise')),
  extra TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Formations du catalogue
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filiere TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 10,
  trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  trainer_name TEXT,
  source TEXT NOT NULL DEFAULT 'community',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Offres d'emploi
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filiere TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Certificats vérifiables publiquement
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  learner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  learner_name TEXT NOT NULL,
  course TEXT NOT NULL,
  filiere TEXT,
  hours INTEGER,
  level TEXT DEFAULT 'Intermédiaire',
  status TEXT NOT NULL DEFAULT 'valide',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Formations de démonstration
INSERT INTO courses (title, filiere, duration, source) VALUES
  ('Développer sa première application web', 'developpement', 30, 'nexskill'),
  ('Bases du pentest offensif', 'cybersecurite', 24, 'nexskill'),
  ('Sécuriser une infrastructure réseau', 'cybersecurite', 20, 'nexskill'),
  ('Machine learning appliqué', 'ia', 28, 'nexskill'),
  ('Acquisition et mesure de performance', 'marketing', 16, 'nexskill'),
  ('De l''idée au premier client', 'entrepreneuriat', 14, 'nexskill'),
  ('Fiscalité locale et outils comptables', 'finance', 18, 'nexskill'),
  ('Construire une identité visuelle', 'design', 20, 'nexskill'),
  ('Montage vidéo et motion design', 'video', 22, 'nexskill'),
  ('Outils bureautiques du quotidien', 'bureautique', 12, 'nexskill'),
  ('Français professionnel', 'langues', 16, 'nexskill'),
  ('Anglais professionnel', 'langues', 16, 'nexskill')
ON CONFLICT DO NOTHING;

-- Certificat de démonstration affiché sur la page d'accueil
INSERT INTO certificates (id, learner_name, course, filiere, hours, level, status)
VALUES ('NS-DEMO01', 'Aïcha Konaté', 'Bases du pentest offensif', 'cybersecurite', 24, 'Intermédiaire', 'valide')
ON CONFLICT (id) DO NOTHING;

-- === Sécurité au niveau des lignes (Row Level Security) ===
-- Principe : la lecture du catalogue/offres/certificats est publique.
-- Les écritures (créer un compte, publier une formation/offre, générer un
-- certificat) passent uniquement par les routes API Next.js, qui utilisent
-- la clé "service role" côté serveur (jamais exposée au navigateur) et
-- contournent volontairement RLS après avoir vérifié elles-mêmes l'identité
-- et le rôle de l'utilisateur. Les tables n'accordent donc aucun droit
-- d'écriture direct depuis le navigateur.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Crée automatiquement le profil applicatif (nom, rôle, filière) dès qu'un
-- compte Supabase Auth est créé, à partir des métadonnées passées lors de
-- l'inscription (options.data côté client). SECURITY DEFINER : la fonction
-- s'exécute avec les droits du propriétaire, donc elle peut écrire dans
-- profiles même quand l'utilisateur n'a pas encore de session active
-- (cas d'une inscription en attente de confirmation d'e-mail).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, extra)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'apprenant'),
    NEW.raw_user_meta_data->>'extra'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "courses_public_read" ON courses;
CREATE POLICY "courses_public_read" ON courses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "offers_public_read" ON offers;
CREATE POLICY "offers_public_read" ON offers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "certificates_public_read" ON certificates;
CREATE POLICY "certificates_public_read" ON certificates
  FOR SELECT USING (true);
