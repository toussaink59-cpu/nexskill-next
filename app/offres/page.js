'use client';
import { useState, useEffect, useMemo } from 'react';

const FILIERE_LABELS = {
  developpement: "Développement logiciel", cybersecurite: "Cybersécurité", ia: "Intelligence artificielle",
  marketing: "Marketing digital", entrepreneuriat: "Entrepreneuriat", finance: "Finance & comptabilité",
  design: "Design graphique", video: "Montage vidéo", bureautique: "Bureautique", langues: "Langues"
};

export default function OffresPage() {
  const [offers, setOffers] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [activeFiliere, setActiveFiliere] = useState('tous');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/offers')
      .then((res) => { if (!res.ok) throw new Error('failed'); return res.json(); })
      .then((data) => { setOffers(data.offers || []); setLoadState('ready'); })
      .catch(() => setLoadState('error'));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return offers.filter((o) => {
      const matchFiliere = activeFiliere === 'tous' || o.filiere === activeFiliere;
      const matchSearch = !term || o.title.toLowerCase().includes(term) || (o.description || '').toLowerCase().includes(term);
      return matchFiliere && matchSearch;
    });
  }, [offers, activeFiliere, search]);

  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <div className="logo">Nex<span>Skill</span></div>
          <div className="nav-links">
            <a href="/catalogue" className="back-link">Catalogue</a>
            <a href="/verification" className="back-link">Vérifier un certificat</a>
            <a href="/" className="back-link">← Accueil</a>
            <a href="/compte" className="nav-cta">Mon compte</a>
          </div>
        </div>
      </nav>

      <section style={{ padding: '56px 0 12px' }}>
        <div className="wrap">
          <div className="eyebrow">Recrutement</div>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 10 }}>Des offres pour des profils déjà vérifiés</h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', maxWidth: 560, marginBottom: 32 }}>
            Chaque entreprise inscrite peut publier une offre depuis son tableau de bord. Filtrez par filière pour trouver les postes qui correspondent à votre certificat.
          </p>
        </div>
      </section>

      <section style={{ position: 'sticky', top: 65, zIndex: 40, background: 'var(--bg)', padding: '14px 0 20px', borderBottom: '1px solid var(--line)', marginBottom: 32 }}>
        <div className="wrap">
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une offre (ex. développeur, comptable, community manager…)"
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
          {loadState === 'loading' && <EmptyBlock title="Chargement des offres…" text="Un instant." />}
          {loadState === 'error' && <EmptyBlock title="Impossible de charger les offres" text="Vérifiez votre connexion et réessayez." />}
          {loadState === 'ready' && filtered.length === 0 && <EmptyBlock title="Aucune offre publiée pour l'instant" text="Les entreprises inscrites peuvent en publier depuis leur tableau de bord." />}
          {loadState === 'ready' && filtered.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 90 }}>
              {filtered.map((o) => (
                <div key={o.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', background: 'var(--teal-light)', padding: '4px 10px', borderRadius: 999, display: 'inline-block', marginBottom: 10 }}>
                      {FILIERE_LABELS[o.filiere] || o.filiere}
                    </span>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{o.title}</h4>
                    {o.description && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{o.description}</div>}
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Publiée par {o.company_name || 'une entreprise NexSkill'}</div>
                  </div>
                  <a href="/compte" className="btn gold" style={{ whiteSpace: 'nowrap' }}>Postuler</a>
                </div>
              ))}
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
