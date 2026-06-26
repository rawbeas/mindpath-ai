# MindPath AI — Complete Setup Guide

Career coaching + mental wellness journaling on one platform.  
Three roles (student / counsellor / admin), one shared backend, all free to run.

---

## What the app does

**Students** get two tools in one place:

- **Career half** — upload a resume PDF + paste a job description → get a match score,
  matched/missing skills, rewritten bullet points, 10 interview questions, and a mock
  interview with AI feedback on every answer.
- **Wellness half** — write a daily journal entry → get an emotion radar chart (top 5
  emotions from Google's 28-class GoEmotions model) and a trend line over time.

**Counsellors** see their assigned students' journal entries — full emotion breakdown
(top 10 emotions), risk flags when distress is high, an AI-generated summary for flagged
entries, and a private notes panel. They never see any career data.

**Admins** manage roles and assignments, and see aggregate platform stats and charts.
They see no individual journal or career content.

The privacy boundary is enforced at the API schema level — two different response
models for the same database document — not just by convention.

---

## What you need before starting

| Tool             | Check if installed  | Install from                    |
| ---------------- | ------------------- | ------------------------------- |
| Python 3.11+     | `python3 --version` | https://python.org/downloads    |
| Node.js 22+      | `node -v`           | https://nodejs.org (choose LTS) |
| npm              | `npm -v`            | comes with Node                 |
| A Google account | —                   | https://accounts.google.com     |

> **Windows note**: when installing Python, tick **"Add python.exe to PATH"** before
> clicking Install. Without this, none of the Python commands below will work.
> Close and reopen your terminal after installing anything.

---

## Step 1 — Open a terminal

**VS Code** (recommended): menu bar → **Terminal → New Terminal**.  
**Windows**: Start → type `PowerShell` → open Windows PowerShell.  
**Mac**: `Cmd + Space` → type `Terminal` → open it.  
**Linux**: `Ctrl + Alt + T`.

---

## Step 2 — Unzip the project

**Windows**: right-click the zip → **Extract All** → choose a location → Extract.  
**Mac**: double-click the zip.

You get a `mindpath-ai/` folder with three things inside:

```
mindpath-ai/
  backend/          ← Python / FastAPI
  frontend/         ← Next.js
  README.md         ← this file
  firebase.json
  firestore.indexes.json
  firestore.rules
```

If you see a `mindpath-ai/mindpath-ai/` double-nesting, go one level deeper — the
inner folder is the real one.

In your terminal, navigate into it:

```
cd path/to/mindpath-ai
```

(Replace `path/to` with wherever you extracted it.)

---

## Step 3 — Create a Firebase project

1. Go to https://console.firebase.google.com → sign in → **Add project**.
2. Give it any name (e.g. `mindpath-ai`) → **Continue** → skip Google Analytics
   → **Create project** → wait ~30 seconds → **Continue**.

---

## Step 4 — Enable sign-in providers

Inside your new project:

1. Left sidebar → **Build** → **Authentication** → **Get started**.
2. Click the **Sign-in method** tab.
3. Click **Email/Password** → toggle **Enable** → **Save**.
4. Click **Add new provider** → click **Google** → toggle **Enable** → pick your
   email as the support email → **Save**.

Both should now show as **Enabled**.

---

## Step 5 — Add a Web app and copy its config

1. Click the **gear icon** (top-left, next to "Project Overview") → **Project settings**.
2. Scroll to **"Your apps"** → click the **`</>`** (Web) icon.
3. Nickname: anything (e.g. `mindpath-web`) → **Register app**. Skip Firebase Hosting.
4. You'll see a `firebaseConfig` object — **keep this page open**, you'll need it in Step 10.

---

## Step 6 — Download the service account key

Still in Project settings:

1. Click the **Service accounts** tab.
2. **Generate new private key** → **Generate key** → a `.json` file downloads.
3. Move and rename that file to:
   ```
   mindpath-ai/backend/firebase-service-account.json
   ```

> This file is a master password for your project. It is already in `.gitignore`.
> Never share it or commit it anywhere.

---

## Step 7 — Get a free Gemini API key

1. Go to https://aistudio.google.com/apikey → **Create API key**.
2. Choose your Firebase project from the dropdown (or create a new one) → copy the key.

No credit card needed. Note: Google's free tier may use prompts to improve their
models — worth keeping in mind since journal text will pass through this key.

---

## Step 8 — Install the Firebase CLI and deploy indexes + rules

The app uses composite Firestore queries. Without pre-built indexes those queries
fail with an error. This step creates all four indexes at once, plus locks down
direct browser access to Firestore (all data goes through FastAPI instead).

Install the Firebase CLI (one-time):

```
npm install -g firebase-tools
```

Sign in:

```
firebase login
```

A browser tab opens — approve it and return to the terminal.

From inside the `mindpath-ai/` folder (where `firebase.json` lives):

```
firebase use --add
```

Pick your project from the list. Then:

```
firebase deploy --only firestore
```

The command returns quickly. Firestore takes **1–2 minutes** to finish building
the indexes in the background — wait before testing journal/career history routes.

---

## Step 9 — Start the backend

Open a terminal in the `mindpath-ai/backend/` folder:

```
cd backend
python3 -m venv venv
```

Activate the virtual environment:

```
# Mac / Linux:
source venv/bin/activate

# Windows (PowerShell):
venv\Scripts\activate
```

Your prompt now starts with `(venv)`. Install dependencies:

```
pip install -r requirements.txt
```

> This takes a few minutes — `torch` (~2 GB) and `sentence-transformers` are the
> largest. The first time a journal entry is analysed, the GoEmotions model (~500 MB)
> downloads automatically and caches locally. The first time a resume is analysed,
> `all-MiniLM-L6-v2` (~90 MB) downloads similarly. Both are one-time.

Copy and fill in the environment file:

```
# Mac / Linux:
cp .env.example .env

# Windows:
copy .env.example .env
```

Open `.env` in any text editor and set `GEMINI_API_KEY` to the key from Step 7.
Leave everything else as-is.

Start the server:

```
uvicorn main:app --reload --port 8000
```

Confirm it works: open http://localhost:8000/health → should show `{"status":"ok"}`.  
**Leave this terminal running.**

---

## Step 10 — Start the frontend

Open a **new, separate terminal** in the `mindpath-ai/frontend/` folder:

```
cd frontend
npm install
```

Copy and fill in the environment file:

```
# Mac / Linux:
cp .env.local.example .env.local

# Windows:
copy .env.local.example .env.local
```

Open `.env.local` and fill in the six `NEXT_PUBLIC_FIREBASE_*` values from the
`firebaseConfig` object in Step 5. Leave `NEXT_PUBLIC_API_BASE_URL` as
`http://localhost:8000`.

Start the dev server:

```
npm run dev
```

Open http://localhost:3000 → you should see the MindPath AI landing page.  
**Leave this terminal running too.**

---

## Step 11 — Create three test accounts

Go to http://localhost:3000/register three times (sign out between each using the
link in the navbar), creating accounts for:

