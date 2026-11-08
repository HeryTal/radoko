"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CalendarData } from "../lib/auth-api";
import { createCalendarBlock, deleteCalendarBlock, downloadDoctorCalendar, getCalendarFeedUrl, getDoctorCalendar } from "../lib/auth-api";

type ViewMode = "day" | "week" | "month";

function dayStart(date: Date) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }
function dayKey(date: Date) { return date.toISOString().slice(0, 10); }
function calendarRange(date: Date, view: ViewMode) {
  const current = dayStart(date);
  if (view === "day") return { from: current, to: new Date(current.getTime() + 24 * 60 * 60_000) };
  if (view === "week") {
    const mondayOffset = (current.getDay() + 6) % 7;
    const from = new Date(current.getTime() - mondayOffset * 24 * 60 * 60_000);
    return { from, to: new Date(from.getTime() + 7 * 24 * 60 * 60_000) };
  }
  const from = new Date(current.getFullYear(), current.getMonth(), 1);
  return { from, to: new Date(current.getFullYear(), current.getMonth() + 1, 1) };
}

export function DoctorCalendar({ accessToken }: { accessToken: string }) {
  const [view, setView] = useState<ViewMode>("week");
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState<CalendarData>({ appointments: [], blocks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blockForm, setBlockForm] = useState({ startsAt: "", endsAt: "", note: "" });
  const [feed, setFeed] = useState<{ feedUrl: string; googleUrl: string; outlookUrl: string } | null>(null);

  const range = useMemo(() => calendarRange(date, view), [date, view]);
  const days = useMemo(() => {
    const result: Date[] = [];
    for (let current = new Date(range.from); current < range.to; current = new Date(current.getTime() + 24 * 60 * 60_000)) result.push(current);
    return result;
  }, [range]);

  async function load() {
    setLoading(true); setError("");
    try { setData(await getDoctorCalendar(accessToken, range.from.toISOString(), range.to.toISOString())); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Impossible de charger le calendrier."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [accessToken, range.from.getTime(), range.to.getTime()]);

  function move(amount: number) {
    setDate((current) => view === "month" ? new Date(current.getFullYear(), current.getMonth() + amount, 1) : new Date(current.getTime() + amount * (view === "week" ? 7 : 1) * 24 * 60 * 60_000));
  }
  async function addBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await createCalendarBlock(accessToken, { startsAt: new Date(blockForm.startsAt).toISOString(), endsAt: new Date(blockForm.endsAt).toISOString(), note: blockForm.note }); setBlockForm({ startsAt: "", endsAt: "", note: "" }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Impossible de bloquer ce créneau."); }
  }
  async function exportCalendar() {
    const blob = await downloadDoctorCalendar(accessToken, range.from.toISOString(), range.to.toISOString());
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "radoko-calendrier.ics"; link.click(); URL.revokeObjectURL(link.href);
  }
  async function prepareFeed() { try { setFeed(await getCalendarFeedUrl(accessToken)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Impossible de préparer la synchronisation."); } }

  const title = view === "month" ? new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date) : `${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(range.from)} — ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(range.to.getTime() - 1))}`;
  return <div className="doctor-calendar">
    <div className="doctor-calendar-toolbar"><div><button type="button" onClick={() => move(-1)}>‹</button><button type="button" onClick={() => setDate(new Date())}>Aujourd’hui</button><button type="button" onClick={() => move(1)}>›</button><strong>{title}</strong></div><div className="doctor-calendar-views">{(["day", "week", "month"] as ViewMode[]).map((item) => <button key={item} type="button" className={view === item ? "is-active" : ""} onClick={() => setView(item)}>{item === "day" ? "Jour" : item === "week" ? "Semaine" : "Mois"}</button>)}</div></div>
    <div className="doctor-calendar-actions"><button type="button" onClick={() => void exportCalendar()}>Exporter .ics</button><button type="button" onClick={() => void prepareFeed()}>Synchroniser Google / Outlook</button></div>
    {feed && <div className="doctor-calendar-feed"><p>Ajoutez le calendrier dans votre application :</p><a href={feed.googleUrl} target="_blank" rel="noreferrer">Google Calendar</a><a href={feed.outlookUrl} target="_blank" rel="noreferrer">Outlook</a><button type="button" onClick={() => void navigator.clipboard?.writeText(feed.feedUrl)}>Copier le lien .ics</button></div>}
    {error && <p className="dashboard-form-message is-error" role="alert">{error}</p>}
    {loading ? <p>Chargement du calendrier…</p> : <div className={`doctor-calendar-grid is-${view}`}>{days.map((day) => { const key = dayKey(day); const appointments = data.appointments.filter((event) => dayKey(new Date(event.startsAt)) === key); const blocks = data.blocks.filter((event) => dayKey(new Date(event.startsAt)) === key); return <div className="doctor-calendar-day" key={key}><strong>{new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(day)}</strong>{appointments.map((event) => <div className={`doctor-calendar-event is-${event.status.toLowerCase()}`} key={event.id}>{new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.startsAt))} · {event.patientName}</div>)}{blocks.map((block) => <div className="doctor-calendar-event is-blocked" key={block.id}>Bloqué · {block.note || "Indisponible"}<button type="button" onClick={() => void deleteCalendarBlock(accessToken, block.id).then(load)}>×</button></div>)}{!appointments.length && !blocks.length && <span className="doctor-calendar-empty">Libre</span>}</div>; })}</div>}
    <form className="doctor-calendar-block-form" onSubmit={(event) => void addBlock(event)}><strong>Bloquer un créneau</strong><input type="datetime-local" value={blockForm.startsAt} onChange={(event) => setBlockForm({ ...blockForm, startsAt: event.target.value })} required /><input type="datetime-local" value={blockForm.endsAt} onChange={(event) => setBlockForm({ ...blockForm, endsAt: event.target.value })} required /><input placeholder="Motif (facultatif)" value={blockForm.note} onChange={(event) => setBlockForm({ ...blockForm, note: event.target.value })} maxLength={200} /><button type="submit">Bloquer</button></form>
  </div>;
}
