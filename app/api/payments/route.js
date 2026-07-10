// app/api/payments/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const VALID_PROVIDERS = ['orange_money', 'wave', 'mtn', 'moov', 'stripe'];

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('payments')
      .select('id, amount, currency, provider, status, created_at, enrollment_id')
      .eq('learner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ payments: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Impossible de charger votre historique de paiement.' }, { status: 500 });
  }
}

// Initie un paiement : crée une ligne "pending". La confirmation réelle
// (webhook du prestataire Mobile Money/Stripe) sera branchée plus tard
// via une route séparée (ex. app/api/payments/webhook) qui passera le
// statut à "succeeded" et créera l'inscription correspondante.
// Pour le MVP actuel, aucune donnée bancaire ne transite ni n'est stockée ici (9, 5.2).
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));
    const courseId = body.course_id;
    const provider = VALID_PROVIDERS.includes(body.provider) ? body.provider : null;

    if (!courseId) return NextResponse.json({ error: 'Formation manquante.' }, { status: 400 });
    if (!provider) return NextResponse.json({ error: 'Moyen de paiement invalide.' }, { status: 400 });

    const { data: course, error: courseError } = await admin
      .from('courses')
      .select('id, price, currency')
      .eq('id', courseId)
      .single();
    if (courseError || !course) {
      return NextResponse.json({ error: 'Formation introuvable.' }, { status: 404 });
    }

    const { data, error } = await admin
      .from('payments')
      .insert({
        learner_id: user.id,
        course_id: courseId,
        amount: course.price,
        currency: course.currency,
        provider,
        status: 'pending',
      })
      .select('id, amount, currency, provider, status, course_id, created_at')
      .single();

    if (error) throw error;

    // TODO (phase intégration paiement) : déclencher ici l'appel au
    // prestataire choisi et renvoyer l'URL/redirection nécessaire au client.
    return NextResponse.json({ payment: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "L'initialisation du paiement a échoué. Réessayez dans un instant." }, { status: 500 });
  }
}
