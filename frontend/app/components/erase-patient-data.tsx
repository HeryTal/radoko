"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useConfirmation } from "./confirmation-dialog";
import { erasePatientDataWithToken } from "../lib/auth-api";

export function ErasePatientDataPage() {
  const { confirm, confirmationDialog } = useConfirmation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function erase() {
    setLoading(true);
    setMessage("");
    try {
      const result = await erasePatientDataWithToken(token);
      setMessage(`Vos coordonnées ont été effacées et ${result.appointmentsAnonymized} rendez-vous anonymisé(s).`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="public-doctor-loading">
      {confirmationDialog}
      <h1>Effacer mes coordonnées</h1>
      {!token
        ? <p role="alert">Le lien de confidentialité est incomplet ou invalide.</p>
        : message
          ? <p role="status">{message}</p>
          : <>
            <p>Cette action anonymisera immédiatement les demandes de rendez-vous associées à l’adresse e-mail utilisée lors de la réservation et annulera les demandes à venir. Elle est irréversible.</p>
            <button className="public-booking-submit" type="button" onClick={() => confirm({ title: "Effacer vos coordonnées ?", description: "Vos rendez-vous seront anonymisés et vos demandes à venir annulées. Cet effacement est définitif et ne peut pas être annulé.", label: "Effacer mes coordonnées", destructive: true, onConfirm: erase })} disabled={loading}>{loading ? "Effacement…" : "Effacer mes coordonnées"}</button>
          </>}
      <Link href="/">Retour à Radoko</Link>
    </main>
  );
}
