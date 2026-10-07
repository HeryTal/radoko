"use client";

import { useState } from "react";
import type { AuthUser, AvailabilityWindow } from "../lib/auth-api";
import { updateDoctorAvailability } from "../lib/auth-api";

const weekdays = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function DoctorAvailabilityEditor({
  profile,
  accessToken,
  onProfileUpdate,
}: {
  profile: AuthUser;
  accessToken: string;
  onProfileUpdate: (profile: AuthUser) => void;
}) {
  const [windows, setWindows] = useState<AvailabilityWindow[]>(
    profile.availabilities.map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })),
  );
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function updateWindow(
    weekday: number,
    originalStartTime: string,
    updates: Partial<AvailabilityWindow>,
  ) {
    setWindows((current) => current.map((window) =>
      window.weekday === weekday && window.startTime === originalStartTime
        ? { ...window, ...updates }
        : window,
    ));
  }

  function toggleDay(weekday: number, enabled: boolean) {
    setWindows((current) => enabled
      ? [...current, { weekday, startTime: "09:00", endTime: "12:00" }].sort((a, b) => a.weekday - b.weekday)
      : current.filter((window) => window.weekday !== weekday),
    );
  }

  function addWindow(weekday: number) {
    const dayWindows = windows
      .filter((window) => window.weekday === weekday)
      .sort((first, second) => first.startTime.localeCompare(second.startTime));
    let cursor = 9 * 60;
    let nextWindow: AvailabilityWindow | null = null;

    for (const window of dayWindows) {
      const [hour, minute] = window.startTime.split(":").map(Number);
      const start = hour * 60 + minute;
      if (start - cursor >= 30) {
        nextWindow = {
          weekday,
          startTime: `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`,
          endTime: window.startTime,
        };
        break;
      }
      const [endHour, endMinute] = window.endTime.split(":").map(Number);
      cursor = Math.max(cursor, endHour * 60 + endMinute) + 60;
    }

    if (!nextWindow && 18 * 60 - cursor >= 30) {
      nextWindow = {
        weekday,
        startTime: `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`,
        endTime: "18:00",
      };
    }

    if (nextWindow) {
      setWindows((current) => [...current, nextWindow].sort(
        (first, second) =>
          first.weekday - second.weekday || first.startTime.localeCompare(second.startTime),
      ));
    }
  }

  function removeWindow(weekday: number, startTime: string) {
    setWindows((current) => current.filter(
      (window) => window.weekday !== weekday || window.startTime !== startTime,
    ));
  }

  async function saveAvailability() {
    setIsSaving(true);
    setMessage("");
    setIsError(false);
    try {
      const updated = await updateDoctorAvailability(accessToken, windows);
      onProfileUpdate(updated);
      setWindows(updated.availabilities.map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })));
      setMessage("Vos horaires de disponibilité ont été enregistrés.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Impossible d’enregistrer les horaires.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="dashboard-schedule-editor">
      <p className="dashboard-editor-intro">Définissez vos créneaux hebdomadaires. Les patients pourront choisir une heure libre dans ces plages.</p>
      <div className="dashboard-weekly-hours">
        {weekdays.map((day, weekday) => {
          const dayWindows = windows.filter((item) => item.weekday === weekday);
          return (
            <div className={`dashboard-weekday${dayWindows.length ? " is-open" : ""}`} key={day}>
              <label className="dashboard-weekday-toggle">
                <input type="checkbox" checked={dayWindows.length > 0} onChange={(event) => toggleDay(weekday, event.target.checked)} />
                <span>{day}</span>
              </label>
              {dayWindows.length ? (
                <div className="dashboard-day-windows">
                  {dayWindows.map((window) => (
                    <div className="dashboard-time-fields" key={`${window.startTime}-${window.endTime}`}>
                      <label><span className="dashboard-sr-only">Début {day}</span><input type="time" value={window.startTime} onChange={(event) => updateWindow(weekday, window.startTime, { startTime: event.target.value })} /></label>
                      <span>à</span>
                      <label><span className="dashboard-sr-only">Fin {day}</span><input type="time" value={window.endTime} onChange={(event) => updateWindow(weekday, window.startTime, { endTime: event.target.value })} /></label>
                      <button className="dashboard-remove-window" type="button" aria-label={`Supprimer ${day} ${window.startTime} – ${window.endTime}`} onClick={() => removeWindow(weekday, window.startTime)}>×</button>
                    </div>
                  ))}
                  <button className="dashboard-add-window" type="button" onClick={() => addWindow(weekday)} disabled={dayWindows.length >= 3}>+ Ajouter une plage</button>
                </div>
              ) : <span className="dashboard-closed-label">Indisponible</span>}
            </div>
          );
        })}
      </div>
      {message && <p className={`dashboard-form-message${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
      <button className="dashboard-save-button" type="button" onClick={saveAvailability} disabled={isSaving}>
        {isSaving ? "Enregistrement…" : "Enregistrer mes disponibilités"}
      </button>
    </div>
  );
}
