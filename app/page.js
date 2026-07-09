export default function HomePage() {
  return (
    <>
      <nav className="nav">
        <div className="wrap">
          <div className="logo">Nex<span>Skill</span></div>
          <div className="nav-links">
            <a href="/catalogue" className="back-link">Catalogue</a>
            <a href="/offres" className="back-link">Offres d&apos;emploi</a>
            <a href="/verification" className="back-link">Vérifier un certificat</a>
          </div>
          <a href="/compte" className="nav-cta">Commencer</a>
        </div>
      </nav>

      <section style={{ paddingTop: 72 }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div className="eyebrow">Afrique francophone · Maroc</div>
            <h1 style={{ fontSize: 44, lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 22 }}>
              Une formation qui <span style={{ color: 'var(--gold)' }}>se prouve</span>, pas seulement qui se suit.
            </h1>
            <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 480, marginBottom: 32 }}>
              Des compétences pratiques dans 11 filières, un certificat vérifiable par QR code, et un accès direct aux entreprises qui recrutent. Payez en Mobile Money, apprenez même sans connexion stable.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/catalogue" className="btn gold">Commencer une formation</a>
              <a href="/compte" className="btn outline">Devenir formateur</a>
            </div>
            <div style={{ display: 'flex', gap: 36, marginTop: 44 }}>
              <div><b style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, display: 'block' }}>11</b><span style={{ fontSize: 12.5, color: 'var(--muted)' }}>filières au lancement</span></div>
              <div><b style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, display: 'block' }}>4+2</b><span style={{ fontSize: 12.5, color: 'var(--muted)' }}>pays couverts</span></div>
              <div><b style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, display: 'block' }}>100%</b><span style={{ fontSize: 12.5, color: 'var(--muted)' }}>certificats vérifiables</span></div>
            </div>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 340 }}>
            <div style={{ position: 'absolute', width: 340, height: 340, background: 'radial-gradient(circle, var(--gold-light) 0%, transparent 70%)', opacity: .5 }}></div>
            <a href="/verification?id=NS-DEMO01" style={{ width: 300, background: 'var(--navy)', borderRadius: 16, padding: 26, color: '#fff', transform: 'rotate(-4deg)', boxShadow: '0 24px 48px rgba(11,17,32,.28)', position: 'relative', zIndex: 2, textDecoration: 'none', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 26 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>Nex<span style={{ color: 'var(--gold-bright)' }}>Skill</span></div>
              </div>
              <div style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8E9BC2', marginBottom: 6 }}>Certificat délivré à</div>
              <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 18 }}>Aïcha Konaté</div>
              <div style={{ fontSize: 12.5, color: '#C7D0EA', marginBottom: 22 }}>Bases du pentest offensif · 24h · Niveau intermédiaire</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: '#8E9BC2', marginBottom: 2 }}>Statut</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#6FDDBB' }}>Valide</div>
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 11.5, color: '#9AA6C9' }}>Cliquez pour vérifier ce certificat →</div>
            </a>
          </div>
        </div>
      </section>

      <section id="filieres">
        <div className="wrap">
          <div className="section-head" style={{ maxWidth: 560, marginBottom: 44 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Filières</div>
            <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em' }}>Onze parcours choisis pour leur employabilité</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {[
              ['Développement logiciel', 'Web, mobile, systèmes'],
              ['Cybersécurité', 'Laboratoires offensifs et défensifs'],
              ['Intelligence artificielle', 'Machine learning appliqué'],
              ['Marketing digital', 'Acquisition et mesure de performance'],
              ['Entrepreneuriat', "De l'idée au premier client"],
              ['Finance & comptabilité', 'Fiscalité locale, outils pro'],
              ['Design graphique', 'Identité visuelle, portfolio'],
              ['Montage vidéo', 'Narration, motion design'],
              ['Bureautique', 'Outils du quotidien professionnel'],
              ['Langues', 'Français, anglais professionnel'],
              ['Concours & certifications', 'Préparation ciblée aux examens']
            ].map(([title, text]) => (
              <div key={title} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
                <h4 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 5 }}>{title}</h4>
                <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>{text}</p>
              </div>
            ))}
            <div style={{ background: 'var(--navy)', borderRadius: 12, padding: 20 }}>
              <h4 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 5, color: '#fff' }}>Et bientôt plus</h4>
              <p style={{ fontSize: 12.5, color: '#9AA6C9' }}>Le catalogue s&apos;élargit chaque trimestre</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--navy)', color: '#fff' }} id="comment">
        <div className="wrap">
          <div style={{ maxWidth: 560, marginBottom: 44 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Comment ça marche</div>
            <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em', color: '#fff' }}>Trois étapes, du premier cours au recrutement</h2>
            <p style={{ color: '#9AA6C9', fontSize: 15, marginTop: 12 }}>Le parcours est le même quelle que soit la filière choisie.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              ['01', 'Apprenez en pratiquant', 'Vidéos, supports téléchargeables et laboratoires interactifs — pas seulement des cours à regarder passivement.'],
              ['02', 'Obtenez un certificat vérifiable', "Chaque certificat porte un QR code menant à une page de vérification publique — consultable par n'importe quel recruteur."],
              ['03', 'Soyez visible des entreprises', 'Avec votre consentement, votre profil certifié apparaît dans les recherches des entreprises qui recrutent dans votre filière.']
            ].map(([n, title, text]) => (
              <div key={n} style={{ border: '1px solid #2A3557', borderRadius: 14, padding: 26 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: 'var(--gold-bright)', fontWeight: 700, marginBottom: 14 }}>{n}</div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: '#A9B4D4' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="profils">
        <div className="wrap">
          <div style={{ maxWidth: 560, marginBottom: 44 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Pour qui</div>
            <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em' }}>Une plateforme, trois façons d&apos;y participer</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              ['Apprenant', 'Montez en compétence, prouvez-le', 'Choisissez une filière, avancez à votre rythme même hors ligne, et obtenez un certificat que les employeurs peuvent vérifier en un clic.', '/catalogue', 'Voir le catalogue →'],
              ['Formateur', 'Transmettez votre expertise', 'Publiez une formation, suivez vos inscriptions et vos revenus, sans avoir à gérer de production vidéo complexe.', '/compte', 'Devenir formateur →'],
              ['Entreprise', 'Recrutez sur preuve, pas sur promesse', 'Publiez une offre et consultez des profils dont les compétences ont déjà été vérifiées par la pratique.', '/compte', 'Publier une offre →']
            ].map(([tag, title, text, href, cta]) => (
              <div key={tag} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 30, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--teal)', background: 'var(--teal-light)', padding: '4px 10px', borderRadius: 999, display: 'inline-block', marginBottom: 18, width: 'fit-content' }}>{tag}</span>
                <h3 style={{ fontSize: 19, fontWeight: 600, marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 22, flex: 1 }}>{text}</p>
                <a href={href} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>{cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }} id="paiement">
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 56, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 16, letterSpacing: '-0.01em' }}>Pensé pour les réalités locales</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14.5, marginBottom: 22 }}>Payez avec les moyens que vous utilisez déjà, et continuez à apprendre même quand la connexion se coupe.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['Orange Money', 'Wave', 'MTN Mobile Money', 'Moov Money', 'Carte bancaire'].map((p) => (
                <span key={p} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--navy)' }}>{p}</span>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 14, padding: 24 }}>
            {[
              ['Mode hors ligne', 'Téléchargez une leçon en Wi-Fi, suivez-la sans connexion.'],
              ['Reprise automatique', 'La lecture reprend exactement où vous vous êtes arrêté.'],
              ['Prix en devise locale', 'Affichage automatique selon votre pays.']
            ].map(([title, text], i) => (
              <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 2 ? 16 : 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', marginTop: 7, flexShrink: 0 }}></div>
                <div><b style={{ fontSize: 13.5, display: 'block', marginBottom: 2 }}>{title}</b><span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{text}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ textAlign: 'center' }}>
        <div className="wrap">
          <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 18 }}>Prêt à faire vérifier vos compétences ?</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 30, fontSize: 15 }}>Rejoignez NexSkill et commencez votre première formation dès aujourd&apos;hui.</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <a href="/compte" className="btn gold">Créer un compte gratuit</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div>
            <div className="logo">Nex<span style={{ color: '#D89238' }}>Skill</span></div>
            <p style={{ marginTop: 14, maxWidth: 220, color: '#8E9BC2' }}>La formation professionnelle qui se prouve. Pensée pour l&apos;Afrique francophone et le Maroc.</p>
          </div>
          <div className="cols">
            <div className="col">
              <h5>Plateforme</h5>
              <a href="/catalogue">Catalogue</a>
              <a href="/offres">Offres d&apos;emploi</a>
              <a href="/verification">Vérifier un certificat</a>
            </div>
            <div className="col">
              <h5>Profils</h5>
              <a href="/compte">Apprenant</a>
              <a href="/compte">Formateur</a>
              <a href="/compte">Entreprise</a>
            </div>
            <div className="col">
              <h5>Légal</h5>
              <a href="#">Conditions d&apos;utilisation</a>
              <a href="#">Confidentialité</a>
            </div>
          </div>
        </div>
        <div className="wrap foot-bottom">© 2026 NexSkill. Tous droits réservés.</div>
      </footer>
    </>
  );
}
