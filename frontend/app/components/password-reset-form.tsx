"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset, resetPassword } from "../lib/auth-api";
import { DoctorAuthLayout } from "./doctor-auth-layout";

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await requestPasswordReset(email);
      setMessage("Si cette adresse correspond à un compte, un lien de réinitialisation vient d’être envoyé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthCard title="Réinitialiser votre mot de passe" intro="Nous vous enverrons un lien valable 30 minutes.">
    <form className="doctor-auth-form" onSubmit={submit}>
      <div className="auth-field"><label htmlFor="email">Adresse e-mail</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      {message ? <p className="auth-form-message" role="status">{message}</p> : null}
      <button className="primary-button auth-submit" disabled={submitting}>{submitting ? "Envoi…" : "Envoyer le lien"}</button>
    </form>
  </AuthCard>;
}

export function PasswordResetConfirmForm({ token }: { token?: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const invalidToken = !token || token.length < 32;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) return setMessage("Les mots de passe ne correspondent pas.");
    if (!token) return;
    setSubmitting(true);
    setMessage("");
    try {
      await resetPassword(token, password);
      setMessage("Mot de passe modifié. Vous pouvez maintenant vous connecter.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthCard title="Choisissez un nouveau mot de passe" intro="Utilisez au moins 12 caractères.">
    {invalidToken ? <p className="auth-form-message" role="alert">Ce lien est invalide ou incomplet.</p> : <form className="doctor-auth-form" onSubmit={submit}>
      <div className="auth-field"><label htmlFor="password">Nouveau mot de passe</label><input id="password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
      <div className="auth-field"><label htmlFor="confirmation">Confirmer le mot de passe</label><input id="confirmation" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
      {message ? <p className="auth-form-message" role="status">{message}</p> : null}
      <button className="primary-button auth-submit" disabled={submitting}>{submitting ? "Modification…" : "Modifier mon mot de passe"}</button>
    </form>}
  </AuthCard>;
}

function AuthCard({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <DoctorAuthLayout><section className="doctor-auth-content"><div className="auth-form-wrap"><span className="eyebrow">ESPACE PROFESSIONNEL</span><h1>{title}</h1><p className="auth-form-intro">{intro}</p>{children}<p className="auth-form-switch"><Link href="/medecins/connexion">Retour à la connexion</Link></p></div></section></DoctorAuthLayout>;
}
