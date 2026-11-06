"use client";

import { useState, type FormEvent } from "react";
import { createReview, AuthApiError } from "../lib/auth-api";

export default function ReviewPage() {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") ?? "" : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setError(true); setMessage("Le lien d’avis est incomplet."); return; }
    setSaving(true); setError(false); setMessage("");
    try {
      await createReview({ token, rating, comment: comment.trim() || undefined });
      setMessage("Merci ! Votre avis sera publié après modération.");
      setComment("");
    } catch (reason) {
      setError(true);
      setMessage(reason instanceof AuthApiError ? reason.message : "Impossible d’envoyer votre avis.");
    } finally { setSaving(false); }
  }

  return <main className="review-page">
    <div className="review-card">
      <span className="review-kicker">RADOKO · VOTRE EXPÉRIENCE</span>
      <h1>Évaluez votre rendez-vous</h1>
      <p>Votre avis aide les autres patients et sera vérifié avant publication.</p>
      <form onSubmit={submit}>
        <fieldset className="review-stars">
          <legend>Votre note</legend>
          {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={value <= rating ? "is-selected" : ""} onClick={() => setRating(value)} aria-label={`${value} étoile${value > 1 ? "s" : ""}`}>★</button>)}
        </fieldset>
        <label>Votre commentaire <span>(facultatif)</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={5} placeholder="Partagez votre expérience…" /></label>
        <button className="review-submit" type="submit" disabled={saving}>{saving ? "Envoi…" : "Envoyer mon avis"}</button>
      </form>
      {message && <p className={`review-message${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>{message}</p>}
    </div>
  </main>;
}
