// app/api/lessons/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const MAX_TITLE_LENGTH = 150;

// Un apprenant non inscrit ne doit voir que les leçons en aperçu gratuit,
// et sans le lien vidéo réel des leçons payantes (4.2 : aperçu, pas accès complet).
async function hasActiveEnrollment(admin, userId, courseId) {
  if (!userId) return false;
  const { data } = await admin
    .from('enrollments')
    .select('id')
    .eq('learner_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  return !!data;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');
    if (!courseId) {
      return NextResponse.json({ error: 'Formation manquante.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const user = await getUserFromRequest(request); // peut être null : accès public autorisé
    const enrolled = await hasActiveEnrollment(admin, user?.id, courseId);

    const { data, error } = await admin
      .from('lessons')
      .select('id, title, position, video_url, resource_url, duration_minutes, is_free_preview')
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    if (error) throw error;

    // On masque les liens vidéo/support des leçons non accessibles,
    // plutôt que de filtrer les lignes : l'apprenant voit le programme
    // complet (sommaire) mais pas le contenu tant qu'il n'est pas inscrit.
    const lessons = data.map((lesson) => {
      const accessible = enrolled || lesson.is_free_preview;
      return {
        ...lesson,
        video_url: accessible ? lesson.video_url : null,
        resource_url: accessible ? lesson.resource_url : null,
        locked: !accessible,
      };
    });

    return NextResponse.json({ lessons });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Impossible de charger le programme pour le moment.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));
    const courseId = body.course_id;
    if (!courseId) return NextResponse.json({ error: 'Formation manquante.' }, { status: 400 });

    // Seul le formateur propriétaire de la formation peut y ajouter des leçons.
    const { data: course, error: courseError } = await admin
      .from('courses')
      .select('id, trainer_id')
      .eq('id', courseId)
      .single();
    if (courseError || !course) {
      return NextResponse.json({ error: 'Formation introuvable.' }, { status: 404 });
    }
    if (course.trainer_id !== user.id) {
      return NextResponse.json({ error: "Vous n'êtes pas le formateur de cette formation." }, { status: 403 });
    }

    const title = (body.title || '').trim().slice(0, MAX_TITLE_LENGTH);
    if (title.length < 3) {
      return NextResponse.json({ error: 'Titre de leçon trop court (3 caractères minimum).' }, { status: 400 });
    }

    const positionRaw = Number(body.position);
    const position = Number.isFinite(positionRaw) ? Math.max(Math.round(positionRaw), 0) : 0;
    const durationRaw = Number(body.duration_minutes);
    const durationMinutes = Number.isFinite(durationRaw) ? Math.max(Math.round(durationRaw), 0) : null;

    const { data, error } = await admin
      .from('lessons')
      .insert({
        course_id: courseId,
        title,
        position,
        video_url: body.video_url || null,
        resource_url: body.resource_url || null,
        duration_minutes: durationMinutes,
        is_free_preview: Boolean(body.is_free_preview),
      })
      .select('id, title, position, video_url, resource_url, duration_minutes, is_free_preview')
      .single();

    if (error) throw error;
    return NextResponse.json({ lesson: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "L'ajout de la leçon a échoué. Réessayez dans un instant." }, { status: 500 });
  }
}
