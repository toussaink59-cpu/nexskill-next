// app/api/reviews/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const MAX_COMMENT_LENGTH = 1000;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');
    if (!courseId) {
      return NextResponse.json({ error: 'Formation manquante.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    // On joint le profil pour afficher le nom de l'auteur sans requête séparée.
    const { data, error } = await admin
      .from('reviews')
      .select('id, rating, comment, created_at, learner:profiles ( name )')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ reviews: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Impossible de charger les avis pour le moment.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));
    const courseId = body.course_id;
    const ratingRaw = Number(body.rating);
    const rating = Number.isInteger(ratingRaw) ? ratingRaw : null;
    const comment = (body.comment || '').trim().slice(0, MAX_COMMENT_LENGTH);

    if (!courseId) return NextResponse.json({ error: 'Formation manquante.' }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Note invalide (1 à 5 attendu).' }, { status: 400 });
    }

    // Seul un apprenant inscrit à la formation peut y laisser un avis
    // (avis fiables, cohérent avec le positionnement "compétences prouvées").
    const { data: enrollment } = await admin
      .from('enrollments')
      .select('id')
      .eq('learner_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();
    if (!enrollment) {
      return NextResponse.json({ error: 'Seul un apprenant inscrit peut laisser un avis.' }, { status: 403 });
    }

    const { data, error } = await admin
      .from('reviews')
      .insert({ course_id: courseId, learner_id: user.id, rating, comment: comment || null })
      .select('id, rating, comment, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Vous avez déjà laissé un avis pour cette formation.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ review: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "L'envoi de l'avis a échoué. Réessayez dans un instant." }, { status: 500 });
  }
}
