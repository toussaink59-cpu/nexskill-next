'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const FILIERE_LABELS = {
  developpement: "Développement logiciel", cybersecurite: "Cybersécurité", ia: "Intelligence artificielle",
  marketing: "Marketing digital", entrepreneuriat: "Entrepreneuriat", finance: "Finance & comptabilité",
  design: "Design graphique", video: "Montage vidéo", bureautique: "Bureautique", langues: "Langues"
};

export default function FormationPage({ params }) {
  const [courseId, setCourseId] = useState(null);
  const [course, setCourse] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | notfound | error
  const [session, setSession] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: '' });
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingSent, setRatingSent] = useState(false);

  useEffect(() => {
    // Next.js 15+ : params est une Promise pour les pages dynamiques.
    Promise.resolve(params).then((p) => setCourseId(p.id));

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, [params]);

  useEffect(() => {
    if (!courseId) return;

    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => {
        const found = (data.courses || []).find((c) => c.id === courseId);
        if (!found) { setLoadState('notfound'); return; }
        setCourse(found);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));

    fetch(`/api/lessons?course_id=${courseId}`)
      .then((res) => res.json())
      .then((data) => setLessons(data.lessons || []))
      .catch(() => {});

    fetch(`/api/reviews?course_id=${courseId}`)
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => {});
  }, [courseId]);

  // Recharge le programme (verrouillage des leçons) une fois la session connue,
  // et vérifie si l'apprenant est déjà inscrit.
  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/lessons?course_id=${courseId}`, {
      headers: session?.access_token ? { Authorization: 'Bearer ' + session.access_token } : {},
    })
      .then((res) => res.json())
      .then((data) => setLessons(data.lessons || []))
      .catch(() => {});

    if (session) {
      fetch('/api/enrollments', { headers: { Authorization: 'Bearer ' + session.access_token } })
        .then((res) => res.json())
        .then((data) => {
          const isEnrolled = (data.enrollments || []).some((e) => e.course?.id === courseId || e.course_id === courseId);
          setEnrolled(isEnrolled);
        })
        .catch(() => {});
    } else {
      setEnrolled(false);
    }
  }, [courseId, session]);

  async function authFetch(url, options = {}) {
    const token = session?.access_token;
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(options.headers || {}) },
    });
  }

  function handleAction() {
    setFeedback(null);
    if (!session) { window.location.href = '/compte'; return; }
    if (Number(course.price) > 0) { window.location.href = '/paiement?course=' + course.id; return; }
    handleFreeEnroll();
  }

  async function handleFreeEnroll() {
    setEnrolling(true);
    const res = await authFetch('/api/enrollments', { method: 'POST', body: JSON.stringify({ course_id: course.id }) });
    const data = await res.json();
    setEnrolling(false);
    if (!res.ok && res.status !== 409) {
      setFeedback({ text: data.error || "L'inscription a échoué.", type: 'error' });
      return;
    }
    setEnrolled(true);
    setFeedback({ text: 'Inscription confirmée !', type: 'success' });
  }

  async function submitReview() {
    setRatingBusy(true);
    const res = await authFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ course_id: course.id, rating: ratingForm.rating, comment: ratingForm.comment }),
    });
    const data = await res.json();
    setRatingBusy(false);
    if (!res.ok) { setFeedback({ text: data.error || "L'envoi de l'avis a échoué.", type: 'error' }); return; }
    setRatingSent(true);
    setReviews((prev) => [{ ...data.review, learner: { name: 'Vous' } }, ...prev]);
  }

  if (loadState === 'loading') return <CenteredMessage title="Chargement…" text="Un instant." />;
  if (loadState === 'notfound') return <CenteredMessage title="Formation introuvable" text="Retournez au catalogue pour choisir une formation." link={{ href: '/catalogue', label: '← Retour au catalogue' }} />;
  if (loadState === 'error') return <CenteredMessage title="Une erreur est survenue" text="Vérifiez votre connexion et réessayez." />;

  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <div className="logo">Nex<span>Skill</span></div>
          <div className="nav-links">
            <a href="/catalogue" className="back-link">← Catalogue</a>
            <a href="/offres" className="back-link">Offres d&apos;emploi</a>
            <a href="/compte" className="nav-cta">Mon compte</a>
          </div>
        </div>
      </nav>

      <section style={{ padding: '56px 0 40px' }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', background: 'var(--teal-light)', padding: '4px 10px', borderRadius: 999 }}>
            {FILIERE_LABELS[course.filiere] || course.filiere}
          </span>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em', margin: '14px 0 10px' }}>{course.title}</h1>
          {course.description && <p style={{ fontSize: 14.5, color: 'var(--muted)', marginBottom: 16, maxWidth: 600 }}>{course.description}</p>}
          <div style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--muted)', marginBottom: 24, flexWrap: 'wrap' }}>
            <span>{course.duration || '—'} heures</span>
            <span>Niveau {course.level || 'Débutant'}</span>
            {avgRating && <span>★ {avgRating} ({reviews.length} avis)</span>}
            {course.source === 'community' && course.trainer_name && <span>Par {course.trainer_name}</span>}
          </div>

          {feedback && <div className={'msg-banner ' + feedback.type} style={{ maxWidth: 480 }}>{feedback.text}</div>}

          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 480, marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Prix</div>
              <b style={{ fontSize: 20, fontFamily: "'Space Grotesk', sans-serif" }}>
                {Number(course.price) > 0 ? `${Number(course.price).toLocaleString('fr-FR')} ${course.currency || 'XOF'}` : 'Gratuit'}
              </b>
            </div>
            <button type="button" onClick={handleAction} disabled={enrolling || enrolled} className="btn gold" style={{ opacity: enrolled ? 0.7 : 1 }}>
              {enrolled ? 'Déjà inscrit ✓' : enrolling ? 'Inscription…' : Number(course.price) > 0 ? `Payer ${Number(course.price).toLocaleString('fr-FR')} FCFA` : "S'inscrire (gratuit)"}
            </button>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Programme</h2>
          {lessons.length === 0 && (
            <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 40 }}>Le programme détaillé de cette formation sera bientôt disponible.</p>
          )}
          {lessons.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 48 }}>
              {lessons.map((lesson, i) => (
                <div key={lesson.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Space Grotesk', sans-serif" }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{lesson.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {lesson.duration_minutes && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{lesson.duration_minutes} min</span>}
                    {lesson.is_free_preview && (
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--gold)', background: 'var(--gold-light)', padding: '3px 8px', borderRadius: 999 }}>Aperçu gratuit</span>
                    )}
                    {lesson.locked && <span style={{ fontSize: 13, color: 'var(--muted)' }}>🔒</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Avis des apprenants</h2>

          {enrolled && !ratingSent && (
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 20, marginBottom: 20, maxWidth: 480 }}>
              <b style={{ display: 'block', fontSize: 13.5, marginBottom: 12 }}>Laisser un avis</b>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRatingForm({ ...ratingForm, rating: n })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: n <= ratingForm.rating ? 'var(--gold)' : 'var(--line)' }}>★</button>
                ))}
              </div>
              <textarea
                value={ratingForm.comment}
                onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                placeholder="Votre avis (facultatif)"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', marginBottom: 12, resize: 'vertical' }}
              />
              <button type="button" onClick={submitReview} disabled={ratingBusy} className="btn gold">
                {ratingBusy ? 'Envoi…' : "Envoyer l'avis"}
              </button>
            </div>
          )}
          {ratingSent && <div className="msg-banner success" style={{ maxWidth: 480 }}>Merci pour votre avis !</div>}

          {reviews.length === 0 && (
            <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>Aucun avis pour l&apos;instant.</p>
          )}
          {reviews.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 80 }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 18px', maxWidth: 560 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <b style={{ fontSize: 13 }}>{r.learner?.name || 'Apprenant'}</b>
                    <span style={{ fontSize: 12.5, color: 'var(--gold)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 13, color: 'var(--muted)' }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function CenteredMessage({ title, text, link }) {
  return (
    <section style={{ padding: '96px 0', textAlign: 'center' }}>
      <div className="wrap">
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: link ? 20 : 0 }}>{text}</p>
        {link && <a href={link.href} style={{ color: 'var(--teal)', fontWeight: 600, fontSize: 13.5 }}>{link.label}</a>}
      </div>
    </section>
  );
}
