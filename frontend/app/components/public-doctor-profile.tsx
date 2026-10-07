"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { PublicDoctorProfile } from "../lib/auth-api";
import { AuthApiError, createAppointment, doctorPhotoUrl, getPublicBookedSlots, getPublicDoctorProfile } from "../lib/auth-api";

const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const longWeekDays = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function madagascarDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayWindows(date: string, profile: PublicDoctorProfile) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return profile.availabilities.filter((availability) => availability.weekday === weekday);
}

function availableTimes(
  date: string,
  profile: PublicDoctorProfile,
  bookedSlots: Array<{ startsAt: string; durationMinutes: number }>,
) {
  const windows = dayWindows(date, profile);
  const times = new Set<string>();

  for (const window of windows) {
    const [startHour, startMinute] = window.startTime.split(":").map(Number);
    const [endHour, endMinute] = window.endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    for (let minute = start; minute + profile.consultationDurationMinutes <= end; minute += profile.consultationDurationMinutes) {
      const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
      const candidate = new Date(`${date}T${time}:00+03:00`);
      if (candidate <= new Date()) continue;
      const candidateEnd = candidate.getTime() + profile.consultationDurationMinutes * 60_000;
      if (bookedSlots.some((slot) => {
        const occupiedStart = new Date(slot.startsAt).getTime();
        const occupiedEnd = occupiedStart + slot.durationMinutes * 60_000;
        return candidate.getTime() < occupiedEnd && candidateEnd > occupiedStart;
      })) continue;
      times.add(time);
    }
  }
  return [...times].sort();
}

