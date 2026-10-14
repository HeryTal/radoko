import type { Metadata } from "next";
import { PasswordResetRequestForm } from "../../components/password-reset-form";

export const metadata: Metadata = { title: "Mot de passe oublié — Radoko" };

export default function PasswordForgottenPage() {
  return <PasswordResetRequestForm />;
}
