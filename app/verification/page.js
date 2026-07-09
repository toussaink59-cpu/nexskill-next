import { getSupabaseClient } from "../../lib/supabase";
import { VerificationForm } from "../../components/VerificationForm";
import { CertificateFound, CertificateNotFound } from "../../components/CertificateResult";
import styles from "./page.module.css";

// Le statut d'un certificat peut changer (révocation) : on interroge
// Supabase à chaque requête, jamais de cache statique sur cette page.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vérifier un certificat — NexSkill",
  description:
    "Vérifiez l'authenticité d'un certificat NexSkill à partir de son identifiant.",
};

async function getCertificate(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    // On logue côté serveur mais on affiche "introuvable" plutôt qu'une
    // page d'erreur : un souci réseau ne doit pas ressembler à un faux certificat.
    console.error("Erreur de vérification de certificat :", error.message);
    return null;
  }
  return data;
}

export default async function VerificationPage({ searchParams }) {
  const params = await searchParams;
  const id = params.id?.trim();
  const certificate = id ? await getCertificate(id) : null;

  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <a href="/" className={styles.backLink}>
          ← NexSkill
        </a>

        <div className={styles.header}>
          <h1>Vérifier un certificat</h1>
          <p>
            Entrez l'identifiant présent sous le QR code du certificat pour
            confirmer son authenticité.
          </p>
        </div>

        <VerificationForm initialValue={id ?? ""} />

        <div className={styles.result}>
          {id && certificate && <CertificateFound certificate={certificate} />}
          {id && !certificate && <CertificateNotFound searchedId={id} />}
        </div>
      </div>
    </main>
  );
}
