import type { Metadata } from "next";
import { DoctorDashboard } from "../../components/doctor-dashboard";

export const metadata: Metadata = {
  title: "Mon espace médecin — Radoko",
  description: "Consultez les informations de votre espace professionnel Radoko.",
};

export default function TableauDeBordMedecinPage() {
  return <DoctorDashboard />;
}
