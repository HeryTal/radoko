This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Connexion au backend

Par défaut, les formulaires médecin appellent `http://localhost:3000`. Pour utiliser une autre adresse, copiez `.env.example` vers `.env.local` et renseignez `NEXT_PUBLIC_API_URL` avant de démarrer Next.js. Le backend doit aussi autoriser l'origine du frontend avec `FRONTEND_URL` (voir `backend/.env.example`).

Après connexion, le médecin est redirigé vers `/medecins/tableau-de-bord`. Cet espace charge les informations du compte depuis l’endpoint protégé `GET /auth/me` ; le backend doit donc être démarré et le jeton de connexion valide.

Le tableau de bord permet de mettre à jour la fiche publique, les modes de consultation et les disponibilités hebdomadaires. Les patients peuvent trouver les profils depuis l’accueil, consulter `/medecins/{id}` et réserver les créneaux ouverts ; les horaires du calendrier sont exprimés en heure de Madagascar (UTC+03:00). Appliquez les migrations du backend avant d’utiliser ces fonctionnalités.

La photo de profil se choisit depuis le sélecteur de fichiers de l’ordinateur ou la galerie de l’appareil : JPG, PNG ou WebP, 5 Mo maximum. Le backend doit pouvoir écrire dans son répertoire `UPLOAD_DIR` (voir le README backend).

Les nouveaux profils professionnels ne paraissent pas dans la recherche avant leur validation administrative. Le professionnel transmet son justificatif depuis son espace ; un compte administrateur promu par l’opérateur examine les documents depuis `/admin`. Les réservations commencent en attente, puis le professionnel peut les accepter, refuser, annuler ou reprogrammer. Le patient reçoit des liens sécurisés pour annuler ou demander l’effacement de ses coordonnées. Le flux d’e-mail requiert une configuration SMTP côté backend.

La page `/confidentialite` décrit les traitements et la conservation de 12 mois, mais demeure un document d’information à finaliser : les coordonnées légales réelles de l’opérateur et les notices requises doivent être ajoutées avant toute ouverture publique.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
