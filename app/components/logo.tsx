import Image from "next/image";

export function Logo() {
  return (
    <a className="wordmark" href="#accueil" aria-label="Radoko, accueil">
      <Image src="/brand/radoko-logo.svg" alt="Radoko" width={262} height={52} priority />
    </a>
  );
}
