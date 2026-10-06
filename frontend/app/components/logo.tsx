import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
};

export function Logo({ href = "#accueil" }: LogoProps) {
  return (
    <Link className="wordmark" href={href} aria-label="Radoko, accueil">
      <Image src="/brand/radoko-logo.svg" alt="Radoko" width={262} height={52} priority />
    </Link>
  );
}
