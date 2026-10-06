"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "./icons";
import { OrganIllustration } from "./organ-illustration";

const stops = [
  { id: "bouche", name: "La bouche", latin: "Cavité buccale", title: "Tout commence", emphasis: "par une bouchée.", description: "Une porte d’entrée sur un monde intérieur. Les dents, la langue et la salive amorcent ensemble le voyage de la digestion.", detail: "Les dents fragmentent les aliments. La langue les mélange à la salive, puis les dirige vers le pharynx lors de la déglutition.", specialty: "Chirurgie dentaire", tag: "MASTIQUER · GOÛTER", color: "#f7fbfe" },
  { id: "oesophage", name: "L’œsophage", latin: "Œsophage", title: "Un passage.", emphasis: "Tout en mouvement.", description: "Poursuivez la descente. Derrière sa simplicité apparente, ce conduit musculaire accompagne chaque bouchée vers l’estomac.", detail: "L’œsophage relie le pharynx à l’estomac. Les contractions successives de sa paroi font progresser les aliments : ce mouvement porte le nom de péristaltisme.", specialty: "Gastro-entérologie", tag: "TRANSPORTER", color: "#f0f9ff" },
  { id: "estomac", name: "L’estomac", latin: "Estomac", title: "Au creux", emphasis: "de la transformation.", description: "Le paysage s’élargit. Dans cette poche aux parois plissées, les aliments sont brassés et mélangés aux sucs gastriques.", detail: "L’estomac se situe entre l’œsophage et l’intestin grêle. Sa paroi musculaire brasse les aliments. Les plis représentés ici évoquent ceux de sa surface intérieure.", specialty: "Gastro-entérologie", tag: "BRASSER · TRANSFORMER", color: "#f6fbff" },
  { id: "intestin", name: "L’intestin grêle", latin: "Duodénum · Jéjunum · Iléon", title: "Un monde de plis.", emphasis: "Une richesse invisible.", description: "Le voyage serpente et se ramifie. C’est ici que se poursuit la digestion et que la plupart des nutriments passent dans l’organisme.", detail: "L’intestin grêle est constitué du duodénum, du jéjunum et de l’iléon. Sa surface intérieure présente des replis et des villosités qui augmentent la surface d’absorption.", specialty: "Gastro-entérologie", tag: "DIGÉRER · ABSORBER", color: "#f0fafb" },
  { id: "colon", name: "Le côlon", latin: "Gros intestin", title: "La dernière étape.", emphasis: "Un équilibre vivant.", description: "Notre exploration touche à sa fin. Le côlon récupère une partie de l’eau restante et accueille une multitude de micro-organismes.", detail: "Le côlon fait suite à l’intestin grêle et se prolonge vers le rectum. Il participe à l’absorption de l’eau et à la formation des selles.", specialty: "Gastro-entérologie", tag: "RÉCUPÉRER · ÉLIMINER", color: "#f7fcff" },
] as const;

export type OrganName = (typeof stops)[number]["id"];

