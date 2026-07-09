// app/api/offers/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 500;
const VALID_FILIERES = [
  'developpement','cybersecurite','ia','marketing','entrepreneuriat',
  'finance','design','video','bureautique','langues'
];

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('offers')
      .select('id, title, filiere, description, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ offers: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Impossible de charger les offres pour l'instant." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });
    if (profile.role !== 'entreprise') {
      return NextResponse.json({ error: 'Seule une entreprise peut publier une offre.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const title = (body.title || '').trim().slice(0, MAX_TITLE_LENGTH);
    const filiere = VALID_FILIERES.includes(body.filiere) ? body.filiere : 'developpement';
    const description = (body.description || '').trim().slice(0, MAX_DESCRIPTION_LENGTH);

    if (title.length < 3) {
      return NextResponse.json({ error: 'Intitulé de poste trop court (3 caractères minimum).' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('offers')
      .insert({ title, filiere, description, company_id: user.id, company_name: profile.name })
      .select('id, title, filiere, description, company_name, created_at')
      .single();
    if (error) throw error;

    return NextResponse.json({ offer: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'La publication a échoué. Réessayez dans un instant.' }, { status: 500 });
  }
}