export function PublicDoctorProfilePage({ doctorId }: { doctorId: string }) {
  const [profile, setProfile] = useState<PublicDoctorProfile | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selectedDate, setSelectedDate] = useState(madagascarDateString());
  const [month, setMonth] = useState(() => {
    const [year, currentMonth] = madagascarDateString().split("-").map(Number);
    return new Date(Date.UTC(year, currentMonth - 1, 1));
  });
  const [unavailable, setUnavailable] = useState<Array<{ startsAt: string; durationMinutes: number }>>([]);
  const [slotsError, setSlotsError] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  useEffect(() => {
    let current = true;
    getPublicDoctorProfile(doctorId).then((doctor) => {
      if (current) setProfile(doctor);
    }).catch((error: unknown) => {
      if (current) setLoadError(error instanceof Error ? error.message : "Impossible de charger ce profil.");
    });
    return () => { current = false; };
  }, [doctorId]);

  useEffect(() => {
    if (!profile) return;
    let current = true;
    getPublicBookedSlots(doctorId, selectedDate).then((slots) => {
      if (current) setUnavailable(slots);
    }).catch((error: unknown) => {
      if (current) setSlotsError(error instanceof Error ? error.message : "Impossible de charger les créneaux.");
    }).finally(() => {
      if (current) setIsLoadingSlots(false);
    });
    return () => { current = false; };
  }, [doctorId, profile, selectedDate]);

  const times = useMemo(
    () => profile ? availableTimes(selectedDate, profile, unavailable) : [],
    [profile, selectedDate, unavailable],
  );

  if (loadError) {
    return <main className="public-doctor-loading"><p role="alert">{loadError}</p><Link href="/">Retour à l’accueil</Link></main>;
  }
  if (!profile) return <main className="public-doctor-loading" aria-live="polite">Chargement du profil…</main>;

  const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(month);
  const daysInMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const firstDayOffset = (new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1)).getUTCDay() + 6) % 7;
  const calendarCells = Array.from({ length: Math.ceil((firstDayOffset + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    if (day < 1 || day > daysInMonth) return null;
    return `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
  const today = madagascarDateString();
  const weekdays = [...profile.availabilities]
    .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))
    .map((availability) => ({
      day: longWeekDays[availability.weekday],
      hours: `${availability.startTime} – ${availability.endTime}`,
    }));

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTime) return;
    const form = event.currentTarget;
    const consultationDurationMinutes = profile?.consultationDurationMinutes ?? 30;
    setIsBooking(true);
    setBookingMessage("");
    setBookingError(false);
    const data = new FormData(form);
    const startsAt = new Date(`${selectedDate}T${selectedTime}:00+03:00`).toISOString();
    try {
      await createAppointment(doctorId, {
        startsAt,
        privacyConsent: data.get("privacyConsent") === "on",
        patientName: String(data.get("patientName") ?? ""),
        patientEmail: String(data.get("patientEmail") ?? ""),
        patientPhone: String(data.get("patientPhone") ?? ""),
        reason: String(data.get("reason") ?? ""),
      });
      setUnavailable((current) => [...current, { startsAt, durationMinutes: consultationDurationMinutes }]);
      setSelectedTime("");
      setBookingMessage(`Votre demande pour le ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Nairobi", weekday: "long", day: "numeric", month: "long" }).format(new Date(startsAt))} à ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit" }).format(new Date(startsAt))} a été transmise. Le rendez-vous ne sera confirmé qu’après validation par le professionnel. Un e-mail de suivi sera envoyé si le service de notification est configuré.`);
      form.reset();
    } catch (error) {
      setBookingError(true);
      if (error instanceof AuthApiError && error.status === 409) {
        setUnavailable((current) => [...current, { startsAt, durationMinutes: consultationDurationMinutes }]);
        setSelectedTime("");
      }
      setBookingMessage(error instanceof Error ? error.message : "Impossible de réserver ce créneau.");
    } finally {
      setIsBooking(false);
    }
  }

  function changeMonth(amount: number) {
    setMonth((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + amount, 1)));
  }

  return (
    <main className="public-doctor-page">
      <header className="public-doctor-header">
        <Link href="/" className="public-doctor-wordmark" aria-label="Radoko, accueil">radoko<span>+</span></Link>
        <Link href="/" className="public-doctor-back">← Retour à la recherche</Link>
      </header>
      <div className="public-doctor-content">
        <section className="public-doctor-card">
          <div className="public-doctor-identity">
            {profile.profilePhotoUrl
              ? <div className="public-doctor-avatar has-photo" role="img" aria-label={`Photo de ${profile.name ?? profile.professionalType}`} style={{ backgroundImage: `url("${doctorPhotoUrl(profile.profilePhotoUrl)}")` }} />
              : <div className="public-doctor-avatar" aria-hidden="true">{(profile.name?.charAt(0) || profile.professionalType.charAt(0)).toUpperCase()}</div>}
            <div>
              <span className={`public-doctor-verification${profile.isVerified ? " is-verified" : ""}`}><i />{profile.isVerified ? "Profil vérifié par Radoko" : "Profil en attente de vérification"}</span>
              <h1>{profile.professionalTitle ? `${profile.professionalTitle} ` : ""}{profile.name}</h1>
              <p>{profile.professionalType} · {profile.specialty}</p>
              <span className="public-doctor-location">{profile.practiceCity}{profile.practiceAddress ? ` · ${profile.practiceAddress}` : ""}</span>
            </div>
          </div>
          {!profile.isVerified && <p className="public-doctor-notice">Les informations de ce profil n’ont pas encore été vérifiées par notre équipe.</p>}

          {profile.bio && <section className="public-doctor-section"><h2>À propos</h2><p>{profile.bio}</p>{profile.experienceYears !== null && <p className="public-doctor-experience">{profile.experienceYears} ans d’expérience</p>}</section>}
          {profile.services.length > 0 && <section className="public-doctor-section"><h2>Services proposés</h2><ul className="public-doctor-tags">{profile.services.map((service) => <li key={service}>{service}</li>)}</ul></section>}
          <section className="public-doctor-section"><h2>Informations pratiques</h2>
            <dl className="public-doctor-details">
              <div><dt>Langues parlées</dt><dd>{profile.spokenLanguages.join(", ") || "À confirmer avec le professionnel"}</dd></div>
              <div><dt>Modes de consultation</dt><dd>{profile.consultationModes.join(", ") || "À confirmer avec le professionnel"}</dd></div>
              <div><dt>Tarif indicatif</dt><dd>{profile.consultationFee !== null ? `${new Intl.NumberFormat("fr-FR").format(profile.consultationFee)} MGA` : "À confirmer avec le professionnel"}</dd></div>
              {profile.phone && <div><dt>Téléphone professionnel</dt><dd><a href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`}>{profile.phone}</a></dd></div>}
            </dl>
          </section>
          <section className="public-doctor-section"><h2>Horaires habituels</h2>
            {weekdays.length
              ? <ul className="public-doctor-hours">{weekdays.map((availability, index) => <li key={`${availability.day}-${availability.hours}-${index}`}><span>{availability.day}</span><span>{availability.hours}</span></li>)}</ul>
              : <p>Les disponibilités ne sont pas encore renseignées.</p>}
          </section>
        </section>

        <aside className="public-booking-card" aria-label="Réserver un rendez-vous">
          <span className="public-booking-kicker">PRENDRE RENDEZ-VOUS</span>
          <h2>Choisissez un créneau</h2>
          <p className="public-booking-duration">{profile.consultationDurationMinutes} min · heure de Madagascar</p>
          {profile.availabilities.length ? (
            <>
              <div className="public-calendar">
                <div className="public-calendar-heading">
                  <strong>{monthYear}</strong>
                  <div>
                    <button type="button" aria-label="Mois précédent" onClick={() => changeMonth(-1)} disabled={month <= new Date(`${today.slice(0, 7)}-01T00:00:00Z`)}>‹</button>
                    <button type="button" aria-label="Mois suivant" onClick={() => changeMonth(1)}>›</button>
                  </div>
                </div>
                <div className="public-calendar-grid public-calendar-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
                <div className="public-calendar-grid">
                  {calendarCells.map((date, index) => date
                    ? <button
                        key={date}
                        type="button"
                        className={`${selectedDate === date ? "is-selected" : ""}${date === today ? " is-today" : ""}${dayWindows(date, profile).length ? " has-hours" : ""}`}
                        disabled={date < today}
                        onClick={() => { setSelectedDate(date); setSelectedTime(""); setBookingMessage(""); setSlotsError(""); setIsLoadingSlots(true); }}
                        aria-pressed={selectedDate === date}
                        aria-label={new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", dateStyle: "full" }).format(new Date(`${date}T00:00:00Z`))}
                      >{Number(date.slice(-2))}</button>
                    : <span className="public-calendar-empty" key={`empty-${index}`} aria-hidden="true" />)}
                </div>
              </div>
              <div className="public-slot-picker">
                <h3>{new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${selectedDate}T00:00:00Z`))}</h3>
                {isLoadingSlots ? <p>Chargement des disponibilités…</p>
                  : slotsError ? <p className="public-booking-error" role="alert">{slotsError}</p>
                    : times.length
                      ? <div className="public-time-slots">{times.map((time) => <button className={selectedTime === time ? "is-selected" : ""} type="button" key={time} onClick={() => { setSelectedTime(time); setBookingMessage(""); }}>{time}</button>)}</div>
                      : <p>Aucun créneau disponible ce jour. Essayez une autre date.</p>}
              </div>
              {selectedTime && <form className="public-booking-form" onSubmit={handleBooking}>
                <h3>Vos coordonnées</h3>
                <p>Créneau sélectionné : <strong>{selectedTime}</strong></p>
                <label>Nom complet<input name="patientName" autoComplete="name" maxLength={100} required /></label>
                <label>E-mail<input name="patientEmail" type="email" autoComplete="email" maxLength={254} required /></label>
                <label>Téléphone<input name="patientPhone" type="tel" autoComplete="tel" maxLength={30} required /></label>
                <label>Motif de consultation <span>(facultatif)</span><textarea name="reason" maxLength={500} rows={2} /></label>
                <div className="public-consent"><label><input name="privacyConsent" type="checkbox" required />J’accepte que mes coordonnées soient transmises au professionnel pour traiter cette demande et conservées pendant 12 mois après sa clôture. <Link href="/confidentialite" target="_blank">En savoir plus</Link>.</label></div>
                <button className="public-booking-submit" type="submit" disabled={isBooking}>{isBooking ? "Envoi…" : "Envoyer ma demande"}</button>
              </form>}
            </>
          ) : <p className="public-no-slots">Ce professionnel n’a pas encore défini ses horaires de réservation. Vous pouvez le contacter directement.</p>}
          {bookingMessage && <p className={`public-booking-message${bookingError ? " is-error" : ""}`} role={bookingError ? "alert" : "status"}>{bookingMessage}</p>}
          <p className="public-booking-privacy">Vos coordonnées sont transmises au professionnel pour gérer le rendez-vous.</p>
        </aside>
      </div>
      <footer className="public-doctor-footer">© 2026 Radoko · Madagascar <Link href="/">Accueil</Link></footer>
    </main>
  );
}
