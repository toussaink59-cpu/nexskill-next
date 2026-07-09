// app/api/certificates/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const FILIERE_LABELS = {
  developpement: "Développement logiciel", cybersecurite: "Cybersécurité", ia: "Intelligence artificielle",
  marketing: "Marketing digital", entrepreneuriat: "Entrepreneuriat", finance: "Finance & comptabilité",
  design: "Design graphique", video: "Montage vidéo", bureautique: "Bureautique", langues: "Langues"
};

function randomCertId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'NS-' + s;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || '').trim().toUpperCase().slice(0, 30);
  if (!id) return NextResponse.json({ error: 'Identifiant de certificat manquant.' }, { status: 400 });

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('certificates').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Certificat introuvable.' }, { status: 404 });
    return NextResponse.json({ certificate: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erreur lors de la vérification. Réessayez dans un instant.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role, name, extra')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });
    if (profile.role !== 'apprenant') {
      return NextResponse.json({ error: 'Seul un apprenant peut obtenir un certificat.' }, { status: 403 });
    }

    const filiereLabel = FILIERE_LABELS[profile.extra] || 'Formation générale';
    let certId = randomCertId();
    for (let attempts = 0; attempts < 5; attempts++) {
      const { data: existing } = await admin.from('certificates').select('id').eq('id', certId).maybeSingle();
      if (!existing) break;
      certId = randomCertId();
    }

    const { data, error } = await admin
      .from('certificates')
      .insert({
        id: certId,
        learner_id: user.id,
        learner_name: profile.name,
        course: filiereLabel + ' — Parcours complet',
        filiere: profile.extra,
        hours: 20,
        level: 'Intermédiaire',
        status: 'valide'
      })
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ certificate: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'La génération a échoué. Réessayez dans un instant.' }, { status: 500 });
  }
}
