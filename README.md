# ANCFCC Agent Pro

Application PWA professionnelle pour accompagner les opérateurs dans la gestion des dossiers fonciers.

## Démarrage rapide

```bash
npm install
npm run dev
```

- Interface : `http://localhost:5173`
- API : `http://localhost:3001`
- Mode par défaut : `simulation`

## Technologies

- React, TypeScript, Vite, Tailwind CSS
- Express et Node.js
- Playwright, avec adaptateur configurable
- Tesseract.js OCR français/arabe
- Supabase Auth, PostgreSQL et RLS
- PWA installable

## Mode simulation

Le parcours complet est simulé : création du dossier, demande SMS, reprise après validation humaine, confirmation explicite du paiement et génération de l’état « certificat disponible ». Aucun paiement ni portail externe n’est utilisé.

## Dossier guidé et portail officiel

Dans le dossier guidé, scannez les deux faces de la CIN, vérifiez les champs proposés et renseignez les titres. Les corrections apportées à l’identité sont conservées dans le dossier enregistré.

Sur Safari, installez le favori **Remplir ANCFCC** depuis les instructions du dossier. Ouvrez le formulaire avec **Ouvrir et préremplir**, puis activez le favori sur la page officielle dans les dix minutes. Le transfert utilise un canal entre les deux onglets. Aucune donnée du dossier ne figure dans l’adresse du favori.

Le favori remplit le formulaire Particulier. Saisissez le CAPTCHA sur le portail et cochez les mentions légales après lecture. Le favori active alors **Suivant**. Si la case est déjà cochée, appuyez sur Entrée dans le champ du CAPTCHA. La suite du dossier reste dans le même onglet officiel. Les erreurs de validation s’affichent sur le portail.

## Sécurité

- Les codes OTP ne sont ni envoyés ni enregistrés par le serveur.
- Aucun numéro de carte ou donnée bancaire n’est stocké.
- Les politiques RLS de [supabase/migrations/20261126_initial.sql](supabase/migrations/20261126_initial.sql) isolent les données par propriétaire.
- Les secrets restent dans les variables d’environnement.

## Supabase

Copier `.env.example` vers `.env.local`, puis renseigner les variables Vite. Appliquer la migration SQL dans le projet Supabase.