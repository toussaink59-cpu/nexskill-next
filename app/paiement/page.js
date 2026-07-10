'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const PROVIDERS = [
  { id: 'orange_money', label: 'Orange Money' },
  { id: 'wave', label: 'Wave' },
  { id: 'mtn', label: 'MTN Mobile Money' },
  { id: 'moov', label: 'Moov Money' },
  { id: 'stripe', label: 'Carte bancaire' },
];

const FILIERE_LABELS = {
  developpement: "Développement logiciel", cybersecurite: "Cybersécurité", ia: "Intelligence artificielle",
  marketing: "Marketing digital", entrepreneuriat: "Entrepreneuriat", finance: "Finance & comptabilité",
  design: "Design graphique", video: "Montage vidéo", bureautique: "Bureautique", langues: "Langues"
};

export default function PaiementPage() {
  const [courseId, setCourseId] = useState(null);
  const [course, setCourse] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [session, setSession] = useState(null);
  const [provider, setProvider] = useState(PROVIDERS[0].id);
  const [step, setStep] = useState('choose');
  const [payment, setPayment] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCourseId(params.get('course'));

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = '/compte'; return; }
      setSession(data.session);
    });
  }, []);

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
  }, [courseId]);

  async function authFetch(url, options = {}) {
    const token = session?.access_token;
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(options.headers || {}) },
    });
  }

  async function startPayment() {
    setFeedback(null);
    setBusy(true);
    const res = await authFetch('/api/payments', { method: 'POST', body: JSON.stringify({ course_id: courseId, provider }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setFeedback({ text: data.error || "Impossible d'initier le paiement.", type: 'error' }); return; }
    setPayment(data.payment);
    setStep('confirming');
  }

  async function confirmPayment() {
    setFeedback(null);
    setBusy(true);
    const res = await authFetch(`/api/payments/${payment.id}/confirm`, { method: 'POST' });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setFeedback({ text: data.error || 'La confirmation a échoué.', type: 'error' }); return; }
    setStep('done');
  }

  if (!session || loadState === 'loading') {
    return <CenteredMessage title="Chargement…" text="Un instant." />;
  }
  if (loadState === 'notfound') {
    return <CenteredMessage title="Formation introuvable" text="Retournez au catalogue pour choisir une formation." link={{ href: '/catalogue', label: '← Retour au catalogue' }} />;
  }
  if (loadState === 'error') {
    return <CenteredMessage title="Une erreur est survenue" text="Vérifiez votre connexion et réessayez." />;
  }

  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <div className="logo">Nex<span>Skill</span></div>
          <div className="nav-links">
            <a href="/catalogue" className="back-link">← Catalogue</a>
            <a href="/compte" className="nav-cta">Mon compte</a>
          </div>
        </div>
      </nav>

      <section style={{ padding: '64px 0 96px' }}>
        <div className="wrap" style={{ maxWidth: 480 }}>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 36, boxShadow: '0 20px 44px rgba(11,17,32,.06)' }}>

            <div style={{ marginBottom: 26 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', background: 'var(--teal-light)', padding: '4px 10px', borderRadius: 999 }}>
                {FILIERE_LABELS[course.filiere] || course.filiere}
              </span>
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: '12px 0 6px' }}>{course.title}</h1>
              <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>{course.duration || '—'} heures de formation</p>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '18px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Montant à payer</span>
              <b style={{ fontSize: 20, fontFamily: "'Space Grotesk', sans-serif" }}>
                {Number(course.price).toLocaleString('fr-FR')} {course.currency || 'XOF'}
              </b>
            </div>

            {feedback && <div className={'msg-banner ' + feedback.type}>{feedback.text}</div>}

            {step === 'choose' && (
              <>
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 10 }}>Moyen de paiement</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {PROVIDERS.map((p) => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', border: '1.5px solid ' + (provider === p.id ? 'var(--teal)' : 'var(--line)'), borderRadius: 10, cursor: 'pointer', background: provider === p.id ? 'var(--teal-light)' : '#fff' }}>
                        <input type="radio" name="provider" value={p.id} checked={provider === p.id} onChange={() => setProvider(p.id)} />
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={startPayment} disabled={busy} className="btn gold" style={{ width: '100%', justifyContent: 'center' }}>
                  {busy ? 'Un instant…' : 'Procéder au paiement'}
                </button>
              </>
            )}

            {step === 'confirming' && (
              <>
                <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
                  Une demande de paiement a été envoyée. En conditions réelles, vous recevriez une notification sur votre téléphone pour valider la transaction {PROVIDERS.find((p) => p.id === provider)?.label}.
                  Cliquez ci-dessous une fois le paiement validé.
                </p>
                <button type="button" onClick={confirmPayment} disabled={busy} className="btn gold" style={{ width: '100%', justifyContent: 'center' }}>
                  {busy ? 'Vérification…' : "J'ai validé le paiement"}
                </button>
              </>
            )}

            {step === 'done' && (
              <>
                <div className="msg-banner success">Paiement confirmé, vous êtes inscrit à la formation !</div>
                <a href="/compte" className="btn gold" style={{ width: '100%', justifyContent: 'center', textAlign: 'center', display: 'flex' }}>
                  Voir mes formations
                </a>
              </>
            )}
          </div>
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
