import type { Metadata } from "next";
import { DoctorAuthForm } from "../../components/doctor-auth-form";

export const metadata: Metadata = {
  title: "Connexion médecin — Radoko",
  description: "Connectez-vous à votre espace professionnel Radoko.",
};

export default function ConnexionMedecinPage() {
  return <DoctorAuthForm mode="login" />;
}
