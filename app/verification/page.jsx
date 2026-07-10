import { supabase } from "../../lib/supabaseClient";
import { VerificationForm } from "../../components/VerificationForm";
import { CertificateFound, CertificateNotFound } from "../../components/CertificateResult";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vérifier un certificat — NexSkill",
  description:
    "Vérifiez l'authenticité d'un certificat NexSkill à partir de son identifiant.",
};

async function getCertificate(id) {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erreur de vérification de certificat :", error.message);
    return null;
  }
  return data;
}

export default async function VerificationPage({ searchParams }) {
  const id = searchParams.id?.trim();
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
