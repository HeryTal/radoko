"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useConfirmation } from "./confirmation-dialog";
import type { AuthUser } from "../lib/auth-api";
import {
  doctorPhotoUrl,
  PROFESSIONAL_TYPES,
  removeDoctorPhoto,
  updateDoctorProfile,
  uploadDoctorPhoto,
} from "../lib/auth-api";

const specialties = [
  "Médecine générale",
  "Cardiologie",
  "Chirurgie dentaire",
  "Gastro-entérologie",
  "Ophtalmologie",
  "Pédiatrie",
  "Soins infirmiers",
  "Maïeutique",
  "Autre spécialité",
];

const consultationModes = ["Cabinet", "Téléphone", "Téléconsultation"];

export function DoctorProfileEditor({
  profile,
  accessToken,
  onProfileUpdate,
}: {
  profile: AuthUser;
  accessToken: string;
  onProfileUpdate: (profile: AuthUser) => void;
}) {
  const { confirm, confirmationDialog } = useConfirmation();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(profile.profilePhotoUrl);
  const photoInput = useRef<HTMLInputElement>(null);

  async function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError(true);
      setPhotoMessage("Choisissez une image JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(true);
      setPhotoMessage("La photo ne peut pas dépasser 5 Mo.");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError(false);
    setPhotoMessage("");
    try {
      const updated = await uploadDoctorPhoto(accessToken, file);
      onProfileUpdate(updated);
      setPhotoUrl(updated.profilePhotoUrl);
      setPhotoMessage("Votre photo de profil a bien été mise à jour.");
    } catch (error) {
      setPhotoError(true);
      setPhotoMessage(error instanceof Error ? error.message : "Impossible d’envoyer cette photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handlePhotoRemoval() {
    setIsUploadingPhoto(true);
    setPhotoError(false);
    setPhotoMessage("");
    try {
      const updated = await removeDoctorPhoto(accessToken);
      onProfileUpdate(updated);
      setPhotoUrl(null);
      setPhotoMessage("Votre photo a été supprimée.");
    } catch (error) {
      setPhotoError(true);
      setPhotoMessage(error instanceof Error ? error.message : "Impossible de supprimer cette photo.");
      throw error;
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setIsError(false);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const professionalType = PROFESSIONAL_TYPES.find(
      (type) => type === formData.get("professionalType"),
    ) ?? "Médecin";
    const consultationFee = String(formData.get("consultationFee") ?? "").trim();
    const experienceYears = String(formData.get("experienceYears") ?? "").trim();
    const input = {
      name: String(formData.get("name") ?? "").trim(),
      professionalType,
      professionalTitle: String(formData.get("professionalTitle") ?? "").trim(),
      specialty: String(formData.get("specialty") ?? "").trim(),
      practiceCity: String(formData.get("practiceCity") ?? "").trim(),
      practiceAddress: String(formData.get("practiceAddress") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      spokenLanguages: String(formData.get("spokenLanguages") ?? "")
        .split(",").map((value) => value.trim()).filter(Boolean),
      bio: String(formData.get("bio") ?? "").trim(),
      experienceYears: experienceYears ? Number(experienceYears) : null,
      services: String(formData.get("services") ?? "")
        .split(",").map((value) => value.trim()).filter(Boolean),
      consultationFee: consultationFee ? Number(consultationFee) : null,
      consultationModes: formData.getAll("consultationModes").map(String),
      consultationDurationMinutes: Number(formData.get("consultationDurationMinutes")),
    };

    try {
      const updated = await updateDoctorProfile(accessToken, input);
      onProfileUpdate(updated);
      setMessage("Votre profil a bien été enregistré.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Impossible d’enregistrer le profil.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="dashboard-editor-form" onSubmit={handleSubmit}>
      {confirmationDialog}
      <div className="dashboard-editor-grid">
        <label className="dashboard-editor-field">
          <span>Nom complet</span>
          <input name="name" defaultValue={profile.name ?? ""} maxLength={100} required />
        </label>
        <label className="dashboard-editor-field">
          <span>Profession</span>
          <select name="professionalType" defaultValue={profile.professionalType}>
            {PROFESSIONAL_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="dashboard-editor-field">
          <span>Titre professionnel</span>
          <input name="professionalTitle" defaultValue={profile.professionalTitle ?? ""} maxLength={40} placeholder="Ex. Dr, Pr" />
        </label>
        <label className="dashboard-editor-field">
          <span>Spécialité</span>
          <select name="specialty" defaultValue={profile.specialty ?? ""} required>
            <option value="" disabled>Choisir une spécialité</option>
            {specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}
          </select>
        </label>
        <label className="dashboard-editor-field">
          <span>Ville du cabinet</span>
          <input name="practiceCity" defaultValue={profile.practiceCity ?? ""} maxLength={100} required />
        </label>
        <label className="dashboard-editor-field">
          <span>Téléphone professionnel</span>
          <input name="phone" type="tel" defaultValue={profile.phone ?? ""} maxLength={30} required />
        </label>
        <label className="dashboard-editor-field dashboard-editor-wide">
          <span>Adresse du cabinet</span>
          <input name="practiceAddress" defaultValue={profile.practiceAddress ?? ""} maxLength={250} placeholder="Adresse, quartier, repère" />
        </label>
        <div className="dashboard-editor-field dashboard-editor-wide dashboard-photo-field">
          <span>Photo de profil</span>
          <div className="dashboard-photo-control">
            <div
              className="dashboard-photo-preview"
              role={photoUrl ? "img" : undefined}
              aria-label={photoUrl ? `Photo de ${profile.name ?? "votre profil"}` : undefined}
              aria-hidden={photoUrl ? undefined : true}
              style={photoUrl ? { backgroundImage: `url("${doctorPhotoUrl(photoUrl)}")` } : undefined}
            >
              {!photoUrl && (profile.name?.trim().charAt(0) || "R").toUpperCase()}
            </div>
            <div className="dashboard-photo-actions">
              <p>Choisissez une image depuis votre ordinateur ou la galerie de votre appareil.</p>
              <div className="dashboard-photo-buttons">
                <input
                  ref={photoInput}
                  className="dashboard-photo-input"
                  id="profilePhoto"
                  name="profilePhoto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelection}
                  disabled={isUploadingPhoto}
                  aria-label="Choisir une photo depuis cet appareil"
                />
                <button
                  className="dashboard-photo-choose"
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? "Envoi en cours…" : photoUrl ? "Changer la photo" : "Choisir une photo"}
                </button>
                {photoUrl && (
                  <button
                    className="dashboard-photo-remove"
                    type="button"
                    onClick={() => confirm({ title: "Supprimer votre photo ?", description: "Votre photo sera retirée de votre fiche publique. Vous pourrez en ajouter une nouvelle à tout moment.", label: "Supprimer la photo", destructive: true, onConfirm: handlePhotoRemoval })}
                    disabled={isUploadingPhoto}
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <small>JPG, PNG ou WebP · 5 Mo maximum</small>
            </div>
          </div>
          {photoMessage && <p className={`dashboard-form-message${photoError ? " is-error" : ""}`} role={photoError ? "alert" : "status"}>{photoMessage}</p>}
        </div>
        <label className="dashboard-editor-field">
          <span>Langues parlées (séparées par des virgules)</span>
          <input name="spokenLanguages" defaultValue={profile.spokenLanguages.join(", ")} placeholder="Français, Malagasy" />
        </label>
        <label className="dashboard-editor-field">
          <span>Années d’expérience</span>
          <input name="experienceYears" type="number" min="0" max="70" defaultValue={profile.experienceYears ?? ""} />
        </label>
        <label className="dashboard-editor-field dashboard-editor-wide">
          <span>Présentation et parcours</span>
          <textarea name="bio" rows={4} maxLength={1200} defaultValue={profile.bio ?? ""} placeholder="Présentez votre approche, votre parcours et votre expérience." />
        </label>
        <label className="dashboard-editor-field dashboard-editor-wide">
          <span>Services proposés (séparés par des virgules)</span>
          <input name="services" defaultValue={profile.services.join(", ")} placeholder="Consultation générale, suivi…" />
        </label>
        <label className="dashboard-editor-field">
          <span>Tarif indicatif (MGA)</span>
          <input name="consultationFee" type="number" min="0" max="10000000" defaultValue={profile.consultationFee ?? ""} placeholder="Non renseigné" />
        </label>
        <label className="dashboard-editor-field">
          <span>Durée d’un rendez-vous</span>
          <select name="consultationDurationMinutes" defaultValue={profile.consultationDurationMinutes}>
            {[15, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </label>
      </div>

      <fieldset className="dashboard-editor-modes">
        <legend>Modes de consultation</legend>
        <div>
          {consultationModes.map((mode) => (
            <label key={mode}>
              <input type="checkbox" name="consultationModes" value={mode} defaultChecked={profile.consultationModes.includes(mode)} />
              <span>{mode}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {message && <p className={`dashboard-form-message${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
      <button className="dashboard-save-button" type="submit" disabled={isSaving}>
        {isSaving ? "Enregistrement…" : "Enregistrer le profil"}
      </button>
    </form>
  );
}