- a **student** (e.g. `student@test.com`)
- a **counsellor** (e.g. `counsellor@test.com`)
- an **admin** (e.g. `admin@test.com`)

Or use **Continue with Google** — any method works. All three start as "student" role.

---

## Step 12 — Bootstrap the first admin

This can't be done through the website (by design — no self-service admin promotion).
In the **backend terminal** — either stop the server first with `Ctrl+C`, or open a
third terminal and re-activate the venv:

```
python -m scripts.seed_admin admin@test.com
```

Use whichever email you picked for the admin account. Restart the backend server
if you stopped it.

---

## Step 13 — Assign roles and link the student

Sign in at http://localhost:3000/login as the admin account → you land on
**/admin/dashboard**.

1. Click **Users** in the navbar.
2. Find the counsellor account → change its role dropdown to `counsellor`.
3. Find the student account → a second dropdown appears → assign it to your counsellor.

---

## Step 14 — Test the wellness pipeline (journal → emotion → counsellor)

**As the student** (`student@test.com`):

1. Click **Write** in the navbar → paste something emotionally meaningful, e.g.:
   > I've been so stressed about placements. Every rejection makes me feel like I'm
   > not enough. I can't sleep and just feel stuck.
2. **Save entry** → you should see an emotion radar chart and a one-line insight.
3. Click **Journal history** → you should see the entry plus an emotion trend chart
   (appears once you have 2+ entries).

