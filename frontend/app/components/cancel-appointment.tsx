"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useConfirmation } from "./confirmation-dialog";
import { cancelAppointmentWithToken } from "../lib/auth-api";

export function CancelAppointmentPage() {
  const { confirm, confirmationDialog } = useConfirmation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    setMessage("");
    try {
      await cancelAppointmentWithToken(token);
      setMessage("Votre rendez-vous a été annulé. Le professionnel a été prévenu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="public-doctor-loading">
      {confirmationDialog}
      <h1>Annuler un rendez-vous</h1>
      {!token
        ? <p role="alert">Le lien d’annulation est incomplet ou invalide.</p>
        : message
          ? <p role="status">{message}</p>
          : <><p>Vous ne pouvez plus vous rendre à ce rendez-vous ? Libérez votre créneau pour un autre patient.</p><button className="public-booking-submit" type="button" onClick={() => confirm({ title: "Annuler votre rendez-vous ?", description: "Votre créneau sera libéré et le professionnel sera prévenu. Pour prendre un autre rendez-vous, vous devrez effectuer une nouvelle réservation.", label: "Annuler le rendez-vous", destructive: true, onConfirm: cancel })} disabled={loading}>{loading ? "Annulation…" : "Annuler ce rendez-vous"}</button></>}
      <Link href="/">Retour à Radoko</Link>
    </main>
  );
}
