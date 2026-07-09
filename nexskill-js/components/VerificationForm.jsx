"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./VerificationForm.module.css";

export function VerificationForm({ initialValue = "" }) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/verification?id=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="cert-id" className={styles.label}>
        Identifiant du certificat
      </label>
      <div className={styles.row}>
        <input
          id="cert-id"
          name="id"
          type="text"
          placeholder="ex. NS-DEMO01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.input}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className={styles.button}>
          Vérifier
        </button>
      </div>
      <p className={styles.hint}>
        L'identifiant se trouve sous le QR code, en bas du certificat.
      </p>
    </form>
  );
}
