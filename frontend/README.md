# MindPath AI — Frontend Reference

> **Full setup walkthrough is in the root `README.md`. Start there.**
> This file is a quick reference once you've already gone through setup.

## Run

```
cd frontend
npm install
cp .env.local.example .env.local   # fill in Firebase config + API URL
npm run dev
```

Open http://localhost:3000. The backend must be running first.

## Environment variables (`.env.local`)

| Variable                                   | Where to find it                                          |
| ------------------------------------------ | --------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase Console → Project settings → General → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Same place                                                |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Same place                                                |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Same place                                                |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same place                                                |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Same place                                                |
| `NEXT_PUBLIC_API_BASE_URL`                 | `http://localhost:8000` (or wherever your backend runs)   |

## Folder layout

```
frontend/src/
  lib/
    firebase.js          ← Firebase SDK init, exports auth + googleProvider
    api.js               ← apiFetch() — attaches Firebase ID token to every request

  contexts/
    AuthContext.jsx      ← Firebase onAuthStateChanged → fetches /users/me → exposes
                           { user, profile, loading, signOut } + dashboardPathForRole()

  components/
    Navbar.jsx           ← role-aware navigation, active link highlighting
    Card.jsx             ← shared surface component
    EmotionBars.jsx      ← horizontal bar chart for top-N emotions (used by counsellors)
    EmotionRadar.jsx     ← recharts RadarChart, top 5 emotions (used by students)
    EmotionTrend.jsx     ← recharts LineChart, emotion scores over time
    RiskBadge.jsx        ← Stable / Watch / High risk pill
    GoogleIcon.jsx       ← Google "G" SVG for sign-in buttons

  app/
    layout.jsx           ← root layout, loads Fraunces + IBM Plex fonts, wraps AuthProvider
    globals.css          ← Tailwind base + focus ring override
    page.jsx             ← landing page (redirects logged-in users to their dashboard)
    not-found.jsx        ← 404 page (Next.js App Router convention)

    login/page.jsx       ← email/password + Google sign-in
    register/page.jsx    ← student self-registration + Google sign-in

    dashboard/page.jsx   ← student: career panel + wellbeing panel + trend chart
    journal/page.jsx     ← student: write entry → radar chart result
    journal/history/page.jsx  ← student: entry list + trend chart at top
    analyze/page.jsx     ← student: upload PDF + paste JD → triggers analysis
    results/[id]/page.jsx     ← student: score ring, skills, bullets, questions
    career-history/page.jsx   ← student: all past analyses with score bars
    interview/[id]/page.jsx   ← student: one question at a time, AI feedback
    profile/page.jsx          ← all roles: change name, password, delete account
    forbidden/page.jsx        ← 403 page shown on wrong-role access

    counsellor/
      dashboard/page.jsx      ← student list + pulsing alert count banner
      alerts/page.jsx         ← full list of flagged entries, auto-refreshes
      student/[id]/page.jsx   ← per-student: trend chart + entries + private notes

    admin/
      dashboard/page.jsx      ← platform stats (counts only, no individual content)
      users/page.jsx          ← role dropdowns + counsellor assignment
      analytics/page.jsx      ← emotion trend bar chart + gap score distribution
```

## Design tokens

The design uses a deliberate two-accent system defined in `tailwind.config.js`:

| Token      | Hex       | Used for                                 |
| ---------- | --------- | ---------------------------------------- |
| `career`   | `#DB9255` | warm amber — all career/resume UI        |
| `wellness` | `#5FA39B` | muted teal — all journal/emotion UI      |
| `risk`     | `#D9614D` | reserved strictly for genuine risk flags |
| `stable`   | `#84A873` | positive/safe states                     |
| `ink`      | `#14161C` | page background                          |
| `surface`  | `#1D2027` | card background                          |
| `bone`     | `#ECE9E2` | primary text                             |
| `ash`      | `#93979F` | secondary text                           |

Fonts: **Fraunces** (display headers) + **IBM Plex Sans** (body) + **IBM Plex Mono** (data/scores).

## Key architectural decisions

**Firebase is used for auth only.** The frontend never reads from or writes to Firestore
directly. Every data operation calls the FastAPI backend via `apiFetch()`, which attaches
the Firebase ID token. The backend verifies the token and handles all Firestore access.
This is what makes the privacy boundary between student and counsellor data enforceable —
the separation isn't just a convention, it's structural.

**`analyze/page.jsx` uses raw `fetch`**, not `apiFetch`, because multipart file uploads
need a browser-set `Content-Type: multipart/form-data` boundary. `apiFetch` sets
`Content-Type: application/json` which would break the upload. The auth token is
attached manually via `auth.currentUser.getIdToken()`.
