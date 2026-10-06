import type { Metadata } from "next";
import { DoctorAuthForm } from "../../components/doctor-auth-form";

export const metadata: Metadata = {
  title: "Créer un espace médecin — Radoko",
  description: "Créez votre espace professionnel Radoko pour présenter votre pratique à Madagascar.",
};

export default function InscriptionMedecinPage() {
  return <DoctorAuthForm mode="register" />;
}
