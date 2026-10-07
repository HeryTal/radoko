"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { DoctorAvailabilityEditor } from "./doctor-availability-editor";
import { DoctorProfileEditor } from "./doctor-profile-editor";
import type { Appointment, AuthUser } from "../lib/auth-api";
import {
  AuthApiError,
  deleteMyAccount,
  doctorPhotoUrl,
  getDoctorAppointments,
  getDoctorProfile,
  rescheduleAppointment,
  setAppointmentStatus,
  uploadVerificationDocument,
} from "../lib/auth-api";

function currentTimestamp() {
  return Date.now();
}

function profileCompletion(profile: AuthUser) {
  const fields = [
    profile.name,
    profile.professionalType,
    profile.specialty,
    profile.practiceCity,
    profile.practiceAddress,
    profile.phone,
    profile.profilePhotoUrl,
    profile.spokenLanguages.length > 0,
    profile.bio,
    profile.experienceYears !== null,
    profile.services.length > 0,
    profile.consultationFee !== null,
    profile.consultationModes.length > 0,
    profile.availabilities.length > 0,
  ];
  const completeFields = fields.filter((field) =>
    typeof field === "boolean" ? field : Boolean(field?.trim()),
  ).length;

  return Math.round((completeFields / fields.length) * 100);
}

