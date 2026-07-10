// app/api/enrollments/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    // On récupère les inscriptions de l'apprenant avec les infos de la formation liée,
    // pour alimenter directement le tableau de bord (4.3) sans requête supplémentaire.
    const { data, error } = await admin
      .from('enrollments')
      .select(`
        id, status, enrolled_at, completed_at,
        course:courses ( id, title, filiere, duration, trainer_name )
      `)
      .eq('learner_id', user.id)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ enrollments: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Impossible de charger vos inscriptions pour le moment.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });
    if (profile.role !== 'apprenant') {
      return NextResponse.json({ error: 'Seul un apprenant peut s\'inscrire à une formation.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const courseId = body.course_id;
    if (!courseId) {
      return NextResponse.json({ error: 'Formation manquante.' }, { status: 400 });
    }

    // On vérifie que la formation existe avant de créer l'inscription,
    // pour renvoyer une erreur claire plutôt qu'une contrainte SQL brute.
    const { data: course, error: courseError } = await admin
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();
    if (courseError || !course) {
      return NextResponse.json({ error: 'Formation introuvable.' }, { status: 404 });
    }

    const { data, error } = await admin
      .from('enrollments')
      .insert({ learner_id: user.id, course_id: courseId })
      .select('id, status, enrolled_at, course_id')
      .single();

    if (error) {
      // Code Postgres 23505 = violation de contrainte unique (déjà inscrit)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Vous êtes déjà inscrit à cette formation.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ enrollment: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "L'inscription a échoué. Réessayez dans un instant." }, { status: 500 });
  }
}
