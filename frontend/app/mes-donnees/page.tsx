import { Suspense } from "react";
import { ErasePatientDataPage } from "../components/erase-patient-data";

export default function ErasePatientDataRoute() {
  return <Suspense fallback={<main className="public-doctor-loading">Chargement…</main>}><ErasePatientDataPage /></Suspense>;
}
