"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Logo } from "./logo";
import { Anatomy } from "./anatomy";
import { AnatomyJourney } from "./anatomy-journey";
import { Icon } from "./icons";

const specialties = [
  { name: "Médecine générale", icon: "plus", detail: "Votre premier interlocuteur santé" },
  { name: "Gastro-entérologie", icon: "digestive", detail: "La santé de votre système digestif" },
  { name: "Cardiologie", icon: "heart", detail: "À l’écoute de votre cœur" },
  { name: "Pédiatrie", icon: "child", detail: "Grandir en bonne santé" },
  { name: "Ophtalmologie", icon: "eye", detail: "Prendre soin de votre regard" },
  { name: "Chirurgie dentaire", icon: "tooth", detail: "Retrouver le plaisir de sourire" },
] as const;
const cities = ["Antananarivo", "Toamasina", "Antsirabe", "Mahajanga", "Fianarantsoa", "Toliara", "Antsiranana"];

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [dialog, setDialog] = useState<"search" | "doctor" | "privacy" | null>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (dialog) {
      modal.current?.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = previous; };
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
    setDialog("search");
  }

  return (
    <>
      <a className="skip-link" href="#recherche">Aller à la recherche</a>
      <header className="site-header">
        <Logo />
        <nav id="main-navigation" className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Navigation principale">
          <a href="#recherche" onClick={() => setMenuOpen(false)}>Trouver un médecin</a>
          <a href="#exploration" onClick={() => setMenuOpen(false)}>Explorer le corps</a>
          <a href="#comment-ca-marche" onClick={() => setMenuOpen(false)}>Comment ça marche</a>
        </nav>
        <a className="nav-cta" href="#medecins">Vous êtes médecin ? <Icon name="arrow" /></a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} aria-controls="main-navigation"><Icon name={menuOpen ? "close" : "menu"} /></button>
      </header>

      <main>
        <section className="hero" id="accueil" aria-labelledby="hero-heading">
          <div className="hero-grain" />
          <div className="hero-art"><div className="orbital orbital-one" /><div className="orbital orbital-two" /><Anatomy />
            <button className="anatomy-tag" onClick={() => selectSpecialty("Gastro-entérologie")}><span className="live-dot" /><span>LE CORPS, CET UNIVERS<small>Explorer la gastro-entérologie</small></span><Icon name="arrow" /></button>
          </div>
          <div className="hero-content">
            <div className="eyebrow"><span className="live-dot" /> LA SANTÉ, PLUS PROCHE. <span className="country">MADAGASCAR</span></div>
            <h1 id="hero-heading">Un univers en vous.<br />Le bon médecin<br /><em>près de vous.</em></h1>
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
            <div className="search-footnote"><span><Icon name="shield" /> Un annuaire pensé pour la confiance</span><span>Sans intermédiaire. Sans prise de rendez-vous en ligne.</span></div>
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
            ["02", "Faites connaissance", "Consultez sa fiche : parcours, adresse, horaires et coordonnées. Les profils seront vérifiés manuellement avant publication."],
            ["03", "Prenez contact, simplement", "Appelez directement le cabinet pour échanger et organiser votre visite. Vous gardez le lien avec votre médecin."],
          ].map(([number, title, description]) => <article className="step" key={number}><span className="step-number">{number}<Icon name="arrow" /></span><h3>{title}</h3><p>{description}</p></article>)}</div>
          <div className="trust-strip"><Icon name="shield" /><div><strong>La confiance se construit avec soin.</strong><p>Une vérification humaine des profils. Une mise en avant payante clairement identifiée.</p></div><span>NOTRE ENGAGEMENT</span></div>
        </div></section>

        <section className="doctor-section section-wrap" id="medecins" aria-labelledby="doctor-heading">
          <div className="doctor-art" aria-hidden="true"><div className="doctor-orbit" /><span className="large-cross">+</span><span className="art-note">LE LIEN QUI FAIT DU BIEN.</span><span className="art-coordinate">18°52′ S · 47°30′ E</span></div>
          <div className="doctor-content"><span className="eyebrow">03 / REJOINDRE RADOKO</span><h2 id="doctor-heading">Vous prenez soin d’eux.<br /><em>On vous rapproche.</em></h2><p>Faites connaître votre pratique aux patients de votre région, avec une fiche qui vous ressemble.</p><ul><li><Icon name="shield" /> Une fiche vérifiée par notre équipe</li><li><Icon name="plus" /> Vos informations, gérées depuis votre espace</li><li><Icon name="eye" /> Une visibilité renforcée, en option via mobile money</li></ul><button className="primary-button" onClick={() => setDialog("doctor")}>Découvrir l’espace médecin <Icon name="arrow" /></button><span className="doctor-note">En préparation · Pour les professionnels à Madagascar</span></div>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-top"><Logo /><p>La santé est humaine.<br />La recherche devrait l’être aussi.</p><a href="#accueil" className="back-top">Retour en haut <span>↑</span></a></div><div className="footer-bottom"><span>© 2026 Radoko · Pensé pour Madagascar</span><button onClick={() => setDialog("privacy")}>Confidentialité</button><span className="launch-status"><span className="live-dot" /> En cours de création</span></div></footer>

      <dialog ref={modal} className="modal" onCancel={() => setDialog(null)} onClose={() => setDialog(null)} onClick={event => { if (event.target === event.currentTarget) setDialog(null); }} aria-labelledby="dialog-heading">
        <button className="modal-close" aria-label="Fermer" onClick={() => setDialog(null)}><Icon name="close" /></button>
        <span className="eyebrow">RADOKO · EN PRÉPARATION</span>
        <h2 id="dialog-heading">{dialog === "search" ? "Votre recherche" : dialog === "doctor" ? "Votre futur espace médecin." : "Votre confidentialité."}</h2>
        {dialog === "search" ? <><div className="search-summary"><span>{specialty || "Toutes les spécialités"}</span><span><Icon name="pin" /> {city || "Toutes les villes"}</span></div><div className="empty-state"><Icon name="search" /><h3>L’annuaire prend forme.</h3><p>Aucun profil n’est publié pour le moment. Les premières fiches seront disponibles après leur vérification par notre équipe.</p></div><button className="primary-button" onClick={() => setDialog(null)}>Modifier ma recherche <Icon name="arrow" /></button></> : dialog === "doctor" ? <><p>Un espace pour créer et mettre à jour votre fiche, présenter votre pratique et être trouvé par les patients de votre ville.</p><ol className="doctor-process"><li>Renseignez votre parcours et les coordonnées du cabinet.</li><li>Notre équipe vérifie votre profil avant publication.</li><li>Choisissez, si vous le souhaitez, une mise en avant payante via mobile money, signalée aux patients.</li></ol><div className="modal-notice">Les inscriptions et les paiements ne sont pas encore ouverts. Aucune information n’est collectée sur cette page.</div><button className="primary-button" onClick={() => setDialog(null)}>C’est compris <Icon name="arrow" /></button></> : <><p>Cette page de présentation n’utilise aucun formulaire d’inscription, paiement ou outil de mesure d’audience.</p><p>Vos choix de spécialité et de ville restent dans la page : ils ne sont ni enregistrés ni envoyés à un annuaire. Ils sont effacés lorsque vous rechargez la page.</p><p>Les informations concernant le traitement des données seront complétées avant l’ouverture du service.</p></>}
      </dialog>
    </>
  );
}