export function AnatomyJourney({ onSelectSpecialty }: { onSelectSpecialty: (specialty: string) => void }) {
  const container = useRef<HTMLElement>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const section = container.current;
      if (!section) return;
      const bounds = section.getBoundingClientRect();
      const distance = Math.max(0, Math.min(bounds.height, window.innerHeight * .5 - bounds.top));
      setProgress(Math.round(distance / bounds.height * 100));
      const scenes = section.querySelectorAll<HTMLElement>(".anatomy-scene");
      let current = 0;
      scenes.forEach((scene, index) => {
        if (scene.getBoundingClientRect().top < window.innerHeight * .55) current = index;
      });
      setActive(current);
      section.style.setProperty("--drift", `${Math.round(distance * .06)}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    if (selected === null) { detailDialog.current?.close(); return; }
    detailDialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [selected]);

  return (
    <section id="exploration" className="anatomy-journey" ref={container} aria-label="Voyage dans l’appareil digestif" style={{ "--zone-color": stops[active].color } as CSSProperties}>
      <div className="journey-atmosphere" aria-hidden="true">
        {Array.from({ length: 30 }, (_, index) => <i key={index} style={{ left: `${(index * 37) % 100}%`, top: `${(index * 71) % 100}%`, width: `${4 + index % 5 * 3}px`, height: `${4 + index % 5 * 3}px` }} />)}
      </div>
      <div className="digestive-route" aria-hidden="true"><svg width="100%" height="100%" viewBox="0 0 400 5000" preserveAspectRatio="none"><path d="M210 0C100 300 280 650 210 1000S140 1650 210 2000 310 2600 200 3000 100 3600 210 4000 260 4600 210 5000" /><path className="route-center" d="M210 0C100 300 280 650 210 1000S140 1650 210 2000 310 2600 200 3000 100 3600 210 4000 260 4600 210 5000" /></svg></div>

      <div className="journey-gauge-wrap"><aside className="journey-gauge" aria-label="Progression de l’exploration">
        <span className="eyebrow">VOYAGE INTÉRIEUR</span>
        <div className="gauge-value">{String(active + 1).padStart(2, "0")}<span> / 05</span></div>
        <p className="gauge-name">{stops[active].name}</p>
        <p className="gauge-latin">{stops[active].latin}</p>
        <div className="journey-progress" role="progressbar" aria-label="Parcours exploré" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ transform: `scaleX(${progress / 100})` }} /></div>
        <nav aria-label="Étapes anatomiques">{stops.map((stop, index) => <a key={stop.id} href={`#zone-${stop.id}`} aria-label={stop.name} aria-current={active === index ? "step" : undefined}><i /><span>{stop.name}</span><small>0{index + 1}</small></a>)}</nav>
        <span className="gauge-note">Illustration artistique<br />Parcours schématique, non à l’échelle</span>
      </aside></div>

      {stops.map((stop, index) => <article key={stop.id} id={`zone-${stop.id}`} className={`anatomy-scene scene-${stop.id}`} aria-labelledby={`title-${stop.id}`}>
        <div className="scene-copy">
          <span className="eyebrow"><span className="live-dot" /> ESCALE 0{index + 1} · {stop.tag}</span>
          <h2 id={`title-${stop.id}`}>{stop.title}<br /><em>{stop.emphasis}</em></h2>
          <p>{stop.description}</p>
          <button className="scene-specialty" onClick={() => onSelectSpecialty(stop.specialty)}>{stop.specialty}<Icon name="arrow" /></button>
          <a className="next-organ" href={index < stops.length - 1 ? `#zone-${stops[index + 1].id}` : "#specialites"}>{index < stops.length - 1 ? "Poursuivre la descente" : "Trouver le bon spécialiste"}<span>↓</span></a>
        </div>
        <button className="organ-explore" onClick={() => setSelected(index)} aria-label={`Explorer ${stop.name.toLowerCase()}`}>
          <OrganIllustration organ={stop.id} />
          <span className="organ-label"><span className="organ-plus">+</span><span>{stop.name}<small>TOUCHER POUR EXPLORER</small></span></span>
        </button>
        <span className="scene-coordinate" aria-hidden="true">0{index + 1} — {stop.latin.toUpperCase()}</span>
      </article>)}

      <dialog ref={detailDialog} className="modal organ-dialog" onCancel={() => setSelected(null)} onClose={() => setSelected(null)} aria-labelledby="organ-detail-heading">
        <button className="modal-close" aria-label="Fermer la fiche anatomique" onClick={() => setSelected(null)}><Icon name="close" /></button>
        {selected !== null && <><span className="eyebrow">ESCALE 0{selected + 1} · LE CORPS HUMAIN</span><OrganIllustration organ={stops[selected].id} /><h2 id="organ-detail-heading">{stops[selected].name}</h2><p>{stops[selected].detail}</p><button className="primary-button" onClick={() => { setSelected(null); onSelectSpecialty(stops[selected].specialty); }}>Trouver un spécialiste <Icon name="arrow" /></button><p className="anatomy-disclaimer">Illustration simplifiée à visée de découverte.</p></>}
      </dialog>
    </section>
  );
}
