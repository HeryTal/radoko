import type { Metadata } from "next";
import { DoctorAuthLayout } from "../../components/doctor-auth-layout";
import { DoctorAuthForm } from "../../components/doctor-auth-form";

export const metadata: Metadata = {
  title: "Connexion médecin — Radoko",
  description: "Connectez-vous à votre espace professionnel Radoko.",
};

export default function ConnexionMedecinPage() {
  return <DoctorAuthLayout><DoctorAuthForm mode="login" /></DoctorAuthLayout>;
}
