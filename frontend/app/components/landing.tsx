"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Logo } from "./logo";
import { Anatomy } from "./anatomy";
import { AnatomyJourney } from "./anatomy-journey";
import { Icon } from "./icons";
import Link from "next/link";
import { doctorPhotoUrl, searchPublicDoctors, type PublicDoctorSummary } from "../lib/auth-api";

const specialties = [
  { name: "Médecine générale", icon: "plus", detail: "Votre premier interlocuteur santé" },
  { name: "Gastro-entérologie", icon: "digestive", detail: "La santé de votre système digestif" },
  { name: "Cardiologie", icon: "heart", detail: "À l’écoute de votre cœur" },
  { name: "Pédiatrie", icon: "child", detail: "Grandir en bonne santé" },
  { name: "Ophtalmologie", icon: "eye", detail: "Prendre soin de votre regard" },
  { name: "Chirurgie dentaire", icon: "tooth", detail: "Retrouver le plaisir de sourire" },
  { name: "Infirmier·ère", icon: "plus", detail: "Des soins infirmiers près de chez vous" },
  { name: "Sage-femme", icon: "child", detail: "Un accompagnement à chaque étape" },
] as const;
const cities = ["Antananarivo", "Toamasina", "Antsirabe", "Mahajanga", "Fianarantsoa", "Toliara", "Antsiranana"];

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [dialog, setDialog] = useState<"search" | "privacy" | null>(null);
  const [searchResults, setSearchResults] = useState<PublicDoctorSummary[]>([]);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLFormElement>(null);
  const searchRequest = useRef(0);
  const page = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = page.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elements = root.querySelectorAll<HTMLElement>(".section-topline, .section-title-row, .specialty-card, .step, .trust-strip, .doctor-art, .doctor-content");
    let observer: IntersectionObserver | undefined;
    const configure = () => {
      observer?.disconnect();
      elements.forEach((element) => element.classList.remove("landing-reveal", "is-visible"));
      if (preference.matches) return;
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer?.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      elements.forEach((element) => {
        // Only defer offscreen content; the initial viewport stays immediately readable.
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        element.classList.add("landing-reveal");
        observer?.observe(element);
      });
    };
    configure();
    preference.addEventListener("change", configure);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", configure);
      elements.forEach((element) => element.classList.remove("landing-reveal", "is-visible"));
    };
  }, []);

  useEffect(() => {
    if (dialog) {
      modal.current?.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
    modal.current?.close();
  }, [dialog]);

  function selectSpecialty(value: string) {
    setSpecialty(value);
    search.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
    search.current?.querySelector<HTMLSelectElement>("#city")?.focus({ preventScroll: true });
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const requestId = ++searchRequest.current;
    setIsSearching(true);
    setSearchError("");
    setDialog("search");
    searchPublicDoctors(specialty, city).then((results) => {
      if (requestId === searchRequest.current) setSearchResults(results);
    }).catch((error: unknown) => {
      if (requestId === searchRequest.current) {
        setSearchError(error instanceof Error ? error.message : "La recherche est momentanément indisponible.");
      }
    }).finally(() => {
      if (requestId === searchRequest.current) setIsSearching(false);
    });
  }

  return (
    <div className="landing-page" ref={page}>
      <a className="skip-link" href="#recherche">Aller à la recherche</a>
      <header className="site-header">
        <Logo />
        <nav id="main-navigation" className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Navigation principale">
          <a href="#recherche" onClick={() => setMenuOpen(false)}>Trouver un médecin</a>
          <a href="#exploration" onClick={() => setMenuOpen(false)}>Explorer le corps</a>
          <a href="#comment-ca-marche" onClick={() => setMenuOpen(false)}>Comment ça marche</a>
        </nav>
        <div className="header-actions">
          <Link className="nav-login" href="/medecins/connexion">Se connecter</Link>
          <Link className="nav-cta" href="/medecins/inscription">Vous êtes médecin ? <Icon name="arrow" /></Link>
        </div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} aria-controls="main-navigation"><Icon name={menuOpen ? "close" : "menu"} /></button>
      </header>

      <main>
        <section className="hero" id="accueil" aria-labelledby="hero-heading">
          <div className="hero-grain" />
          <div className="hero-art"><div className="orbital orbital-one" /><div className="orbital orbital-two" /><Anatomy /></div>
          <div className="hero-content">
            <div className="eyebrow"><span className="live-dot" /> LA SANTÉ, PLUS PROCHE. <span className="country">MADAGASCAR</span></div>
            <h1 id="hero-heading">Un univers en vous.<br />Le bon médecin<br /><em>près de vous.<svg className="hero-underline" viewBox="0 0 330 22" preserveAspectRatio="none" aria-hidden="true"><path d="M4 14C80 3 214 3 326 12M36 20C136 10 226 11 292 17" pathLength="1" /></svg></em></h1>
            <p className="hero-description">Votre corps est extraordinaire.<br />Trouvons ensemble ceux qui en prennent soin.</p>
            <a className="explore-link" href="#exploration">Commencer l’exploration <span>↓</span></a>
          </div>
          <div className="hero-bottom">
            <div className="search-heading"><span>VOTRE PARCOURS DE SANTÉ COMMENCE ICI</span><span>01 — TROUVER</span></div>
            <form className="search-form" id="recherche" ref={search} onSubmit={submitSearch}>
              <div className="search-field"><Icon name="search" /><div><label htmlFor="specialty">De quel médecin avez-vous besoin ?</label><select id="specialty" value={specialty} onChange={e => setSpecialty(e.target.value)}><option value="">Toutes les spécialités</option>{specialties.map(item => <option key={item.name}>{item.name}</option>)}</select></div></div>
              <div className="search-field city-field"><Icon name="pin" /><div><label htmlFor="city">Où à Madagascar ?</label><select id="city" value={city} onChange={e => setCity(e.target.value)}><option value="">Toutes les villes</option>{cities.map(item => <option key={item}>{item}</option>)}</select></div></div>
              <button className="search-button" type="submit">Trouver un médecin <Icon name="arrow" /></button>
            </form>
            <div className="search-footnote"><span><Icon name="shield" /> Un annuaire pensé pour la confiance</span><span>Consultez les profils et réservez un créneau disponible.</span></div>
          </div>
          <div className="hero-caption"><span className="caption-line" /> UNE EXPLORATION DU VIVANT <span>↓</span></div>
        </section>

        <AnatomyJourney onSelectSpecialty={selectSpecialty} />

        <section className="specialties section-wrap" id="specialites" aria-labelledby="specialties-heading">
          <div className="section-topline"><span className="eyebrow">01 / EXPLORER</span><span>CHAQUE PARTIE DE VOUS MÉRITE DE L’ATTENTION</span></div>
          <div className="section-title-row"><h2 id="specialties-heading">À chaque besoin,<br /><em>la bonne expertise.</em></h2><p>Du premier conseil au suivi spécialisé,<br />trouvez le professionnel qui vous correspond.</p></div>
          <div className="specialty-grid">{specialties.map((item, index) => <button className="specialty-card" key={item.name} onClick={() => selectSpecialty(item.name)}><div className="specialty-card-top"><Icon name={item.icon} /><span>0{index + 1}</span></div><h3>{item.name}</h3><p>{item.detail}</p><span className="card-arrow"><Icon name="arrow" /></span></button>)}</div>
          <p className="section-note"><span className="live-dot" /> Un réseau qui se construit, pour une santé plus accessible à Madagascar.</p>
        </section>

        <section className="how-section" id="comment-ca-marche" aria-labelledby="how-heading"><div className="section-wrap">
          <div className="section-topline"><span className="eyebrow">02 / SE RAPPROCHER</span><span>SIMPLE. HUMAIN. DIRECT.</span></div>
          <div className="section-title-row"><h2 id="how-heading">Moins de recherches.<br /><em>Plus de confiance.</em></h2><p>Le chemin vers le bon médecin<br />ne devrait pas être compliqué.</p></div>
          <div className="steps">{[
            ["01", "Trouvez votre spécialiste", "Choisissez une spécialité et une ville. Votre recherche commence avec ce qui compte pour vous."],
            ["02", "Faites connaissance", "Consultez sa fiche : parcours, adresse, horaires et coordonnées. Le statut de vérification est clairement indiqué."],
            ["03", "Choisissez votre rendez-vous", "Réservez un créneau disponible en ligne, ou contactez directement le professionnel si son agenda n’est pas ouvert."],
          ].map(([number, title, description]) => <article className="step" key={number}><span className="step-number">{number}<Icon name="arrow" /></span><h3>{title}</h3><p>{description}</p></article>)}</div>
          <div className="trust-strip"><Icon name="shield" /><div><strong>La confiance se construit avec soin.</strong><p>Une vérification humaine des profils. Une mise en avant payante clairement identifiée.</p></div><span>NOTRE ENGAGEMENT</span></div>
        </div></section>

        <section className="doctor-section section-wrap" id="medecins" aria-labelledby="doctor-heading">
          <div className="doctor-art" aria-hidden="true"><div className="doctor-orbit" /><span className="large-cross">+</span><span className="art-note">LE LIEN QUI FAIT DU BIEN.</span><span className="art-coordinate">18°52′ S · 47°30′ E</span></div>
          <div className="doctor-content"><span className="eyebrow">03 / REJOINDRE RADOKO</span><h2 id="doctor-heading">Vous prenez soin d’eux.<br /><em>On vous rapproche.</em></h2><p>Faites connaître votre pratique aux patients de votre région, avec une fiche qui vous ressemble.</p><ul><li><Icon name="shield" /> Une fiche vérifiée par notre équipe</li><li><Icon name="plus" /> Vos informations, gérées depuis votre espace</li><li><Icon name="eye" /> Une visibilité renforcée, en option via mobile money</li></ul><Link className="primary-button" href="/medecins/inscription">Créer mon espace médecin <Icon name="arrow" /></Link><span className="doctor-note">Inscription réservée aux professionnels de santé à Madagascar</span></div>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-top"><Logo /><p>La santé est humaine.<br />La recherche devrait l’être aussi.</p><a href="#accueil" className="back-top">Retour en haut <span>↑</span></a></div><div className="footer-bottom"><span>© 2026 Radoko · Pensé pour Madagascar</span><button onClick={() => setDialog("privacy")}>Confidentialité</button><span className="launch-status"><span className="live-dot" /> En cours de création</span></div></footer>

      <dialog ref={modal} className="modal" onCancel={() => setDialog(null)} onClose={() => setDialog(null)} onClick={event => { if (event.target === event.currentTarget) setDialog(null); }} aria-labelledby="dialog-heading">
        <button className="modal-close" aria-label="Fermer" onClick={() => setDialog(null)}><Icon name="close" /></button>
        <span className="eyebrow">RADOKO · EN PRÉPARATION</span>
        <h2 id="dialog-heading">{dialog === "search" ? "Votre recherche" : "Votre confidentialité."}</h2>
        {dialog === "search" ? <><div className="search-summary"><span>{specialty || "Toutes les spécialités"}</span><span><Icon name="pin" /> {city || "Toutes les villes"}</span></div>{isSearching ? <div className="empty-state"><p>Recherche des professionnels…</p></div> : searchError ? <div className="empty-state" role="alert"><p>{searchError}</p></div> : searchResults.length ? <div className="directory-results">{searchResults.map((doctor) => <Link className="directory-result" href={`/medecins/${doctor.id}`} key={doctor.id} onClick={() => setDialog(null)}><span className={`directory-result-avatar${doctor.profilePhotoUrl ? " has-photo" : ""}`} style={doctor.profilePhotoUrl ? { backgroundImage: `url("${doctorPhotoUrl(doctor.profilePhotoUrl)}")` } : undefined}>{!doctor.profilePhotoUrl && (doctor.name?.charAt(0).toUpperCase() ?? "R")}</span><span className="directory-result-info"><strong>{doctor.professionalTitle ? `${doctor.professionalTitle} ` : ""}{doctor.name}</strong><small>{doctor.professionalType} · {doctor.specialty}</small><small>{doctor.practiceCity}{doctor.practiceAddress ? ` · ${doctor.practiceAddress}` : ""}</small></span><span className="directory-result-status">{doctor.isVerified ? "Vérifié" : "À vérifier"} <Icon name="arrow" /></span></Link>)}</div> : <div className="empty-state"><Icon name="search" /><h3>Aucun professionnel trouvé.</h3><p>Essayez une autre spécialité ou une autre ville. Vous pouvez aussi vous connecter à une fiche directement.</p></div>}<button className="primary-button" onClick={() => setDialog(null)}>Modifier ma recherche <Icon name="arrow" /></button></> : <><p>La recherche envoie la spécialité et la ville sélectionnées au service Radoko pour afficher les profils correspondants. Ces critères ne sont pas conservés dans le navigateur.</p><p>Lors d’une réservation, le nom, l’e-mail, le téléphone, le créneau et le motif facultatif sont transmis et enregistrés pour permettre au professionnel de gérer le rendez-vous.</p><p>Les coordonnées du patient sont visibles au professionnel associé au rendez-vous. Elles ne sont pas affichées sur la fiche publique. Les informations de confidentialité devront être complétées avant l’ouverture commerciale du service.</p></>}
      </dialog>
    </div>
  );
}
