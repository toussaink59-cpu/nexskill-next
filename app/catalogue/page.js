'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

const FILIERE_LABELS = {
  developpement: "Développement logiciel", cybersecurite: "Cybersécurité", ia: "Intelligence artificielle",
  marketing: "Marketing digital", entrepreneuriat: "Entrepreneuriat", finance: "Finance & comptabilité",
  design: "Design graphique", video: "Montage vidéo", bureautique: "Bureautique", langues: "Langues"
};

export default function CataloguePage() {
  const [courses, setCourses] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [activeFiliere, setActiveFiliere] = useState('tous');
  const [search, setSearch] = useState('');
  const [session, setSession] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null); // id de la formation en cours d'inscription
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [feedback, setFeedback] = useState(null); // { text, type }

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => { if (!res.ok) throw new Error('failed'); return res.json(); })
      .then((data) => { setCourses(data.courses || []); setLoadState('ready'); })
      .catch(() => setLoadState('error'));

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((c) => {
      const matchFiliere = activeFiliere === 'tous' || c.filiere === activeFiliere;
      const matchSearch = !term || c.title.toLowerCase().includes(term) || (FILIERE_LABELS[c.filiere] || '').toLowerCase().includes(term);
      return matchFiliere && matchSearch;
    });
  }, [courses, activeFiliere, search]);
function handleCardAction(c) {
    if (!session) { window.location.href = '/compte'; return; }
    if (Number(c.price) > 0) { window.location.href = '/paiement?course=' + c.id; return; }
    handleEnroll(c.id);
  }
  async function handleEnroll(courseId) {
    setFeedback(null);

    // Pas connecté : on redirige vers l'espace compte plutôt que d'échouer silencieusement.
    if (!session) {
      window.location.href = '/compte';
      return;
    }

    setEnrollingId(courseId);
    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({ course_id: courseId }),
    });
    const data = await res.json().catch(() => ({}));
    setEnrollingId(null);

    if (!res.ok) {
      // 409 = déjà inscrit : on le traite comme un succès côté affichage.
      if (res.status === 409) {
        setEnrolledIds((prev) => new Set(prev).add(courseId));
        setFeedback({ text: 'Vous êtes déjà inscrit à cette formation.', type: 'success' });
        return;
      }
      setFeedback({ text: data.error || "L'inscription a échoué.", type: 'error' });
      return;
    }

    setEnrolledIds((prev) => new Set(prev).add(courseId));
    setFeedback({ text: 'Inscription confirmée ! Retrouvez cette formation dans votre espace compte.', type: 'success' });
  }

  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <div className="logo">Nex<span>Skill</span></div>
          <div className="nav-links">
            <a href="/offres" className="back-link">Offres d&apos;emploi</a>
            <a href="/verification" className="back-link">Vérifier un certificat</a>
            <a href="/" className="back-link">← Accueil</a>
            <a href="/compte" className="nav-cta">Mon compte</a>
          </div>
        </div>
      </nav>

      <section style={{ padding: '56px 0 12px' }}>
        <div className="wrap">
          <div className="eyebrow">Catalogue</div>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 10 }}>Onze filières, des formations concrètes</h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', maxWidth: 560, marginBottom: 32 }}>
            Filtrez par filière ou recherchez une compétence précise. Les formations marquées « communauté » ont été publiées par des formateurs indépendants sur NexSkill.
          </p>
          {feedback && <div className={'msg-banner ' + feedback.type} style={{ maxWidth: 560 }}>{feedback.text}</div>}
        </div>
      </section>

      <section style={{ position: 'sticky', top: 65, zIndex: 40, background: 'var(--bg)', padding: '14px 0 20px', borderBottom: '1px solid var(--line)', marginBottom: 32 }}>
        <div className="wrap">
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une formation (ex. montage, cybersécurité, comptabilité…)"
              style={{ width: '100%', maxWidth: 420, padding: '12px 16px', border: '1.5px solid var(--line)', borderRadius: 9, fontSize: 14, background: '#fff' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['tous', ...Object.keys(FILIERE_LABELS)].map((f) => (
              <button key={f} type="button" onClick={() => setActiveFiliere(f)}
                style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 999, border: '1.5px solid ' + (activeFiliere === f ? 'var(--teal)' : 'var(--line)'), background: activeFiliere === f ? 'var(--teal-light)' : '#fff', color: activeFiliere === f ? 'var(--teal)' : 'var(--muted)', cursor: 'pointer' }}>
                {f === 'tous' ? 'Toutes les filières' : FILIERE_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          {loadState === 'loading' && <EmptyBlock title="Chargement du catalogue…" text="Un instant." />}
          {loadState === 'error' && <EmptyBlock title="Impossible de charger le catalogue" text="Vérifiez votre connexion et réessayez." />}
          {loadState === 'ready' && filtered.length === 0 && <EmptyBlock title="Aucune formation ne correspond à cette recherche" text="Essayez une autre filière ou un autre mot-clé." />}
          {loadState === 'ready' && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, paddingBottom: 80 }}>
              {filtered.map((c) => {
                const isEnrolled = enrolledIds.has(c.id);
                const isEnrolling = enrollingId === c.id;
                return (
                  <div key={c.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', background: 'var(--teal-light)', padding: '4px 10px', borderRadius: 999 }}>
                        {FILIERE_LABELS[c.filiere] || c.filiere}
                      </span>
                      {c.source === 'community' && (
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--gold)', background: 'var(--gold-light)', padding: '4px 9px', borderRadius: 999 }}>Communauté</span>
                      )}
                    </div>
                    <h4 style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 8 }}>{c.title}</h4>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18, flex: 1 }}>{c.duration || '—'} heures · Niveau intermédiaire</div>
                    {c.source === 'community' && c.trainer_name && (
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 14 }}>Par {c.trainer_name}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCardAction(c)}
                      disabled={isEnrolling || isEnrolled}
                      className="btn gold"
                      style={{ textAlign: 'center', justifyContent: 'center', opacity: isEnrolled ? 0.7 : 1, cursor: isEnrolled ? 'default' : 'pointer' }}
                    >
                      {isEnrolled ? 'Déjà inscrit ✓' : isEnrolling ? 'Inscription…' : Number(c.price) > 0 ? `Payer ${Number(c.price).toLocaleString('fr-FR')} FCFA` : "S'inscrire (gratuit)"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function EmptyBlock({ title, text }) {
  return (
    <div style={{ background: '#fff', border: '1px dashed var(--line)', borderRadius: 14, padding: 36, textAlign: 'center', marginBottom: 40 }}>
      <b style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>{title}</b>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{text}</span>
    </div>
  );
}
