"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { cancelAppointmentWithToken } from "../lib/auth-api";

export function CancelAppointmentPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      await cancelAppointmentWithToken(token);
      setMessage("Votre rendez-vous a été annulé. Le professionnel a été prévenu.");
    } catch (cancelError) {
      setError(true);
      setMessage(cancelError instanceof Error ? cancelError.message : "Impossible d’annuler ce rendez-vous.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="public-doctor-loading">
      <h1>Annuler un rendez-vous</h1>
      {!token
        ? <p role="alert">Le lien d’annulation est incomplet ou invalide.</p>
        : message
          ? <p role={error ? "alert" : "status"}>{message}</p>
          : <><p>Confirmez-vous l’annulation de la demande associée à ce lien ?</p><button className="public-booking-submit" type="button" onClick={() => void cancel()} disabled={loading}>{loading ? "Annulation…" : "Confirmer l’annulation"}</button></>}
      <Link href="/">Retour à Radoko</Link>
    </main>
  );
}
