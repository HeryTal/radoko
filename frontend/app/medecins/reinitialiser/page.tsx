import type { Metadata } from "next";
import { PasswordResetConfirmForm } from "../../components/password-reset-form";

export const metadata: Metadata = { title: "Nouveau mot de passe — Radoko" };

export default async function PasswordResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <PasswordResetConfirmForm token={token} />;
}
