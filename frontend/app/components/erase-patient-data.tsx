"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { erasePatientDataWithToken } from "../lib/auth-api";

export function ErasePatientDataPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function erase() {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await erasePatientDataWithToken(token);
      setMessage(`Vos coordonnées ont été effacées et ${result.appointmentsAnonymized} rendez-vous anonymisé(s).`);
    } catch (eraseError) {
      setError(true);
      setMessage(eraseError instanceof Error ? eraseError.message : "Impossible d’effacer ces données.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="public-doctor-loading">
      <h1>Effacer mes coordonnées</h1>
      {!token
        ? <p role="alert">Le lien de confidentialité est incomplet ou invalide.</p>
        : message
          ? <p role={error ? "alert" : "status"}>{message}</p>
          : <>
            <p>Cette action anonymisera immédiatement les demandes de rendez-vous associées à l’adresse e-mail utilisée lors de la réservation et annulera les demandes à venir. Elle est irréversible.</p>
            <button className="public-booking-submit" type="button" onClick={() => void erase()} disabled={loading}>{loading ? "Effacement…" : "Confirmer l’effacement"}</button>
          </>}
      <Link href="/">Retour à Radoko</Link>
    </main>
  );
}
