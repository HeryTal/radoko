import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./logo";
import { Icon } from "./icons";

export function DoctorAuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="doctor-auth-page">
      <header className="doctor-auth-header">
        <Logo href="/" />
        <Link href="/" className="auth-home-link">Retour au site <Icon name="arrow" /></Link>
      </header>
      <main className="doctor-auth-main">
        <section className="doctor-auth-main-content" aria-label="Espace médecin">
          {children}
        </section>
      </main>
      <footer className="doctor-auth-footer">
        <span>© 2026 Radoko · Pensé pour Madagascar</span>
        <span>Vos informations sont transmises de manière sécurisée.</span>
      </footer>
    </div>
  );
}
