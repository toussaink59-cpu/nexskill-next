'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Le lien reçu par e-mail ouvre une session "recovery" temporaire automatiquement.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 8) { setMsg({ text: 'Le mot de passe doit contenir au moins 8 caractères.', type: 'error' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setMsg({ text: error.message, type: 'error' }); return; }
    setDone(true);
  }

  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <div className="logo">Nex<span>Skill</span></div>
          <a href="/compte" className="back-link">← Retour à la connexion</a>
        </div>
      </nav>

      <section style={{ padding: '64px 0 96px' }}>
        <div className="wrap" style={{ maxWidth: 460 }}>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: 36, boxShadow: '0 20px 44px rgba(11,17,32,.06)' }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Choisir un nouveau mot de passe</h1>

            {!ready && !done && (
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                Ouvrez cette page depuis le lien reçu par e-mail pour continuer.
              </p>
            )}

            {ready && !done && (
              <form onSubmit={handleSubmit} noValidate>
                {msg && <div className={'msg-banner ' + msg.type}>{msg.text}</div>}
                <div className="field">
                  <label>Nouveau mot de passe</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  <div className="hint">8 caractères minimum.</div>
                </div>
                <button type="submit" className="btn gold" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
                </button>
              </form>
            )}

            {done && (
              <div className="msg-banner success">
                Mot de passe mis à jour. Vous pouvez maintenant{' '}
                <a href="/compte" style={{ fontWeight: 700 }}>vous connecter</a>.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
