// app/api/courses/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const MAX_TITLE_LENGTH = 150;
const VALID_FILIERES = [
  'developpement','cybersecurite','ia','marketing','entrepreneuriat',
  'finance','design','video','bureautique','langues'
];

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('courses')
      .select('id, title, filiere, duration, trainer_name, source, price, currency, level, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ courses: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Impossible de charger le catalogue pour l'instant." }, { status: 500 });
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
    if (profile.role !== 'formateur') {
      return NextResponse.json({ error: 'Seul un formateur peut publier une formation.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const title = (body.title || '').trim().slice(0, MAX_TITLE_LENGTH);
    const filiere = VALID_FILIERES.includes(body.filiere) ? body.filiere : 'developpement';
    const durationRaw = Number(body.duration);
    const duration = Number.isFinite(durationRaw) ? Math.min(Math.max(Math.round(durationRaw), 1), 500) : 10;

    if (title.length < 3) {
      return NextResponse.json({ error: 'Titre de formation trop court (3 caractères minimum).' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('courses')
      .insert({ title, filiere, duration, trainer_id: user.id, trainer_name: profile.name, source: 'community' })
      .select('id, title, filiere, duration, trainer_name, source, created_at')
      .single();
    if (error) throw error;

    return NextResponse.json({ course: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'La publication a échoué. Réessayez dans un instant.' }, { status: 500 });
  }
}
