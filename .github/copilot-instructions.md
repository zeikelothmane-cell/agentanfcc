# ANCFCC Agent Pro - Project instructions

## Project overview

- This is a React 18 + TypeScript PWA for managing ANCFCC land-file operator workflows.
- The UI uses Vite and Tailwind CSS. The API uses Express, Zod, Node.js, and Playwright.
- Application state is currently in memory via `server/store.ts`; Supabase and PostgreSQL RLS are prepared in `supabase/migrations/20261126_initial.sql` but are not the primary local implementation.
- Keep the default workflow in simulation mode. Never assume portal fields, selectors, or API endpoints that have not been observed and documented.

## Development commands

- Install dependencies: `npm install`
- Run the web app and API: `npm run dev`
- Web app: `http://localhost:5173`
- API: `http://localhost:3001`
- Run tests: `npm test`
- Run one test file: `npm test -- server/store.test.ts`
- Run a full typecheck and production build: `npm run build`
- Start the production server: `npm start`
- Copy environment configuration from `.env.example` to `.env.local`.

## Code organization

- Keep React UI components and the application shell in `src/`.
- Keep browser-to-API calls and response shapes in `src/api.ts`.
- Keep shared frontend types in `src/types.ts`.
- Keep Express routes and request validation in `server/index.ts`.
- Keep server state and mutations in `server/store.ts`.
- Keep portal automation behind `server/automation.ts`.
- Keep database schema and RLS changes in `supabase/migrations/`.
- Preserve the existing single-quote, no-semicolon TypeScript style unless a touched file already establishes another convention.

## TypeScript and React conventions

- Prefer explicit interfaces/types for exported data structures and function inputs.
- Use Zod for external HTTP request validation; do not trust unvalidated `req.body`.
- In React, preserve the existing functional-component and hooks style.
- Reuse shared types from `src/types.ts` instead of duplicating client/demand shapes.
- Keep API error handling consistent: report server `error` messages from `src/api.ts` and show user-facing failures in the UI.
- Keep responsive behavior and Tailwind utility patterns consistent with the existing PWA.
- Use accessibility attributes for interactive controls, especially modal close actions and icon-only buttons.
- Keep user-facing labels in French and use existing status labels/colors for demand states.

## Workflow rules

- Preserve the demand lifecycle: `brouillon` -> `en_cours` -> `code_sms` -> `confirmation_paiement` -> `terminee` or `erreur`.
- Duplicate active demands for the same client and land title must be rejected.
- SMS validation must occur before payment confirmation.
- Payment confirmation must remain an explicit operator action.
- The real automation adapter remains disabled unless `ANCFCC_AUTOMATION_MODE=configured` and `ANCFCC_PORTAL_URL` are explicitly set.
- Do not bypass CAPTCHA, bot protections, authentication challenges, or other portal security controls.
- Do not add real payment capture or card/banking-data storage.
- Do not send or persist OTP codes on the server.
- For real automation work, require documented observations of stable selectors and human steps before implementing in `server/automation.ts`.

## Supabase and security

- Never commit secrets or `.env.local`.
- Keep secrets in environment variables as described by `.env.example`.
- Use owner-scoped data access and maintain RLS policies for every new user-owned table.
- When changing authentication or persisted data models, update the migration and preserve ownership isolation.
- Avoid storing unnecessary personal data and do not place sensitive values in browser state or logs.

## Tests and validation

- Add or update Vitest coverage for behavior changes in the relevant `server/*.test.ts` file.
- For store or workflow changes, test duplicate prevention and state transitions explicitly.
- Run the smallest relevant test first, then `npm run build` for cross-package TypeScript and production bundling changes.
- Do not change or weaken tests only to make a failing implementation pass.
