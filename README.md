# VitalTrack — Blood Sugar & Blood Pressure Tracker

A fast, modern, responsive web app for recording and analyzing your **blood sugar** (mg/dL)
and **blood pressure** (mmHg) readings. Built with React + Vite + TypeScript, Material UI,
Recharts, and Firebase (Auth + Firestore + Hosting).

> ⚠️ For personal tracking only — **not medical advice**. Category thresholds are standard
> reference ranges shown for context.

## Features

- 🔐 **Email/password auth** (Firebase Auth) — your data is private to your account.
- 📊 **Dashboard** — stat cards (latest, average, in-range %, latest BP + category),
  blood-sugar and blood-pressure trend charts, and a 7 / 30 / 90 day / all time selector.
- 🧾 **CRUD grids** for both reading types — add, edit, delete, with quick search,
  column filters, sorting, pagination, and CSV export (MUI DataGrid).
- 🎨 **Flat, modern UI** with light/dark mode, responsive on mobile and desktop.

## Tech stack

React 19 · Vite · TypeScript · Material UI (v9) + MUI X DataGrid & Date Pickers ·
Recharts · React Hook Form + Zod · Firebase.

## 1. Install

```bash
npm install
```

## 2. Configure Firebase

1. Create a project at https://console.firebase.google.com.
2. **Authentication → Sign-in method →** enable **Email/Password**.
3. **Firestore Database →** create a database (Production mode is fine — rules are included).
4. **Project settings → General → Your apps →** add a **Web app** and copy the config.
5. Copy `.env.example` to `.env.local` and paste your values:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

6. Put your project id in `.firebaserc` (replace `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`).

## 3. Run locally

```bash
npm run dev
```

## 4. Data model & security

Readings are stored per-user under `users/{uid}/bloodSugar/*` and
`users/{uid}/bloodPressure/*`. `firestore.rules` restricts every document to its owner.

Deploy the rules:

```bash
firebase deploy --only firestore:rules
```

## 5. Deploy to Firebase Hosting

```bash
firebase login          # interactive — run this yourself in a terminal
npm run build           # outputs to dist/
firebase deploy         # deploys hosting + firestore rules
```

`firebase.json` is preconfigured to serve `dist/` as a single-page app
(all routes rewrite to `index.html`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
