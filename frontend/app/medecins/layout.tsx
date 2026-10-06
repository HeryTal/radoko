import type { ReactNode } from "react";
import { DoctorAuthLayout } from "../components/doctor-auth-layout";

export default function MedecinsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <DoctorAuthLayout>{children}</DoctorAuthLayout>;
}
