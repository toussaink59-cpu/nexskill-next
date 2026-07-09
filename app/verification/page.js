'use client';
import { useState, useEffect } from 'react';

const FILIERE_LABELS = {
  developpement: "Développement logiciel", cybersecurite: "Cybersécurité", ia: "Intelligence artificielle",
  marketing: "Marketing digital", entrepreneuriat: "Entrepreneuriat", finance: "Finance & comptabilité",
  design: "Design graphique", video: "Montage vidéo", bureautique: "Bureautique", langues: "Langues"
};

export default function VerificationPage() {
  const [certId, setCertId] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | valid | invalid
  const [certificate, setCertificate] = useState(null);
  const [notFoundId, setNotFoundId] = useState('');

  async function doVerify(rawId) {
    const id = rawId.trim().toUpperCase();
    if (!id) { setStatus('idle'); return; }
    setStatus('loading');
    try {
      const res = await fetch('/api/certificates?id=' + encodeURIComponent(id));
      if (res.status === 404) { setNotFoundId(id); setStatus('invalid'); return; }
      if (!res.ok) { setNotFoundId(id); setStatus('invalid'); return; }
      const data = await res.json();
      setCertificate(data.certificate);
      setStatus('valid');
    } catch (err) {
      setNotFoundId(id);
      setStatus('invalid');
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam) {
      setCertId(idParam.toUpperCase());
      doVerify(idParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <div className="logo">Nex<span>Skill</span></div>
          <div className="nav-links">
            <a href="/catalogue" className="back-link">Catalogue</a>
            <a href="/offres" className="back-link">Offres d&apos;emploi</a>
            <a href="/compte" className="back-link">Mon compte</a>
            <a href="/" className="back-link">← Accueil</a>
          </div>
        </div>
      </nav>

      <section style={{ padding: '72px 0 100px', textAlign: 'center' }}>
        <div className="wrap" style={{ maxWidth: 920, margin: '0 auto' }}>
          <div className="eyebrow">Vérification publique</div>
          <h1 style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 14 }}>
            Un certificat NexSkill se vérifie en quelques secondes
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 520, margin: '0 auto 36px' }}>
            Entrez l&apos;identifiant présent sous le QR code du certificat pour confirmer son authenticité.
          </p>

          <div style={{ display: 'flex', gap: 10, maxWidth: 460, margin: '0 auto 8px' }}>
            <input
              type="text"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doVerify(certId); }}
              placeholder="Ex. NS-DEMO01"
              style={{ flex: 1, padding: '14px 16px', border: '1.5px solid var(--line)', borderRadius: 9, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '.03em', textTransform: 'uppercase' }}
            />
            <button
              type="button"
              onClick={() => doVerify(certId)}
              disabled={status === 'loading'}
              style={{ padding: '14px 24px', borderRadius: 9, border: 'none', background: 'var(--gold)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              {status === 'loading' ? (
                <>
                  <span className="loading-dot"></span><span className="loading-dot"></span><span className="loading-dot"></span>
                </>
              ) : 'Vérifier'}
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 56 }}>
            Pas d&apos;identifiant sous la main ?{' '}
            <button
              type="button"
              onClick={() => { setCertId('NS-DEMO01'); doVerify('NS-DEMO01'); }}
              style={{ background: 'none', border: 'none', color: 'var(--teal)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontSize: 12.5 }}
            >
              Tester avec le certificat de démonstration
            </button>
          </div>

          <div style={{ maxWidth: 460, margin: '0 auto', minHeight: 40, textAlign: 'left' }}>
            {status === 'idle' && (
              <div style={{ background: 'var(--surface)', border: '1px dashed var(--line)', borderRadius: 14, padding: 32 }}>
                <b style={{ display: 'block', fontSize: 14.5, marginBottom: 6 }}>Aucun certificat consulté pour l&apos;instant</b>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Saisissez un identifiant ci-dessus pour afficher son statut de vérification.</span>
              </div>
            )}
            {status === 'invalid' && (
              <div style={{ background: 'var(--danger-light)', borderRadius: 14, padding: 28 }}>
                <b style={{ display: 'block', fontSize: 14.5, color: 'var(--danger)', marginBottom: 6 }}>Certificat introuvable</b>
                <span style={{ fontSize: 13, color: '#7A2E22' }}>
                  Aucun certificat ne correspond à l&apos;identifiant « {notFoundId} ». Vérifiez qu&apos;il a été saisi exactement comme indiqué sous le QR code.
                </span>
              </div>
            )}
            {status === 'valid' && certificate && (
              <div style={{ background: 'var(--navy)', borderRadius: 18, padding: 30, color: '#fff', boxShadow: '0 24px 48px rgba(11,17,32,.24)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>Nex<span style={{ color: 'var(--gold-bright)' }}>Skill</span></div>
                  <div style={{ background: 'var(--teal)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 999, letterSpacing: '.03em', textTransform: 'uppercase' }}>✓ Valide</div>
                </div>
                <div style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8E9BC2', marginBottom: 6 }}>Certificat délivré à</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>{certificate.learner_name}</div>
                <div style={{ fontSize: 13.5, color: '#C7D0EA', marginBottom: 22 }}>
                  {certificate.course} · {FILIERE_LABELS[certificate.filiere] || certificate.filiere}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid #2A3557', paddingTop: 20 }}>
                  <div><span style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#8E9BC2' }}>Durée</span><div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{certificate.hours} heures</div></div>
                  <div><span style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#8E9BC2' }}>Niveau</span><div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{certificate.level}</div></div>
                  <div><span style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#8E9BC2' }}>Date</span><div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{new Date(certificate.issued_at).toLocaleDateString('fr-FR')}</div></div>
                  <div><span style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#8E9BC2' }}>Statut</span><div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3, color: '#6FDDBB' }}>Vérifié</div></div>
                </div>
                <div style={{ marginTop: 20, fontSize: 11.5, color: '#8E9BC2', fontFamily: "'Space Grotesk', sans-serif" }}>Identifiant : {certificate.id}</div>
              </div>
            )}
          </div>

          <div style={{ maxWidth: 460, margin: '56px auto 0', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 22px', textAlign: 'left' }}>
            <b style={{ display: 'block', fontSize: 13.5, marginBottom: 4 }}>Comment ça marche</b>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Chaque certificat NexSkill porte un identifiant unique et un QR code menant à cette page — aucune donnée n&apos;est modifiable après émission.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
