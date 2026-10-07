import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <Link href="/">← Retour à Radoko</Link>
      <h1>Confidentialité et données personnelles</h1>
      <p><strong>Document d’information à finaliser avant l’ouverture au public.</strong> L’identité et les coordonnées légales de l’opérateur de Radoko, ainsi que les formalités et bases légales applicables à Madagascar, doivent être ajoutées par l’opérateur avant le lancement. Ce texte ne constitue pas un avis juridique.</p>
      <h2>Données de compte professionnel</h2>
      <p>Radoko traite l’adresse e-mail de connexion, le mot de passe sous forme de hash, les informations du profil professionnel, les disponibilités et les justificatifs transmis pour la vérification. Les justificatifs sont conservés dans la base de données, accessibles uniquement aux administrateurs, puis supprimés après la décision de vérification.</p>
      <h2>Demandes de rendez-vous</h2>
      <p>Le nom, l’adresse e-mail, le téléphone et le motif facultatif sont transmis au professionnel choisi afin qu’il puisse gérer la demande. La demande reste en attente jusqu’à sa confirmation. Les coordonnées sont anonymisées automatiquement 12 mois après la date du rendez-vous lorsqu’il est terminé, annulé ou refusé. Les e-mails en file d’envoi sont supprimés après livraison et au plus tard après 30 jours.</p>
      <h2>Vos droits et suppression du compte</h2>
      <p>Un professionnel connecté peut supprimer son compte depuis son espace. Les rendez-vous associés à son compte sont supprimés ; les demandes patient associées à l’adresse e-mail du compte sont anonymisées et annulées. Un patient peut demander l’effacement des rendez-vous associés à son adresse depuis le lien sécurisé envoyé par e-mail. Pour les demandes d’accès ou d’effacement qui ne sont pas couvertes par ces fonctions, contactez l’opérateur de Radoko via ses coordonnées légales, à compléter avant la mise en production.</p>
      <h2>Sécurité et hébergement</h2>
      <p>Les mots de passe sont hachés avec Argon2id, les accès privés nécessitent un jeton court, les justificatifs ne sont pas publics et les requêtes sensibles sont limitées en fréquence. L’opérateur doit configurer un hébergement chiffré, des sauvegardes PostgreSQL chiffrées et testées, un stockage persistant et protégé pour les photos, ainsi qu’une procédure de restauration.</p>
      <p>Dernière mise à jour : 7 octobre 2026.</p>
    </main>
  );
}
