"use client";

import { useEffect, useId, useRef, useState } from "react";

type Confirmation = {
  title: string;
  description: string;
  label: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

/** Native modal semantics keep focus and background interaction inside the dialog. */
export function useConfirmation() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const inFlight = useRef(false);
  const id = useId();

  useEffect(() => {
    if (!confirmation) return;
    const element = dialog.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    cancel.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [confirmation]);

  function dismiss() {
    if (!inFlight.current) setConfirmation(null);
  }

  async function execute() {
    if (!confirmation || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      await confirmation.onConfirm();
      setConfirmation(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "L’action n’a pas abouti. Veuillez réessayer.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return {
    confirm: (options: Confirmation) => {
      if (inFlight.current) return;
      setError("");
      setConfirmation(options);
    },
    confirmationDialog: confirmation && (
      <dialog ref={dialog} className={`confirmation-dialog${confirmation.destructive ? " is-destructive" : ""}`}
        aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
        onCancel={(event) => { event.preventDefault(); dismiss(); }}>
        <div className="confirmation-content" aria-busy={pending}>
          <span className="confirmation-symbol" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {confirmation.destructive ? <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v5m0 3v.2" /></> : <><path d="M9 4H5v16h4M13 8l4 4-4 4m-4-4h12" /></>}
            </svg>
          </span>
          <p className="confirmation-eyebrow">UN INSTANT AVANT DE CONTINUER</p>
          <h2 id={`${id}-title`}>{confirmation.title}</h2>
          <p id={`${id}-description`} className="confirmation-description">{confirmation.description}</p>
          {error && <p className="confirmation-error" role="alert">{error}</p>}
          <div className="confirmation-actions">
            <button ref={cancel} type="button" className="confirmation-cancel" disabled={pending} onClick={dismiss}>Annuler</button>
            <button type="button" className="confirmation-submit" disabled={pending} onClick={() => void execute()}>
              {pending && <span className="confirmation-spinner" aria-hidden="true" />}
              {pending ? "Traitement en cours…" : confirmation.label}
            </button>
          </div>
          <span className="confirmation-live" role="status">{pending ? "Traitement en cours, veuillez patienter." : ""}</span>
        </div>
      </dialog>
    ),
  };
}
