"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { DoctorAuthIllustration } from "./doctor-auth-illustration";
import { Icon } from "./icons";

type DoctorAuthFormProps = {
  mode: "register" | "login";
};

const specialties = [
  "Médecine générale",
  "Cardiologie",
  "Chirurgie dentaire",
  "Gastro-entérologie",
  "Ophtalmologie",
  "Pédiatrie",
  "Autre spécialité",
];

const cities = [
  "Antananarivo",
  "Toamasina",
  "Antsirabe",
  "Mahajanga",
  "Fianarantsoa",
  "Toliara",
  "Antsiranana",
];

export function DoctorAuthForm({ mode }: DoctorAuthFormProps) {
  const isRegister = mode === "register";
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (isRegister) {
      const formData = new FormData(event.currentTarget);
      if (formData.get("password") !== formData.get("passwordConfirmation")) {
        setMessage("Les deux mots de passe ne correspondent pas.");
        return;
      }
    }

    setMessage(
      isRegister
        ? "La création de compte n’est pas encore disponible. Aucune information n’a été envoyée."
        : "La connexion n’est pas encore disponible. Aucune information n’a été envoyée.",
    );
  }

  return (
    <div className={`doctor-auth-composition doctor-auth-composition-${mode}`}>
      <aside
        className="doctor-auth-visual"
        aria-label={isRegister ? "Illustration médicale du cœur" : "Illustration médicale des poumons"}
      >
        <span className="eyebrow">
          <span className="live-dot" /> {isRegister ? "PRENDRE SOIN" : "RESTER À L’ÉCOUTE"}
        </span>
        <DoctorAuthIllustration mode={mode} />
        <div className="doctor-auth-visual-caption">
          <span>{isRegister ? "Au cœur de votre pratique." : "Le souffle de votre engagement."}</span>
          <small>{isRegister ? "UN PROFIL QUI VOUS RESSEMBLE" : "VOTRE ESPACE, TOUJOURS À PORTÉE"}</small>
        </div>
        <span className="auth-aside-caption">RADOKO · MADAGASCAR</span>
      </aside>

      <section className="doctor-auth-content">
        <div className="auth-form-wrap">
          <span className="eyebrow">VOTRE ESPACE PROFESSIONNEL</span>
          <h1>{isRegister ? "Rejoignez Radoko." : "Ravi de vous revoir."}</h1>
          <p className="auth-form-intro">
            {isRegister
              ? "Créez votre profil professionnel pour présenter votre pratique aux patients."
              : "Connectez-vous pour retrouver votre espace médecin."}
          </p>

          <form className="doctor-auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <>
                <div className="auth-field-row">
                  <div className="auth-field">
                    <label htmlFor="firstName">Prénom</label>
                    <input id="firstName" name="firstName" autoComplete="given-name" required />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="lastName">Nom</label>
                    <input id="lastName" name="lastName" autoComplete="family-name" required />
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="specialty">Votre spécialité</label>
                  <select id="specialty" name="specialty" defaultValue="" required>
                    <option value="" disabled>Choisir une spécialité</option>
                    {specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}
                  </select>
                </div>
                <div className="auth-field">
                  <label htmlFor="practiceCity">Ville du cabinet</label>
                  <select id="practiceCity" name="practiceCity" defaultValue="" required>
                    <option value="" disabled>Choisir une ville</option>
                    {cities.map((city) => <option key={city}>{city}</option>)}
                  </select>
                </div>
              </>
            ) : null}

            <div className="auth-field">
              <label htmlFor="email">Adresse e-mail</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>

            {isRegister ? (
              <div className="auth-field">
                <label htmlFor="phone">Téléphone professionnel</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+261 34 00 000 00"
                  required
                />
              </div>
            ) : null}

            <div className="auth-field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={8}
                required
              />
              {isRegister ? <small>8 caractères minimum</small> : null}
            </div>

            {isRegister ? (
              <div className="auth-field">
                <label htmlFor="passwordConfirmation">Confirmer le mot de passe</label>
                <input
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            ) : null}

            {message ? <p className="auth-form-message" role="status">{message}</p> : null}

            <button className="primary-button auth-submit" type="submit">
              {isRegister ? "Créer mon espace médecin" : "Se connecter"}
            </button>
          </form>

          <p className="auth-form-switch">
            {isRegister ? "Vous avez déjà un compte ?" : "Vous êtes médecin et vous nous rejoignez ?"}
            {" "}
            <Link href={isRegister ? "/medecins/connexion" : "/medecins/inscription"}>
              {isRegister ? "Se connecter" : "Créer un compte"} <Icon name="arrow" />
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
