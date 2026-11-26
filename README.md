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

## Adaptateur ANCFCC

L’adaptateur réel reste désactivé par défaut. Aucun champ, sélecteur ou API du portail n’est supposé.

Pour une intégration ultérieure :

1. Observer le parcours réel dans un environnement autorisé.
2. Documenter les étapes, les sélecteurs stables et les événements humains.
3. Configurer `ANCFCC_PORTAL_URL`.
4. Passer `ANCFCC_AUTOMATION_MODE=configured`.
5. Implémenter les étapes dans `server/automation.ts`.

Ne jamais contourner les CAPTCHA, les protections ou les mécanismes de sécurité du portail.

## Sécurité

- Les codes OTP ne sont ni envoyés ni enregistrés par le serveur.
- Aucun numéro de carte ou donnée bancaire n’est stocké.
- Les politiques RLS de [supabase/migrations/20261126_initial.sql](supabase/migrations/20261126_initial.sql) isolent les données par propriétaire.
- Les secrets restent dans les variables d’environnement.

## Supabase

Copier `.env.example` vers `.env.local`, puis renseigner les variables Vite. Appliquer la migration SQL dans le projet Supabase.