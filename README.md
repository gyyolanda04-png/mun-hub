# MUN Hub

A committee-management app for Model UN chairs — attendance, participation
stats, an amendment workspace, blocs, notes, timers, and a live presentation
mode.

- `frontend/` — Next.js / React (TSX) UI.
- `backend/` — Spring Boot (Java) REST API. See `backend/README.md` for the full API docs.

## Just want to use it?

The app is already deployed — you don't need to run anything:

- **App:** https://mun-hub-ten.vercel.app

Create an account and you're in. (The backend is on a free host that sleeps
after ~15 min idle, so the very first login after a quiet spell can take
30–60 seconds while it wakes up. Give it a moment — it's not broken.)

The rest of this file is only for running it on your own computer.

## Run it locally

You need **two things installed** and you run **two terminals** — one for the
backend, one for the frontend.

**Prerequisites**

- **Java 21 or newer** (a JDK) — for the backend. Maven is *not* required;
  the project ships the Maven Wrapper (`mvnw`) and downloads Maven itself on
  first run. Check with `java -version`.
- **Node.js 20 or newer** — for the frontend. Check with `node -v`. This uses
  plain **npm** (which comes with Node) — you do **not** need pnpm or yarn.

**Terminal 1 — backend**

```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

Wait until it prints something like `Started ... on port 8080`. Leave this
terminal running. The first run is slow — it downloads Maven and all the
dependencies — so give it a few minutes.

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000**.

By default the frontend talks to the backend at `http://localhost:8080`, so
if you started the backend as above, there's nothing else to configure. To
point it somewhere else, copy `frontend/.env.local.example` to
`frontend/.env.local` and edit `NEXT_PUBLIC_API_URL`.

## Troubleshooting

- **`pnpm: command not found`** — old instructions used pnpm. This project
  uses npm now: run `npm install` and `npm run dev` instead.
- **Login / saving fails, or the page says it can't reach the server** — the
  backend (terminal 1) isn't running or hasn't finished starting. Make sure
  it's up and shows `Started ... on port 8080`, then try again.
- **`java: command not found` or a version below 21** — install a Java 21+
  JDK (e.g. [Temurin](https://adoptium.net/)) and reopen your terminal.
- **`./mvnw: Permission denied` (macOS/Linux)** — run `chmod +x mvnw` in the
  `backend/` folder once, then retry.
- **Port already in use (8080 or 3000)** — something else is using that port.
  Stop it, or change the port (`npm run dev -- -p 3001` for the frontend).
- **First run just sits there** — that's normal. The backend downloads Maven
  and dependencies on first launch; the frontend compiles on first load.
