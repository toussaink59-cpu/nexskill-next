# NexSkill — Next.js + Supabase

Version reconstruite du site sur une base plus robuste : Next.js (frontend +
routes API dans un seul projet) et Supabase (PostgreSQL + authentification
complète : mots de passe, vérification d'e-mail, réinitialisation).

## Pourquoi ce changement

Supabase gère nativement ce qu'on codait à la main dans la version
précédente (Netlify + Neon) : hachage des mots de passe, émission de jetons de
session, **vérification d'e-mail**, et **réinitialisation de mot de passe** —
les deux points qui manquaient le plus à la version précédente.

## Étape 1 — Créer un projet Supabase

1. Allez sur **supabase.com**, créez un compte (GitHub recommandé).
2. **New project** → donnez un nom (ex. `nexskill`), choisissez une région
   proche de vos utilisateurs, définissez un mot de passe de base de données
   (à conserver de côté, différent de celui des comptes utilisateurs).
3. Attendez la fin du provisionnement (1-2 minutes).

## Étape 2 — Charger le schéma

1. Dans le tableau de bord du projet, ouvrez **SQL Editor**.
2. Copiez tout le contenu de `db/schema.sql`, collez-le, cliquez sur **Run**.
3. Cela crée les tables (`profiles`, `courses`, `offers`, `certificates`), le
   déclencheur qui crée automatiquement un profil à chaque inscription, les
   données de démonstration, et les règles de sécurité (RLS).

## Étape 3 — Récupérer les clés

Dans **Project Settings > API** :

| Nom sur Supabase | Variable à créer sur Vercel |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role (secret) | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ La clé **service_role** contourne toutes les protections de sécurité de la
base — ne la partagez jamais, ne la mettez jamais dans une variable préfixée
`NEXT_PUBLIC_` (ce préfixe rendrait la valeur visible dans le navigateur de
n'importe quel visiteur).

## Étape 4 — Activer la confirmation d'e-mail et configurer les liens

Dans **Authentication > Providers > Email**, la confirmation d'e-mail est
activée par défaut sur les nouveaux projets — laissez-la ainsi pour une vraie
mise en production.

Dans **Authentication > URL Configuration**, ajoutez l'URL de votre site (une
fois connu, après déploiement Vercel) dans **Site URL** et dans
**Redirect URLs** (ajoutez aussi `.../reset-password`) — sinon les liens de
confirmation et de réinitialisation de mot de passe redirigeront vers une
mauvaise adresse.

## Étape 5 — Déployer sur Vercel

1. Poussez ce dossier sur un dépôt GitHub (même méthode que précédemment :
   upload via l'interface web GitHub, ou dépôt existant).
2. Sur **vercel.com**, connectez-vous avec GitHub.
3. **Add New > Project**, importez le dépôt. Vercel détecte Next.js
   automatiquement, aucun réglage à changer.
4. Avant de cliquer sur Deploy, dépliez **Environment Variables** et ajoutez
   les 3 variables de l'étape 3.
5. **Deploy**.

## Vérifier que tout fonctionne

- `/compte` → créez un compte. Si la confirmation d'e-mail est active, un
  message l'indique ; vérifiez votre boîte mail.
- Après confirmation, connectez-vous → le tableau de bord doit s'afficher.
- `/compte` → "Mot de passe oublié ?" → vous recevez un e-mail → le lien
  ouvre `/reset-password` → vous choisissez un nouveau mot de passe.
- `/verification?id=NS-DEMO01` → le certificat de démonstration s'affiche.
- Un formateur qui publie une formation doit la voir sur `/catalogue`.
- Une entreprise qui publie une offre doit la voir sur `/offres`.

## Prochaine étape mentionnée : Mobile Money

Comme évoqué, l'intégration des paiements (Orange Money, Wave, MTN, Moov)
s'ajoutera plus tard via une route API Next.js (`/app/api/paiement/route.js`)
qui appellera un agrégateur comme **CinetPay** ou **PawaPay**. Cette étape
n'est pas encore construite — on s'y attaque quand vous serez prêt.

## Sécurité déjà en place grâce à Supabase

- Mots de passe hachés et gérés par Supabase (pas de code maison).
- Limitation des tentatives de connexion déjà intégrée côté Supabase.
- Vérification d'e-mail et réinitialisation de mot de passe natives.
- RLS (Row Level Security) activée sur toutes les tables : la lecture du
  catalogue/offres/certificats est publique, mais aucune écriture directe
  depuis le navigateur n'est possible — tout passe par les routes API, qui
  vérifient elles-mêmes l'identité et le rôle avant d'écrire.

## Ce qu'il reste à considérer

- Ajouter une page "Conditions d'utilisation" / "Confidentialité" réelles
  (actuellement des liens vides) avant un lancement public.
- Fixer une politique de sauvegarde/rétention sur Supabase selon votre plan.
- L'intégration Mobile Money (voir ci-dessus).
