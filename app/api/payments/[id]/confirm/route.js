// app/api/payments/[id]/confirm/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

    const paymentId = params.id;
    const admin = getSupabaseAdmin();

    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .select('id, learner_id, status, course_id')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Paiement introuvable.' }, { status: 404 });
    }
    if (payment.learner_id !== user.id) {
      return NextResponse.json({ error: 'Ce paiement ne vous appartient pas.' }, { status: 403 });
    }
    if (payment.status === 'succeeded') {
      return NextResponse.json({ error: 'Ce paiement a déjà été confirmé.' }, { status: 409 });
    }
    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'Ce paiement ne peut plus être confirmé.' }, { status: 409 });
    }

    const { error: enrollError, data: enrollment } = await admin
      .from('enrollments')
      .insert({ learner_id: user.id, course_id: payment.course_id })
      .select('id, status, enrolled_at, course_id')
      .single();

    if (enrollError && enrollError.code !== '23505') throw enrollError;

    const { error: updateError } = await admin
      .from('payments')
      .update({ status: 'succeeded', enrollment_id: enrollment?.id || null })
      .eq('id', paymentId);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, enrollment: enrollment || null, alreadyEnrolled: !enrollment });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'La confirmation du paiement a échoué.' }, { status: 500 });
  }
}
