import { Suspense } from "react";
import { CancelAppointmentPage } from "../../components/cancel-appointment";

export default function CancelAppointmentRoute() {
  return <Suspense fallback={<main className="public-doctor-loading">Chargement…</main>}><CancelAppointmentPage /></Suspense>;
}