**As the counsellor** (`counsellor@test.com`):

1. Click **Alerts** in the navbar — if the entry crossed the risk threshold
   (grief + fear + sadness > 0.7), it appears here with an AI-generated summary.
2. Click **My students** → click the student → you see their full breakdown (10 emotions),
   trend chart, and a private notes field. Add a note.

**Back as the student**:

1. Check **Journal history** — your entry is there with the insight, but no risk score,
   no "High risk" badge, no counsellor note. That's the privacy wall working.

---

## Step 15 — Test the career pipeline (resume → gap score → mock interview)

**As the student**:

1. Click **Resume** in the navbar → upload a PDF resume, paste a real job description,
   fill in the job title and company → **Run analysis**.
2. The progress steps animate (Extracting → Scoring → Analysing → Saving). When done
   you land on the results page showing: match score ring, matched skills (green),
   missing skills (red), rewritten bullets (with a copy button), and 10 interview questions.
3. Click **Practice these questions** → answer one question → **Submit answer** →
   you get a score (0–100), feedback, and an improved version of your answer.
4. Click **Career history** in the navbar → see the score bar for this analysis.
   Run a second analysis to see both.

---

## Step 16 — Test the admin side

**As the admin**:

1. **/admin/dashboard** → see total users, flagged entries, counsellor load, analyses run.
2. **Analytics** → two charts: average emotion scores across all journal entries,
   and resume match score distribution. No names — aggregate only.
3. **Users** → confirm you can change roles and reassign students.

---

## Step 17 — Test profile and error pages

1. As any role, click **Profile** in the navbar → change your display name → **Save name**.
2. If you signed up with email/password, try changing your password.
3. While signed in as student, manually navigate to `http://localhost:3000/admin/dashboard`
   → you should land on the **403 Forbidden** page, not the admin content.
4. Navigate to `http://localhost:3000/this-does-not-exist` → **404** page.

---

## Troubleshooting

**`node` or `python3` not found after installing** — close the terminal completely and
open a brand new one. PATH changes from installers don't apply to already-open terminals.

**`pip install` fails partway** — just re-run it; it skips what already installed.

**Backend port already in use** — run `uvicorn main:app --reload --port 8001` instead
and update `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001` in `frontend/.env.local`.

**`firebase deploy` says "project not found"** — run `firebase use --add` first and
pick your project from the list.

**Firestore query error with a link to "create index"** — you skipped Step 8 or the
indexes haven't finished building yet (wait 1–2 minutes after `firebase deploy`).

**"Continue with Google" does nothing** — your browser is blocking the popup. Allow
popups for `localhost:3000` in your browser settings and retry.

**"This domain is not authorized" on Google sign-in** — Firebase Console →
Authentication → Settings → Authorized domains → confirm `localhost` is listed
(it is by default for new projects, but worth checking).

**First journal entry is very slow** — normal. The GoEmotions model is downloading
and loading into memory for the first time (~30–60 seconds). Every subsequent entry
is fast.

**First resume analysis is slow** — same reason for `all-MiniLM-L6-v2`. One-time.

**403 errors from the API** — you're calling an endpoint with the wrong role's token.
Sign out and in as the correct role.

---

## Not built yet

Docker / containerisation (deliberately deferred until local testing is confirmed).
