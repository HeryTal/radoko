import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./journey.css";

const inter = localFont({
  src: "./fonts/inter-variable.ttf",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const manrope = localFont({
  src: "./fonts/manrope-variable.ttf",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});
export const metadata: Metadata = {
  title: "Radoko — Le bon médecin. Plus près de vous.",
  description: "Découvrez Radoko, le futur annuaire de médecins à Madagascar : recherche par spécialité et ville, fiches vérifiées et contact direct.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" className={`${inter.variable} ${manrope.variable}`}><body>{children}</body></html>;
}