export function DoctorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState(false);
  const [appointmentActionError, setAppointmentActionError] = useState("");
  const [accountDeleteError, setAccountDeleteError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    const accessToken = window.localStorage.getItem("radoko_access_token");

    if (!accessToken) {
      router.replace("/medecins/connexion");
      return () => {
        isCurrent = false;
      };
    }

    let hasLoadedProfile = false;
    getDoctorProfile(accessToken)
      .then((doctor) => {
        hasLoadedProfile = true;
        if (doctor.role === "ADMIN") {
          router.replace("/admin");
          return null;
        }
        if (isCurrent) setAccessToken(accessToken);
        if (isCurrent) setProfile(doctor);
        return getDoctorAppointments(accessToken);
      })
      .then((bookings) => {
        if (isCurrent && bookings) {
          setAppointments(bookings);
          setCurrentTime(currentTimestamp());
        }
      })
      .catch((requestError: unknown) => {
        if (!isCurrent) return;

        if (requestError instanceof AuthApiError && requestError.status === 401) {
          window.localStorage.removeItem("radoko_access_token");
          router.replace("/medecins/connexion");
          return;
        }

        if (hasLoadedProfile) {
          setAppointmentsError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger les rendez-vous.",
          );
        } else {
          setError(requestError instanceof Error
            ? requestError.message
            : "Impossible de charger votre profil. Veuillez réessayer.");
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [router]);

  function handleLogout() {
    window.localStorage.removeItem("radoko_access_token");
    router.replace("/medecins/connexion");
  }

  async function handleVerificationUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("document");
    if (!(file instanceof File) || !file.size) return;
    setVerificationMessage("");
    setVerificationError(false);
    try {
      const result = await uploadVerificationDocument(accessToken, file);
      setProfile(result.profile);
      setVerificationMessage("Justificatif envoyé. Il sera supprimé après la décision de vérification.");
      form.reset();
    } catch (uploadError) {
      setVerificationError(true);
      setVerificationMessage(uploadError instanceof Error ? uploadError.message : "Impossible d’envoyer le justificatif.");
    }
  }

  async function handleAppointmentStatus(id: string, status: "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED") {
    setAppointmentActionError("");
    try {
      await setAppointmentStatus(accessToken, id, status);
      setAppointments(await getDoctorAppointments(accessToken));
      setCurrentTime(currentTimestamp());
    } catch (actionError) {
      setAppointmentActionError(actionError instanceof Error ? actionError.message : "Impossible de mettre à jour le rendez-vous.");
    }
  }

  async function handleReschedule(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = new FormData(form).get("newStart");
    if (typeof value !== "string" || !value) return;
    setAppointmentActionError("");
    try {
      await rescheduleAppointment(accessToken, id, new Date(`${value}:00+03:00`).toISOString());
      setAppointments(await getDoctorAppointments(accessToken));
      setCurrentTime(currentTimestamp());
      form.reset();
    } catch (actionError) {
      setAppointmentActionError(actionError instanceof Error ? actionError.message : "Impossible de reprogrammer le rendez-vous.");
    }
  }

  if (isLoading || !profile) {
    return (
      <main className="dashboard-loading" aria-live="polite">
        {error ? (
          <div className="dashboard-error" role="alert">
            <p>{error}</p>
            <button className="dashboard-button" type="button" onClick={() => window.location.reload()}>
              Réessayer
            </button>
          </div>
        ) : (
          <p>Chargement de votre espace médecin…</p>
        )}
      </main>
    );
  }

  const completion = profileCompletion(profile);
  const missingProfileFields = [
    !profile.name && "votre nom",
    !profile.practiceAddress && "l’adresse du cabinet",
    !profile.profilePhotoUrl && "une photo professionnelle",
    !profile.spokenLanguages.length && "les langues parlées",
    !profile.bio && "une présentation",
    !profile.services.length && "vos services",
    !profile.specialty && "votre spécialité",
    !profile.practiceCity && "la ville de votre cabinet",
    !profile.phone && "votre téléphone",
    !profile.availabilities.length && "vos horaires de disponibilité",
  ].filter(Boolean);

  return (
    <div className="doctor-dashboard" id="accueil">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/" aria-label="Radoko, accueil">
          <Image src="/brand/radoko-logo.svg" alt="Radoko" width={262} height={52} priority />
        </Link>
        <p className="dashboard-workspace-label">ESPACE PROFESSIONNEL</p>
        <nav className="dashboard-nav" aria-label="Navigation de l’espace médecin">
          <a className="dashboard-nav-link is-active" href="#accueil" aria-current="page">
            <span className="dashboard-nav-icon" aria-hidden="true">⌂</span>
            Vue d’ensemble
          </a>
          <a className="dashboard-nav-link" href="#profil">
            <span className="dashboard-nav-icon" aria-hidden="true">◉</span>
            Mon profil
          </a>
          <a className="dashboard-nav-link" href="#disponibilites">
            <span className="dashboard-nav-icon" aria-hidden="true">▦</span>
            Disponibilités
          </a>
          <a className="dashboard-nav-link" href="#rendez-vous">
            <span className="dashboard-nav-icon" aria-hidden="true">◷</span>
            Rendez-vous
          </a>
        </nav>
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-sidebar-note">
            <span className="dashboard-note-mark" aria-hidden="true">R</span>
            <p>Un espace pensé pour accompagner votre pratique, à Madagascar.</p>
          </div>
          <Link className="dashboard-public-link" href="/">
            Retourner sur Radoko <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-breadcrumb">Espace médecin</span>
            <span className="dashboard-breadcrumb-separator" aria-hidden="true">/</span>
            <span className="dashboard-breadcrumb-current">Vue d’ensemble</span>
          </div>
          <button className="dashboard-logout" type="button" onClick={handleLogout}>
            <span aria-hidden="true">↗</span> Déconnexion
          </button>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow"><span /> VOTRE ESPACE PROFESSIONNEL</span>
              <h1>Bienvenue{profile.name ? `, ${profile.name}` : ""}.</h1>
              <p>Retrouvez ici les informations associées à votre compte médecin Radoko.</p>
            </div>
            <div className="dashboard-welcome-mark" aria-hidden="true">
              <span>R</span>
              <i />
              <i />
              <i />
            </div>
          </section>

          {!profile.isVerified && <section className="dashboard-panel dashboard-verification-panel">
            <div className="dashboard-panel-heading">
              <div><span className="dashboard-section-kicker">VALIDATION DU PROFIL</span><h2>Faites vérifier votre activité</h2></div>
              <span className="dashboard-profile-status">En attente</span>
            </div>
            <p className="dashboard-editor-intro">
              Votre profil ne sera visible dans la recherche qu’après validation. Envoyez un justificatif professionnel PDF, JPG ou PNG (10 Mo maximum).
              {profile.verificationNote && <><br /><strong>Motif de refus précédent : </strong>{profile.verificationNote}</>}
            </p>
            <form className="dashboard-verification-form" onSubmit={handleVerificationUpload}>
              <label>Justificatif professionnel<input name="document" type="file" accept="application/pdf,image/jpeg,image/png" required /></label>
              <button className="dashboard-button" type="submit">Envoyer pour vérification</button>
            </form>
            {verificationMessage && <p className={`dashboard-form-message${verificationError ? " is-error" : ""}`} role={verificationError ? "alert" : "status"}>{verificationMessage}</p>}
          </section>}

          <section className="dashboard-summary" aria-label="Résumé de votre profil">
            <article className="dashboard-summary-card dashboard-completion-card">
              <div className="dashboard-card-label">
                <span className="dashboard-card-icon completion-icon" aria-hidden="true">✓</span>
                <span>Profil professionnel</span>
              </div>
              <div className="dashboard-completion-number">{completion}<small>%</small></div>
              <div className="dashboard-progress" role="progressbar" aria-label="Profil complété" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${completion}%` }} />
              </div>
              <p>{completion === 100 ? "Toutes vos informations sont renseignées." : "Quelques informations restent à renseigner."}</p>
            </article>

            <article className="dashboard-summary-card">
              <div className="dashboard-card-label">
                <span className="dashboard-card-icon specialty-icon" aria-hidden="true">+</span>
                <span>Votre profession</span>
              </div>
              <strong className="dashboard-summary-value">{profile.professionalType}</strong>
              <p>{profile.specialty || "Spécialité à renseigner"}</p>
            </article>

            <article className="dashboard-summary-card">
              <div className="dashboard-card-label">
                <span className="dashboard-card-icon location-icon" aria-hidden="true">⌖</span>
                <span>Votre cabinet</span>
              </div>
              <strong className="dashboard-summary-value">{profile.practiceCity || "Ville à renseigner"}</strong>
              <p>Votre ville d’exercice</p>
            </article>
          </section>

          <div className="dashboard-lower-grid">
            <section className="dashboard-panel" id="profil">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-section-kicker">VOTRE COMPTE</span>
                  <h2>Mon profil médecin</h2>
                </div>
                <span className={`dashboard-profile-status${profile.isVerified ? " is-verified" : " is-pending"}`}><i /> {profile.isVerified ? "Profil vérifié" : "À vérifier"}</span>
              </div>
              <div className="dashboard-profile-identity">
                {profile.profilePhotoUrl
                  ? <div className="dashboard-avatar dashboard-avatar-photo" role="img" aria-label={`Photo de ${profile.name ?? "profil médecin"}`} style={{ backgroundImage: `url("${doctorPhotoUrl(profile.profilePhotoUrl)}")` }} />
                  : <div className="dashboard-avatar" aria-hidden="true">{(profile.name?.trim().charAt(0) || profile.email.charAt(0)).toUpperCase()}</div>}
                <div>
                  <strong>{profile.professionalTitle ? `${profile.professionalTitle} ` : ""}{profile.name || "Nom non renseigné"}</strong>
                  <span>{profile.professionalType} · {profile.specialty || "Spécialité à préciser"}{profile.practiceCity ? ` · ${profile.practiceCity}` : ""}</span>
                </div>
              </div>
              <dl className="dashboard-profile-details">
                <div><dt>Adresse e-mail</dt><dd>{profile.email}</dd></div>
                <div><dt>Téléphone professionnel</dt><dd>{profile.phone || "Non renseigné"}</dd></div>
                <div><dt>Spécialité</dt><dd>{profile.specialty || "Non renseignée"}</dd></div>
                <div><dt>Ville du cabinet</dt><dd>{profile.practiceCity || "Non renseignée"}</dd></div>
                <div><dt>Adresse</dt><dd>{profile.practiceAddress || "Non renseignée"}</dd></div>
                <div><dt>Langues</dt><dd>{profile.spokenLanguages.join(", ") || "Non renseignées"}</dd></div>
              </dl>
            </section>

            <aside className="dashboard-panel dashboard-next-step">
              <span className="dashboard-section-kicker">À SUIVRE</span>
              <div className="dashboard-next-icon" aria-hidden="true">✓</div>
              <h2>{missingProfileFields.length ? "Complétez votre profil" : "Votre profil est complet"}</h2>
              <p>
                {missingProfileFields.length
                  ? `Pensez à ajouter ${missingProfileFields.join(", ")} pour que votre espace soit à jour.`
                  : "Toutes les informations de votre compte sont renseignées. Vous pouvez les consulter dans votre profil."}
              </p>
              <a className="dashboard-text-link" href="#profil">
                Consulter mon profil <span aria-hidden="true">→</span>
              </a>
            </aside>
          </div>

          <section className="dashboard-panel dashboard-management-panel">
            <div className="dashboard-panel-heading">
              <div><span className="dashboard-section-kicker">VOTRE FICHE PUBLIQUE</span><h2>Présentez votre pratique</h2></div>
              <a className="dashboard-text-link" href={`/medecins/${profile.id}`} target="_blank" rel="noreferrer">Voir ma fiche publique <span aria-hidden="true">↗</span></a>
            </div>
            <p className="dashboard-editor-intro">Ces informations peuvent être consultées par les patients. Votre adresse e-mail et vos informations de connexion restent privées.</p>
            <DoctorProfileEditor profile={profile} accessToken={accessToken} onProfileUpdate={setProfile} />
          </section>

          <section className="dashboard-panel dashboard-management-panel" id="disponibilites">
            <div className="dashboard-panel-heading">
              <div><span className="dashboard-section-kicker">AGENDA DE RÉSERVATION</span><h2>Mes disponibilités</h2></div>
              <span className="dashboard-duration-note">Créneaux de {profile.consultationDurationMinutes} min · heure de Madagascar</span>
            </div>
            <DoctorAvailabilityEditor profile={profile} accessToken={accessToken} onProfileUpdate={setProfile} />
          </section>

          <section className="dashboard-panel dashboard-management-panel" id="rendez-vous">
            <div className="dashboard-panel-heading">
              <div><span className="dashboard-section-kicker">AGENDA</span><h2>Prochains rendez-vous</h2></div>
              <span className="dashboard-profile-status">{appointments.length} à venir</span>
            </div>
            {appointmentsError
              ? <p className="dashboard-form-message is-error" role="alert">{appointmentsError}</p>
              : appointments.length
                ? <div className="dashboard-appointments">
                    {appointments.map((appointment) => (
                      <article className="dashboard-appointment" key={appointment.id}>
                        <time dateTime={appointment.startsAt}>
                          {new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Nairobi", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(appointment.startsAt))}
                        </time>
                        <div><strong>{appointment.patientName}</strong><span>{appointment.patientPhone} · {appointment.patientEmail}</span>{appointment.reason && <small>{appointment.reason}</small>}</div>
                        <span>{appointment.durationMinutes} min · {appointment.status === "REQUESTED" ? "En attente" : appointment.status === "CONFIRMED" ? "Confirmé" : appointment.status === "DECLINED" ? "Refusé" : appointment.status === "CANCELLED" ? "Annulé" : "Terminé"}</span>
                        <div className="dashboard-appointment-actions">
                          {appointment.status === "REQUESTED" && <>
                            <button type="button" onClick={() => void handleAppointmentStatus(appointment.id, "CONFIRMED")}>Confirmer</button>
                            <button type="button" onClick={() => void handleAppointmentStatus(appointment.id, "DECLINED")}>Refuser</button>
                          </>}
                          {(appointment.status === "REQUESTED" || appointment.status === "CONFIRMED") && new Date(appointment.startsAt) > new Date() && <>
                            <button type="button" onClick={() => void handleAppointmentStatus(appointment.id, "CANCELLED")}>Annuler</button>
                            <form onSubmit={(event) => void handleReschedule(event, appointment.id)}>
                              <label>Nouvelle date et heure (Madagascar)<input name="newStart" type="datetime-local" required /></label>
                              <button type="submit">Reprogrammer</button>
                            </form>
                          </>}
                          {appointment.status === "CONFIRMED" && currentTime > 0 && new Date(appointment.startsAt).getTime() + appointment.durationMinutes * 60_000 <= currentTime &&
                            <button type="button" onClick={() => void handleAppointmentStatus(appointment.id, "COMPLETED")}>Marquer terminé</button>}
                        </div>
                      </article>
                    ))}
                  </div>
                : <p className="dashboard-editor-intro">Aucun rendez-vous à venir. Vos réservations apparaîtront ici.</p>}
            {appointmentActionError && <p className="dashboard-form-message is-error" role="alert">{appointmentActionError}</p>}
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 Radoko · Pensé pour Madagascar</span>
            <span>Vos informations sont protégées par votre connexion sécurisée.</span>
            <button className="dashboard-delete-account" type="button" onClick={async () => {
              if (!window.confirm("Supprimer définitivement votre compte ? Cette action est irréversible.")) return;
              setAccountDeleteError("");
              try {
                await deleteMyAccount(accessToken);
                window.localStorage.removeItem("radoko_access_token");
                router.replace("/");
              } catch (deleteError) {
                setAccountDeleteError(deleteError instanceof Error ? deleteError.message : "La suppression du compte a échoué.");
              }
            }}>Supprimer mon compte</button>
          </footer>
          {accountDeleteError && <p className="dashboard-form-message is-error" role="alert">{accountDeleteError}</p>}
        </div>
      </main>
    </div>
  );
}
