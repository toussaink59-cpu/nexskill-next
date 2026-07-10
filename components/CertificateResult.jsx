import styles from "./CertificateResult.module.css";

const QR_PATTERN = [
  1, 0, 1, 1, 0, 1,
  0, 1, 0, 1, 1, 0,
  1, 1, 1, 0, 1, 1,
  0, 1, 0, 1, 0, 1,
  1, 0, 1, 1, 1, 0,
  0, 1, 1, 0, 1, 1,
];

const STATUS_COPY = {
  valide: { label: "Valide", note: null },
  revoque: {
    label: "Révoqué",
    note: "Ce certificat a été révoqué par NexSkill et n'est plus valable comme preuve de compétence.",
  },
  expire: {
    label: "Expiré",
    note: "Ce certificat a dépassé sa durée de validité. La personne doit repasser la certification pour en obtenir une à jour.",
  },
};

function getStatusInfo(status) {
  return (
    STATUS_COPY[status] ?? {
      label: status,
      note: "Ce certificat affiche un statut non reconnu par le site. Contactez NexSkill pour confirmation.",
    }
  );
}

export function CertificateFound({ certificate }) {
  const isValid = certificate.status === "valide";
  const { label, note } = getStatusInfo(certificate.status);
  const issuedDate = new Date(certificate.issued_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} ${!isValid ? styles.cardRevoked : ""}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            Nex<span>Skill</span>
          </div>
        </div>
        <div className={styles.label}>Certificat délivré à</div>
        <div className={styles.name}>{certificate.learner_name}</div>
        <div className={styles.course}>
          {certificate.course} · {certificate.hours}h · Niveau {certificate.level}
        </div>
        <div className={styles.bottom}>
          <div>
            <div className={styles.label} style={{ marginBottom: 2 }}>
              Statut
            </div>
            <div className={isValid ? styles.statusValid : styles.statusRevoked}>
              {label}
            </div>
          </div>
          <div className={styles.qr} aria-hidden="true">
            {QR_PATTERN.map((filled, i) => (
              <i key={i} style={{ background: filled ? "var(--navy)" : "transparent" }} />
            ))}
          </div>
        </div>
      </div>
      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span>Identifiant</span>
          <b>{certificate.id}</b>
        </div>
        <div className={styles.metaRow}>
          <span>Filière</span>
          <b>{certificate.filiere ?? "—"}</b>
        </div>
        <div className={styles.metaRow}>
          <span>Délivré le</span>
          <b>{issuedDate}</b>
        </div>
      </div>
      {note && <p className={styles.revokedNote}>{note}</p>}
    </div>
  );
}

export function CertificateNotFound({ searchedId }) {
  return (
    <div className={styles.notFound}>
      <div className={styles.notFoundIcon}>?</div>
      <h2>Aucun certificat trouvé pour « {searchedId} »</h2>
      <p>
        Vérifiez que l'identifiant est correctement recopié depuis le certificat
        (sous le QR code). Les identifiants NexSkill commencent toujours par « NS- ».
      </p>
    </div>
  );
}
