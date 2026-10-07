"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  downloadVerificationDocument,
  getDoctorProfile,
  getPendingProfessionals,
  reviewProfessional,
  type PendingProfessional,
} from "../lib/auth-api";

export function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [professionals, setProfessionals] = useState<PendingProfessional[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function reload(accessToken: string) {
    setProfessionals(await getPendingProfessionals(accessToken));
  }

  useEffect(() => {
    let active = true;
    const accessToken = window.localStorage.getItem("radoko_access_token");
    if (!accessToken) {
      router.replace("/medecins/connexion");
      return () => { active = false; };
    }
    getDoctorProfile(accessToken).then(async (profile) => {
      if (profile.role !== "ADMIN") {
        router.replace("/medecins/tableau-de-bord");
        return;
      }
      if (active) setToken(accessToken);
      await reload(accessToken);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger l’administration.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  async function decide(doctorId: string, decision: "approve" | "reject") {
    setError("");
    setMessage("");
    try {
      await reviewProfessional(token, doctorId, decision, reasons[doctorId]);
      await reload(token);
      setMessage(decision === "approve" ? "Profil validé. La notification e-mail est en file d’attente ; sa livraison dépend de la configuration SMTP." : "Profil refusé. Les justificatifs ont été supprimés et une notification e-mail a été mise en file d’attente.");
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Impossible d’enregistrer la décision.");
    }
  }

  async function download(documentId: string) {
    try {
      const blob = await downloadVerificationDocument(token, documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "justificatif-professionnel";
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Impossible de télécharger ce justificatif.");
    }
  }

  function logout() {
    window.localStorage.removeItem("radoko_access_token");
    router.replace("/medecins/connexion");
  }

  return (
    <main className="dashboard-main admin-dashboard">
      <header className="dashboard-topbar">
        <Link href="/" className="dashboard-brand"><Image src="/brand/radoko-logo.svg" alt="Radoko" width={180} height={36} /></Link>
        <span className="dashboard-breadcrumb-current">Administration</span>
        <button className="dashboard-logout" type="button" onClick={logout}>Déconnexion</button>
      </header>
      <div className="dashboard-content">
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow"><span /> ADMINISTRATION RADOKO</span>
            <h1>Vérification des professionnels</h1>
            <p>Consultez les justificatifs de manière privée, puis approuvez ou refusez les profils.</p>
          </div>
        </section>
        {error && <p className="dashboard-form-message is-error" role="alert">{error}</p>}
        {message && <p className="dashboard-form-message" role="status">{message}</p>}
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div><span className="dashboard-section-kicker">À EXAMINER</span><h2>Profils en attente</h2></div>
            <span className="dashboard-profile-status">{professionals.length}</span>
          </div>
          {loading ? <p>Chargement des demandes…</p> : professionals.length === 0
            ? <p className="dashboard-editor-intro">Aucun profil en attente de vérification.</p>
            : <div className="admin-professionals">
              {professionals.map((professional) => (
                <article className="admin-professional-card" key={professional.id}>
                  <h3>{professional.name || "Nom non renseigné"}</h3>
                  <p>{professional.professionalType}{professional.specialty ? ` · ${professional.specialty}` : ""}</p>
                  <p>{professional.practiceCity || "Ville non renseignée"} · {professional.email} · {professional.phone || "Téléphone non renseigné"}</p>
                  {professional.verificationNote && <p><strong>Motif de refus précédent :</strong> {professional.verificationNote}</p>}
                  <p>Inscription le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(professional.createdAt))}</p>
                  <div className="admin-documents">
                    <strong>Justificatifs</strong>
                    {professional.verificationDocuments.length
                      ? professional.verificationDocuments.map((document) => (
                        <button type="button" key={document.id} onClick={() => void download(document.id)}>
                          Télécharger {document.fileName} ({document.mimeType})
                        </button>
                      ))
                      : <span>Aucun justificatif envoyé</span>}
                  </div>
                  <label>Motif si refus<textarea value={reasons[professional.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [professional.id]: event.target.value }))} minLength={5} maxLength={500} /></label>
                  <div className="admin-decision-actions">
                    <button type="button" disabled={!professional.verificationDocuments.length} onClick={() => void decide(professional.id, "approve")}>Approuver</button>
                    <button type="button" disabled={(reasons[professional.id]?.trim().length ?? 0) < 5} onClick={() => void decide(professional.id, "reject")}>Refuser</button>
                  </div>
                </article>
              ))}
            </div>}
        </section>
      </div>
    </main>
  );
}
