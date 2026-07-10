// app/api/progress/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

// Vérifie que l'inscription appartient bien à l'utilisateur connecté,
// pour empêcher un apprenant de lire ou modifier la progression d'un autre.
async function assertOwnEnrollment(admin, enrollmentId, userId) {
  const { data, error } = await admin
    .from('enrollments')
    .select('id')
    .eq('id', enrollmentId)
    .eq('learner_id', userId)
    .single();
  return !error && !!data;
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollment_id');
    if (!enrollmentId) {
      return NextResponse.json({ error: 'Inscription manquante.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const owns = await assertOwnEnrollment(admin, enrollmentId, user.id);
    if (!owns) return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });

    const { data, error } = await admin
      .from('progress')
      .select('lesson_id, completed, last_position_seconds, updated_at')
      .eq('enrollment_id', enrollmentId);

    if (error) throw error;
    return NextResponse.json({ progress: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Impossible de charger la progression pour le moment.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { enrollment_id: enrollmentId, lesson_id: lessonId } = body;
    const completed = Boolean(body.completed);
    const positionRaw = Number(body.last_position_seconds);
    // On protège contre une valeur négative ou aberrante envoyée par le lecteur vidéo.
    const lastPositionSeconds = Number.isFinite(positionRaw) ? Math.max(Math.round(positionRaw), 0) : 0;

    if (!enrollmentId || !lessonId) {
      return NextResponse.json({ error: 'Inscription ou leçon manquante.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const owns = await assertOwnEnrollment(admin, enrollmentId, user.id);
    if (!owns) return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });

    // Upsert : crée la ligne au premier visionnage, la met à jour ensuite —
    // c'est ce qui permet la reprise automatique de lecture (4.3).
    const { data, error } = await admin
      .from('progress')
      .upsert(
        {
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          completed,
          last_position_seconds: lastPositionSeconds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'enrollment_id,lesson_id' }
      )
      .select('lesson_id, completed, last_position_seconds, updated_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ progress: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "La sauvegarde de la progression a échoué." }, { status: 500 });
  }
}
