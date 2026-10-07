import type { Metadata } from "next";
import { PublicDoctorProfilePage } from "../../components/public-doctor-profile";

export const metadata: Metadata = {
  title: "Profil professionnel — Radoko",
  description: "Consultez les informations professionnelles et les disponibilités de ce professionnel de santé.",
};

export default async function PublicDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicDoctorProfilePage doctorId={id} />;
}
