'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ROLE_COPY = {
  apprenant: { label: 'Apprenant', extraLabel: "Filière d'intérêt", cta: 'Générer mon certificat' },
  formateur: { label: 'Formateur', extraLabel: 'Domaine d\'expertise', cta: 'Publier une formation' },
  entreprise: { label: 'Entreprise', extraLabel: "Secteur d'activité", cta: 'Publier une offre' }
};
const FILIERES = ['developpement','cybersecurite','ia','marketing','entrepreneuriat','finance','design','video','bureautique','langues'];
const FILIERE_LABELS = {
  developpement: "Développement logiciel", cybersecurite: "Cybersécurité", ia: "Intelligence artificielle",
  marketing: "Marketing digital", entrepreneuriat: "Entrepreneuriat", finance: "Finance & comptabilité",
  design: "Design graphique", video: "Montage vidéo", bureautique: "Bureautique", langues: "Langues"
};
const STATUS_LABELS = { active: 'En cours', completed: 'Terminée', cancelled: 'Annulée' };

export default function ComptePage() {
  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [role, setRole] = useState('apprenant');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [extra, setExtra] = useState(FILIERES[0]);
  const [msg, setMsg] = useState(null); // { text, type }
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [certResult, setCertResult] = useState(null);
  const [courseForm, setCourseForm] = useState({ title: '', filiere: FILIERES[0], duration: 10 });
  const [offerForm, setOfferForm] = useState({ title: '', filiere: FILIERES[0], description: '' });
  const [actionResult, setActionResult] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsState, setEnrollmentsState] = useState('idle'); // idle | loading | ready | error

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) loadProfile(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) loadProfile(newSession);
      else { setSession(null); setProfile(null); }
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile(sess) {
    setSession(sess);
    const { data, error } = await supabase.from('profiles').select('name, role, extra').eq('id', sess.user.id).single();
    if (!error && data) {
      setProfile(data);
      if (data.role === 'apprenant') loadEnrollments(sess);
    }
  }

  async function loadEnrollments(sess) {
    setEnrollmentsState('loading');
    const res = await fetch('/api/enrollments', {
      headers: { Authorization: 'Bearer ' + sess.access_token },
    });
    if (!res.ok) { setEnrollmentsState('error'); return; }
    const data = await res.json();
    setEnrollments(data.enrollments || []);
    setEnrollmentsState('ready');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (mode === 'forgot') {
      if (!email.trim()) { setMsg({ text: 'Indiquez votre adresse e-mail.', type: 'error' }); return; }
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/reset-password' : undefined
      });
      setLoading(false);
      if (error) { setMsg({ text: error.message, type: 'error' }); return; }
      setMsg({ text: 'Si un compte existe avec cet e-mail, un lien de réinitialisation vient de lui être envoyé.', type: 'success' });
      return;
    }

    if (password.length < 8) { setMsg({ text: 'Le mot de passe doit contenir au moins 8 caractères.', type: 'error' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg({ text: 'Adresse e-mail invalide.', type: 'error' }); return; }

    setLoading(true);
    if (mode === 'signup') {
      if (name.trim().length < 2) { setLoading(false); setMsg({ text: 'Indiquez votre nom.', type: 'error' }); return; }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim(), role, extra } }
      });
      setLoading(false);
      if (error) { setMsg({ text: error.message, type: 'error' }); return; }
      if (data.session) {
        setMsg({ text: 'Compte créé avec succès.', type: 'success' });
        loadProfile(data.session);
      } else {
        setMsg({ text: 'Compte créé ! Vérifiez votre boîte e-mail pour confirmer votre adresse avant de vous connecter.', type: 'success' });
        setMode('login');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (error) { setMsg({ text: error.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : error.message, type: 'error' }); return; }
      setMsg({ text: 'Connexion réussie.', type: 'success' });
      loadProfile(data.session);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setCertResult(null);
    setActionResult(null);
    setEnrollments([]);
    setMode('login');
  }

  async function authFetch(url, options = {}) {
    const token = session?.access_token;
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(options.headers || {}) }
    });
  }

  async function generateCertificate() {
    setActionResult(null);
    const res = await authFetch('/api/certificates', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) { setActionResult({ text: data.error || 'Échec de la génération.', type: 'error' }); return; }
    setCertResult(data.certificate);
    setActionResult({ text: null, type: 'success' });
  }

  async function publishCourse() {
    setActionResult(null);
    if (courseForm.title.trim().length < 3) { setActionResult({ text: 'Titre trop court.', type: 'error' }); return; }
    const res = await authFetch('/api/courses', { method: 'POST', body: JSON.stringify(courseForm) });
    const data = await res.json();
    if (!res.ok) { setActionResult({ text: data.error || 'Échec de la publication.', type: 'error' }); return; }
    setActionResult({ text: `« ${data.course.title} » publiée. Voir le catalogue.`, type: 'success' });
    setCourseForm({ title: '', filiere: FILIERES[0], duration: 10 });
  }

  async function publishOffer() {
    setActionResult(null);
    if (offerForm.title.trim().length < 3) { setActionResult({ text: 'Intitulé trop court.', type: 'error' }); return; }
    const res = await authFetch('/api/offers', { method: 'POST', body: JSON.stringify(offerForm) });
    const data = await res.json();
    if (!res.ok) { setActionResult({ text: data.error || 'Échec de la publication.', type: 'error' }); return; }
    setActionResult({ text: `« ${data.offer.title} » publiée. Voir les offres.`, type: 'success' });
    setOfferForm({ title: '', filiere: FILIERES[0], description: '' });
  }

  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <div className="logo">Nex<span>Skill</span></div>
          <div className="nav-links">
            <a href="/catalogue" className="back-link">Catalogue</a>
            <a href="/offres" className="back-link">Offres d&apos;emploi</a>
            <a href="/verification" className="back-link">Vérifier un certificat</a>
            <a href="/" className="back-link">← Accueil</a>
          </div>
        </div>
      </nav>

      <section style={{ padding: '64px 0 96px' }}>
        <div className="wrap" style={{ maxWidth: 520 }}>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 36, boxShadow: '0 20px 44px rgba(11,17,32,.06)' }}>

            {!session && (
              <>
                <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 8 }}>
                  {mode === 'signup' ? 'Créer un compte' : mode === 'forgot' ? 'Mot de passe oublié' : 'Connexion'}
                </h1>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 26 }}>
                  {mode === 'forgot' ? "On vous envoie un lien pour en choisir un nouveau." : 'Retrouvez vos formations, vos certificats ou vos offres.'}
                </p>

                {mode !== 'forgot' && (
                  <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 26 }}>
                    <button type="button" onClick={() => setMode('login')} style={{ flex: 1, padding: '10px 0', fontSize: 13.5, fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer', background: mode === 'login' ? 'var(--navy)' : 'transparent', color: mode === 'login' ? '#fff' : 'var(--muted)' }}>Connexion</button>
                    <button type="button" onClick={() => setMode('signup')} style={{ flex: 1, padding: '10px 0', fontSize: 13.5, fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer', background: mode === 'signup' ? 'var(--navy)' : 'transparent', color: mode === 'signup' ? '#fff' : 'var(--muted)' }}>Créer un compte</button>
                  </div>
                )}

                {mode === 'signup' && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    {Object.keys(ROLE_COPY).map((r) => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 999, border: '1.5px solid ' + (role === r ? 'var(--teal)' : 'var(--line)'), background: role === r ? 'var(--teal-light)' : 'transparent', color: role === r ? 'var(--teal)' : 'var(--muted)', cursor: 'pointer' }}>
                        {ROLE_COPY[r].label}
                      </button>
                    ))}
                  </div>
                )}

                {msg && <div className={'msg-banner ' + msg.type}>{msg.text}</div>}

                <form onSubmit={handleSubmit} noValidate>
                  {mode === 'signup' && (
                    <>
                      <div className="field">
                        <label>Nom complet</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                      </div>
                      <div className="field">
                        <label>{ROLE_COPY[role].extraLabel}</label>
                        <select value={extra} onChange={(e) => setExtra(e.target.value)}>
                          {FILIERES.map((f) => <option key={f} value={f}>{FILIERE_LABELS[f]}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="field">
                    <label>Adresse e-mail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  </div>
                  {mode !== 'forgot' && (
                    <div className="field">
                      <label>Mot de passe</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                      <div className="hint">8 caractères minimum.</div>
                    </div>
                  )}
                  <button type="submit" className="btn gold" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                    {loading ? (<><span className="loading-dot"></span><span className="loading-dot"></span><span className="loading-dot"></span></>) :
                      mode === 'signup' ? 'Créer mon compte' : mode === 'forgot' ? 'Envoyer le lien' : 'Se connecter'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 18 }}>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
                      Mot de passe oublié ?
                    </button>
                  )}
                  {mode === 'forgot' && (
                    <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
                      ← Retour à la connexion
                    </button>
                  )}
                </div>
              </>
            )}

            {session && profile && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gold-light)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                    {profile.name ? profile.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 600 }}>Bonjour, {profile.name}</h2>
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>{ROLE_COPY[profile.role]?.label}</p>
                  </div>
                </div>

                {actionResult?.text && <div className={'msg-banner ' + actionResult.type}>{actionResult.text}</div>}

                {profile.role === 'apprenant' && (
                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 22, marginBottom: 16 }}>
                    <b style={{ display: 'block', fontSize: 14, marginBottom: 12 }}>Mes formations</b>

                    {enrollmentsState === 'loading' && (
                      <p style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</p>
                    )}
                    {enrollmentsState === 'error' && (
                      <p style={{ fontSize: 13, color: 'var(--muted)' }}>Impossible de charger vos formations pour le moment.</p>
                    )}
                    {enrollmentsState === 'ready' && enrollments.length === 0 && (
                      <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                        Vous n&apos;êtes inscrit à aucune formation pour l&apos;instant.{' '}
                        <a href="/catalogue" style={{ color: 'var(--teal)', fontWeight: 600 }}>Parcourir le catalogue →</a>
                      </p>
                    )}
                    {enrollmentsState === 'ready' && enrollments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {enrollments.map((en) => (
                          <div key={en.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{en.course?.title || 'Formation'}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{FILIERE_LABELS[en.course?.filiere] || en.course?.filiere}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', background: 'var(--teal-light)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                              {STATUS_LABELS[en.status] || en.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {profile.role === 'apprenant' && (
                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 22, marginBottom: 16 }}>
                    <b style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Obtenir un certificat de démonstration</b>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Simulez la fin d&apos;une formation pour voir comment fonctionne un certificat vérifiable.</p>
                    <button type="button" onClick={generateCertificate} className="btn gold">Générer mon certificat</button>
                    {certResult && (
                      <div style={{ marginTop: 16, background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: 16, fontSize: 13 }}>
                        Certificat généré : <b style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{certResult.id}</b><br />
                        <a href={'/verification?id=' + certResult.id} style={{ color: 'var(--teal)', fontWeight: 600 }}>Voir la vérification →</a>
                      </div>
                    )}
                  </div>
                )}

                {profile.role === 'formateur' && (
                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 22, marginBottom: 16 }}>
                    <b style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Publier une formation</b>
                    <div className="field">
                      <label>Titre</label>
                      <input type="text" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="field">
                        <label>Filière</label>
                        <select value={courseForm.filiere} onChange={(e) => setCourseForm({ ...courseForm, filiere: e.target.value })}>
                          {FILIERES.map((f) => <option key={f} value={f}>{FILIERE_LABELS[f]}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Durée (heures)</label>
                        <input type="number" min="1" value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} />
                      </div>
                    </div>
                    <button type="button" onClick={publishCourse} className="btn gold">Publier la formation</button>
                  </div>
                )}

                {profile.role === 'entreprise' && (
                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 22, marginBottom: 16 }}>
                    <b style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Publier une offre</b>
                    <div className="field">
                      <label>Intitulé du poste</label>
                      <input type="text" value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>Filière recherchée</label>
                      <select value={offerForm.filiere} onChange={(e) => setOfferForm({ ...offerForm, filiere: e.target.value })}>
                        {FILIERES.map((f) => <option key={f} value={f}>{FILIERE_LABELS[f]}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Description courte</label>
                      <input type="text" value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} />
                    </div>
                    <button type="button" onClick={publishOffer} className="btn gold">Publier l&apos;offre</button>
                  </div>
                )}

                <button type="button" onClick={handleLogout} style={{ background: 'transparent', border: '1.5px solid var(--line)', color: 'var(--muted)', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Se déconnecter
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
